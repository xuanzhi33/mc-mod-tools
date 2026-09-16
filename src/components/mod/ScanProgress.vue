<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { CheckCircle2 } from 'lucide-vue-next'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useModsStore } from '@/stores/mods'

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

const percent = computed(() => {
  const { total, processed } = store.progress
  if (total === 0) return 0
  return Math.round((processed / total) * 100)
})

const stageText = computed(() => {
  switch (store.progress.stage) {
    case 'listing':
      return t('mod.stage.listing')
    case 'hashing':
      return t('mod.stage.hashing')
    case 'querying-versions':
      return t('mod.stage.queryingVersions')
    case 'querying-projects':
      return t('mod.stage.queryingProjects')
    case 'done':
      return t('mod.stage.done')
    case 'error':
      return t('mod.stage.error')
    default:
      return ''
  }
})
</script>

<template>
  <div v-if="visible" class="space-y-2">
    <div class="flex items-center justify-between gap-2 text-sm">
      <span
        class="inline-flex items-center gap-1.5"
        :class="store.progress.stage === 'done' ? 'text-primary' : 'text-muted-foreground'"
      >
        <CheckCircle2 v-if="store.progress.stage === 'done'" class="size-4" />
        {{ stageText }}
      </span>
      <span v-if="store.progress.stage !== 'done'" class="text-muted-foreground tabular-nums">
        {{ store.progress.processed }} / {{ store.progress.total }}
      </span>
    </div>
    <Progress :model-value="percent" />
    <div v-if="store.scanning" class="flex justify-end">
      <Button variant="ghost" size="sm" @click="store.cancelScan()">
        {{ t('mod.cancel') }}
      </Button>
    </div>
    <p v-if="store.progress.message" class="text-destructive text-xs">
      {{ store.progress.message }}
    </p>
  </div>
</template>
