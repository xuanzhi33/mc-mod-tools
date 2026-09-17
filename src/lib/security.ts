import type { DisclosureType, ModFile, ModrinthProject } from '@/types/mod'

/**
 * 各披露项的风险等级（用于着色与生成风险提示）。
 *
 * high   = 直接涉及数据/系统安全
 * medium = 值得注意
 * info   = 仅作告知
 */
/**
 * 各披露项的风险等级（用于着色与生成风险提示）。
 *
 * high   = 直接涉及数据/系统安全，会进入「风险提示」
 * medium = 值得注意
 * info   = 仅作告知，不强调
 */
export const DISCLOSURE_SEVERITY: Record<DisclosureType, 'high' | 'medium' | 'info'> = {
  // 会读写系统 / 其它进程，风险最高
  system_interactions: 'high',
  advertisements: 'medium',
  // 遥测很常见且多为合规/统计目的，仅作告知，不在风险提示中强调
  telemetry: 'info',
  telemetry_opt_in: 'info',
  telemetry_opt_out: 'info',
  telemetry_always_active: 'info',
  epilepsy_triggers: 'info',
  paid_features: 'info',
  derivative_work: 'info',
  ai_content: 'info',
  ai_content_code: 'info',
  ai_content_assets: 'info',
  ai_content_text: 'info',
  ai_functionality: 'info',
  archived: 'info',
}

/**
 * 许可证是否"不明确"：没有名称，或是自定义许可（SPDX LicenseRef-*）。
 * 这类项目既看不到源码，也没有标准开源协议，审计难度最高。
 */
export function isCustomLicense(license?: ModrinthProject['license'] | null): boolean {
  if (!license) return true
  return !license.name || (license.id ?? '').startsWith('LicenseRef-')
}

/** 内置（embedded）依赖数量：jar 里额外打包了别的模组 */
export function embeddedDependencyCount(mod: ModFile): number {
  return (mod.version?.dependencies ?? []).filter(
    (d) => (d.dependency_type ?? d.version_type) === 'embedded',
  ).length
}
