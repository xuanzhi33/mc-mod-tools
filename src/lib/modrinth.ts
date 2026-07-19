/**
 * Modrinth Labrinth API 客户端。
 * 文档：https://docs.modrinth.com/
 */

import type { ModrinthProject, ModrinthVersion } from '@/types/mod'

const API_BASE = 'https://api.modrinth.com/v2'

// 浏览器环境下无法设置 User-Agent；Modrinth API 文档允许浏览器场景豁免。
const HEADERS: HeadersInit = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
}

const VERSION_FILES_BATCH = 10 // 单次 POST /version_files 最多 10 个 hash
const PROJECTS_BATCH = 100 // 单次 GET /projects?ids=[] 最多 100 个 id

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Modrinth API ${res.status} ${res.statusText}: ${text || url}`)
  }
  return res.json() as Promise<T>
}

/** 睡眠 */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * 根据 hash 批量查询 version。
 * 自动分批（每批 10 个），返回 hash -> Version 映射。
 */
export async function fetchVersionsByHashes(
  hashes: string[],
  algorithm: 'sha1' | 'sha512' = 'sha1',
  onProgress?: (done: number, total: number) => void,
): Promise<Record<string, ModrinthVersion>> {
  const result: Record<string, ModrinthVersion> = {}
  const unique = [...new Set(hashes)]
  const total = unique.length
  let done = 0

  for (let i = 0; i < unique.length; i += VERSION_FILES_BATCH) {
    const batch = unique.slice(i, i + VERSION_FILES_BATCH)

    const body = JSON.stringify({ hashes: batch, algorithm })
     
    const data = await request<Record<string, ModrinthVersion>>(
      `${API_BASE}/version_files`,
      { method: 'POST', headers: HEADERS, body },
    )
    Object.assign(result, data)
    done += batch.length
    onProgress?.(done, total)
    // 简单限流，避免 429
    if (i + VERSION_FILES_BATCH < unique.length) {
       
      await sleep(120)
    }
  }

  return result
}

/**
 * 根据 project id 批量查询 project 详情。
 * 自动分批（每批 100 个），返回 id -> Project 映射。
 */
export async function fetchProjectsByIds(
  ids: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<Record<string, ModrinthProject>> {
  const result: Record<string, ModrinthProject> = {}
  const unique = [...new Set(ids.filter(Boolean))]
  const total = unique.length
  let done = 0

  for (let i = 0; i < unique.length; i += PROJECTS_BATCH) {
    const batch = unique.slice(i, i + PROJECTS_BATCH)
    // GET /projects?ids=[...] 需要 URL 编码的 JSON 数组
    const query = encodeURIComponent(JSON.stringify(batch))
     
    const data = await request<ModrinthProject[]>(`${API_BASE}/projects?ids=${query}`)
    for (const p of data) {
      result[p.id] = p
    }
    done += batch.length
    onProgress?.(done, total)
    if (i + PROJECTS_BATCH < unique.length) {
       
      await sleep(120)
    }
  }

  return result
}
