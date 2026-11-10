<template>
  <div
    v-if="firstPhoto"
    :class="className"
    role="img"
    :aria-label="`Volta ${motor.name || ''}`.trim()"
    :style="{
      backgroundImage: `url(${firstPhoto})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }"
  ></div>
  <MotoSilhouette
    v-else
    :category="motor.category"
    :colors="motor.colors"
    :className="className"
  />
</template>

<script setup>
import { computed } from 'vue';
import MotoSilhouette from './MotoSilhouette.vue';

const props = defineProps({
  motor: { type: Object, required: true },
  className: { type: String, default: '' },
});

const firstPhoto = computed(() => {
  // Backwards-compat: support legacy `motor.photo` (single) alongside `motor.photos` (array)
  if (Array.isArray(props.motor.photos) && props.motor.photos.length) return props.motor.photos[0];
  if (props.motor.photo) return props.motor.photo;
  return null;
});
</script>
