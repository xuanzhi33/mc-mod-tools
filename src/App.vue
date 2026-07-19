<script setup lang="ts">
import { onMounted } from 'vue';
import { Toaster } from '@/components/ui/sonner'
import { useSettingsStore } from './stores/settings';
import HomeView from '@/views/HomeView.vue';

onMounted(() => {
  const settingsStore = useSettingsStore();
  settingsStore.applyColorMode();
  settingsStore.applyLanguage();
});
</script>

<template>
  <HomeView />
  <Toaster rich-colors position="top-right" />
</template>
