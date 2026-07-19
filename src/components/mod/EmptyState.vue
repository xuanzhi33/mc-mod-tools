<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { FolderOpen, ShieldAlert } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useModsStore } from '@/stores/mods'

const { t } = useI18n()
const store = useModsStore()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
    <!-- 浏览器不支持 -->
    <template v-if="!store.supported">
      <ShieldAlert class="text-destructive size-12" />
      <div class="space-y-1">
        <p class="text-lg font-medium">{{ t('mod.unsupportedTitle') }}</p>
        <p class="text-muted-foreground max-w-md text-sm">{{ t('mod.unsupportedDesc') }}</p>
      </div>
    </template>

    <!-- 未选择文件夹 -->
    <template v-else-if="!store.dirHandle">
      <div class="bg-primary/10 mb-2 flex size-16 items-center justify-center rounded-full">
        <FolderOpen class="text-primary size-8" />
      </div>
      <div class="space-y-1">
        <p class="text-lg font-medium">{{ t('mod.emptyTitle') }}</p>
        <p class="text-muted-foreground max-w-md text-sm">{{ t('mod.emptyDesc') }}</p>
      </div>
      <Button size="lg" @click="$emit('pick')">
        <FolderOpen />
        {{ t('mod.pickFolder') }}
      </Button>
    </template>

    <!-- 已选择但无 jar -->
    <template v-else>
      <div class="bg-muted mb-2 flex size-16 items-center justify-center rounded-full">
        <FolderOpen class="text-muted-foreground size-8" />
      </div>
      <div class="space-y-1">
        <p class="text-lg font-medium">{{ t('mod.noJarsTitle') }}</p>
        <p class="text-muted-foreground max-w-md text-sm">{{ t('mod.noJarsDesc') }}</p>
      </div>
    </template>
  </div>
</template>
