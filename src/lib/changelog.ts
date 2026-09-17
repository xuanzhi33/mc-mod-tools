/** 更新日志的一行 */
export interface ChangelogLine {
  kind: 'heading' | 'bullet' | 'text'
  text: string
}

/** 去掉常见的行内 Markdown：图片 / 链接 / 粗体 / 整行斜体 / 行内代码 / HTML 标签 */
function cleanInline(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/(^|\s)_([^_]+)_(?=\s|[.,;:!?)]|$)/g, '$1$2')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/<\/?[a-zA-Z][^>]*>/g, '')
    .trim()
}

/**
 * 解析更新日志（Markdown）为可渲染的行。
 *
 * 只区分标题 / 列表 / 普通段落，不引入 Markdown 解析库；
 * 空行直接丢弃。
 */
export function parseChangelog(changelog: string | null | undefined): ChangelogLine[] {
  return (changelog ?? '')
    .split('\n')
    .filter((raw) => raw.trim())
    .map((raw): ChangelogLine => {
      const heading = raw.match(/^#{1,6}\s+(.*)$/)
      if (heading) return { kind: 'heading', text: cleanInline(heading[1] ?? '') }
      const bullet = raw.match(/^\s*(?:[-*+]|\d+\.)\s+(.*)$/)
      if (bullet) return { kind: 'bullet', text: cleanInline(bullet[1] ?? '') }
      return { kind: 'text', text: cleanInline(raw) }
    })
    .filter((line) => line.text)
}
