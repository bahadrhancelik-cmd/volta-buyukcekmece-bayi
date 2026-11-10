<template>
  <RouterLink v-if="aktif" to="/katalog" class="kampanya-serit">
    <strong>11.11'e özel · Sadece bugün</strong>
    <span>VSM, VSX ve VB2 PRO'da ekstra 1.111 TL indirim · VSM ve VSX'e kask + kilit hediye</span>
    <em>Modelleri gör →</em>
  </RouterLink>
</template>

<script setup>
import { kampanyaAktif } from '../lib/kampanya';
const aktif = kampanyaAktif();
</script>
