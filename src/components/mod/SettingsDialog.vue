<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import SettingsItem from '@/components/settings/SettingsItem.vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AppWindow, ExternalLink, Languages, Settings, SunMoon } from 'lucide-vue-next'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>()

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const { t, availableLocales } = useI18n()
const settingsStore = useSettingsStore()
const { colorMode, language } = storeToRefs(settingsStore)

const colorOptions = computed(() =>
  ['light', 'dark', 'system'].map((mode) => ({
    label: t(`settings.interface.colorModeOptions.${mode}`),
    value: mode,
  })),
)

const localeOptions = computed(() =>
  availableLocales.map((loc) => ({
    label: t(`settings.interface.languageOptions.${loc}`),
    value: loc,
  })),
)

const sectionTitleClass = 'font-semibold text-muted-foreground border-b pb-2'
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Settings class="size-5" />
          {{ t('settings.title') }}
        </DialogTitle>
        <DialogDescription class="sr-only">
          {{ t('settings.title') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6">
        <section class="space-y-3">
          <h2 :class="sectionTitleClass" class="flex items-center gap-2">
            <AppWindow class="size-4" />
            {{ t('settings.interface.title') }}
          </h2>

          <SettingsItem
            v-model="colorMode"
            :label="t('settings.interface.colorMode')"
            type="select"
            :icon="SunMoon"
            :options="colorOptions"
          />

          <SettingsItem
            v-model="language"
            :label="t('settings.interface.language')"
            type="select"
            :icon="Languages"
            :options="localeOptions"
          />
        </section>
      </div>

      <DialogFooter class="flex-row items-center justify-between text-xs text-muted-foreground">
        <span>{{ t('settings.footer.author') }}</span>
        <a
          href="https://github.com/xuanzhi33/mc-mod-tools"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 hover:text-foreground"
        >
          <ExternalLink class="size-3" />
          {{ t('settings.footer.repo') }}
        </a>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
