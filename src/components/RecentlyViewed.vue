<template>
  <section v-if="visible.length" class="featured-section container">
    <div class="section-head">
      <div>
        <div class="section-eyebrow">Son görüntülenenler</div>
        <h2 class="section-title">{{ title }}</h2>
      </div>
      <button
        v-if="recent.ids.length"
        type="button"
        class="btn btn-ghost btn-sm"
        @click="recent.clear(); trackEvent('clickRecentlyViewedClearHistory')"
      >Geçmişi temizle</button>
    </div>
    <div class="moto-grid">
      <MotoCard v-for="m in visible" :key="m.id" :motor="m" />
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { useMotorStore } from '../stores/motors';
import { useRecentStore } from '../stores/recent';
import MotoCard from './MotoCard.vue';
import { trackEvent } from '../lib/analytics';

const props = defineProps({
  excludeId: { type: String, default: null },
  limit: { type: Number, default: 4 },
  title: { type: String, default: 'Yakın zamanda baktığınız modeller' },
});

const motorStore = useMotorStore();
const recent = useRecentStore();

const visible = computed(() => {
  const byId = new Map(motorStore.motors.map((m) => [m.id, m]));
  return recent.ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .filter((m) => m.id !== props.excludeId)
    .filter((m) => m.visible !== false)
    .slice(0, props.limit);
});
</script>
