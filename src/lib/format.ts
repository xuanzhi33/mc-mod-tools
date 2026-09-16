/**
 * 通用格式化工具：数字、字节、日期。
 * 统一实现，避免各组件重复定义导致行为与精度不一致。
 */

/** 紧凑数字：1234 -> 1.2K，1234567 -> 1.2M */
export function formatCompactNumber(n: number): string {
  if (!Number.isFinite(n)) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

/** 本地化千分位数字：1234 -> 1,234 */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString()
}

/** 字节数：1536 -> 1.5 KB */
export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

/** 仅日期，跟随传入的 locale；无值或非法日期返回 "—" */
export function formatDate(s: string | undefined, locale?: string): string {
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** 给定时间是否在最近 days 天内（用于高亮新发布的版本） */
export function isWithinDays(s: string | undefined, days: number, now = Date.now()): boolean {
  if (!s) return false
  const t = new Date(s).getTime()
  if (Number.isNaN(t)) return false
  return now - t < days * 24 * 60 * 60 * 1000
}
