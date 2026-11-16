<template>
  <main class="catalog-page">
    <section class="page-head container">
      <div class="page-head-text">
        <div class="section-eyebrow">Tüm modeller</div>
        <h1 class="page-title">Model kataloğu</h1>
        <p class="page-lead">
          Elektrikli ve benzinli motosiklet, ticari araç, bisiklet ve çocuk modellerimiz. Fiyatlara vergiler dahildir.
        </p>
      </div>
    </section>

    <section class="container catalog-search">
      <label class="search-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input
          ref="aramaKutusu"
          v-model="q"
          type="search"
          inputmode="search"
          placeholder="Model ara (ör. VSX, kamyonet, çocuk)"
          aria-label="Model ara"
        />
        <button v-if="q" type="button" class="search-clear" aria-label="Aramayı temizle" @click="q = ''">×</button>
      </label>
    </section>

    <section class="container catalog-toolbar">
      <div class="filter-tabs">
        <button :class="{ active: filter === 'all' }" @click="filter = 'all'; trackEvent('clickCatalogFilterAllTab')">
          Tümü <span class="count">{{ store.motors.length }}</span>
        </button>
        <button
          v-for="c in categoryStore.sorted"
          :key="c.id"
          :class="{ active: filter === c.slug }"
          @click="filter = c.slug; trackEvent('clickCatalogFilterCategoryTab')"
        >
          {{ c.label }} <span class="count">{{ countByCategory(c.slug) }}</span>
        </button>
      </div>

      <div class="toolbar-right">
        <select v-model="stockFilter" class="select" @change="trackEvent('changeCatalogStockFilter')">
          <option value="all">Stok durumu</option>
          <option value="in">Stokta</option>
          <option value="out">Tükendi</option>
        </select>
        <select v-model="sort" class="select" @change="trackEvent('changeCatalogSortOption')">
          <option value="order">Önerilen</option>
          <option value="price-asc">Fiyat ↑</option>
          <option value="price-desc">Fiyat ↓</option>
          <option value="name-asc">İsim A→Z</option>
        </select>
        <select v-model="layout" class="select" @change="trackEvent('changeCatalogLayoutOption')">
          <option value="grid">Grid</option>
          <option value="list">Liste</option>
        </select>
      </div>
    </section>

    <section class="container catalog-grid-section">
      <div v-if="filtered.length === 0" class="empty">
        <p v-if="q">“{{ q }}” için model bulunamadı.</p>
        <p v-else>Bu filtrelere uygun model bulunamadı.</p>
        <p v-if="q" class="empty-cta">
          Aradığınızı bulamadıysanız <a :href="whatsappLink(`Merhaba, sitede ${q} aradım, bilgi alabilir miyim?`)" target="_blank" rel="noopener" @click="trackEvent('clickDetailWhatsappCta')">WhatsApp'tan sorun</a>.
        </p>
      </div>
      <div v-else :class="layout === 'list' ? 'moto-list' : 'moto-grid'">
        <MotoCard
          v-for="m in filtered" :key="m.id"
          :motor="m"
          :layout="layout"
        />
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMotorStore } from '../stores/motors';
import { useCategoryStore } from '../stores/site';
import MotoCard from '../components/MotoCard.vue';
import { trackEvent, trackSearch } from '../lib/analytics';
import { whatsappLink } from '../lib/magaza';

const route = useRoute();
const router = useRouter();
const store = useMotorStore();
const categoryStore = useCategoryStore();
const filter = ref('all');
const stockFilter = ref('all');
const sort = ref('order');
const layout = ref('grid');
const q = ref(typeof route.query.q === 'string' ? route.query.q : '');
const aramaKutusu = ref(null);

onMounted(() => {
  if (route.query.cat) filter.value = route.query.cat;
  // Üst menüdeki büyüteçten gelindiyse arama kutusuna odaklan.
  if (route.query.ara !== undefined) nextTick(() => aramaKutusu.value?.focus());
});

// Türkçe büyük/küçük harf ve şapka farkını yok say ("çocuk" = "COCUK").
function sade(t) {
  return (t || '').toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i').replace(/[-_/]/g, ' ').replace(/\s+/g, ' ').trim();
}
const kategoriAdi = computed(() => Object.fromEntries(categoryStore.sorted.map((c) => [c.slug, c.label])));

let aramaZamani;
watch(q, (v) => {
  router.replace({ query: { ...route.query, q: v || undefined, ara: undefined } });
  clearTimeout(aramaZamani);
  if (v && v.trim().length >= 2) aramaZamani = setTimeout(() => trackSearch(v.trim()), 1200);
});

function countByCategory(cat) {
  return store.motors.filter((m) => m.category === cat).length;
}

const filtered = computed(() => {
  let list = [...store.motors];
  if (filter.value !== 'all') list = list.filter((m) => m.category === filter.value);
  const kelimeler = sade(q.value).split(' ').filter(Boolean);
  if (kelimeler.length) {
    list = list.filter((m) => {
      const metin = sade(`${m.name} ${kategoriAdi.value[m.category] || ''}`);
      return kelimeler.every((k) => metin.includes(k));
    });
  }
  if (stockFilter.value === 'in') list = list.filter((m) => m.inStock);
  if (stockFilter.value === 'out') list = list.filter((m) => !m.inStock);

  if (sort.value === 'price-asc') list.sort((a, b) => a.price - b.price);
  else if (sort.value === 'price-desc') list.sort((a, b) => b.price - a.price);
  else if (sort.value === 'name-asc') list.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  else list.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  // Stoktakiler her sıralamada önce; stokta olmayanlar sonda ("Gelince haber ver" ile).
  return [...list.filter((m) => m.inStock), ...list.filter((m) => !m.inStock)];
});
</script>
