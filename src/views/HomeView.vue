<template>
  <main>
    <!-- HERO -->
    <section
      v-if="hasHeroImage"
      class="hero hero-banner"
      :style="{ backgroundImage: `url(${settings.hero_image_url})` }"
    >
      <div class="container hero-inner">
        <div class="hero-text">
          <div class="hero-eyebrow">
            <span class="eyebrow-dot"></span>
            Volta Motor Yetkili Bayi · Büyükçekmece
          </div>
          <h1 class="hero-title">{{ heroTitle }}</h1>
          <p class="hero-lead">{{ heroSubtitle }}</p>
          <div class="hero-ctas">
            <RouterLink :to="settings.hero_cta_href || '/katalog'" class="btn btn-primary btn-lg" @click="trackEvent('clickHomeHeroPrimaryCta')">
              {{ settings.hero_cta_label || 'Tüm modelleri gör' }}
            </RouterLink>
            <RouterLink to="/iletisim" class="btn btn-ghost btn-lg" @click="trackEvent('clickHomeHeroVisitDealerCta')">Bayiyi ziyaret et →</RouterLink>
          </div>
        </div>
      </div>
    </section>

    <section v-else class="hero hero-split">
      <div class="container hero-inner">
        <div class="hero-text">
          <div class="hero-eyebrow">
            <span class="eyebrow-dot"></span>
            Volta Motor Yetkili Bayi · Büyükçekmece
          </div>
          <h1 class="hero-title" v-html="heroTitleSplit"></h1>
          <p class="hero-lead">{{ heroSubtitle }}</p>
          <div class="hero-ctas">
            <RouterLink :to="settings.hero_cta_href || '/katalog'" class="btn btn-primary btn-lg" @click="trackEvent('clickHomeHeroPrimaryCta')">
              {{ settings.hero_cta_label || 'Tüm modelleri gör' }}
            </RouterLink>
            <RouterLink to="/iletisim" class="btn btn-ghost btn-lg" @click="trackEvent('clickHomeHeroVisitDealerCta')">Bayiyi ziyaret et →</RouterLink>
          </div>
          <div class="hero-stats">
            <div class="hero-stat">
              <div class="stat-num">{{ store.motors.length }}</div>
              <div class="stat-label">Modelimiz</div>
            </div>
            <div class="hero-stat">
              <div class="stat-num">Yetkili</div>
              <div class="stat-label">Volta bayisi</div>
            </div>
            <div class="hero-stat">
              <div class="stat-num">2 yıl</div>
              <div class="stat-label">Garanti</div>
            </div>
          </div>
        </div>

        <div class="hero-visual">
          <div class="hero-card-stack">
            <div
              v-for="(m, i) in featured.slice(0, 3)"
              :key="m.id"
              class="hero-stack-card"
              :class="`stack-${i}`"
              @click="openFeaturedCard(m)"
            >
              <MotoImage :motor="m" className="hero-stack-image" />
              <div class="hero-stack-meta">
                <div class="hero-stack-name">{{ m.name }}</div>
                <div class="hero-stack-price">{{ formatPrice(m.price) }}</div>
              </div>
            </div>
            <div class="hero-bg-circle"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Kategoriler -->
    <section v-if="categoryStore.sorted.length" class="categories container">
      <RouterLink
        v-for="c in categoryStore.sorted"
        :key="c.id"
        :to="`/katalog?cat=${c.slug}`"
        class="cat-card"
        @click="trackEvent('clickHomeCategoryCard')"
      >
        <div class="cat-num">{{ countByCategory(c.slug) }}</div>
        <div class="cat-info">
          <h3>{{ c.label }}</h3>
          <p>{{ countByCategory(c.slug) }} model</p>
        </div>
        <div class="cat-arrow">→</div>
      </RouterLink>
    </section>

    <!-- Öne çıkanlar -->
    <section v-if="featured.length" class="featured-section container">
      <div class="section-head">
        <div>
          <div class="section-eyebrow">Öne çıkanlar</div>
          <h2 class="section-title">Bu hafta öne çıkardıklarımız</h2>
        </div>
        <RouterLink to="/katalog" class="btn btn-ghost" @click="trackEvent('clickHomeFeaturedViewAll')">Tümünü gör →</RouterLink>
      </div>
      <div class="moto-grid">
        <MotoCard v-for="m in featured.slice(0, 6)" :key="m.id" :motor="m" />
      </div>
    </section>

    <RecentlyViewed :limit="4" />

    <!-- Neden biz -->
    <section class="why-section">
      <div class="container">
        <div class="section-head center">
          <div class="section-eyebrow">Neden Volta Büyükçekmece?</div>
          <h2 class="section-title">Sadece satış değil, baştan sona destek.</h2>
        </div>
        <div class="why-grid">
          <div class="why-card">
            <div class="why-num">01</div>
            <h3>Yetkili bayi</h3>
            <p>Volta Motor'un Büyükçekmece'deki resmi satış ve servis noktasıyız. Tüm modeller orijinal garantili.</p>
          </div>
          <div class="why-card">
            <div class="why-num">02</div>
            <h3>Modelleri yakından inceleyin</h3>
            <p>Karar vermeden önce mağazamızda tüm modelleri detaylı inceleyin; sorularınızı birebir yanıtlayalım.</p>
          </div>
          <div class="why-card">
            <div class="why-num">03</div>
            <h3>Servis & yedek parça</h3>
            <p>Periyodik bakım, batarya kontrolü, yedek parça temini — hepsi tek noktadan.</p>
          </div>
          <div class="why-card">
            <div class="why-num">04</div>
            <h3>Esnek ödeme</h3>
            <p>Peşin, taksit, banka kredisi seçenekleriyle ödeme planınızı birlikte oluşturalım.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section container">
      <div class="cta-card">
        <div>
          <h2>Showroom'umuzu ziyaret edin.</h2>
          <p v-if="settings.address">{{ settings.address }}<span v-if="settings.working_hours"> · {{ settings.working_hours }}</span></p>
          <p v-else>Atatürk Caddesi No: 123, Büyükçekmece. Hafta içi 09:00–19:00, Cumartesi 10:00–18:00.</p>
        </div>
        <RouterLink to="/iletisim" class="btn btn-primary btn-lg" @click="trackEvent('clickHomeShowroomContactCta')">Konum ve iletişim →</RouterLink>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useMotorStore } from '../stores/motors';
