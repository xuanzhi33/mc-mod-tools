<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { FolderOpen, FolderPen, RotateCw, FolderX } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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

async function onClear() {
  await store.clear()
  toast.success(t('mod.clearDialog.done'))
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <Button v-if="!hasHandle" :disabled="store.scanning" @click="onPick">
      <FolderOpen />
      {{ t('mod.pickFolder') }}
    </Button>
    <template v-else>
      <Button variant="outline" :disabled="store.scanning" @click="onPick">
        <FolderPen />
        {{ t('mod.changeFolder') }}
      </Button>
      <Button variant="secondary" :disabled="store.scanning" @click="onRescan">
        <RotateCw />
        {{ t('mod.rescan') }}
      </Button>

      <TooltipProvider v-if="!store.scanning" :delay-duration="300">
        <Tooltip>
          <AlertDialog>
            <TooltipTrigger as-child>
              <AlertDialogTrigger as-child>
                <Button variant="ghost" size="icon" :aria-label="t('mod.clearFolder')">
                  <FolderX />
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent>{{ t('mod.clearFolder') }}</TooltipContent>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{{ t('mod.clearDialog.title') }}</AlertDialogTitle>
                <AlertDialogDescription>
                  {{ t('mod.clearDialog.desc') }}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{{ t('mod.cancel') }}</AlertDialogCancel>
                <AlertDialogAction
                  class="bg-destructive text-white hover:bg-destructive/90"
                  @click="onClear"
                >
                  {{ t('mod.clearDialog.confirm') }}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </Tooltip>
      </TooltipProvider>
    </template>
  </div>
</template>
