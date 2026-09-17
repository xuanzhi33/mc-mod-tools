<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ExternalLink, FileText, ShieldAlert, ShieldCheck, Star } from 'lucide-vue-next'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { formatBytes, formatDate, formatNumber } from '@/lib/format'
import { fetchGitHubStars, parseGitHubRepo } from '@/lib/github'
import { DISCLOSURE_SEVERITY, embeddedDependencyCount, isCustomLicense } from '@/lib/security'
import type { DisclosureType, Environment, ModFile } from '@/types/mod'

const props = defineProps<{ modelValue: boolean; mod: ModFile | null }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>()

const { t, te, locale } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const projectUrl = computed(() => {
  if (!props.mod?.project) return null
  return `https://modrinth.com/project/${props.mod.project.slug}`
})

const versionUrl = computed(() => {
  if (!props.mod?.version) return null
  return `https://modrinth.com/project/${props.mod.project?.slug ?? ''}/version/${props.mod.version.id}`
})

function formatDateLocal(s?: string): string {
  return formatDate(s, locale.value)
}

/** 优先取 i18n 文案，缺失时回退原始枚举值 */
function label(prefix: string, value?: string | null): string {
  if (!value) return '—'
  const key = `${prefix}.${value}`
  return te(key) ? t(key) : value
}

/** 只显示域名 + 路径，避免过长 */
function shortUrl(url: string): string {
  try {
    const u = new URL(url)
    return `${u.host}${u.pathname.replace(/\/$/, '')}`
  } catch {
    return url
  }
}

const DISCLOSURE_BADGE: Record<'high' | 'medium' | 'info', string> = {
  high: 'border-destructive/40 bg-destructive/10 text-destructive',
  medium: 'border-orange-500/40 bg-orange-500/10 text-orange-500',
  info: '',
}

const disclosures = computed<DisclosureType[]>(() => props.mod?.project?.disclosure_types ?? [])

const environments = computed<Environment[]>(() => {
  // 版本级 environment 是单个值，项目级是数组
  const raw = props.mod?.version?.environment ?? props.mod?.project?.environment
  if (!raw) return []
  return [...new Set(Array.isArray(raw) ? raw : [raw])]
})

const embeddedDeps = computed(() => (props.mod ? embeddedDependencyCount(props.mod) : 0))

const gameVersions = computed(() => props.mod?.version?.game_versions ?? [])
const loaders = computed(() => props.mod?.version?.loaders ?? [])

const showAllGameVersions = ref(false)
const showAllLoaders = ref(false)

/** 折叠时 MC 版本只留最新一个，加载器只留第一个 */
const visibleGameVersions = computed(() =>
  showAllGameVersions.value ? gameVersions.value : gameVersions.value.slice(-1),
)
const visibleLoaders = computed(() =>
  showAllLoaders.value ? loaders.value : loaders.value.slice(0, 1),
)

// 切换模组时收起
watch(
  () => props.mod?.path,
  () => {
    showAllGameVersions.value = false
    showAllLoaders.value = false
  },
)

/** 源码仓库（仅 GitHub 才支持查 star） */
const githubRepo = computed(() => parseGitHubRepo(props.mod?.project?.source_url))

/** 近似 star 数（shields.io），null = 未知/失败 */
const stars = ref<string | null>(null)
const starsLoading = ref(false)
let starsReqId = 0

/** 仅在面板打开时按需请求（shields 响应自带 30 分钟缓存，故不再自行缓存） */
async function loadStars() {
  const repo = githubRepo.value
  const id = ++starsReqId
  stars.value = null
  if (!props.modelValue || !repo) {
    starsLoading.value = false
    return
  }
  starsLoading.value = true
  try {
    const value = await fetchGitHubStars(repo.owner, repo.repo)
    if (id === starsReqId) stars.value = value
  } catch {
    // 失败则静默不展示
  } finally {
    if (id === starsReqId) starsLoading.value = false
  }
}

