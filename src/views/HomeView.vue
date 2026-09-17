<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, Settings, X } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import FolderPicker from '@/components/mod/FolderPicker.vue'
import ScanProgress from '@/components/mod/ScanProgress.vue'
import EmptyState from '@/components/mod/EmptyState.vue'
import ModTable from '@/components/mod/ModTable.vue'
import ModDetailSheet from '@/components/mod/ModDetailSheet.vue'
import SettingsDialog from '@/components/mod/SettingsDialog.vue'
import { useModsStore } from '@/stores/mods'
import type { ModFile } from '@/types/mod'

const { t } = useI18n()
const store = useModsStore()

const selectedMod = ref<ModFile | null>(null)
const detailOpen = ref(false)
const settingsOpen = ref(false)

const hasData = computed(() => !!store.dirHandle && store.modFiles.length > 0)

const isFiltering = computed(() => store.search.trim() !== '')

const showEmpty = computed(() => {
  if (!store.supported) return true
  if (!store.dirHandle) return true
  if (store.modFiles.length === 0 && !store.scanning && store.progress.stage !== 'error') {
    return true
  }
  return false
})

function openDetail(m: ModFile) {
  selectedMod.value = m
  detailOpen.value = true
}

async function onPickFromEmpty() {
  try {
    if (await store.selectFolder()) {
      await store.scan()
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return
    toast.error(t('mod.folderSelectFailed'))
  }
}

onMounted(async () => {
  const restored = await store.restoreSavedHandle()
  if (restored && store.dirHandle) {
    // 自动开始扫描已恢复的文件夹
    await store.scan()
  } else if (store.dirHandle && !restored) {
    // 需要重新授权
    toast.info(t('mod.needPermission'))
  }
})
</script>

<template>
  <div class="flex h-screen flex-col">
    <!-- 顶部栏 -->
    <header class="border-b">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3">
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <h1 class="shrink-0 text-lg font-semibold">{{ t('common.title') }}</h1>
          <span
            v-if="store.dirName"
            class="text-muted-foreground max-w-[8rem] truncate text-sm sm:max-w-[16rem]"
            :title="store.dirName"
          >
            / {{ store.dirName }}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <FolderPicker />

          <TooltipProvider :delay-duration="300">
            <Tooltip>
              <TooltipTrigger as-child>
                <Button
                  variant="ghost"
                  size="icon"
                  :aria-label="t('settings.title')"
                  @click="settingsOpen = true"
                >
                  <Settings />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{{ t('settings.title') }}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <!-- 工具栏：搜索 / 筛选 / 视图切换 -->
      <div v-if="hasData" class="border-t">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-2">
          <div class="relative min-w-[10rem] flex-1 sm:max-w-xs">
            <Search
              class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            />
            <Input
              v-model="store.search"
              :placeholder="t('mod.searchPlaceholder')"
              class="h-8 pr-8 pl-8 text-sm"
            />
            <button
              v-if="store.search"
              type="button"
              class="text-muted-foreground hover:text-foreground absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1 transition-colors"
              :aria-label="t('mod.searchClear')"
              @click="store.search = ''"
            >
              <X class="size-3.5" />
            </button>
          </div>

          <span v-if="!store.scanning" class="text-muted-foreground text-xs whitespace-nowrap">
            {{
              isFiltering
                ? t('mod.statsShowing', {
                    shown: store.filteredFiles.length,
                    total: store.stats.total,
                  })
                : t('mod.statsTotal', { n: store.stats.total })
            }}
          </span>

          <Badge
            v-if="!store.scanning && store.stats.problem > 0"
            variant="destructive"
            class="whitespace-nowrap"
          >
            {{ t('mod.statsProblem', { n: store.stats.problem }) }}
          </Badge>

          <div
            v-if="!store.scanning && store.availableMcVersions.length > 0"
            class="ml-auto flex items-center gap-2"
          >
            <span class="text-muted-foreground text-xs whitespace-nowrap">
              {{ t('mod.mcVersionLabel') }}
            </span>
            <Select v-model="store.mcVersion">
              <SelectTrigger size="sm" class="w-28 font-mono">
                <SelectValue>{{ store.mcVersion }}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="v in store.availableMcVersions" :key="v" :value="v">
                  {{ v }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-auto px-4">
      <div class="flex flex-1 flex-col py-4">
        <!-- 扫描中：隐藏列表内容，把空间让给加载面板 -->
        <template v-if="store.scanning">
          <ScanProgress class="my-auto" />
        </template>

        <template v-else>
          <ScanProgress class="mb-4" />

          <EmptyState v-if="showEmpty" @pick="onPickFromEmpty" />
          <ModTable v-else @open="openDetail" />
        </template>
      </div>
    </main>

    <ModDetailSheet v-model="detailOpen" :mod="selectedMod" />
    <SettingsDialog v-model="settingsOpen" />
  </div>
</template>
