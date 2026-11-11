<template>
  <article v-if="layout === 'list'" class="moto-card list" @click="goDetail">
    <div class="moto-card-image-wrap list">
      <MotoImage :motor="motor" className="moto-card-image" />
    </div>
    <div class="moto-card-body list">
      <div class="moto-card-top">
        <div class="moto-card-cat">{{ categoryStore.labelOf(motor.category) }}</div>
        <StockBadge :in-stock="motor.inStock" />
      </div>
      <h3 class="moto-card-title">{{ motor.name }}</h3>
      <div v-if="topSpecs.length" class="moto-card-specs">
        <span v-for="(s, i) in topSpecs" :key="i">
          <strong>{{ s.value }}</strong>{{ s.unit ? ' ' + s.unit : '' }}<template v-if="s.label"> {{ s.label.toLowerCase() }}</template>
        </span>
      </div>
      <ColorDots :colors="motor.colors" />
    </div>
    <div class="moto-card-price-wrap">
      <div class="moto-card-price-label">Satış fiyatı</div>
      <div class="moto-card-price-stack">
        <span v-if="onSale" class="moto-card-compare">{{ formatPrice(motor.comparePrice) }}</span>
        <span class="moto-card-price">{{ formatPrice(motor.price) }}</span>
      </div>
      <div class="moto-card-taksit">{{ taksit }} taksit</div>
      <button class="btn-link">İncele →</button>
    </div>
  </article>

  <article v-else class="moto-card grid" @click="goDetail">
    <div class="moto-card-image-wrap">
      <MotoImage :motor="motor" className="moto-card-image" />
      <span v-if="motor.featured" class="featured-tag">Öne çıkan</span>
      <span v-if="onSale" class="sale-tag">%{{ discountPercent }} indirim</span>
      <StockBadge :in-stock="motor.inStock" />
    </div>
    <div class="moto-card-body">
      <div class="moto-card-cat">{{ categoryStore.labelOf(motor.category) }}</div>
      <h3 class="moto-card-title">{{ motor.name }}</h3>
      <div v-if="topSpecs.length" class="moto-card-specs">
        <template v-for="(s, i) in topSpecs" :key="i">
          <span class="dot-sep" v-if="i > 0">·</span>
          <span><strong>{{ s.value }}</strong>{{ s.unit ? ' ' + s.unit : '' }}</span>
        </template>
      </div>
      <div class="kart-alt">
      <div v-if="renkSayisi" class="kart-renkler">
        <ColorDots :colors="motor.colors" :size="16" />
        <span>{{ renkSayisi }} renk</span>
      </div>
      <div class="kart-fiyat">
        <span v-if="onSale" class="kart-eski-fiyat">{{ formatPrice(motor.comparePrice) }}</span>
        <span class="kart-yeni-fiyat">{{ formatPrice(motor.price) }}</span>
      </div>
      <div v-if="taksit" class="kart-taksit">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
        <span><strong>{{ taksit }}</strong> · vade farksız</span>
      </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { taksitMetni } from '../lib/magaza';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import MotoImage from './MotoImage.vue';
import StockBadge from './StockBadge.vue';
import ColorDots from './ColorDots.vue';
import { formatPrice } from '../data/seed';
import { useCategoryStore } from '../stores/site';
import { trackEvent } from '../lib/analytics';

const categoryStore = useCategoryStore();

const props = defineProps({
  motor: { type: Object, required: true },
  layout: { type: String, default: 'grid' },
});

const router = useRouter();
function goDetail() {
  trackEvent('clickMotoCard');
  router.push(`/motor/${props.motor.url || props.motor.slug}`);
}

// Üstü çizili fiyat = Volta tavsiye fiyatı (uygulamadan otomatik gelir).
const taksit = computed(() => taksitMetni(props.motor.price));
const renkSayisi = computed(() => (Array.isArray(props.motor.colors) ? props.motor.colors.length : 0));
const onSale = computed(() => Number(props.motor.comparePrice) > Number(props.motor.price));
const discountPercent = computed(() =>
  onSale.value ? Math.round((1 - Number(props.motor.price) / Number(props.motor.comparePrice)) * 100) : 0
);

const topSpecs = computed(() => {
  const list = Array.isArray(props.motor.specs) ? props.motor.specs : [];
  return list.filter((s) => s && s.value).slice(0, 3);
});
</script>
