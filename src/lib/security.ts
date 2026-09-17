import { formatCompactNumber, isWithinDays } from '@/lib/format'
import type { DisclosureType, ModFile, ModrinthProject, ProjectStatus } from '@/types/mod'

/**
 * 各披露项的风险等级（用于着色与生成风险提示）。
 *
 * high   = 直接涉及数据/系统安全，会进入「风险提示」
 * medium = 值得注意
 * info   = 仅作告知，不强调
 */
export const DISCLOSURE_SEVERITY: Record<DisclosureType, RiskLevel | 'info'> = {
  // 会读写系统 / 其它进程，风险最高
  system_interactions: 'high',
  advertisements: 'medium',
  archived: 'medium',
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
}

/** 风险等级，info 不会进入风险清单 */
export type RiskLevel = 'high' | 'medium'

/** 当前版本下载量低于此值 => 下载量偏低 */
export const LOW_DOWNLOAD_THRESHOLD = 100_000

/** 当前版本发布不足这么多天 => 新发布 */
export const NEW_RELEASE_DAYS = 3

/** 项目超过这么多天未更新 => 疑似停止维护 */
export const STALE_DAYS = 730

/** 由官方主动处置的项目状态：风险最高 */
const OFFICIAL_PROJECT_ACTIONS = new Set<ProjectStatus>(['rejected', 'withheld'])

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

/** 当前版本是否为「新发布」（下载量尚未积累） */
export function isNewRelease(mod: ModFile | null | undefined, now = Date.now()): boolean {
  return isWithinDays(mod?.version?.date_published, NEW_RELEASE_DAYS, now)
}

/** 当前版本下载量是否偏低 */
export function isLowDownloads(mod: ModFile | null | undefined): boolean {
  const downloads = mod?.version?.downloads
  return typeof downloads === 'number' && downloads < LOW_DOWNLOAD_THRESHOLD
}

/** 项目是否长期未更新，返回已过去的整年数（未超过 STALE_DAYS 返回 0） */
export function staleYears(updated: string | null | undefined, now = Date.now()): number {
  if (!updated) return 0
  const days = (now - new Date(updated).getTime()) / 86_400_000
  return days >= STALE_DAYS ? Math.floor(days / 365) : 0
}

/** securityWarnings 需要的最小 i18n 接口 */
export interface SecurityI18n {
  t: (key: string, named?: Record<string, unknown>) => string
  te: (key: string) => boolean
}

export interface SecurityWarning {
  level: RiskLevel
  /** 已翻译的文案 */
  text: string
}

/** 取风险等级最高的一项，null 表示无风险提示 */
export function highestRiskLevel(warnings: SecurityWarning[]): RiskLevel | null {
  if (warnings.some((w) => w.level === 'high')) return 'high'
  return warnings.length ? 'medium' : null
}

/** 取 i18n 文案，缺失时回退原始枚举值 */
function enumLabel(i18n: SecurityI18n, prefix: string, value?: string | null): string {
  if (!value) return '—'
  const key = `${prefix}.${value}`
  return i18n.te(key) ? i18n.t(key) : value
}

/**
 * 汇总一个模组的风险提示（高 / 中两级）。数据全部来自已有的 /v2/projects 与 /v2/search
 * 响应，不产生额外网络请求。
 *
 * 注意：遥测类披露已降为 info，不会出现在这里，只在「作者申报披露」中展示。
 */
export function securityWarnings(
  mod: ModFile | null | undefined,
  i18n: SecurityI18n,
  now = Date.now(),
): SecurityWarning[] {
  const p = mod?.project
  const v = mod?.version
  const out: SecurityWarning[] = []
  if (!mod) return out

  // ——— 项目层面 ———
  if (p) {
    if (p.monetization_status === 'force-demonetized') {
      out.push({ level: 'high', text: i18n.t('mod.security.warn.forceDemonetized') })
    } else if (p.monetization_status === 'demonetized') {
      out.push({ level: 'medium', text: i18n.t('mod.security.warn.demonetized') })
    }

    if (p.status && p.status !== 'approved') {
      out.push({
        level: OFFICIAL_PROJECT_ACTIONS.has(p.status) ? 'high' : 'medium',
        text: i18n.t('mod.security.warn.projectStatus', {
          status: enumLabel(i18n, 'mod.security.status', p.status),
        }),
      })
    }

    if (p.requested_status && p.requested_status !== p.status) {
      out.push({
        level: 'medium',
        text: i18n.t('mod.security.warn.requestedStatus', {
          status: enumLabel(i18n, 'mod.security.status', p.requested_status),
        }),
      })
    }

    if (p.moderator_message) {
      out.push({
        level: 'medium',
        text: i18n.t('mod.security.warn.moderatorMessage', { message: p.moderator_message }),
      })
    }

    for (const d of p.disclosure_types ?? []) {
      const severity = DISCLOSURE_SEVERITY[d]
      if (severity !== 'info') {
        out.push({ level: severity, text: enumLabel(i18n, 'mod.security.disclosureType', d) })
      }
    }

    if (!p.source_url && isCustomLicense(p.license)) {
      out.push({ level: 'medium', text: i18n.t('mod.security.warn.noSource') })
    }

    const years = staleYears(p.updated, now)
    if (years > 0) {
      out.push({ level: 'medium', text: i18n.t('mod.security.warn.stale', { years }) })
    }
  }

  // ——— 当前版本 / 文件层面 ———
  if (v?.status && v.status !== 'listed') {
    out.push({
      level: 'medium',
      text: i18n.t('mod.security.warn.versionStatus', {
        status: enumLabel(i18n, 'mod.security.versionStatus', v.status),
      }),
    })
  }
  if (v?.version_type && v.version_type !== 'release') {
    out.push({
      level: 'medium',
      text: i18n.t('mod.security.warn.prerelease', {
        type: enumLabel(i18n, 'mod.security.versionType', v.version_type),
      }),
    })
  }
  const embedded = embeddedDependencyCount(mod)
  if (embedded > 0) {
    out.push({ level: 'medium', text: i18n.t('mod.security.warn.embedded', { n: embedded }) })
  }

  if (isLowDownloads(mod)) {
    out.push({
      level: 'medium',
      text: i18n.t('mod.security.warn.lowDownloads', {
        n: formatCompactNumber(LOW_DOWNLOAD_THRESHOLD),
      }),
    })
  }
  if (isNewRelease(mod, now)) {
    out.push({
      level: 'medium',
      text: i18n.t('mod.security.warn.newRelease', { days: NEW_RELEASE_DAYS }),
    })
  }

  return out
}
