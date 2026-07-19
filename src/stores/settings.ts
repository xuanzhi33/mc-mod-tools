import { usePreferredDark, usePreferredLanguages, useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

export type ColorMode = 'light' | 'dark' | 'system'

export const LOCAL_STORAGE_KEY_PREFIX = 'xuanzhi33-'

export const useSettingsStore = defineStore('settings', () => {
  const browserDark = usePreferredDark()
  const browserLanguages = usePreferredLanguages()
  const { locale, t } = useI18n()

  const preferZh = computed(() =>
    browserLanguages.value.some((lang) => lang.startsWith('zh') || lang.startsWith('cn')),
  )

  const language = useStorage(
    LOCAL_STORAGE_KEY_PREFIX + 'language',
    preferZh.value ? 'zh' : 'en',
  )
  const colorMode = useStorage<ColorMode>(
    LOCAL_STORAGE_KEY_PREFIX + 'color-mode',
    'system',
  )

  const isDarkMode = computed(() => {
    if (colorMode.value === 'dark') return true
    if (colorMode.value === 'light') return false
    return browserDark.value
  })

  const applyColorMode = () => {
    document.documentElement.classList.toggle('dark', isDarkMode.value)
  }

  watch(isDarkMode, applyColorMode)

  const applyLanguage = () => {
    locale.value = language.value
    document.title = t('common.title')
  }
  watch(language, applyLanguage)

  return {
    colorMode,
    isDarkMode,
    language,
    applyColorMode,
    applyLanguage,
  }
})
