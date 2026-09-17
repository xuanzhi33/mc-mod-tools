<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowUpRight } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { parseChangelog } from '@/lib/changelog'
import type { ModrinthVersion } from '@/types/mod'

const props = defineProps<{ version: ModrinthVersion }>()

const { t } = useI18n()

/** 更新日志是 Markdown，这里只做分行 + 去掉明显标记，不引入解析库 */
const lines = computed(() => parseChangelog(props.version.changelog))
</script>

<template>
  <Tooltip v-if="lines.length">
    <TooltipTrigger as-child>
      <span
        class="text-muted-foreground mt-0.5 flex cursor-help items-center gap-1 text-[11px]"
        tabindex="0"
        :aria-label="t('mod.changelog')"
        @keydown.stop
      >
        <ArrowUpRight class="size-3 shrink-0" />
        <span>{{ version.version_number }}</span>
      </span>
    </TooltipTrigger>
    <TooltipContent class="w-80 text-left">
      <div class="flex items-baseline gap-1.5">
        <span class="font-medium">{{ t('mod.changelog') }}</span>
        <span class="font-mono text-[11px] opacity-70">{{ version.version_number }}</span>
      </div>
      <div class="mt-1 max-h-72 space-y-1 overflow-y-auto pr-1 leading-relaxed">
        <template v-for="(line, i) in lines" :key="i">
          <p v-if="line.kind === 'heading'" class="font-medium">{{ line.text }}</p>
          <p v-else-if="line.kind === 'bullet'" class="flex gap-1.5">
            <span class="opacity-60">•</span>
            <span>{{ line.text }}</span>
          </p>
          <p v-else>{{ line.text }}</p>
        </template>
      </div>
    </TooltipContent>
  </Tooltip>

  <span v-else class="text-muted-foreground mt-0.5 flex items-center gap-1 text-[11px]">
    <ArrowUpRight class="size-3 shrink-0" />
    <span>{{ version.version_number }}</span>
  </span>
</template>
