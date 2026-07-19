<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { FolderOpen, RotateCw, FolderX } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useModsStore } from '@/stores/mods'
import { toast } from 'vue-sonner'

const { t } = useI18n()
const store = useModsStore()

const hasHandle = computed(() => !!store.dirHandle)

async function onPick() {
  try {
    await store.selectFolder()
    toast.success(t('mod.folderSelected', { name: store.dirName }))
    await store.scan()
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return
    toast.error(t('mod.folderSelectFailed'))
  }
}

async function onRescan() {
  try {
    await store.scan()
  } catch (e) {
    toast.error(e instanceof Error ? e.message : String(e))
  }
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <Button v-if="!hasHandle" @click="onPick">
      <FolderOpen />
      {{ t('mod.pickFolder') }}
    </Button>
    <template v-else>
      <Button variant="outline" @click="onPick">
        <RotateCw />
        {{ t('mod.changeFolder') }}
      </Button>
      <Button variant="secondary" :disabled="store.scanning" @click="onRescan">
        <RotateCw />
        {{ t('mod.rescan') }}
      </Button>
      <Button
        v-if="!store.scanning"
        variant="ghost"
        size="icon"
        @click="store.clear()"
      >
        <FolderX />
      </Button>
    </template>
  </div>
</template>
