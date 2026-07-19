<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Badge } from '@/components/ui/badge'
import type { ModFileStatus } from '@/types/mod'

const props = defineProps<{ status: ModFileStatus }>()

const { t } = useI18n()

const variant = computed<
  'default' | 'secondary' | 'destructive' | 'outline'
>(() => {
  switch (props.status) {
    case 'matched':
      return 'default'
    case 'pending':
    case 'hashing':
    case 'querying':
      return 'secondary'
    case 'error':
      return 'destructive'
    default:
      return 'outline'
  }
})

const label = computed(() => t(`mod.status.${props.status}`))
</script>

<template>
  <Badge :variant="variant" class="font-mono">{{ label }}</Badge>
</template>
