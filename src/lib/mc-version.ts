/**
 * MC 版本号比较与排序。
 * 版本号形如 `1.21.4`、`26.3-rc-1`、`24w14a`；
 * 只用于下拉框排序，要求方向正确、稳定即可。
 */

function leadingNumber(segment: string | undefined): number {
  if (!segment) return 0
  const match = /^\d+/.exec(segment)
  return match ? Number(match[0]) : 0
}

/** 比较两个 MC 版本号；返回 > 0 表示 a 比 b 新 */
export function compareMcVersions(a: string, b: string): number {
  const [aBase = '', ...aPre] = a.split('-')
  const [bBase = '', ...bPre] = b.split('-')

  const aParts = aBase.split('.')
  const bParts = bBase.split('.')
  const len = Math.max(aParts.length, bParts.length)
  for (let i = 0; i < len; i++) {
    const diff = leadingNumber(aParts[i]) - leadingNumber(bParts[i])
    if (diff !== 0) return diff
  }

  // 正式版视为比预发布版新
  if (aPre.length === 0 && bPre.length > 0) return 1
  if (aPre.length > 0 && bPre.length === 0) return -1

  return (
    aPre.join('-').localeCompare(bPre.join('-'), undefined, { numeric: true }) ||
    a.localeCompare(b, undefined, { numeric: true })
  )
}
