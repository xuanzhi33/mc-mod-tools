<script setup lang="ts">
import { onMounted } from 'vue';
import { RouterView } from 'vue-router'
import { Toaster } from '@/components/ui/sonner'
import { useSettingsStore } from './stores/settings';

onMounted(() => {
  const settingsStore = useSettingsStore();
  settingsStore.applyColorMode();
  settingsStore.applyLanguage();
});
</script>

<template>
  <RouterView />
  <Toaster rich-colors position="top-right" />
</template>
