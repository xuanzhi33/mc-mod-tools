import type { ScanProgress } from '@/types/mod'

/** 扫描阶段顺序（用于进度权重与步骤条展示） */
export const SCAN_STAGES = [
  'listing',
  'hashing',
  'querying-versions',
  'querying-projects',
  'querying-authors',
  'querying-updates',
] as const

export type ScanStep = (typeof SCAN_STAGES)[number]

/**
 * 各阶段的进度权重（合计 100），按预期耗时分配：
 * 本地哈希读取磁盘 + 计算 SHA-1，占大头；四个网络阶段各只有少量请求。
 */
const STAGE_WEIGHT: Record<ScanStep, number> = {
  listing: 5,
  hashing: 60,
  'querying-versions': 15,
  'querying-projects': 8,
  'querying-authors': 7,
  'querying-updates': 5,
}

/** 当前阶段之前所有阶段的权重之和 */
function baseWeight(index: number): number {
  let base = 0
  for (let i = 0; i < index; i++) {
    const stage = SCAN_STAGES[i]
    if (stage) base += STAGE_WEIGHT[stage]
  }
  return base
}

/**
 * 把"分阶段进度"换算成单调递增的总进度（0-100）。
 * 每进入新阶段不会归零，因此进度条不会来回跳动。
 */
export function overallPercent(progress: ScanProgress): number {
  if (progress.stage === 'done') return 100
  const index = SCAN_STAGES.indexOf(progress.stage as ScanStep)
  if (index < 0) return 0
  const stage = SCAN_STAGES[index]
  if (!stage) return 0
  const fraction = progress.total > 0 ? Math.min(1, progress.processed / progress.total) : 0
  return Math.min(100, Math.round(baseWeight(index) + STAGE_WEIGHT[stage] * fraction))
}
