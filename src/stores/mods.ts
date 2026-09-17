import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import type { ModFile, ScanProgress } from '@/types/mod'
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
import { fetchProjectAuthors, fetchProjectsByIds, fetchVersionsByHashes } from '@/lib/modrinth'
import { compareMcVersions } from '@/lib/mc-version'

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
  const search = ref('')
  const mcVersion = ref('')

  const filteredFiles = computed<ModFile[]>(() => {
    let list = modFiles.value
    const q = search.value.trim().toLowerCase()
    if (q) {
      list = list.filter((m) => {
        const p = m.project
        return (
          m.name.toLowerCase().includes(q) ||
          m.path.toLowerCase().includes(q) ||
          (p?.title.toLowerCase().includes(q) ?? false) ||
          (p?.slug.toLowerCase().includes(q) ?? false) ||
          (p?.author?.toLowerCase().includes(q) ?? false) ||
          (m.version?.version_number.toLowerCase().includes(q) ?? false)
        )
      })
    }
    return list
  })

  const stats = computed(() => {
    const total = modFiles.value.length
    const matched = modFiles.value.filter((m) => m.status === 'matched').length
    return { total, problem: total - matched }
  })

  /** 统计每个 MC 版本被多少个已识别模组支持 */
  function mcVersionCounts(): Map<string, number> {
    const counts = new Map<string, number>()
    for (const m of modFiles.value) {
      for (const gv of m.version?.game_versions ?? []) {
        counts.set(gv, (counts.get(gv) ?? 0) + 1)
      }
    }
    return counts
  }

  /** 当前已识别模组支持的 MC 版本集合（新 → 旧） */
  const availableMcVersions = computed<string[]>(() =>
    [...mcVersionCounts().keys()].sort((a, b) => compareMcVersions(b, a)),
  )

  /** 推断的 MC 版本：出现次数最多，并列时取较新 */
  const inferredMcVersion = computed<string>(() => {
    let best = ''
    let bestCount = 0
    for (const [version, count] of mcVersionCounts()) {
      if (count > bestCount || (count === bestCount && compareMcVersions(version, best) > 0)) {
        best = version
        bestCount = count
      }
    }
    return best
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
    mcVersion.value = ''
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
      // 整体替换，触发响应式代理化
      modFiles.value = files

      if (cancelled) return

      // 后续修改必须通过 modFiles.value 访问元素（代理对象），
      // 否则直接修改原对象引用不会触发视图更新。

      // 2. 计算 SHA-1（并发限制）
      progress.value = { stage: 'hashing', total: files.length, processed: 0 }
      let hashed = 0
      const indices = files.map((_, i) => i)
      await runWithConcurrency(indices, HASH_CONCURRENCY, async (i) => {
        if (cancelled) return
        const m = modFiles.value[i]
        if (!m) return
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
      for (let i = 0; i < modFiles.value.length; i++) {
        const m = modFiles.value[i]
        if (!m) continue
        if (m.sha1 && m.status !== 'error') {
          m.status = 'querying'
          hashToIndex.set(m.sha1, i)
        }
      }

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
        const m = modFiles.value[idx]
        if (!m) continue
        m.version = version
        if (version.project_id) matchedProjectIds.add(version.project_id)
      }
      // 未匹配的标 not_found
      for (const m of modFiles.value) {
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

      for (const m of modFiles.value) {
        const pid = m.version?.project_id
        if (pid && projectMap[pid]) {
          m.project = projectMap[pid]
          m.status = 'matched'
        }
      }

      if (cancelled) return

      // 5. 批量查询作者（项目接口不返回 author，需走 search 接口）
      const authorIds = [...matchedProjectIds]
      if (authorIds.length > 0) {
        progress.value = {
          stage: 'querying-authors',
          total: authorIds.length,
          processed: 0,
        }
        const authorMap = await fetchProjectAuthors(authorIds, (done, total) => {
          progress.value = { stage: 'querying-authors', total, processed: done }
        })
        for (const m of modFiles.value) {
          const pid = m.version?.project_id
          if (pid && m.project && authorMap[pid]) {
            m.project.author = authorMap[pid]
          }
        }
      }

      if (!mcVersion.value || !availableMcVersions.value.includes(mcVersion.value)) {
        mcVersion.value = inferredMcVersion.value
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
    mcVersion.value = ''
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
    search,
    mcVersion,
    // computed
    filteredFiles,
    stats,
    availableMcVersions,
    inferredMcVersion,
    // actions
    restoreSavedHandle,
    selectFolder,
    requestPermissionForSaved,
    scan,
    cancelScan,
    clear,
  }
})
