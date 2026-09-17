import type { ModFile } from '@/types/mod'

/**
 * 是否有可用更新。
 *
 * 注意同时要求「版本 id 不同」与「发布日期更晚」：
 * 当用户把 MC 版本切到比实例更旧时，接口会返回更旧的版本，此时不算更新。
 */
export function hasUpdate(m: ModFile): boolean {
  const u = m.update
  if (!u || !m.version) return false
  return u.id !== m.version.id && u.date_published > m.version.date_published
}

/** 已检查且已是最新（用于把版本字段标绿） */
export function isUpToDate(m: ModFile): boolean {
  return !!m.update && !!m.version && !hasUpdate(m)
}
