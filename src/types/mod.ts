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
  /** 作者用户名。项目接口不返回，需由 search 接口补充（见 fetchProjectAuthors） */
  author?: string
}

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
  status: 'listed' | 'archived' | 'draft' | 'unlisted' | 'scheduled' | 'unknown'
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
