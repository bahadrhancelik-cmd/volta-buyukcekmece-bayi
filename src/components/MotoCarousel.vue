<template>
  <div class="moto-carousel">
    <div
      class="moto-carousel-stage"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
      <div
        v-if="hasPhotos"
        class="moto-carousel-slide"
        :style="{ backgroundImage: `url(${activePhotos[index]})` }"
        :aria-label="`${motor.name} fotoğraf ${index + 1}`"
      ></div>
      <MotoSilhouette
        v-else
        :category="motor.category"
        :colors="motor.colors"
        className="moto-carousel-silhouette"
      />

      <button
        v-if="activePhotos.length > 1"
        class="moto-carousel-arrow prev"
        type="button"
        @click="prev(); trackEvent('clickCarouselPrevPhoto')"
        aria-label="Önceki fotoğraf"
      >‹</button>
      <button
        v-if="activePhotos.length > 1"
        class="moto-carousel-arrow next"
        type="button"
        @click="next(); trackEvent('clickCarouselNextPhoto')"
        aria-label="Sonraki fotoğraf"
      >›</button>
    </div>

    <div
      v-if="activePhotos.length > 1"
      class="moto-carousel-dots"
      aria-hidden="true"
    >
      <span
        v-for="(_, i) in activePhotos"
        :key="i"
        class="moto-carousel-dot"
        :class="{ active: i === index }"
      ></span>
    </div>

    <div v-if="activePhotos.length > 1" class="moto-carousel-thumbs">
      <button
        v-for="(p, i) in activePhotos"
        :key="`${p}-${i}`"
        type="button"
        class="moto-carousel-thumb"
        :class="{ active: i === index }"
        :style="{ backgroundImage: `url(${p})` }"
        @click="index = i; trackEvent('clickCarouselThumbnail')"
        :aria-label="`Fotoğraf ${i + 1}`"
      ></button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import MotoSilhouette from './MotoSilhouette.vue';
import { trackEvent } from '../lib/analytics';

const props = defineProps({
  motor: { type: Object, required: true },
  // Optional explicit photo list — used by DetailView to feed color-filtered photos.
  // When omitted, falls back to motor.photos (or legacy motor.photo).
  photos: { type: Array, default: null },
});

const index = ref(0);

const activePhotos = computed(() => {
  if (Array.isArray(props.photos)) return props.photos;
  const arr = Array.isArray(props.motor.photos) ? props.motor.photos : [];
  if (arr.length) return arr;
  if (props.motor.photo) return [props.motor.photo];
  return [];
});

const hasPhotos = computed(() => activePhotos.value.length > 0);

watch(
  () => props.motor.id,
  () => { index.value = 0; }
);

watch(activePhotos, (val) => {
  if (index.value >= val.length) index.value = 0;
});

function prev() {
  if (!activePhotos.value.length) return;
  index.value = (index.value - 1 + activePhotos.value.length) % activePhotos.value.length;
}
function next() {
  if (!activePhotos.value.length) return;
  index.value = (index.value + 1) % activePhotos.value.length;
}

// Touch swipe support — distinguishes horizontal swipes (change image)
// from vertical (let the page scroll naturally).
const SWIPE_THRESHOLD = 40;
let touchStartX = null;
let touchStartY = null;

function onTouchStart(e) {
  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
}

function onTouchEnd(e) {
  if (touchStartX == null || !activePhotos.value.length) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  touchStartX = null;
  touchStartY = null;
  if (Math.abs(dx) < SWIPE_THRESHOLD) return;
  if (Math.abs(dy) > Math.abs(dx)) return; // mostly-vertical → ignore
  trackEvent('swipeCarouselPhoto');
  if (dx > 0) prev();
  else next();
}
</script>
