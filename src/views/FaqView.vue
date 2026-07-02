<template>
  <main class="faq-page">
    <template v-for="s in sections" :key="s.id">
      <!-- Generic sections -->
      <SectionBlock v-if="!isCustomKind(s.kind)" :section="s" />

      <!-- FAQ questions list -->
      <section v-else-if="s.kind === 'faq_list'" class="container faq-section">
        <p v-if="faqStore.loading && !faqStore.faqs.length" class="empty">Yükleniyor…</p>
        <p v-else-if="!visibleFaqs.length" class="empty">Henüz soru eklenmemiş.</p>

        <ul v-else class="faq-list">
          <li
            v-for="(f, i) in visibleFaqs"
            :key="f.id"
            class="faq-item"
            :class="{ open: openIndex === i }"
          >
            <button
              type="button"
              class="faq-question"
              @click="toggle(i)"
              :aria-expanded="openIndex === i"
              :aria-controls="`faq-answer-${i}`"
            >
              <span>{{ f.question }}</span>
              <span class="faq-chevron" aria-hidden="true">{{ openIndex === i ? '−' : '+' }}</span>
            </button>
            <div
              v-show="openIndex === i"
              :id="`faq-answer-${i}`"
              class="faq-answer"
            >{{ f.answer }}</div>
          </li>
        </ul>
      </section>
    </template>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, watchEffect } from 'vue';
import { useFaqStore, usePageSectionsStore } from '../stores/site';
import SectionBlock from '../components/SectionBlock.vue';
import { trackEvent } from '../lib/analytics';

const faqStore = useFaqStore();
const pageStore = usePageSectionsStore();
const openIndex = ref(0);

const sections = computed(() => pageStore.visibleByPage('faq'));
const visibleFaqs = computed(() => faqStore.visibleSorted);

const CUSTOM_KINDS = ['faq_list'];
function isCustomKind(k) { return CUSTOM_KINDS.includes(k); }

onMounted(() => {
  if (!faqStore.loaded) faqStore.fetchAll();
  if (!pageStore.loaded) pageStore.fetchAll();
});

function toggle(i) {
  trackEvent('clickFaqQuestionToggle');
  openIndex.value = openIndex.value === i ? -1 : i;
}

// FAQPage JSON-LD for rich results.
let jsonLdEl = null;
watchEffect(() => {
  if (typeof document === 'undefined') return;
  const items = visibleFaqs.value;
  if (!items.length) {
    if (jsonLdEl) {
      jsonLdEl.remove();
      jsonLdEl = null;
    }
    return;
  }
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };
  if (!jsonLdEl) {
    jsonLdEl = document.createElement('script');
    jsonLdEl.setAttribute('type', 'application/ld+json');
    jsonLdEl.setAttribute('data-faq-jsonld', '');
    document.head.appendChild(jsonLdEl);
  }
  jsonLdEl.textContent = JSON.stringify(ld);
});
</script>
