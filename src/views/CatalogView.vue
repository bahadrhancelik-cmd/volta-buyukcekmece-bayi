<template>
  <main class="catalog-page">
    <section class="page-head container">
      <div class="page-head-text">
        <div class="section-eyebrow">Tüm modeller</div>
        <h1 class="page-title">Model kataloğu</h1>
        <p class="page-lead">
          Elektrikli scooter, ATV ve e-bisiklet modellerimiz. Bayi fiyatları KDV dahildir.
        </p>
      </div>
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
        <p>Bu filtrelere uygun model bulunamadı.</p>
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
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useMotorStore } from '../stores/motors';
import { useCategoryStore } from '../stores/site';
import MotoCard from '../components/MotoCard.vue';
import { trackEvent } from '../lib/analytics';

const route = useRoute();
const store = useMotorStore();
const categoryStore = useCategoryStore();
const filter = ref('all');
const stockFilter = ref('all');
const sort = ref('order');
const layout = ref('grid');

onMounted(() => {
  if (route.query.cat) filter.value = route.query.cat;
});

function countByCategory(cat) {
  return store.motors.filter((m) => m.category === cat).length;
}

const filtered = computed(() => {
  let list = [...store.motors];
  if (filter.value !== 'all') list = list.filter((m) => m.category === filter.value);
  if (stockFilter.value === 'in') list = list.filter((m) => m.inStock);
  if (stockFilter.value === 'out') list = list.filter((m) => !m.inStock);

  if (sort.value === 'price-asc') list.sort((a, b) => a.price - b.price);
  else if (sort.value === 'price-desc') list.sort((a, b) => b.price - a.price);
  else if (sort.value === 'name-asc') list.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  else list.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  return list;
});
</script>
