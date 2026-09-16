import type { ModFileStatus } from '@/types/mod'

/** 未识别：没匹配到 Modrinth 项目，或读取/哈希出错（极少见） */
export function isUnrecognized(status: ModFileStatus): boolean {
  return status === 'not_found' || status === 'error'
}