import { useCategoryStore, useSettingsStore } from '../stores/site';
import { formatPrice } from '../data/seed';
import { trackEvent } from '../lib/analytics';
import MotoCard from '../components/MotoCard.vue';
import MotoImage from '../components/MotoImage.vue';
import RecentlyViewed from '../components/RecentlyViewed.vue';

const router = useRouter();
const store = useMotorStore();
const categoryStore = useCategoryStore();
const settingsStore = useSettingsStore();

const settings = computed(() => settingsStore.settings);
const featured = computed(() => store.featured);

const hasHeroImage = computed(() => !!settings.value.hero_image_url);
const heroTitle = computed(() => settings.value.hero_title || 'Şehir senin, enerji bizden.');
const heroSubtitle = computed(() =>
  settings.value.hero_subtitle ||
  "Türkiye'nin elektrikli mobilite markası Volta Motor'un Büyükçekmece bayisinde scooter, ATV ve elektrikli bisiklet modellerimizi keşfedin."
);

// For the split-hero (no banner image), break the title at the first comma
// for the two-line accent treatment used in the original design.
const heroTitleSplit = computed(() => {
  const t = heroTitle.value;
  const idx = t.indexOf(',');
  if (idx > 0) {
    const first = t.slice(0, idx + 1);
    const rest = t.slice(idx + 1).trim();
    return `${escapeHtml(first)}<br><span class="hero-accent">${escapeHtml(rest)}</span>`;
  }
  return escapeHtml(t);
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[m]));
}

function countByCategory(slug) {
  return store.motors.filter((m) => m.category === slug).length;
}

function openFeaturedCard(m) {
  trackEvent('clickHomeHeroFeaturedCard');
  router.push(`/motor/${m.slug}`);
}
</script>
