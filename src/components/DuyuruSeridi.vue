<template>
  <div class="duyuru-seridi" role="region" aria-label="Mağaza avantajları">
    <div class="duyuru-akis">
      <!-- Kesintisiz kayma için liste iki kez yazılır; ikincisi ekran okuyucudan gizli -->
      <ul v-for="kopya in 2" :key="kopya" class="duyuru-liste" :aria-hidden="kopya === 2 ? 'true' : null">
        <li v-for="m in MADDELER" :key="m"><span class="duyuru-nokta" aria-hidden="true"></span>{{ m }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
const MADDELER = [
  'Kredi kartına vade farksız 6 taksit',
  'Tüm modelleri mağazada yerinde inceleyin',
  "Her gün 10:00'dan itibaren açığız",
  'Tüm ürünler 2 yıl Volta garantili',
  'Orijinal Volta yedek parça',
  'Volta Fabrika Satış Mağazası · Beykent',
];
</script>
