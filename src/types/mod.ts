// Modrinth API 类型定义

export interface ModrinthProject {
  slug: string
  title: string
  description: string
  description_html?: string
  categories: string[]
  client_side: 'required' | 'optional' | 'unsupported'
  server_side: 'required' | 'optional' | 'unsupported'
  project_type: 'mod' | 'modpack' | 'resourcepack' | 'shader' | 'plugin' | 'datapack'
  downloads: number
  followers: number
  icon_url: string | null
  published: string
  updated: string
  team: string
  license: { id: string; name: string; url: string | null }
  versions: string[]
  gallery: string[]
  color: number | null
  featured_gallery: string | null
  id: string
  /** 作者用户名。项目接口不返回，需由 search 接口补充（见 fetchProjectSearchMeta） */
  author?: string

  // —— 以下字段用于安全 / 可信度评估 ——
  /** 项目审核状态 */
  status?: ProjectStatus
  /** 作者提交审核 / 排期时申请的目标可见性状态（approved = 公开）。与 status 不一致才意味着有未决变更 */
  requested_status?: ProjectStatus | null
  /** 审核备注（公开项目通常为 null） */
  moderator_message?: string | null
  /** 通过审核的时间 */
  approved?: string
  /** 进入审核队列的时间 */
  queued?: string | null
  /** 变现状态，force-demonetized = 被官方强制取消变现 */
  monetization_status?: MonetizationStatus
  /** 源码仓库 */
  source_url?: string | null
  /** 问题反馈地址 */
  issues_url?: string | null
  /** 文档 / Wiki 地址 */
  wiki_url?: string | null
  /** Discord 邀请链接 */
  discord_url?: string | null
  /** 所属组织 id */
  organization?: string | null
  /** 审核帖 id */
  thread_id?: string
  /** 支持的运行环境 */
  environment?: Environment[]
  /** 作者申报的内容披露。项目接口不返回，需由 search 接口补充 */
  disclosure_types?: DisclosureType[]
  /** 组织名（来自 search 接口，项目接口只返回组织 id） */
  organization_name?: string | null
}

/** 项目审核状态 */
export type ProjectStatus =
  | 'approved'
  | 'archived'
  | 'rejected'
  | 'draft'
  | 'unlisted'
  | 'processing'
  | 'withheld'
  | 'scheduled'
  | 'private'
  | 'unknown'

/** 版本状态 */
export type VersionStatus = 'listed' | 'archived' | 'draft' | 'unlisted' | 'scheduled' | 'unknown'

/** 变现状态 */
export type MonetizationStatus = 'monetized' | 'demonetized' | 'force-demonetized'

/** 作者必须申报的内容披露（安全相关） */
export type DisclosureType =
  | 'ai_content'
  | 'ai_content_code'
  | 'ai_content_assets'
  | 'ai_content_text'
  | 'ai_functionality'
  | 'advertisements'
  | 'epilepsy_triggers'
  | 'system_interactions'
  | 'telemetry'
  | 'telemetry_opt_in'
  | 'telemetry_opt_out'
  | 'telemetry_always_active'
  | 'derivative_work'
  | 'paid_features'
  | 'archived'

/** 项目 / 版本支持的运行环境 */
export type Environment =
  | 'client_and_server'
  | 'client_only'
  | 'client_only_server_optional'
  | 'singleplayer_only'
  | 'server_only'
  | 'server_only_client_optional'
  | 'dedicated_server_only'
  | 'client_or_server'
  | 'client_or_server_prefers_both'
  | 'unknown'

export interface ModrinthFile {
  hashes: { sha1: string; sha512: string }
  url: string
  filename: string
  primary: boolean
  size: number
  file_type: string | null
}

export interface ModrinthDependency {
  version_id: string | null
  project_id: string | null
  file_name: string | null
  version_type: 'required' | 'optional' | 'incompatible' | 'embedded'
  dependency_type?: 'required' | 'optional' | 'incompatible' | 'embedded'
}

export interface ModrinthVersion {
  name: string
  version_number: string
  changelog: string
  dependencies: ModrinthDependency[]
  game_versions: string[]
  version_type: 'release' | 'beta' | 'alpha'
  loaders: string[]
  featured: boolean
  status: VersionStatus
  /** 支持的运行环境。注意：版本级是单个值，项目级才是数组 */
  environment?: Environment
  id: string
  project_id: string
  author_id: string
  date_published: string
  downloads: number
  files: ModrinthFile[]
}

// 本地文件 + 元信息聚合
export type ModFileStatus =
  | 'pending' // 待处理
  | 'hashing' // 计算 hash 中
  | 'querying' // 查询 Modrinth 中
  | 'matched' // 已识别
  | 'not_found' // Modrinth 未找到
  | 'error' // 出错

export interface ModFile {
  /** 相对文件夹根的路径 */
  path: string
  /** 仅文件名 */
  name: string
  /** 字节数 */
  size: number
  handle: FileSystemFileHandle
  /** SHA-1 十六进制小写 */
  sha1?: string
  status: ModFileStatus
  /** Modrinth 返回的版本信息 */
  version?: ModrinthVersion
  /** 相对当前 profile（加载器 + MC 版本）的最新版本；null = 已检查但无法确定 */
  update?: ModrinthVersion | null
  /** Modrinth 返回的项目信息 */
  project?: ModrinthProject
  error?: string
}

export type ScanStage =
  | 'idle'
  | 'listing'
  | 'hashing'
  | 'querying-versions'
  | 'querying-projects'
  | 'querying-authors'
  | 'querying-updates'
  | 'done'
  | 'error'

export interface ScanProgress {
  stage: ScanStage
  total: number
  processed: number
  message?: string
}