watch(
  () => [props.modelValue, githubRepo.value?.owner, githubRepo.value?.repo] as const,
  loadStars,
  {
    immediate: true,
  },
)

/** 用于 VirusTotal 查询的主文件 */
const primaryFile = computed(() => {
  const files = props.mod?.version?.files ?? []
  return files.find((f) => f.primary) ?? files[0] ?? null
})

const virusTotalUrl = computed(() =>
  primaryFile.value
    ? `https://www.virustotal.com/gui/search/${primaryFile.value.hashes.sha1}`
    : null,
)

const communityLinks = computed(() => {
  const p = props.mod?.project
  if (!p) return [] as { key: string; label: string; url: string }[]
  const out: { key: string; label: string; url: string }[] = []
  if (p.issues_url) out.push({ key: 'issues', label: t('mod.security.issues'), url: p.issues_url })
  if (p.wiki_url) out.push({ key: 'wiki', label: t('mod.security.wiki'), url: p.wiki_url })
  if (p.discord_url)
    out.push({ key: 'discord', label: t('mod.security.discord'), url: p.discord_url })
  return out
})

interface Warning {
  text: string
  level: 'high' | 'medium'
}

/** 风险提示（只列 important 的，完整信息在下方明细里） */
const warnings = computed<Warning[]>(() => {
  const p = props.mod?.project
  const v = props.mod?.version
  const out: Warning[] = []
  if (!p) return out

  if (p.monetization_status === 'force-demonetized') {
    out.push({ text: t('mod.security.warn.forceDemonetized'), level: 'high' })
  }
  if (p.status && p.status !== 'approved') {
    out.push({
      text: t('mod.security.warn.projectStatus', {
        status: label('mod.security.status', p.status),
      }),
      level: 'high',
    })
  }
  if (p.requested_status && p.requested_status !== p.status) {
    out.push({
      text: t('mod.security.warn.requestedStatus', {
        status: label('mod.security.status', p.requested_status),
      }),
      level: 'medium',
    })
  }
  if (v?.status && v.status !== 'listed') {
    out.push({
      text: t('mod.security.warn.versionStatus', {
        status: label('mod.security.versionStatus', v.status),
      }),
      level: 'medium',
    })
  }
  for (const d of disclosures.value) {
    if (DISCLOSURE_SEVERITY[d] === 'high') {
      out.push({ text: label('mod.security.disclosureType', d), level: 'high' })
    }
  }
  if (!p.source_url && isCustomLicense(p.license)) {
    out.push({ text: t('mod.security.warn.noSource'), level: 'medium' })
  }
  if (embeddedDeps.value > 0) {
    out.push({ text: t('mod.security.warn.embedded', { n: embeddedDeps.value }), level: 'medium' })
  }
  return out
})
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent side="right" class="flex w-full flex-col gap-0 p-0 sm:max-w-md">
      <SheetHeader class="shrink-0 gap-2 space-y-0 border-b p-4 pr-12">
        <div class="flex items-start gap-3">
          <img
            v-if="mod?.project?.icon_url"
            :src="mod.project.icon_url"
            :alt="mod.project.title"
            class="bg-muted size-12 shrink-0 rounded object-cover"
          />
          <div v-else class="bg-muted flex size-12 shrink-0 items-center justify-center rounded">
            <FileText class="text-muted-foreground size-6" />
          </div>
          <div class="min-w-0 flex-1">
            <SheetTitle class="truncate text-base">
              {{ mod?.project?.title ?? mod?.name ?? '—' }}
            </SheetTitle>
            <SheetDescription class="truncate">
              {{ mod?.project?.slug ?? mod?.name }}
            </SheetDescription>
          </div>
        </div>
        <div v-if="mod?.version || projectUrl" class="flex flex-wrap items-center gap-1.5">
          <template v-if="mod?.version">
            <Badge variant="secondary" class="font-mono">
              {{ mod.version.version_number }}
            </Badge>
            <Badge variant="outline">
              {{ mod.version.version_type }}
            </Badge>
          </template>
          <div class="ml-auto flex items-center gap-1">
            <Button v-if="projectUrl" as-child variant="ghost" size="sm" class="h-6 px-2 text-xs">
              <a :href="projectUrl" target="_blank" rel="noopener noreferrer">
                <ExternalLink class="size-3" />Modrinth
              </a>
            </Button>
            <Button v-if="versionUrl" as-child variant="ghost" size="sm" class="h-6 px-2 text-xs">
              <a :href="versionUrl" target="_blank" rel="noopener noreferrer">
                <ExternalLink class="size-3" />{{ t('mod.detail.viewVersion') }}
              </a>
            </Button>
          </div>
        </div>
      </SheetHeader>

      <div v-if="mod" class="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <!-- 描述 -->
        <section v-if="mod.project?.description" class="space-y-1">
          <h4 class="text-muted-foreground text-xs tracking-wide uppercase">
            {{ t('mod.detail.description') }}
          </h4>
          <p class="text-sm leading-relaxed">{{ mod.project.description }}</p>
        </section>

        <!-- 项目信息 -->
        <section class="space-y-2">
          <h4 class="text-muted-foreground text-xs tracking-wide uppercase">
            {{ t('mod.detail.projectInfo') }}
          </h4>
          <dl class="text-sm">
            <div class="flex justify-between py-1">
              <dt class="text-muted-foreground">{{ t('mod.detail.author') }}</dt>
              <dd>{{ mod.project?.author ?? '—' }}</dd>
            </div>
            <div class="flex justify-between py-1">
              <dt class="text-muted-foreground">{{ t('mod.detail.downloads') }}</dt>
              <dd class="flex items-center gap-1 tabular-nums" :title="t('mod.downloadsHint')">
                <span>{{ formatNumber(mod.version?.downloads ?? 0) }}</span>
                <span>/</span>
                <span class="text-muted-foreground">
                  {{ formatNumber(mod.project?.downloads ?? 0) }}
                </span>
              </dd>
            </div>
            <div class="flex justify-between py-1">
              <dt class="text-muted-foreground">{{ t('mod.detail.follows') }}</dt>
              <dd class="tabular-nums">{{ formatNumber(mod.project?.followers ?? 0) }}</dd>
            </div>
            <div class="flex justify-between py-1">
              <dt class="text-muted-foreground">{{ t('mod.detail.updated') }}</dt>
              <dd>{{ formatDateLocal(mod.project?.updated) }}</dd>
            </div>
          </dl>
        </section>

        <Separator />

        <!-- 版本信息 -->
        <section class="space-y-2">
          <h4 class="text-muted-foreground text-xs tracking-wide uppercase">
            {{ t('mod.detail.versionInfo') }}
          </h4>
          <dl class="text-sm">
            <div class="grid grid-cols-2 gap-x-3 gap-y-1 py-1">
              <!-- MC 版本：折叠时只显示最新一个 -->
              <div class="min-w-0">
                <dt class="text-muted-foreground mb-1">{{ t('mod.col.mcVersions') }}</dt>
                <dd class="flex flex-wrap items-center gap-1">
                  <template v-if="gameVersions.length">
                    <Badge
                      v-for="gv in visibleGameVersions"
                      :key="gv"
                      variant="outline"
                      class="font-mono text-xs"
                    >
                      {{ gv }}
                    </Badge>
                    <Badge
                      v-if="gameVersions.length > 1"
                      as-child
                      variant="outline"
                      class="font-mono text-xs"
                    >
                      <button
                        type="button"
                        class="cursor-pointer"
                        :title="
                          showAllGameVersions ? t('mod.detail.collapse') : t('mod.detail.expand')
                        "
                        @click="showAllGameVersions = !showAllGameVersions"
                      >
                        {{ showAllGameVersions ? '−' : `+${gameVersions.length - 1}` }}
                      </button>
                    </Badge>
                  </template>
                  <span v-else class="text-muted-foreground text-xs">—</span>
                </dd>
              </div>

              <!-- 加载器：折叠时只显示第一个 -->
              <div class="min-w-0">
                <dt class="text-muted-foreground mb-1">{{ t('mod.col.loaders') }}</dt>
                <dd class="flex flex-wrap items-center gap-1">
                  <template v-if="loaders.length">
                    <Badge
                      v-for="ld in visibleLoaders"
                      :key="ld"
                      variant="secondary"
                      class="font-mono text-xs"
                    >
                      {{ ld }}
                    </Badge>
                    <Badge
                      v-if="loaders.length > 1"
                      as-child
                      variant="secondary"
                      class="font-mono text-xs"
                    >
                      <button
                        type="button"
                        class="cursor-pointer"
                        :title="showAllLoaders ? t('mod.detail.collapse') : t('mod.detail.expand')"
                        @click="showAllLoaders = !showAllLoaders"
                      >
                        {{ showAllLoaders ? '−' : `+${loaders.length - 1}` }}
                      </button>
                    </Badge>
                  </template>
                  <span v-else class="text-muted-foreground text-xs">—</span>
                </dd>
              </div>
            </div>
            <div class="flex justify-between py-1">
              <dt class="text-muted-foreground">{{ t('mod.detail.published') }}</dt>
              <dd>{{ formatDateLocal(mod.version?.date_published) }}</dd>
            </div>
          </dl>
        </section>

        <!-- 安全 / 信任 -->
        <template v-if="mod.project">
          <Separator />

          <section class="space-y-2">
            <h4 class="text-muted-foreground text-xs tracking-wide uppercase">
              {{ t('mod.security.title') }}
            </h4>

            <!-- 风险提示 -->
            <ul v-if="warnings.length" class="space-y-1">
              <li
                v-for="(w, i) in warnings"
                :key="i"
                class="flex items-start gap-1.5 rounded-md border px-2 py-1 text-xs"
                :class="
                  w.level === 'high'
                    ? 'border-destructive/40 bg-destructive/10 text-destructive'
                    : 'border-orange-500/40 bg-orange-500/10 text-orange-500'
                "
              >
                <ShieldAlert class="mt-0.5 size-3 shrink-0" />
                <span>{{ w.text }}</span>
              </li>
            </ul>
            <p v-else class="flex items-center gap-1.5 text-xs text-emerald-500">
              <ShieldCheck class="size-3 shrink-0" />
              {{ t('mod.security.noWarnings') }}
            </p>

            <dl class="text-sm">
              <!-- 审核备注 -->
              <div v-if="mod.project.moderator_message" class="py-1">
                <dt class="text-destructive mb-1">{{ t('mod.security.moderatorMessage') }}</dt>
                <dd class="text-destructive text-xs">{{ mod.project.moderator_message }}</dd>
              </div>

              <!-- 作者申报披露 -->
              <div class="py-1">
                <dt class="text-muted-foreground mb-1">{{ t('mod.security.disclosure') }}</dt>
                <dd v-if="disclosures.length" class="flex flex-wrap gap-1">
                  <Badge
                    v-for="d in disclosures"
                    :key="d"
                    variant="outline"
                    class="text-[11px]"
                    :class="DISCLOSURE_BADGE[DISCLOSURE_SEVERITY[d]]"
                  >
                    {{ label('mod.security.disclosureType', d) }}
                  </Badge>
                </dd>
                <dd v-else class="text-muted-foreground text-xs">
                  {{ t('mod.security.disclosureNone') }}
                </dd>
              </div>

              <!-- 审核状态 -->
              <div class="flex justify-between gap-3 py-1">
                <dt class="text-muted-foreground shrink-0">{{ t('mod.security.reviewStatus') }}</dt>
                <dd class="text-right">
                  {{ label('mod.security.status', mod.project.status) }}
                  <span v-if="mod.project.approved" class="text-muted-foreground">
                    · {{ formatDateLocal(mod.project.approved) }}
                  </span>
                </dd>
              </div>

              <!-- 变现状态 -->
              <div v-if="mod.project.monetization_status" class="flex justify-between gap-3 py-1">
                <dt class="text-muted-foreground shrink-0">{{ t('mod.security.monetization') }}</dt>
                <dd
                  class="text-right"
                  :class="
                    mod.project.monetization_status === 'force-demonetized' && 'text-destructive'
                  "
                >
                  {{ label('mod.security.monetizationStatus', mod.project.monetization_status) }}
                </dd>
              </div>

              <!-- 许可证 -->
              <div class="flex justify-between gap-3 py-1">
                <dt class="text-muted-foreground shrink-0">{{ t('mod.security.license') }}</dt>
                <dd class="min-w-0 text-right">
                  <a
                    v-if="mod.project.license?.url"
                    :href="mod.project.license.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 hover:underline"
                  >
                    <span class="truncate">
                      {{ mod.project.license.name || mod.project.license.id }}
                    </span>
                    <ExternalLink class="size-3 shrink-0" />
                  </a>
                  <span v-else class="truncate">
                    {{ mod.project.license?.name || mod.project.license?.id || '—' }}
                  </span>
                  <span v-if="isCustomLicense(mod.project.license)" class="text-muted-foreground">
                    （{{ t('mod.security.licenseCustom') }}）
                  </span>
                </dd>
              </div>

              <!-- 公开源码 -->
              <div class="flex justify-between gap-3 py-1">
                <dt class="text-muted-foreground shrink-0">{{ t('mod.security.source') }}</dt>
                <dd class="min-w-0 text-right">
                  <a
                    v-if="mod.project.source_url"
                    :href="mod.project.source_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex max-w-full items-center gap-1 hover:underline"
                  >
                    <span class="truncate font-mono text-xs">
                      {{ shortUrl(mod.project.source_url) }}
                    </span>
                    <ExternalLink class="size-3 shrink-0" />
                  </a>
                  <span v-else class="text-muted-foreground">
                    {{ t('mod.security.notProvided') }}
                  </span>
                  <span
                    v-if="githubRepo && (stars || starsLoading)"
                    class="text-muted-foreground ml-1.5 inline-flex items-center gap-0.5 align-middle text-xs whitespace-nowrap"
                    :title="t('mod.security.starsHint')"
                  >
                    <Star class="size-3 shrink-0" />
                    {{ stars ?? '…' }}
                  </span>
                </dd>
              </div>

              <!-- 反馈渠道 -->
              <div v-if="communityLinks.length" class="flex justify-between gap-3 py-1">
                <dt class="text-muted-foreground shrink-0">{{ t('mod.security.community') }}</dt>
                <dd class="flex flex-wrap justify-end gap-x-2 gap-y-1">
                  <a
                    v-for="l in communityLinks"
                    :key="l.key"
                    :href="l.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-primary inline-flex items-center gap-1 hover:underline"
                  >
                    {{ l.label }}
                    <ExternalLink class="size-3" />
                  </a>
                </dd>
              </div>

              <!-- 所属组织 -->
              <div
                v-if="mod.project.organization_name || mod.project.organization"
                class="flex justify-between gap-3 py-1"
              >
                <dt class="text-muted-foreground shrink-0">{{ t('mod.security.organization') }}</dt>
                <dd class="truncate text-right">
                  {{ mod.project.organization_name ?? mod.project.organization }}
                </dd>
              </div>

              <!-- 官方精选 -->
              <div v-if="mod.version" class="flex justify-between gap-3 py-1">
                <dt class="text-muted-foreground shrink-0">{{ t('mod.security.featured') }}</dt>
                <dd
                  class="text-right"
                  :class="
                    mod.version.featured ? 'text-primary font-medium' : 'text-muted-foreground'
                  "
                >
                  {{ mod.version.featured ? t('mod.security.yes') : t('mod.security.no') }}
                </dd>
              </div>

              <!-- 运行环境 -->
              <div v-if="environments.length" class="py-1">
                <dt class="text-muted-foreground mb-1">{{ t('mod.security.environment') }}</dt>
                <dd class="flex flex-wrap gap-1">
                  <Badge v-for="e in environments" :key="e" variant="outline" class="text-xs">
                    {{ label('mod.security.environmentValue', e) }}
                  </Badge>
                </dd>
              </div>

              <!-- 内置依赖 -->
              <div v-if="mod.version" class="flex justify-between gap-3 py-1">
                <dt class="text-muted-foreground shrink-0">{{ t('mod.security.embeddedDeps') }}</dt>
                <dd
                  class="text-right"
                  :class="embeddedDeps > 0 ? 'text-orange-500' : 'text-muted-foreground'"
                >
                  {{
                    embeddedDeps > 0
                      ? t('mod.security.embeddedCount', { n: embeddedDeps })
                      : t('mod.security.embeddedNone')
                  }}
                </dd>
              </div>

              <!-- 哈希校验 -->
              <div v-if="primaryFile" class="py-1">
                <dt class="text-muted-foreground mb-1">{{ t('mod.security.hash') }}</dt>
                <dd class="flex items-center gap-2">
                  <span class="min-w-0 flex-1 truncate font-mono text-xs">
                    {{ primaryFile.hashes.sha1 }}
                  </span>
                  <a
                    v-if="virusTotalUrl"
                    :href="virusTotalUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-primary inline-flex shrink-0 items-center gap-1 text-xs hover:underline"
                  >
                    {{ t('mod.security.virusTotal') }}
                    <ExternalLink class="size-3" />
                  </a>
                </dd>
              </div>

              <!-- 时间线 -->
              <div class="py-1">
                <dt class="text-muted-foreground mb-1">{{ t('mod.security.timeline') }}</dt>
                <dd class="text-muted-foreground text-xs">
                  {{ t('mod.security.created') }} {{ formatDateLocal(mod.project.published) }} ·
                  {{ t('mod.security.updated') }} {{ formatDateLocal(mod.project.updated) }}
                  <template v-if="mod.version">
                    · {{ t('mod.security.versionPublished') }}
                    {{ formatDateLocal(mod.version.date_published) }}
                  </template>
                </dd>
              </div>
            </dl>
          </section>
        </template>

        <Separator />

        <!-- 文件信息 -->
        <section class="space-y-2">
          <h4 class="text-muted-foreground text-xs tracking-wide uppercase">
            {{ t('mod.detail.fileInfo') }}
          </h4>
          <dl class="text-sm">
            <div class="py-1">
              <dt class="text-muted-foreground">{{ t('mod.detail.filePath') }}</dt>
              <dd class="font-mono text-xs break-all">{{ mod.path }}</dd>
            </div>
            <div class="flex justify-between py-1">
              <dt class="text-muted-foreground">{{ t('mod.detail.fileSize') }}</dt>
              <dd class="tabular-nums">{{ formatBytes(mod.size) }}</dd>
            </div>
            <div v-if="mod.sha1" class="py-1">
              <dt class="text-muted-foreground">SHA-1</dt>
              <dd class="font-mono text-xs break-all">{{ mod.sha1 }}</dd>
            </div>
          </dl>
        </section>

        <!-- 错误信息 -->
        <section v-if="mod.error" class="space-y-1">
          <h4 class="text-destructive text-xs tracking-wide uppercase">
            {{ t('mod.detail.error') }}
          </h4>
          <p class="text-destructive text-xs">{{ mod.error }}</p>
        </section>
      </div>
    </SheetContent>
  </Sheet>
</template>
