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
            Volta Motor · Büyükçekmece Fabrika Satış Mağazası
          </div>
          <h1 class="hero-title">{{ heroTitle }}</h1>
          <p class="hero-lead">{{ heroSubtitle }}</p>
          <div class="hero-ctas">
            <RouterLink :to="settings.hero_cta_href || '/katalog'" class="btn btn-primary btn-lg" @click="trackEvent('clickHomeHeroPrimaryCta')">
              {{ settings.hero_cta_label || 'Tüm modelleri gör' }}
            </RouterLink>
            <RouterLink to="/iletisim" class="btn btn-ghost btn-lg" @click="trackEvent('clickHomeHeroVisitDealerCta')">Mağazayı ziyaret et →</RouterLink>
          </div>
        </div>
      </div>
    </section>

    <section v-else class="hero hero-split">
      <div class="container hero-inner">
        <div class="hero-text">
          <div class="hero-eyebrow">
            <span class="eyebrow-dot"></span>
            Volta Motor · Büyükçekmece Fabrika Satış Mağazası
          </div>
          <h1 class="hero-title" v-html="heroTitleSplit"></h1>
          <p class="hero-lead">{{ heroSubtitle }}</p>
          <div class="hero-ctas">
            <RouterLink :to="settings.hero_cta_href || '/katalog'" class="btn btn-primary btn-lg" @click="trackEvent('clickHomeHeroPrimaryCta')">
              {{ settings.hero_cta_label || 'Tüm modelleri gör' }}
            </RouterLink>
            <RouterLink to="/iletisim" class="btn btn-ghost btn-lg" @click="trackEvent('clickHomeHeroVisitDealerCta')">Mağazayı ziyaret et →</RouterLink>
          </div>
          <a :href="YOL_TARIFI" target="_blank" rel="noopener" class="showroom-callout" @click="trackEvent('clickHomeShowroomCallout')">
            <span class="showroom-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/></svg>
            </span>
            <span class="showroom-text">
              <strong>Showroom'da görün, yerinde karar verin</strong>
              <span>Tüm modelleri Beykent'teki mağazamızda detaylı inceleyin · Her gün 10:00'dan itibaren açığız</span>
            </span>
            <span class="showroom-go" aria-hidden="true">Yol tarifi →</span>
          </a>
          <div class="hero-stats">
            <div class="hero-stat">
              <div class="stat-num">{{ store.motors.length }}</div>
              <div class="stat-label">Modelimiz</div>
            </div>
            <div class="hero-stat">
              <div class="stat-num">1000+</div>
              <div class="stat-label">Mutlu müşteri</div>
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
        <img v-if="categoryPhoto(c.slug)" :src="categoryPhoto(c.slug)" alt="" class="cat-thumb" loading="lazy" />
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
            <h3>Fabrika Satış Mağazası</h3>
            <p>Volta Motor'un Büyükçekmece'deki resmi satış noktası, Fabrika Satış Mağazasıyız. Tüm modeller orijinal garantili.</p>
          </div>
          <div class="why-card">
            <div class="why-num">02</div>
            <h3>Modelleri yakından inceleyin</h3>
            <p>Karar vermeden önce mağazamızda tüm modelleri detaylı inceleyin; sorularınızı birebir yanıtlayalım.</p>
          </div>
          <div class="why-card">
            <div class="why-num">03</div>
            <h3>Garanti & satış sonrası</h3>
            <p>Tüm ürünler Volta garantisinde. Bakım ve servis ihtiyacınızda sizi Volta yetkili servisine yönlendiriyoruz.</p>
          </div>
          <div class="why-card">
            <div class="why-num">04</div>
            <h3>Esnek ödeme</h3>
            <p>Peşin, taksit, banka kredisi seçenekleriyle ödeme planınızı birlikte oluşturalım.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Mağaza ve teslimat fotoğrafları (Instagram'dan, 11.11.2026) -->
    <section class="gallery-section container" aria-labelledby="magaza-baslik">
      <div class="section-head center">
        <div class="section-eyebrow">Mağazamız</div>
        <h2 id="magaza-baslik" class="section-title">Beykent'te, Avrupa Caddesi üzerinde</h2>
      </div>
      <div class="store-grid">
        <img v-for="f in MAGAZA" :key="f.src" :src="f.src" :alt="f.alt" width="800" height="1000" loading="lazy" decoding="async" />
      </div>
    </section>

    <section class="gallery-section container" aria-labelledby="teslimat-baslik">
      <div class="section-head center">
        <div class="section-eyebrow">Teslimatlarımız</div>
        <h2 id="teslimat-baslik" class="section-title">Yeni araçları hayırlı olsun!</h2>
      </div>
      <div class="delivery-grid">
        <img v-for="n in 12" :key="n" :src="`/galeri/teslimat-${n}.jpg`" :alt="`Volta Motor Büyükçekmece Fabrika Satış Mağazası önünde teslimat ${n}`" width="600" height="750" loading="lazy" decoding="async" />
      </div>
      <div class="reviews-more">
        <a href="https://www.instagram.com/voltamotorbuyukcekmece/" target="_blank" rel="noopener" class="btn btn-ghost" @click="trackEvent('clickInstagramGallery')">Instagram'da daha fazlası →</a>
      </div>
    </section>

    <!-- Google yorumları -->
    <section class="reviews-section container" aria-labelledby="yorumlar-baslik">
      <div class="section-head center">
        <div class="section-eyebrow">Müşterilerimiz ne diyor?</div>
        <h2 id="yorumlar-baslik" class="section-title">Google'da <span class="reviews-score">4,9 ★</span> · 66 yorum</h2>
      </div>
      <div class="reviews-grid">
        <figure v-for="y in YORUMLAR" :key="y.ad" class="review-card">
          <div class="review-stars" aria-label="5 yıldız">★★★★★</div>
          <blockquote>{{ y.metin }}</blockquote>
          <figcaption>{{ y.ad }} <span>· Google yorumu</span></figcaption>
        </figure>
      </div>
      <div class="reviews-more">
        <a :href="GOOGLE_YORUMLAR" target="_blank" rel="noopener" class="btn btn-ghost" @click="trackEvent('clickGoogleReviews')">Tüm yorumları Google'da gör →</a>
      </div>
    </section>

    <!-- Yerel bilgi (SEO) -->
    <section class="local-section container">
      <h2>Beykent, Beylikdüzü ve Büyükçekmece'de Volta Motor</h2>
      <p>Volta Motor Büyükçekmece Fabrika Satış Mağazası, Beykent Pınartepe Mahallesi Avrupa Caddesi'nde hizmet verir. Beylikdüzü, Esenyurt, Büyükçekmece, Avcılar ve Silivri'den gelen müşterilerimize Volta elektrikli motosiklet, elektrikli bisiklet, benzinli motosiklet, ATV ve elektrikli çocuk ürünlerini tek mağazada sunuyoruz.</p>
      <p>Mağazamızda VSM, VSX, VB2 PRO ve diğer Volta modellerini detaylı inceleyebilir, güncel fiyat ve stok bilgisini alabilir, kredi kartına vade farksız 6 taksit seçeneğinden yararlanabilirsiniz. Tüm ürünler Volta garantisi altındadır.</p>
    </section>

    <!-- CTA -->
    <section class="cta-section container">
      <div class="cta-card">
        <div>
          <h2>Showroom'umuzu ziyaret edin.</h2>
          <p v-if="settings.address">{{ settings.address }}<span v-if="settings.working_hours"> · {{ settings.working_hours }}</span></p>
          <p v-else>Pınartepe Mah. Avrupa Cd. No:83T, Beykent, Büyükçekmece. Pzt–Cmt 10:00–19:30, Pazar 10:00–19:00.</p>
        </div>
        <RouterLink to="/iletisim" class="btn btn-primary btn-lg" @click="trackEvent('clickHomeShowroomContactCta')">Konum ve iletişim →</RouterLink>
      </div>
    </section>
  </main>
</template>

<script setup>
import { YOL_TARIFI, GOOGLE_YORUMLAR } from '../lib/konum';

const MAGAZA = [
  { src: '/galeri/magaza-dis-cephe.jpg', alt: 'Volta Motor Büyükçekmece Fabrika Satış Mağazası tabelası ve dış cephesi, Beykent Avrupa Caddesi' },
  { src: '/galeri/magaza-ic.jpg', alt: 'Volta Büyükçekmece showroom içi: elektrikli motosiklet, bisiklet ve üç tekerlekli modeller' },
  { src: '/galeri/magaza-showroom.jpg', alt: 'Showroom koridoru: Volta üç tekerlekli elektrikli araçlar ve motosikletler' },
  { src: '/galeri/magaza-ev2.jpg', alt: 'Mağazamızın önünde Volta EV2 elektrikli araçlar' },
];

// Google Haritalar'daki 5 yıldızlı yorumlardan seçildi (10.11.2026); isimler ad + soyad baş harfi
const YORUMLAR = [
  { ad: 'Şebnem A.', metin: 'Her sorumuza detaylı cevap verildi. Müşteri diyaloğu, fiyatlardaki uygunluk çok iyiydi. Hiçbir sorun yaşamadık.' },
  { ad: 'İlçim G.', metin: 'Personelin ilgi ve alakası çok iyiydi. Hizmetten çok memnun kaldık. Satın alma sürecinde de çok yardımcı oldular. Kesinlikle tavsiye ederim.' },
  { ad: 'Emrecan A.', metin: 'Hem işinde uzman hem de müşteri ilişkileri çok iyi bir ekibe sahipler. Kesinlikle ilk tercih olmalı.' },
  { ad: 'Ömer Ç.', metin: 'Mağaza oldukça güzel, ürün çeşitliliği yeterli ve fiyatlar gayet uygun. Çalışanlar güler yüzlü, ilgili ve yardımcı oluyor.' },
];
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
  "Volta Motor Büyükçekmece Fabrika Satış Mağazası'nda scooter, ATV ve elektrikli bisiklet modellerimizi keşfedin."
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

function categoryPhoto(slug) {
  const m = store.motors.find((x) => x.category === slug && x.photos && x.photos.length);
  return m ? m.photos[0] : null;
}
function countByCategory(slug) {
  return store.motors.filter((m) => m.category === slug).length;
}

function openFeaturedCard(m) {
  trackEvent('clickHomeHeroFeaturedCard');
  router.push(`/motor/${m.url || m.slug}`);
}
</script>
