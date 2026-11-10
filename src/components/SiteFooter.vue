<template>
  <footer class="site-footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <div class="brand">
          <img
            v-if="settings.logo_url"
            :src="settings.logo_url"
            alt="Volta Motor Büyükçekmece logosu"
            class="brand-logo-img"
          />
          <template v-else>
            <span class="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 32 32" width="28" height="28">
                <path d="M 8 4 L 16 28 L 24 4 L 19 4 L 16 18 L 13 4 Z" fill="currentColor" />
              </svg>
            </span>
            <span class="brand-text">
              <span class="brand-name">VOLTA</span>
              <span class="brand-sub">Büyükçekmece Fabrika Satış Mağazası</span>
            </span>
          </template>
        </div>
        <p class="footer-copy">
          Volta Motor Büyükçekmece Fabrika Satış Mağazası. Şehir içi ulaşımdan arazi kullanımına,
          ihtiyacınıza uygun elektrikli aracı keşfedin.
        </p>
      </div>

      <div class="footer-cols">
        <div>
          <h4>Site</h4>
          <RouterLink to="/" @click="trackEvent('clickFooterNavHome')">Ana Sayfa</RouterLink>
          <RouterLink to="/katalog" @click="trackEvent('clickFooterNavCatalog')">Modeller</RouterLink>
          <RouterLink to="/hakkimizda" @click="trackEvent('clickFooterNavAbout')">Hakkımızda</RouterLink>
          <RouterLink to="/sss" @click="trackEvent('clickFooterNavFaq')">SSS</RouterLink>
          <RouterLink to="/iletisim" @click="trackEvent('clickFooterNavContact')">İletişim</RouterLink>
          <RouterLink to="/kvkk">KVKK Aydınlatma Metni</RouterLink>
        </div>
        <div v-if="categoryStore.sorted.length">
          <h4>Kategoriler</h4>
          <RouterLink
            v-for="c in categoryStore.sorted"
            :key="c.id"
            :to="`/katalog?cat=${c.slug}`"
            @click="trackEvent('clickFooterCategoryLink')"
          >{{ c.label }}</RouterLink>
        </div>
        <div>
          <h4>İletişim</h4>
          <p v-if="settings.address" style="white-space: pre-line">{{ settings.address }}</p>
          <p v-if="settings.phone">{{ settings.phone }}</p>
          <p v-if="settings.email">{{ settings.email }}</p>
        </div>
      </div>
    </div>
    <div class="footer-bottom container">
      <span>© {{ year }} Volta Motor Büyükçekmece</span>
      <span v-if="settings.working_hours" class="footer-meta">{{ settings.working_hours }}</span>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue';
import { useSettingsStore, useCategoryStore } from '../stores/site';
import { trackEvent } from '../lib/analytics';

const settingsStore = useSettingsStore();
const categoryStore = useCategoryStore();
const settings = computed(() => settingsStore.settings);
const year = new Date().getFullYear();
</script>
