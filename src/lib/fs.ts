/**
 * File System Access API 封装：选择文件夹、列出 jar 文件、句柄持久化。
 */

const DB_NAME = 'modrinth-mod-tool'
const DB_VERSION = 1
const STORE_NAME = 'handles'
const HANDLE_KEY = 'mods-dir'

/** 是否支持 File System Access API */
export function isFsApiSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

/** 选择一个文件夹 */
export async function pickDirectory(): Promise<FileSystemDirectoryHandle> {
  const handle = await window.showDirectoryPicker({
    mode: 'read',
    id: 'mods-folder',
  })
  await saveHandle(handle)
  return handle
}

/** 校验/请求文件夹访问权限 */
export async function ensurePermission(
  handle: FileSystemDirectoryHandle,
  request = false,
): Promise<boolean> {
  const opts = { mode: 'read' as const }
  if (request) {
    const perm = await (handle as unknown as {
      requestPermission: (o: { mode: 'read' | 'readwrite' }) => Promise<PermissionState>
    }).requestPermission(opts)
    return perm === 'granted'
  }
  const perm = await (handle as unknown as {
    queryPermission: (o: { mode: 'read' | 'readwrite' }) => Promise<PermissionState>
  }).queryPermission(opts)
  return perm === 'granted'
}

const JAR_EXTENSIONS = ['.jar']

/** 是否为模组 jar（兼容 `.jar.disabled` 等后缀） */
function isJarFile(name: string): boolean {
  const lower = name.toLowerCase()
  return JAR_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

export interface ListedFile {
  path: string
  name: string
  handle: FileSystemFileHandle
}

/**
 * 异步遍历文件夹，递归列出所有 jar 文件。
 * @param onProgress 每发现一个文件时的回调
 */
export async function listJarFiles(
  dirHandle: FileSystemDirectoryHandle,
  onProgress?: (count: number) => void,
): Promise<ListedFile[]> {
  const result: ListedFile[] = []
  let count = 0

  async function walk(handle: FileSystemDirectoryHandle, prefix: string): Promise<void> {
    for await (const [name, child] of handle.entries()) {
      const fullPath = prefix ? `${prefix}/${name}` : name
      if (child.kind === 'directory') {
        await walk(child as FileSystemDirectoryHandle, fullPath)
      } else if (child.kind === 'file' && isJarFile(name)) {
        result.push({ path: fullPath, name, handle: child as FileSystemFileHandle })
        count++
        onProgress?.(count)
      }
    }
  }

  await walk(dirHandle, '')
  return result
}

/** 读取文件大小 */
export async function getFileSize(handle: FileSystemFileHandle): Promise<number> {
  const file = await handle.getFile()
  return file.size
}

/** 获取 File 对象 */
export async function getFile(handle: FileSystemFileHandle): Promise<File> {
  return handle.getFile()
}

// ===== IndexedDB 句柄持久化 =====

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(handle, HANDLE_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch (e) {
    console.warn('保存文件夹句柄失败', e)
  }
}

export async function loadSavedHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openDb()
    const handle = await new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY)
      req.onsuccess = () => resolve((req.result as FileSystemDirectoryHandle) ?? null)
      req.onerror = () => reject(req.error)
    })
    db.close()
    return handle
  } catch {
    return null
  }
}

export async function clearSavedHandle(): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(HANDLE_KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    // ignore
  }
}
