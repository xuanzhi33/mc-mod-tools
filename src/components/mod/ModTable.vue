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
import { Input } from '@/components/ui/input'
import StatusBadge from './StatusBadge.vue'
import { useModsStore } from '@/stores/mods'
import type { ModFile } from '@/types/mod'

const { t } = useI18n()
const store = useModsStore()

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

const emit = defineEmits<{ open: [m: ModFile] }>()

function onRowClick(m: ModFile) {
  emit('open', m)
}

const rows = computed(() => store.filteredFiles)
</script>

<template>
  <div class="space-y-3">
    <Input
      v-model="store.search"
      :placeholder="t('mod.searchPlaceholder')"
      class="max-w-sm"
    />
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="min-w-[200px]">{{ t('mod.col.modName') }}</TableHead>
            <TableHead class="min-w-[120px]">{{ t('mod.col.version') }}</TableHead>
            <TableHead>{{ t('mod.col.mcVersions') }}</TableHead>
            <TableHead>{{ t('mod.col.loaders') }}</TableHead>
            <TableHead>{{ t('mod.col.author') }}</TableHead>
            <TableHead class="text-right">{{ t('mod.col.downloads') }}</TableHead>
            <TableHead>{{ t('mod.col.status') }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow
            v-for="m in rows"
            :key="m.path"
            class="cursor-pointer"
            @click="onRowClick(m)"
          >
            <TableCell class="font-medium">
              <div class="flex items-center gap-2">
                <img
                  v-if="m.project?.icon_url"
                  :src="m.project.icon_url"
                  :alt="m.project.title"
                  class="size-6 rounded object-cover"
                  loading="lazy"
                />
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
              <span class="text-muted-foreground text-xs">
                {{ m.version?.game_versions.join(', ') ?? '—' }}
              </span>
            </TableCell>
            <TableCell>
              <span class="text-muted-foreground text-xs">
                {{ m.version?.loaders.join(', ') ?? '—' }}
              </span>
            </TableCell>
            <TableCell class="text-sm">{{ m.project?.author ?? '—' }}</TableCell>
            <TableCell class="text-right tabular-nums">
              <span v-if="m.project" class="inline-flex items-center gap-1">
                <Download class="size-3" />
                {{ formatNumber(m.project.downloads) }}
              </span>
              <span v-else>—</span>
            </TableCell>
            <TableCell><StatusBadge :status="m.status" /></TableCell>
          </TableRow>
          <TableRow v-if="rows.length === 0">
            <TableCell :colspan="7" class="text-muted-foreground py-8 text-center">
              {{ t('mod.noResults') }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
