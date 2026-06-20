<template>
  <main class="contact-page">
    <section class="page-head container">
      <div class="section-eyebrow">İletişim</div>
      <h1 class="page-title">Bize ulaşın.</h1>
      <p class="page-lead">
        Showroom'umuzu ziyaret edin, telefon edin ya da formu doldurun — en kısa sürede dönüş yapalım.
      </p>
    </section>

    <section class="container contact-grid">
      <div class="contact-info">
        <div v-if="settings.address" class="contact-item">
          <div class="contact-label">Adres</div>
          <div class="contact-value" style="white-space: pre-line">{{ settings.address }}</div>
        </div>
        <div v-if="settings.phone" class="contact-item">
          <div class="contact-label">Telefon</div>
          <div class="contact-value">
            <a v-if="phoneHref" :href="phoneHref">{{ settings.phone }}</a>
            <span v-else>{{ settings.phone }}</span>
          </div>
        </div>
        <div v-if="settings.email" class="contact-item">
          <div class="contact-label">E-posta</div>
          <div class="contact-value"><a :href="`mailto:${settings.email}`">{{ settings.email }}</a></div>
        </div>
        <div v-if="settings.working_hours" class="contact-item">
          <div class="contact-label">Çalışma saatleri</div>
          <div class="contact-value" style="white-space: pre-line">{{ settings.working_hours }}</div>
        </div>
        <div v-if="hasSocial" class="contact-item">
          <div class="contact-label">Sosyal medya</div>
          <div class="contact-value" style="display: flex; gap: 12px; flex-wrap: wrap">
            <a v-if="settings.social_instagram" :href="settings.social_instagram" target="_blank" rel="noopener">Instagram</a>
            <a v-if="settings.social_facebook" :href="settings.social_facebook" target="_blank" rel="noopener">Facebook</a>
            <a v-if="settings.social_youtube" :href="settings.social_youtube" target="_blank" rel="noopener">YouTube</a>
          </div>
        </div>
      </div>

      <div class="contact-map">
        <iframe
          v-if="hasMap"
          :src="mapEmbed"
          width="100%"
          height="100%"
          style="border:0; min-height: 360px;"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          :title="`Konum: ${settings.address || 'Volta Büyükçekmece Bayi'}`"
        ></iframe>
        <div v-else class="map-placeholder">
          <svg viewBox="0 0 600 400" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#d6d3d1" stroke-width="1"/>
              </pattern>
            </defs>
            <rect width="600" height="400" fill="#f5f5f4"/>
            <rect width="600" height="400" fill="url(#map-grid)"/>
            <path d="M 0 200 Q 200 180, 350 220 T 600 200" stroke="#a8a29e" stroke-width="14" fill="none"/>
            <path d="M 0 200 Q 200 180, 350 220 T 600 200" stroke="#fff" stroke-width="10" fill="none"/>
            <g transform="translate(310, 200)">
              <circle r="28" fill="#95c121" opacity="0.25"/>
              <circle r="14" fill="#95c121"/>
              <circle r="6" fill="#fff"/>
            </g>
          </svg>
          <div class="map-tag">
            <strong>Volta Büyükçekmece Bayi</strong>
            <span v-if="settings.address">{{ firstLine(settings.address) }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="container contact-form-section">
      <div class="contact-form-wrap">
        <h2 class="section-title">Bize bir mesaj bırakın</h2>
        <form @submit.prevent="submit" class="contact-form">
          <label>
            <span>Ad Soyad</span>
            <input type="text" required v-model="form.name" placeholder="Adınız Soyadınız" />
          </label>
          <label>
            <span>Telefon</span>
            <input type="tel" required v-model="form.phone" placeholder="0(5xx) xxx xx xx" />
          </label>
          <label class="full">
            <span>Mesajınız</span>
            <textarea rows="5" required v-model="form.message" placeholder="İlgilendiğiniz model, sorunuz..."></textarea>
          </label>
          <div class="form-bottom">
            <button type="submit" class="btn btn-primary btn-lg" :disabled="sending">
              {{ sending ? 'Gönderiliyor…' : 'Gönder' }}
            </button>
            <span v-if="sent" class="form-sent">✓ Mesajınız alındı, en kısa sürede dönüş yapacağız.</span>
            <span v-if="sendError" class="form-error">{{ sendError }}</span>
          </div>
        </form>
      </div>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';
import { useSettingsStore } from '../stores/site';

const settingsStore = useSettingsStore();
const settings = computed(() => settingsStore.settings);

const phoneHref = computed(() => {
  const p = settings.value.phone;
  if (!p) return null;
  const cleaned = p.replace(/[^+\d]/g, '');
  return cleaned ? `tel:${cleaned}` : null;
});

const hasMap = computed(() =>
  Number.isFinite(Number(settings.value.map_lat)) &&
  Number.isFinite(Number(settings.value.map_lng))
);

const mapEmbed = computed(() => {
  if (!hasMap.value) return '';
  const lat = Number(settings.value.map_lat);
  const lng = Number(settings.value.map_lng);
  // OpenStreetMap embed — no API key required.
  const d = 0.005;
  const bbox = `${lng - d}%2C${lat - d}%2C${lng + d}%2C${lat + d}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
});

const hasSocial = computed(() =>
  !!(settings.value.social_instagram || settings.value.social_facebook || settings.value.social_youtube)
);

function firstLine(s) {
  return String(s).split('\n')[0];
}

const form = reactive({ name: '', phone: '', message: '' });
const sent = ref(false);
const sending = ref(false);
const sendError = ref('');

async function submit() {
  sendError.value = '';
  sending.value = true;
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, phone: form.phone, message: form.message }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'Mesaj gönderilemedi. Lütfen telefonla ulaşın.');
    }
    sent.value = true;
    form.name = '';
    form.phone = '';
    form.message = '';
    setTimeout(() => { sent.value = false; }, 6000);
  } catch (e) {
    sendError.value = e.message || 'Mesaj gönderilemedi. Lütfen telefonla ulaşın.';
  } finally {
    sending.value = false;
  }
}
</script>
