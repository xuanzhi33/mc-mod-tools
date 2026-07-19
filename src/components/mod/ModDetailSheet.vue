<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download, ExternalLink, FileText, Hash, User } from 'lucide-vue-next'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import StatusBadge from './StatusBadge.vue'
import type { ModFile } from '@/types/mod'

const props = defineProps<{ modelValue: boolean; mod: ModFile | null }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>()

const { t } = useI18n()

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

function formatNumber(n: number): string {
  return n.toLocaleString()
}

function formatDate(s?: string): string {
  if (!s) return '—'
  return new Date(s).toLocaleString()
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      side="right"
      class="w-full gap-0 sm:max-w-md overflow-y-auto"
    >
      <SheetHeader class="space-y-2">
        <div class="flex items-start gap-3">
          <img
            v-if="mod?.project?.icon_url"
            :src="mod.project.icon_url"
            :alt="mod.project.title"
            class="size-12 rounded object-cover"
          />
          <div
            v-else
            class="bg-muted flex size-12 items-center justify-center rounded"
          >
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
          <SheetClose />
        </div>
        <div v-if="mod" class="flex flex-wrap items-center gap-1.5">
          <StatusBadge :status="mod.status" />
          <Badge v-if="mod.version" variant="secondary" class="font-mono">
            {{ mod.version.version_number }}
          </Badge>
          <Badge v-if="mod.version" variant="outline">
            {{ mod.version.version_type }}
          </Badge>
        </div>
      </SheetHeader>

      <div v-if="mod" class="space-y-4 px-4 pb-6">
        <!-- 描述 -->
        <section v-if="mod.project?.description" class="space-y-1">
          <h4 class="text-muted-foreground text-xs uppercase tracking-wide">
            {{ t('mod.detail.description') }}
          </h4>
          <p class="text-sm leading-relaxed">{{ mod.project.description }}</p>
        </section>

        <!-- 项目信息 -->
        <section class="space-y-2">
          <h4 class="text-muted-foreground text-xs uppercase tracking-wide">
            {{ t('mod.detail.projectInfo') }}
          </h4>
          <dl class="text-sm">
            <div class="flex justify-between py-1">
              <dt class="text-muted-foreground inline-flex items-center gap-1">
                <User class="size-3" />{{ t('mod.detail.author') }}
              </dt>
              <dd>{{ mod.project?.author ?? '—' }}</dd>
            </div>
            <div class="flex justify-between py-1">
              <dt class="text-muted-foreground inline-flex items-center gap-1">
                <Download class="size-3" />{{ t('mod.detail.downloads') }}
              </dt>
              <dd class="tabular-nums">
                {{ formatNumber(mod.project?.downloads ?? 0) }}
              </dd>
            </div>
            <div class="flex justify-between py-1">
              <dt class="text-muted-foreground">{{ t('mod.detail.follows') }}</dt>
              <dd class="tabular-nums">{{ formatNumber(mod.project?.follows ?? 0) }}</dd>
            </div>
            <div class="flex justify-between py-1">
              <dt class="text-muted-foreground">{{ t('mod.detail.updated') }}</dt>
              <dd>{{ formatDate(mod.project?.updated) }}</dd>
            </div>
          </dl>
        </section>

        <Separator />

        <!-- 版本信息 -->
        <section class="space-y-2">
          <h4 class="text-muted-foreground text-xs uppercase tracking-wide">
            {{ t('mod.detail.versionInfo') }}
          </h4>
          <dl class="text-sm">
            <div class="py-1">
              <dt class="text-muted-foreground mb-1">{{ t('mod.col.mcVersions') }}</dt>
              <dd class="flex flex-wrap gap-1">
                <Badge
                  v-for="gv in mod.version?.game_versions"
                  :key="gv"
                  variant="outline"
                  class="font-mono text-xs"
                >
                  {{ gv }}
                </Badge>
                <span v-if="!mod.version?.game_versions?.length">—</span>
              </dd>
            </div>
            <div class="py-1">
              <dt class="text-muted-foreground mb-1">{{ t('mod.col.loaders') }}</dt>
              <dd class="flex flex-wrap gap-1">
                <Badge
                  v-for="ld in mod.version?.loaders"
                  :key="ld"
                  variant="secondary"
                  class="font-mono text-xs"
                >
                  {{ ld }}
                </Badge>
                <span v-if="!mod.version?.loaders?.length">—</span>
              </dd>
            </div>
            <div class="flex justify-between py-1">
              <dt class="text-muted-foreground">{{ t('mod.detail.published') }}</dt>
              <dd>{{ formatDate(mod.version?.date_published) }}</dd>
            </div>
          </dl>
        </section>

        <Separator />

        <!-- 文件信息 -->
        <section class="space-y-2">
          <h4 class="text-muted-foreground text-xs uppercase tracking-wide">
            {{ t('mod.detail.fileInfo') }}
          </h4>
          <dl class="text-sm">
            <div class="py-1">
              <dt class="text-muted-foreground">{{ t('mod.detail.filePath') }}</dt>
              <dd class="break-all font-mono text-xs">{{ mod.path }}</dd>
            </div>
            <div class="flex justify-between py-1">
              <dt class="text-muted-foreground">{{ t('mod.detail.fileSize') }}</dt>
              <dd class="tabular-nums">{{ formatBytes(mod.size) }}</dd>
            </div>
            <div v-if="mod.sha1" class="py-1">
              <dt class="text-muted-foreground inline-flex items-center gap-1">
                <Hash class="size-3" />SHA-1
              </dt>
              <dd class="font-mono text-xs break-all">{{ mod.sha1 }}</dd>
            </div>
          </dl>
        </section>

        <!-- 错误信息 -->
        <section v-if="mod.error" class="space-y-1">
          <h4 class="text-destructive text-xs uppercase tracking-wide">
            {{ t('mod.detail.error') }}
          </h4>
          <p class="text-destructive text-xs">{{ mod.error }}</p>
        </section>

        <!-- 外链 -->
        <div class="flex flex-wrap gap-2 pt-2">
          <Button v-if="projectUrl" as-child variant="default" size="sm">
            <a :href="projectUrl" target="_blank" rel="noopener noreferrer">
              <ExternalLink />
              Modrinth
            </a>
          </Button>
          <Button v-if="versionUrl" as-child variant="outline" size="sm">
            <a :href="versionUrl" target="_blank" rel="noopener noreferrer">
              <ExternalLink />
              {{ t('mod.detail.viewVersion') }}
            </a>
          </Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
