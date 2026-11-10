<template>
  <div>
    <SiteHeader v-if="!isAdminRoute" />
    <RouterView />
    <SiteFooter v-if="!isAdminRoute" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import SiteHeader from './components/SiteHeader.vue';
import SiteFooter from './components/SiteFooter.vue';
import { useMotorStore } from './stores/motors';
import { useCategoryStore, useSettingsStore, useFaqStore } from './stores/site';

const route = useRoute();
const isAdminRoute = computed(() => route.path.startsWith('/admin'));
const motorStore = useMotorStore();
const categoryStore = useCategoryStore();
const settingsStore = useSettingsStore();
const faqStore = useFaqStore();

onMounted(() => {
  // Run in parallel — none of these depend on each other.
  motorStore.fetchAll();
  categoryStore.fetchAll();
  settingsStore.fetch();
  faqStore.fetchAll();
});
</script>
