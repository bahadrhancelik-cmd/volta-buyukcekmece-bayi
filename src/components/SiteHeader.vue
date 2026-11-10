<template>
  <header class="site-header">
    <div class="container header-inner">
      <RouterLink to="/" class="brand" @click="trackEvent('clickHeaderLogo')">
        <img src="/logo-volta.png" alt="Volta" class="brand-logo-img" width="640" height="266" />
        <span class="brand-lockup">
          <span class="brand-city"><img src="/buyukcekmece-yazi.png" alt="Büyükçekmece" class="brand-city-img brand-city-acik" width="1309" height="96" /><img src="/buyukcekmece-yazi-beyaz.png" alt="" aria-hidden="true" class="brand-city-img brand-city-koyu" width="1309" height="96" /></span>
          <span class="brand-city-sub">Fabrika Satış Mağazası</span>
        </span>
      </RouterLink>

      <nav class="site-nav" :class="{ open: menuOpen }">
        <RouterLink
          to="/"
          class="nav-link"
          active-class="active"
          exact-active-class="active"
          @click="menuOpen = false; trackEvent('clickHeaderNavHome')"
        >Ana Sayfa</RouterLink>

        <div class="nav-dropdown">
          <RouterLink
            to="/katalog"
            class="nav-link nav-dropdown-trigger"
            active-class="active"
            @click="menuOpen = false; trackEvent('clickHeaderNavCatalog')"
          >
            Modeller
            <span v-if="categoryStore.sorted.length" class="nav-caret" aria-hidden="true">▾</span>
          </RouterLink>
          <div
            v-if="categoryStore.sorted.length"
            class="nav-dropdown-menu"
            role="menu"
          >
            <RouterLink
              to="/katalog"
              class="nav-dropdown-item"
              @click="menuOpen = false; trackEvent('clickHeaderDropdownAllModels')"
            >
              <span class="nav-dropdown-label">Tüm modeller</span>
              <span class="nav-dropdown-count">{{ motorCount }}</span>
            </RouterLink>
            <div class="nav-dropdown-sep" aria-hidden="true"></div>
            <RouterLink
              v-for="c in categoryStore.sorted"
              :key="c.id"
              :to="`/katalog?cat=${c.slug}`"
              class="nav-dropdown-item"
              @click="menuOpen = false; trackEvent('clickHeaderDropdownCategory')"
            >
              <span class="nav-dropdown-label">{{ c.label }}</span>
              <span class="nav-dropdown-count">{{ countOf(c.slug) }}</span>
            </RouterLink>
          </div>
        </div>

        <RouterLink to="/hakkimizda" class="nav-link" active-class="active" @click="menuOpen = false; trackEvent('clickHeaderNavAbout')">Hakkımızda</RouterLink>
        <RouterLink to="/sss" class="nav-link" active-class="active" @click="menuOpen = false; trackEvent('clickHeaderNavFaq')">SSS</RouterLink>
        <RouterLink to="/iletisim" class="nav-link" active-class="active" @click="menuOpen = false; trackEvent('clickHeaderNavContact')">İletişim</RouterLink>
      </nav>

      <div class="header-actions">
        <a v-if="phoneHref" :href="phoneHref" class="header-phone" @click="trackEvent('clickHeaderPhone')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          <span>{{ settings.phone }}</span>
        </a>
        <RouterLink to="/katalog" class="btn btn-primary header-cta" @click="trackEvent('clickHeaderViewModelsCta')">Modelleri Gör</RouterLink>
        <button class="menu-toggle" @click="menuOpen = !menuOpen; trackEvent('clickHeaderMenuToggle')" aria-label="Menü">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useSettingsStore, useCategoryStore } from '../stores/site';
import { useMotorStore } from '../stores/motors';
import { trackEvent } from '../lib/analytics';

const menuOpen = ref(false);
const settingsStore = useSettingsStore();
const categoryStore = useCategoryStore();
const motorStore = useMotorStore();

const settings = computed(() => settingsStore.settings);

const phoneHref = computed(() => {
  const p = settings.value.phone;
  if (!p) return null;
  const cleaned = p.replace(/[^+\d]/g, '');
  return cleaned ? `tel:${cleaned}` : null;
});

const motorCount = computed(() => motorStore.motors.length);
function countOf(slug) {
  return motorStore.motors.filter((m) => m.category === slug).length;
}
</script>
