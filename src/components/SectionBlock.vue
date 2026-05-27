<template>
  <section v-if="section.kind === 'hero'" class="page-head container">
    <div v-if="section.eyebrow" class="section-eyebrow">{{ section.eyebrow }}</div>
    <h1 v-if="section.title" class="page-title">{{ section.title }}</h1>
    <p v-if="section.body" class="page-lead">{{ section.body }}</p>
  </section>

  <section v-else-if="section.kind === 'rich'" class="container section-rich">
    <h2 v-if="section.title" class="section-rich-title">{{ section.title }}</h2>
    <div class="rich-content" v-html="section.body || ''"></div>
  </section>

  <section v-else-if="section.kind === 'stats'" class="container section-stats">
    <div v-if="section.eyebrow || section.title" class="section-head">
      <div v-if="section.eyebrow" class="section-eyebrow">{{ section.eyebrow }}</div>
      <h2 v-if="section.title" class="section-title">{{ section.title }}</h2>
    </div>
    <div class="page-stats-grid">
      <div v-for="(it, i) in itemsOf(section)" :key="i" class="about-stat">
        <div class="about-stat-num">{{ it.value }}</div>
        <div class="about-stat-label">{{ it.label }}</div>
      </div>
    </div>
  </section>

  <section v-else-if="section.kind === 'cards'" class="container section-cards">
    <div v-if="section.eyebrow || section.title" class="section-head">
      <div v-if="section.eyebrow" class="section-eyebrow">{{ section.eyebrow }}</div>
      <h2 v-if="section.title" class="section-title">{{ section.title }}</h2>
    </div>
    <div class="values-grid">
      <div v-for="(it, i) in itemsOf(section)" :key="i" class="value-card">
        <h3>{{ it.title }}</h3>
        <p>{{ it.description }}</p>
      </div>
    </div>
  </section>

  <section v-else-if="section.kind === 'cta'" class="container section-cta">
    <div class="faq-cta-card">
      <div>
        <h3 v-if="section.title">{{ section.title }}</h3>
        <p v-if="section.body">{{ section.body }}</p>
      </div>
      <RouterLink
        v-if="ctaHref && ctaLabel"
        :to="ctaHref"
        class="btn btn-primary btn-lg"
      >{{ ctaLabel }}</RouterLink>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  section: { type: Object, required: true },
});

function itemsOf(s) {
  return Array.isArray(s?.data?.items) ? s.data.items : [];
}

const ctaLabel = computed(() => props.section?.data?.cta_label || '');
const ctaHref  = computed(() => props.section?.data?.cta_href || '');
</script>
