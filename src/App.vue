<template>
  <div>
    <DuyuruSeridi v-if="!isAdminRoute" />
    <SiteHeader v-if="!isAdminRoute" />
    <RouterView v-slot="{ Component, route: r }">
      <Transition name="sayfa-gecis">
        <component :is="Component" :key="r.path.startsWith('/admin') ? 'admin' : r.path" />
      </Transition>
    </RouterView>
    <SiteFooter v-if="!isAdminRoute" />
    <WhatsAppButton v-if="!isAdminRoute" />
    <CerezOnay v-if="!isAdminRoute" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import SiteHeader from './components/SiteHeader.vue';
import DuyuruSeridi from './components/DuyuruSeridi.vue';
import SiteFooter from './components/SiteFooter.vue';
import WhatsAppButton from './components/WhatsAppButton.vue';
import CerezOnay from './components/CerezOnay.vue';
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
