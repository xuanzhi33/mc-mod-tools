/**
 * 通过 shields.io 获取 GitHub 仓库的近似 star 数。
 *
 * 只用于展示参考值，因此接受 shields 的四舍五入结果（如 `54k`）。
 * shields 对不存在的仓库会返回 200 + `value: "repo not found"`，这里一并过滤。
 */

/** 解析出 owner/repo；只认 github.com，其它托管平台（GitLab/Codeberg/自建）返回 null */
export function parseGitHubRepo(url?: string | null): { owner: string; repo: string } | null {
  if (!url) return null
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return null
  }
  if (u.hostname !== 'github.com' && u.hostname !== 'www.github.com') return null
  const [owner, repo] = u.pathname.split('/').filter(Boolean)
  if (!owner || !repo) return null
  return { owner, repo: repo.replace(/\.git$/, '') }
}

/** shields 返回的近似值：123 / 1.2k / 54k / 1.5m */
const STAR_VALUE = /^\d+(\.\d+)?[km]?$/i

const SHIELDS_BASE = 'https://img.shields.io/github/stars'

export async function fetchGitHubStars(
  owner: string,
  repo: string,
  signal?: AbortSignal,
): Promise<string | null> {
  const url = `${SHIELDS_BASE}/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}.json`
  const res = await fetch(url, { signal })
  if (!res.ok) return null
  const data = (await res.json()) as { value?: unknown }
  const value = typeof data.value === 'string' ? data.value.trim() : ''
  return STAR_VALUE.test(value) ? value : null
}
