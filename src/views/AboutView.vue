<template>
  <main class="about-page">
    <SectionBlock v-for="s in sections" :key="s.id" :section="s" />
    <p v-if="store.loading && !sections.length" class="empty container">Yükleniyor…</p>
  </main>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { usePageSectionsStore } from '../stores/site';
import SectionBlock from '../components/SectionBlock.vue';

const store = usePageSectionsStore();
const sections = computed(() => store.visibleByPage('about'));

onMounted(() => {
  if (!store.loaded) store.fetchAll();
});
</script>
