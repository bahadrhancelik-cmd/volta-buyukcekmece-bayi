<template>
  <div v-if="goster" class="cerez-seridi" role="dialog" aria-live="polite" aria-label="Çerez tercihi">
    <p>
      Sitemizi geliştirmek ve reklamlarımızın etkisini ölçmek için, onay verirseniz Google Analytics ve Google Ads çerezlerini kullanıyoruz.
      <RouterLink to="/kvkk">Ayrıntılar</RouterLink>
    </p>
    <div class="cerez-butonlar">
      <button type="button" class="cerez-red" @click="sec('red')">Reddet</button>
      <button type="button" class="cerez-kabul" @click="sec('kabul')">Kabul et</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

// Seçim tarayıcıda saklanır; altbilgideki "Çerez tercihleri" bağlantısı şeridi yeniden açar.
const goster = ref(false);

function kayitli() {
  try { return localStorage.getItem('cerezOnay'); } catch { return null; }
}

function sec(secim) {
  try { localStorage.setItem('cerezOnay', secim); } catch { /* depolama kapalı */ }
  const izin = secim === 'kabul' ? 'granted' : 'denied';
  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', { analytics_storage: izin, ad_storage: izin, ad_user_data: izin, ad_personalization: 'denied' });
  }
  goster.value = false;
}

function yenidenAc() { goster.value = true; }

onMounted(() => {
  if (window.location.pathname.startsWith('/admin')) return;
  if (!kayitli()) goster.value = true;
  window.addEventListener('cerez-tercihi-ac', yenidenAc);
});
onBeforeUnmount(() => window.removeEventListener('cerez-tercihi-ac', yenidenAc));
</script>
