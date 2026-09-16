<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, Circle, Loader2, TriangleAlert } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useModsStore } from '@/stores/mods'
import { SCAN_STAGES, overallPercent, type ScanStep } from '@/lib/progress'

const { t } = useI18n()
const store = useModsStore()

const DONE_VISIBLE_MS = 3000
const showDone = ref(false)
let doneTimer: number | undefined

watch(
  () => store.progress.stage,
  (stage) => {
    window.clearTimeout(doneTimer)
    if (stage === 'done') {
      showDone.value = true
      doneTimer = window.setTimeout(() => {
        showDone.value = false
      }, DONE_VISIBLE_MS)
    } else {
      showDone.value = false
    }
  },
)

onBeforeUnmount(() => window.clearTimeout(doneTimer))

const visible = computed(() => store.scanning || store.progress.stage === 'error' || showDone.value)

const percent = computed(() => overallPercent(store.progress))

const currentIndex = computed(() => SCAN_STAGES.indexOf(store.progress.stage as ScanStep))

const detail = computed(() => {
  const { total, processed } = store.progress
  return total > 0 ? `${processed} / ${total}` : ''
})

function stageLabel(stage: ScanStep): string {
  switch (stage) {
    case 'listing':
      return t('mod.stage.listing')
    case 'hashing':
      return t('mod.stage.hashing')
    case 'querying-versions':
      return t('mod.stage.queryingVersions')
    case 'querying-projects':
      return t('mod.stage.queryingProjects')
    case 'querying-authors':
      return t('mod.stage.queryingAuthors')
  }
}
</script>

<template>
  <div v-if="visible">
    <!-- 扫描中：完整加载面板 -->
    <div
      v-if="store.scanning"
      class="bg-card mx-auto w-full max-w-xl space-y-4 rounded-lg border p-5 shadow-sm"
    >
      <div class="flex items-center gap-2 font-medium">
        <Loader2 class="text-primary size-4 animate-spin" />
        {{ t('mod.scanning') }}
      </div>

      <ol class="space-y-2 text-sm">
        <li
          v-for="(stage, i) in SCAN_STAGES"
          :key="stage"
          class="flex items-center gap-2"
          :class="i > currentIndex ? 'text-muted-foreground/60' : ''"
        >
          <Check v-if="i < currentIndex" class="text-primary size-4 shrink-0" />
          <Loader2
            v-else-if="i === currentIndex"
            class="text-primary size-4 shrink-0 animate-spin"
          />
          <Circle v-else class="size-4 shrink-0" />
          <span>{{ stageLabel(stage) }}</span>
          <span
            v-if="i === currentIndex && detail"
            class="text-muted-foreground ml-auto tabular-nums"
          >
            {{ detail }}
          </span>
        </li>
      </ol>

      <div class="space-y-2">
        <Progress :model-value="percent" />
        <div class="flex items-center justify-between">
          <span class="text-muted-foreground text-xs tabular-nums">{{ percent }}%</span>
          <Button variant="ghost" size="sm" @click="store.cancelScan()">
            {{ t('mod.cancel') }}
          </Button>
        </div>
      </div>
    </div>

    <!-- 扫描出错 -->
    <div
      v-else-if="store.progress.stage === 'error'"
      class="border-destructive/40 bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
    >
      <TriangleAlert class="mt-0.5 size-4 shrink-0" />
      <span>{{ store.progress.message || t('mod.stage.error') }}</span>
    </div>

    <!-- 扫描完成（短暂提示） -->
    <div
      v-else
      class="border-primary/30 bg-primary/10 text-primary flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
    >
      <Check class="size-4 shrink-0" />
      <span>{{ t('mod.stage.done') }}</span>
    </div>
  </div>
</template>
