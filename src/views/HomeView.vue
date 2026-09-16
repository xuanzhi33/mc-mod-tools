<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { LayoutGrid, List, Search, Settings, X } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
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
import ModCard from '@/components/mod/ModCard.vue'
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

const showSkeleton = computed(() => store.scanning && store.modFiles.length === 0)

const isFiltering = computed(() => store.statusFilter !== 'all' || store.search.trim() !== '')

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

          <Select v-model="store.statusFilter">
            <SelectTrigger size="sm" class="w-32">
              <SelectValue :placeholder="t('mod.filter.all')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{{ t('mod.filter.all') }}</SelectItem>
              <SelectItem value="matched">{{ t('mod.filter.matched') }}</SelectItem>
              <SelectItem value="not_found">{{ t('mod.filter.not_found') }}</SelectItem>
              <SelectItem value="error">{{ t('mod.filter.error') }}</SelectItem>
            </SelectContent>
          </Select>

          <TooltipProvider :delay-duration="300">
            <ButtonGroup class="ml-auto">
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    :variant="store.viewMode === 'table' ? 'secondary' : 'ghost'"
                    size="icon-sm"
                    :aria-label="t('mod.view.table')"
                    :aria-pressed="store.viewMode === 'table'"
                    @click="store.viewMode = 'table'"
                  >
                    <List />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{{ t('mod.view.table') }}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger as-child>
                  <Button
                    :variant="store.viewMode === 'card' ? 'secondary' : 'ghost'"
                    size="icon-sm"
                    :aria-label="t('mod.view.card')"
                    :aria-pressed="store.viewMode === 'card'"
                    @click="store.viewMode = 'card'"
                  >
                    <LayoutGrid />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{{ t('mod.view.card') }}</TooltipContent>
              </Tooltip>
            </ButtonGroup>
          </TooltipProvider>
        </div>
      </div>

      <!-- 统计条 -->
      <div v-if="hasData" class="bg-muted/30 border-t">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-2 text-xs">
          <Badge variant="secondary">
            {{ t('mod.statsTotal', { n: store.stats.total }) }}
          </Badge>
          <Badge variant="default">
            {{ t('mod.statsMatched', { n: store.stats.matched }) }}
          </Badge>
          <Badge variant="outline">
            {{ t('mod.statsNotFound', { n: store.stats.notFound }) }}
          </Badge>
          <Badge v-if="store.stats.error > 0" variant="destructive">
            {{ t('mod.statsError', { n: store.stats.error }) }}
          </Badge>
          <Badge v-if="isFiltering" variant="outline" class="border-dashed">
            {{
              t('mod.statsShowing', { shown: store.filteredFiles.length, total: store.stats.total })
            }}
          </Badge>
          <span class="text-muted-foreground ml-auto">
            {{ t('mod.statsDownloads', { n: store.stats.totalDownloads.toLocaleString() }) }}
          </span>
        </div>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="mx-auto w-full max-w-7xl flex-1 space-y-4 overflow-auto px-4 py-4">
      <ScanProgress />

      <div v-if="showSkeleton" class="space-y-2">
        <Skeleton v-for="i in 8" :key="i" class="h-10 w-full" />
      </div>

      <EmptyState v-else-if="showEmpty" @pick="onPickFromEmpty" />

      <template v-else>
        <ModTable v-if="store.viewMode === 'table'" @open="openDetail" />
        <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <ModCard v-for="m in store.filteredFiles" :key="m.path" :mod="m" @open="openDetail" />
        </div>
      </template>
    </main>

    <ModDetailSheet v-model="detailOpen" :mod="selectedMod" />
    <SettingsDialog v-model="settingsOpen" />
  </div>
</template>
