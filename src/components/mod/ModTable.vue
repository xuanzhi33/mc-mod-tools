<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download } from 'lucide-vue-next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useModsStore } from '@/stores/mods'
import { formatCompactNumber } from '@/lib/format'
import { isUnrecognized } from '@/lib/mod-status'
import type { ModFile } from '@/types/mod'

const { t } = useI18n()
const store = useModsStore()

const emit = defineEmits<{ open: [m: ModFile] }>()

function onRowClick(m: ModFile) {
  emit('open', m)
}

function onRowKeydown(e: KeyboardEvent, m: ModFile) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    emit('open', m)
  }
}

const rows = computed(() => store.filteredFiles)

const MAX_TAGS = 2

function rest(list: string[] | undefined): number {
  return Math.max(0, (list?.length ?? 0) - MAX_TAGS)
}
</script>

<template>
  <div class="rounded-md border">
    <Table class="border-separate border-spacing-0" container-class="md:overflow-visible">
      <TableHeader
        class="[&_th]:bg-background [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:border-b [&_tr]:border-b-0"
      >
        <TableRow>
          <TableHead class="min-w-[220px]">{{ t('mod.col.modName') }}</TableHead>
          <TableHead class="min-w-[110px]">{{ t('mod.col.version') }}</TableHead>
          <TableHead>{{ t('mod.col.mcVersions') }}</TableHead>
          <TableHead>{{ t('mod.col.loaders') }}</TableHead>
          <TableHead>{{ t('mod.col.author') }}</TableHead>
          <TableHead class="text-right">{{ t('mod.col.downloads') }}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody class="[&>tr:not(:last-child)>td]:border-b">
        <TableRow
          v-for="m in rows"
          :key="m.path"
          tabindex="0"
          class="focus-visible:bg-muted/50 cursor-pointer outline-none"
          :class="isUnrecognized(m.status) && 'bg-destructive/10 hover:bg-destructive/15'"
          @click="onRowClick(m)"
          @keydown="onRowKeydown($event, m)"
        >
          <TableCell class="font-medium">
            <div class="flex items-center gap-2">
              <img
                v-if="m.project?.icon_url"
                :src="m.project.icon_url"
                :alt="m.project.title"
                class="bg-muted size-6 shrink-0 rounded object-cover"
                loading="lazy"
              />
              <div
                v-else
                class="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded text-[10px]"
              >
                ?
              </div>
              <div class="min-w-0">
                <div class="truncate">{{ m.project?.title ?? m.name }}</div>
                <div class="text-muted-foreground truncate text-xs">{{ m.path }}</div>
              </div>
            </div>
          </TableCell>
          <TableCell class="font-mono text-xs">
            {{ m.version?.version_number ?? '—' }}
          </TableCell>
          <TableCell>
            <div v-if="m.version?.game_versions?.length" class="flex flex-wrap gap-1">
              <Badge
                v-for="gv in m.version.game_versions.slice(0, MAX_TAGS)"
                :key="gv"
                variant="outline"
                class="font-mono text-[11px]"
              >
                {{ gv }}
              </Badge>
              <Badge v-if="rest(m.version.game_versions)" variant="outline" class="text-[11px]">
                +{{ rest(m.version.game_versions) }}
              </Badge>
            </div>
            <span v-else class="text-muted-foreground text-xs">—</span>
          </TableCell>
          <TableCell>
            <div v-if="m.version?.loaders?.length" class="flex flex-wrap gap-1">
              <Badge
                v-for="ld in m.version.loaders.slice(0, MAX_TAGS)"
                :key="ld"
                variant="secondary"
                class="font-mono text-[11px]"
              >
                {{ ld }}
              </Badge>
              <Badge v-if="rest(m.version.loaders)" variant="secondary" class="text-[11px]">
                +{{ rest(m.version.loaders) }}
              </Badge>
            </div>
            <span v-else class="text-muted-foreground text-xs">—</span>
          </TableCell>
          <TableCell class="text-sm">{{ m.project?.author ?? '—' }}</TableCell>
          <TableCell class="text-right tabular-nums">
            <span
              v-if="m.project"
              class="inline-flex items-center gap-1"
              :title="t('mod.downloadsHint')"
            >
              <Download class="size-3 shrink-0" />
              <span v-if="m.version">{{ formatCompactNumber(m.version.downloads) }}</span>
              <span>/</span>
              <span class="text-muted-foreground">
                {{ formatCompactNumber(m.project.downloads) }}
              </span>
            </span>
            <span v-else>—</span>
          </TableCell>
        </TableRow>
        <TableRow v-if="rows.length === 0" class="hover:bg-transparent">
          <TableCell :colspan="6" class="text-muted-foreground py-8 text-center">
            {{ t('mod.noResults') }}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
