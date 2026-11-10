<template>
  <main v-if="!motor" class="container empty-page">
    <h2>Model bulunamadı</h2>
    <RouterLink to="/katalog" class="btn btn-primary" @click="trackEvent('clickDetailNotFoundBackToCatalog')">Kataloğa dön</RouterLink>
  </main>

  <main v-else class="detail-page">
    <div class="container">
      <RouterLink to="/katalog" class="breadcrumb" @click="trackEvent('clickDetailBreadcrumbCatalog')">← Katalog</RouterLink>

      <div class="detail-grid">
        <div class="detail-image-side">
          <MotoCarousel :motor="motor" :photos="filteredPhotos" />
          <div class="detail-image-tags" style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
            <span v-if="motor.featured" class="featured-tag">Öne çıkan</span>
            <span v-if="motor.kampanya" class="sale-tag kampanya-tag">11.11 · 1.111 TL indirim</span>
            <span v-else-if="onSale" class="sale-tag">%{{ discountPercent }} indirim</span>
          </div>
        </div>

        <div class="detail-info-side">
          <div class="detail-cat">{{ categoryStore.labelOf(motor.category) }}</div>
          <h1 class="detail-title">{{ motor.name }}</h1>

          <div class="detail-meta">
            <StockBadge :in-stock="motor.inStock" />
            <span v-if="motor.featured" class="meta-tag">★ Öne çıkan</span>
          </div>

          <div
            v-if="motor.description"
            class="detail-desc rich-content"
            v-html="motor.description"
          ></div>

          <div class="detail-price-block">
            <div class="detail-price-label">{{ motor.kampanya ? '11.11 fiyatı · yalnız 11 Kasım 2026 (vergiler dahil)' : 'Satış fiyatı (vergiler dahil)' }}</div>
            <div class="detail-price-row">
              <span v-if="onSale" class="detail-compare-price" :title="motor.kampanya ? 'Kampanya öncesi fiyat' : 'Volta tavsiye satış fiyatı'">{{ formatPrice(motor.comparePrice) }}</span>
              <span class="detail-price">{{ formatPrice(motor.price) }}</span>
              <span v-if="motor.kampanya" class="detail-discount-badge">1.111 TL indirim</span>
              <span v-else-if="onSale" class="detail-discount-badge">%{{ discountPercent }} indirim</span>
            </div>
            <div v-if="motor.kampanya" class="kampanya-taksit">💳 Kredi kartına vade farksız 6 taksit</div>
            <div v-if="hediye" class="kampanya-hediye">🎁 {{ KAMPANYA.hediye.metin }}
            </div>
          </div>

          <div v-if="specsList.length" class="detail-specs">
            <div class="spec-row">
              <div v-for="(s, i) in specsList" :key="i" class="spec">
                <div class="spec-label">{{ s.label }}</div>
                <div class="spec-value">{{ s.value }} <span v-if="s.unit">{{ s.unit }}</span></div>
              </div>
            </div>
          </div>

          <div v-if="motor.colors && motor.colors.length > 1" class="detail-colors">
            <div class="detail-colors-label">Renk seçenekleri</div>
            <div class="detail-colors-row">
              <button
                v-for="(c, i) in motor.colors" :key="i"
                class="color-pick"
                :class="{ active: selectedColor === i }"
                @click="selectedColor = i; trackEvent('clickDetailColorOption')"
                :aria-label="`Renk ${i + 1}`"
              >
                <span :style="{ background: c }"></span>
              </button>
            </div>
          </div>

          <div v-if="!motor.inStock" class="notify-box">
            <template v-if="!notifyDone">
              <div class="notify-title">Stoğa gelince haber verelim</div>
              <p class="notify-text">Bu model şu an mağazamızda yok. Adınızı ve telefonunuzu bırakın, gelir gelmez sizi arayalım.</p>
              <form class="notify-form" @submit.prevent="sendNotify">
                <input v-model.trim="notifyName" type="text" placeholder="Adınız" autocomplete="name" maxlength="100" required />
                <input v-model.trim="notifyPhone" type="tel" placeholder="Telefon (05xx…)" autocomplete="tel" maxlength="20" required />
                <label class="notify-consent">
                  <input v-model="notifyConsent" type="checkbox" required />
                  <span>Bilgilerimin bu talep için kullanılmasına ilişkin <RouterLink to="/kvkk" target="_blank">aydınlatma metnini</RouterLink> okudum.</span>
                </label>
                <button class="btn btn-primary" type="submit" :disabled="notifySending">{{ notifySending ? 'Gönderiliyor…' : 'Gelince haber ver' }}</button>
                <div v-if="notifyError" class="notify-error">{{ notifyError }}</div>
              </form>
            </template>
            <div v-else class="notify-ok">Teşekkürler! {{ motor.name }} stoğa girince sizi arayacağız.</div>
          </div>

          <div class="detail-cta-row">
            <RouterLink to="/iletisim" class="btn btn-primary btn-lg" @click="trackEvent('clickDetailRequestInfoCta')">Bayiden bilgi al</RouterLink>
            <a v-if="phoneHref" :href="phoneHref" class="btn btn-ghost btn-lg" @click="trackEvent('clickDetailCallDealerCta')">Hemen ara</a>
          </div>
        </div>
      </div>

      <section v-if="related.length" class="related">
        <h2 class="section-title">Benzer modeller</h2>
        <div class="moto-grid">
          <MotoCard v-for="m in related" :key="m.id" :motor="m" />
        </div>
      </section>
    </div>

    <RecentlyViewed :exclude-id="motor.id" :limit="4" />
  </main>
