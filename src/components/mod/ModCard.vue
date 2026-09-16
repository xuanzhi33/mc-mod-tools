<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download, ExternalLink } from 'lucide-vue-next'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCompactNumber } from '@/lib/format'
import { isUnrecognized } from '@/lib/mod-status'
import type { ModFile } from '@/types/mod'

const props = defineProps<{ mod: ModFile }>()
const emit = defineEmits<{ open: [m: ModFile] }>()

const { t } = useI18n()

const projectUrl = computed(() => {
  if (!props.mod.project) return null
  return `https://modrinth.com/project/${props.mod.project.slug}`
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    emit('open', props.mod)
  }
}
</script>

<template>
  <Card
    role="button"
    tabindex="0"
    class="cursor-pointer transition-shadow hover:shadow-md focus-visible:ring-ring outline-none focus-visible:ring-2"
    :class="isUnrecognized(mod.status) && 'bg-destructive/10'"
    @click="emit('open', mod)"
    @keydown="onKeydown"
  >
    <CardHeader class="flex-row items-start gap-3 space-y-0">
      <img
        v-if="mod.project?.icon_url"
        :src="mod.project.icon_url"
        :alt="mod.project.title"
        class="bg-muted size-10 shrink-0 rounded object-cover"
        loading="lazy"
      />
      <div
        v-else
        class="bg-muted flex size-10 items-center justify-center rounded text-xs font-mono"
      >
        ?
      </div>
      <div class="min-w-0 flex-1">
        <h3 class="truncate font-medium">
          {{ mod.project?.title ?? mod.name }}
        </h3>
        <p class="text-muted-foreground truncate text-xs">
          {{ mod.project?.author ?? '—' }}
        </p>
      </div>
    </CardHeader>
    <CardContent class="space-y-2 text-xs">
      <p class="text-muted-foreground line-clamp-2 min-h-[2rem]">
        {{ mod.project?.description ?? t('mod.notFoundDesc') }}
      </p>
      <div class="flex flex-wrap items-center gap-1.5">
        <Badge v-if="mod.version" variant="secondary" class="font-mono">
          {{ mod.version.version_number }}
        </Badge>
        <Badge v-for="gv in mod.version?.game_versions.slice(0, 3)" :key="gv" variant="outline">
          {{ gv }}
        </Badge>
        <Badge v-for="ld in mod.version?.loaders.slice(0, 3)" :key="ld" variant="outline">
          {{ ld }}
        </Badge>
      </div>
      <div class="flex items-center justify-between pt-1">
        <span v-if="mod.project" class="text-muted-foreground inline-flex items-center gap-1">
          <Download class="size-3" />
          {{ formatCompactNumber(mod.project.downloads) }}
        </span>
        <a
          v-if="projectUrl"
          :href="projectUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary inline-flex items-center gap-1 hover:underline"
          @click.stop
        >
          <ExternalLink class="size-3" />
          Modrinth
        </a>
      </div>
    </CardContent>
  </Card>
</template>
