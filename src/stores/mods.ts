import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import type { ModFile, ScanProgress, StatusFilter, ViewMode } from '@/types/mod'
import {
  clearSavedHandle,
  ensurePermission,
  getFileSize,
  isFsApiSupported,
  listJarFiles,
  loadSavedHandle,
  pickDirectory,
} from '@/lib/fs'
import { computeSha1 } from '@/lib/hash'
import { fetchProjectsByIds, fetchVersionsByHashes } from '@/lib/modrinth'

const HASH_CONCURRENCY = 4

/** 并发执行任务，限制最大并发数 */
async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let cursor = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++
      const item = items[idx]
      if (item === undefined) continue
       
      await worker(item, idx)
    }
  })
  await Promise.all(runners)
}

export const useModsStore = defineStore('mods', () => {
  const supported = isFsApiSupported()

  // 用 shallowRef 因为 FileSystemDirectoryHandle 不应被深度响应化
  const dirHandle = shallowRef<FileSystemDirectoryHandle | null>(null)
  const dirName = ref<string>('')

  const modFiles = ref<ModFile[]>([])
  const progress = ref<ScanProgress>({ stage: 'idle', total: 0, processed: 0 })
  const scanning = ref(false)
  const viewMode = ref<ViewMode>('table')
  const statusFilter = ref<StatusFilter>('all')
  const search = ref('')

  const filteredFiles = computed<ModFile[]>(() => {
    let list = modFiles.value
    if (statusFilter.value !== 'all') {
      list = list.filter((m) => m.status === statusFilter.value)
    }
    const q = search.value.trim().toLowerCase()
    if (q) {
      list = list.filter((m) => {
        const p = m.project
        return (
          m.name.toLowerCase().includes(q) ||
          m.path.toLowerCase().includes(q) ||
          (p?.title.toLowerCase().includes(q) ?? false) ||
          (p?.slug.toLowerCase().includes(q) ?? false) ||
          (p?.author.toLowerCase().includes(q) ?? false) ||
          (m.version?.version_number.toLowerCase().includes(q) ?? false)
        )
      })
    }
    return list
  })

  const stats = computed(() => {
    const total = modFiles.value.length
    const matched = modFiles.value.filter((m) => m.status === 'matched').length
    const notFound = modFiles.value.filter((m) => m.status === 'not_found').length
    const error = modFiles.value.filter((m) => m.status === 'error').length
    const totalDownloads = modFiles.value.reduce(
      (sum, m) => sum + (m.project?.downloads ?? 0),
      0,
    )
    return { total, matched, notFound, error, totalDownloads }
  })

  /** 应用启动时恢复上次选择的文件夹句柄 */
  async function restoreSavedHandle(): Promise<boolean> {
    if (!supported) return false
    const saved = await loadSavedHandle()
    if (!saved) return false
    const ok = await ensurePermission(saved, false)
    if (!ok) {
      // 没权限，不自动请求，等待用户在 UI 主动触发
      dirHandle.value = saved
      dirName.value = saved.name
      return false
    }
    dirHandle.value = saved
    dirName.value = saved.name
    return true
  }

  /** 用户点击「选择文件夹」或「重新选择」 */
  async function selectFolder(): Promise<boolean> {
    if (!supported) return false
    const handle = await pickDirectory()
    dirHandle.value = handle
    dirName.value = handle.name
    modFiles.value = []
    progress.value = { stage: 'idle', total: 0, processed: 0 }
    return true
  }

  /** 请求已恢复句柄的权限 */
  async function requestPermissionForSaved(): Promise<boolean> {
    if (!dirHandle.value) return false
    const ok = await ensurePermission(dirHandle.value, true)
    return ok
  }

  /** 取消扫描 */
  let cancelled = false
  function cancelScan(): void {
    if (scanning.value) {
      cancelled = true
    }
  }

  /** 主扫描流程 */
  async function scan(): Promise<void> {
    if (!dirHandle.value || scanning.value) return
    cancelled = false
    scanning.value = true

    try {
      // 1. 列出 jar 文件
      progress.value = { stage: 'listing', total: 0, processed: 0 }
      const listed = await listJarFiles(dirHandle.value, (count) => {
        progress.value = { stage: 'listing', total: count, processed: count }
      })

      if (cancelled) return

      // 初始化 modFiles（不含 size，后续 hash 阶段补充）
      const files: ModFile[] = await Promise.all(
        listed.map(async (f) => {
          let size = 0
          try {
            size = await getFileSize(f.handle)
          } catch {
            // ignore
          }
          return {
            path: f.path,
            name: f.name,
            size,
            handle: f.handle,
            status: 'pending' as const,
          }
        }),
      )
      modFiles.value = files

      if (cancelled) return

      // 2. 计算 SHA-1（并发限制）
      progress.value = { stage: 'hashing', total: files.length, processed: 0 }
      let hashed = 0
      await runWithConcurrency(files, HASH_CONCURRENCY, async (m) => {
        if (cancelled) return
        m.status = 'hashing'
        try {
          const file = await m.handle.getFile()
          m.sha1 = await computeSha1(file)
        } catch (e) {
          m.status = 'error'
          m.error = e instanceof Error ? e.message : String(e)
        }
        if (m.status === 'hashing') m.status = 'pending'
        hashed++
        progress.value = { stage: 'hashing', total: files.length, processed: hashed }
      })

      if (cancelled) return

      // 3. 批量查询 versions by hash
      const hashToIndex = new Map<string, number>()
      files.forEach((m, i) => {
        if (m.sha1 && m.status !== 'error') {
          m.status = 'querying'
          hashToIndex.set(m.sha1, i)
        }
      })

      const hashes = [...hashToIndex.keys()]
      if (hashes.length === 0) {
        progress.value = { stage: 'done', total: files.length, processed: files.length }
        return
      }

      progress.value = { stage: 'querying-versions', total: hashes.length, processed: 0 }
      const versionMap = await fetchVersionsByHashes(hashes, 'sha1', (done, total) => {
        progress.value = { stage: 'querying-versions', total, processed: done }
      })

      // 应用 version 结果
      const matchedProjectIds = new Set<string>()
      for (const [hash, version] of Object.entries(versionMap)) {
        const idx = hashToIndex.get(hash)
        if (idx === undefined) continue
        const m = files[idx]
        if (!m) continue
        m.version = version
        if (version.project_id) matchedProjectIds.add(version.project_id)
      }
      // 未匹配的标 not_found
      for (const m of files) {
        if (m.status === 'querying' && !m.version) {
          m.status = 'not_found'
        }
      }

      if (cancelled) return

      // 4. 批量查询 projects
      const projectIds = [...matchedProjectIds]
      if (projectIds.length === 0) {
        progress.value = { stage: 'done', total: files.length, processed: files.length }
        return
      }
      progress.value = {
        stage: 'querying-projects',
        total: projectIds.length,
        processed: 0,
      }
      const projectMap = await fetchProjectsByIds(projectIds, (done, total) => {
        progress.value = { stage: 'querying-projects', total, processed: done }
      })

      for (const m of files) {
        const pid = m.version?.project_id
        if (pid && projectMap[pid]) {
          m.project = projectMap[pid]
          m.status = 'matched'
        }
      }

      progress.value = { stage: 'done', total: files.length, processed: files.length }
    } catch (e) {
      progress.value = {
        stage: 'error',
        total: progress.value.total,
        processed: progress.value.processed,
        message: e instanceof Error ? e.message : String(e),
      }
    } finally {
      scanning.value = false
    }
  }

  async function clear(): Promise<void> {
    cancelled = true
    scanning.value = false
    dirHandle.value = null
    dirName.value = ''
    modFiles.value = []
    progress.value = { stage: 'idle', total: 0, processed: 0 }
    await clearSavedHandle()
  }

  return {
    // state
    supported,
    dirHandle,
    dirName,
    modFiles,
    progress,
    scanning,
    viewMode,
    statusFilter,
    search,
    // computed
    filteredFiles,
    stats,
    // actions
    restoreSavedHandle,
    selectFolder,
    requestPermissionForSaved,
    scan,
    cancelScan,
    clear,
  }
})
