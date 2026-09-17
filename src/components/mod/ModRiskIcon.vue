<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertTriangle, ShieldAlert } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { highestRiskLevel, securityWarnings } from '@/lib/security'
import type { ModFile } from '@/types/mod'

const props = defineProps<{ mod: ModFile }>()

const { t, te } = useI18n()

const warnings = computed(() => securityWarnings(props.mod, { t, te }))
const level = computed(() => highestRiskLevel(warnings.value))
const heading = computed(() =>
  level.value === 'high' ? t('mod.security.highRisk') : t('mod.security.mediumRisk'),
)
</script>

<template>
  <Tooltip v-if="level">
    <TooltipTrigger as-child>
      <span
        class="inline-flex shrink-0 cursor-help"
        tabindex="0"
        :aria-label="heading"
        @keydown.stop
      >
        <ShieldAlert v-if="level === 'high'" class="text-destructive size-3.5" />
        <AlertTriangle v-else class="size-3.5 text-orange-500" />
      </span>
    </TooltipTrigger>
    <TooltipContent class="max-w-xs">
      <div class="space-y-1">
        <p class="font-medium" :class="level === 'high' ? 'text-destructive' : 'text-orange-500'">
          {{ heading }}
        </p>
        <ul class="space-y-0.5">
          <li v-for="(w, i) in warnings" :key="i" class="flex gap-1.5">
            <span class="opacity-60">•</span>
            <span :class="w.level === 'high' ? '' : 'opacity-70'">{{ w.text }}</span>
          </li>
        </ul>
      </div>
    </TooltipContent>
  </Tooltip>
</template>