</template>

<script setup>
import { KAMPANYA, hediyeVarMi } from '../lib/kampanya';
import { ref, computed, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMotorStore } from '../stores/motors';
import { useCategoryStore, useSettingsStore } from '../stores/site';
import { formatPrice } from '../data/seed';
import MotoCarousel from '../components/MotoCarousel.vue';
import StockBadge from '../components/StockBadge.vue';
import MotoCard from '../components/MotoCard.vue';
import RecentlyViewed from '../components/RecentlyViewed.vue';
import { useRecentStore } from '../stores/recent';
import { trackEvent } from '../lib/analytics';
import { supabase } from '../lib/supabase';

const route = useRoute();
const router = useRouter();
const store = useMotorStore();
const categoryStore = useCategoryStore();
const settingsStore = useSettingsStore();
const recentStore = useRecentStore();
const selectedColor = ref(0);

const motor = computed(() => store.bySlug(route.params.slug));
const related = computed(() => {
  if (!motor.value) return [];
  return store.motors
    .filter((m) => m.category === motor.value.category && m.id !== motor.value.id)
    .slice(0, 3);
});

// Üstü çizili fiyat = Volta tavsiye fiyatı (uygulamadan otomatik gelir).
const hediye = computed(() => hediyeVarMi(motor.value?.appModel));
const onSale = computed(() => Number(motor.value?.comparePrice) > Number(motor.value?.price));

const discountPercent = computed(() => {
  if (!onSale.value) return 0;
  const cp = Number(motor.value.comparePrice);
  const p = Number(motor.value.price);
  return Math.round(((cp - p) / cp) * 100);
});

// "Gelince haber ver" → uygulamadaki Talepler listesine düşer (site_haber_ver).
const notifyName = ref('');
const notifyPhone = ref('');
const notifyConsent = ref(false);
const notifySending = ref(false);
const notifyDone = ref(false);
const notifyError = ref('');
watch(() => route.params.slug, () => { notifyDone.value = false; notifyError.value = ''; });
async function sendNotify() {
  notifyError.value = '';
  const digits = notifyPhone.value.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 13) { notifyError.value = 'Lütfen geçerli bir telefon numarası yazın.'; return; }
  notifySending.value = true;
  const { error } = await supabase.rpc('site_haber_ver', { p_motor: motor.value.id, p_ad: notifyName.value, p_telefon: notifyPhone.value });
  notifySending.value = false;
  if (error) { notifyError.value = 'Kaydedilemedi, lütfen bizi telefonla arayın.'; return; }
  notifyDone.value = true;
  trackEvent('submitNotifyWhenInStock');
}

