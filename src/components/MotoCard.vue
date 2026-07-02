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
      <div class="moto-card-price-label">Bayi fiyatı</div>
      <div class="moto-card-price-stack">
        <span v-if="onSale" class="moto-card-compare">{{ formatPrice(motor.comparePrice) }}</span>
        <span class="moto-card-price">{{ formatPrice(motor.price) }}</span>
      </div>
      <button class="btn-link">İncele →</button>
    </div>
  </article>

  <article v-else class="moto-card grid" @click="goDetail">
    <div class="moto-card-image-wrap">
      <MotoImage :motor="motor" className="moto-card-image" />
      <span v-if="motor.featured" class="featured-tag">Öne çıkan</span>
      <span v-if="onSale" class="sale-tag">İndirim</span>
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
      <div class="moto-card-bottom">
        <ColorDots :colors="motor.colors" />
        <div class="moto-card-price-stack inline">
          <span v-if="onSale" class="moto-card-compare">{{ formatPrice(motor.comparePrice) }}</span>
          <span class="moto-card-price">{{ formatPrice(motor.price) }}</span>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
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
  router.push(`/motor/${props.motor.slug}`);
}

const onSale = computed(() => {
  const cp = Number(props.motor.comparePrice);
  return Number.isFinite(cp) && cp > Number(props.motor.price);
});

const topSpecs = computed(() => {
  const list = Array.isArray(props.motor.specs) ? props.motor.specs : [];
  return list.filter((s) => s && s.value).slice(0, 3);
});
</script>