const specsList = computed(() => {
  const arr = Array.isArray(motor.value?.specs) ? motor.value.specs : [];
  return arr.filter((s) => s && s.label && s.value);
});

function stripHtml(s) {
  if (!s) return '';
  return String(s).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// Filter carousel photos by the selected color. Untagged photos are shown
// for every color; if the selected color has its own tagged photos, those
// + untagged ones are shown. Falls back to all photos.
const filteredPhotos = computed(() => {
  const m = motor.value;
  if (!m) return [];
  const all = Array.isArray(m.photos) ? m.photos : [];
  const tags = Array.isArray(m.photoColors) ? m.photoColors : [];
  if (!all.length) return [];
  const colors = Array.isArray(m.colors) ? m.colors : [];
  const sel = colors[selectedColor.value] || '';
  if (!sel || !tags.some((t) => t)) return all; // no color selected OR no tags exist
  const matching = all.filter((_, i) => {
    const tag = tags[i] || '';
    return tag === '' || tag === sel;
  });
  return matching.length ? matching : all;
});

const phoneHref = computed(() => {
  const p = settingsStore.settings?.phone;
  if (!p) return null;
  const cleaned = p.replace(/[^+\d]/g, '');
  return cleaned ? `tel:${cleaned}` : null;
});

watch(() => route.params.slug, () => { selectedColor.value = 0; });

// Track this motor as recently viewed once it's loaded (or when route changes).
watch(
  () => motor.value?.id,
  (id) => { if (id) recentStore.track(id); },
  { immediate: true }
);

// Eski (şablon) adresle gelindiyse okunur adrese geç
watchEffect(() => {
  const m = motor.value;
  if (m && m.url && route.params.slug !== m.url) router.replace(`/motor/${m.url}`);
});

// Per-motor SEO: title + meta description + Product JSON-LD
let jsonLdEl = null;
watchEffect(() => {
  if (typeof document === 'undefined') return;
  const m = motor.value;
  if (!m) return;
  const catLabel = categoryStore.labelOf(m.category);
  document.title = `${m.name} · Volta Motor Büyükçekmece`;
  const specSummary = specsList.value
    .map((s) => `${s.label} ${s.value}${s.unit ? ' ' + s.unit : ''}`)
    .join(', ');
  const plainDesc = stripHtml(m.description);
  const desc = `${m.name} — ${catLabel}${specSummary ? '. ' + specSummary : ''}${plainDesc ? '. ' + plainDesc.slice(0, 140) : ''} ${formatPrice(m.price)}`.replace(/\s+/g, ' ').trim();
  let metaDesc = document.head.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute('content', desc);

  const photos = Array.isArray(m.photos) ? m.photos : [];
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: m.name,
    description: plainDesc || desc,
    category: catLabel,
    image: photos.length ? photos : undefined,
    brand: { '@type': 'Brand', name: 'Volta Motor' },
    additionalProperty: specsList.value.length
      ? specsList.value.map((s) => ({
          '@type': 'PropertyValue',
          name: s.label,
          value: s.unit ? `${s.value} ${s.unit}` : s.value,
        }))
      : undefined,
    offers: {
      '@type': 'Offer',
      price: m.price,
      priceCurrency: 'TRY',
      availability: m.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    },
  };
  if (!jsonLdEl) {
    jsonLdEl = document.createElement('script');
    jsonLdEl.setAttribute('type', 'application/ld+json');
    jsonLdEl.setAttribute('data-detail-jsonld', '');
    document.head.appendChild(jsonLdEl);
  }
  jsonLdEl.textContent = JSON.stringify(ld);
});
</script>
