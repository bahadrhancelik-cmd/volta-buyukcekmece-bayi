<template>
  <main class="contact-page">
    <template v-for="s in sections" :key="s.id">
      <!-- Generic sections -->
      <SectionBlock v-if="!isCustomKind(s.kind)" :section="s" />

      <!-- Contact info + map paired side-by-side -->
      <section
        v-else-if="s.kind === 'contact_info' && nextIsMap(s)"
        class="container contact-grid"
      >
        <div class="contact-info">
          <div v-if="settings.address" class="contact-item">
            <div class="contact-label">Adres</div>
            <div class="contact-value" style="white-space: pre-line">{{ settings.address }}</div>
          </div>
          <div v-if="settings.phone" class="contact-item">
            <div class="contact-label">Telefon</div>
            <div class="contact-value">
              <a v-if="phoneHref" :href="phoneHref" @click="trackEvent('clickContactPhoneLink')">{{ settings.phone }}</a>
              <span v-else>{{ settings.phone }}</span>
            </div>
          </div>
          <div v-if="settings.email" class="contact-item">
            <div class="contact-label">E-posta</div>
            <div class="contact-value"><a :href="`mailto:${settings.email}`" @click="trackEvent('clickContactEmailLink')">{{ settings.email }}</a></div>
          </div>
          <div v-if="settings.working_hours" class="contact-item">
            <div class="contact-label">Çalışma saatleri</div>
            <div class="contact-value" style="white-space: pre-line">{{ settings.working_hours }}</div>
          </div>
          <div v-if="hasSocial" class="contact-item">
            <div class="contact-label">Sosyal medya</div>
            <div class="contact-value" style="display: flex; gap: 12px; flex-wrap: wrap">
              <a v-if="settings.social_instagram" :href="settings.social_instagram" target="_blank" rel="noopener" @click="trackEvent('clickContactInstagramLink')">Instagram</a>
              <a v-if="settings.social_facebook" :href="settings.social_facebook" target="_blank" rel="noopener" @click="trackEvent('clickContactFacebookLink')">Facebook</a>
              <a v-if="settings.social_youtube" :href="settings.social_youtube" target="_blank" rel="noopener" @click="trackEvent('clickContactYoutubeLink')">YouTube</a>
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
            :title="`Konum: ${settings.address || 'Volta Motor Büyükçekmece'}`"
          ></iframe>
          <div v-if="hasMap" class="map-actions">
            <a :href="YOL_TARIFI" target="_blank" rel="noopener" class="btn btn-primary" @click="trackEvent('clickContactDirections')">Yol tarifi al</a>
            <a :href="HARITADA_AC" target="_blank" rel="noopener" class="btn btn-ghost">Google Haritalar'da aç</a>
          </div>
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
              <strong>Volta Motor Büyükçekmece</strong>
              <span v-if="settings.address">{{ firstLine(settings.address) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Contact info standalone -->
      <section v-else-if="s.kind === 'contact_info'" class="container contact-grid contact-grid-single">
        <div class="contact-info">
          <div v-if="settings.address" class="contact-item">
            <div class="contact-label">Adres</div>
            <div class="contact-value" style="white-space: pre-line">{{ settings.address }}</div>
          </div>
          <div v-if="settings.phone" class="contact-item">
            <div class="contact-label">Telefon</div>
            <div class="contact-value">
              <a v-if="phoneHref" :href="phoneHref" @click="trackEvent('clickContactPhoneLink')">{{ settings.phone }}</a>
              <span v-else>{{ settings.phone }}</span>
            </div>
          </div>
          <div v-if="settings.email" class="contact-item">
            <div class="contact-label">E-posta</div>
            <div class="contact-value"><a :href="`mailto:${settings.email}`" @click="trackEvent('clickContactEmailLink')">{{ settings.email }}</a></div>
          </div>
          <div v-if="settings.working_hours" class="contact-item">
            <div class="contact-label">Çalışma saatleri</div>
            <div class="contact-value" style="white-space: pre-line">{{ settings.working_hours }}</div>
          </div>
          <div v-if="hasSocial" class="contact-item">
            <div class="contact-label">Sosyal medya</div>
            <div class="contact-value" style="display: flex; gap: 12px; flex-wrap: wrap">
              <a v-if="settings.social_instagram" :href="settings.social_instagram" target="_blank" rel="noopener" @click="trackEvent('clickContactInstagramLink')">Instagram</a>
              <a v-if="settings.social_facebook" :href="settings.social_facebook" target="_blank" rel="noopener" @click="trackEvent('clickContactFacebookLink')">Facebook</a>
              <a v-if="settings.social_youtube" :href="settings.social_youtube" target="_blank" rel="noopener" @click="trackEvent('clickContactYoutubeLink')">YouTube</a>
            </div>
          </div>
        </div>
      </section>

      <!-- Map standalone (skip if already paired with contact_info above) -->
      <section v-else-if="s.kind === 'map' && !prevIsInfo(s)" class="container contact-grid contact-grid-single">
        <div class="contact-map">
          <iframe
            v-if="hasMap"
            :src="mapEmbed"
            width="100%"
            height="100%"
            style="border:0; min-height: 360px;"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            :title="`Konum: ${settings.address || 'Volta Motor Büyükçekmece'}`"
          ></iframe>
          <div v-if="hasMap" class="map-actions">
            <a :href="YOL_TARIFI" target="_blank" rel="noopener" class="btn btn-primary" @click="trackEvent('clickContactDirections')">Yol tarifi al</a>
            <a :href="HARITADA_AC" target="_blank" rel="noopener" class="btn btn-ghost">Google Haritalar'da aç</a>
          </div>
          <div v-else class="map-placeholder">
            <svg viewBox="0 0 600 400" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
              <defs>
                <pattern id="map-grid-2" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#d6d3d1" stroke-width="1"/>
                </pattern>
              </defs>
              <rect width="600" height="400" fill="#f5f5f4"/>
              <rect width="600" height="400" fill="url(#map-grid-2)"/>
              <path d="M 0 200 Q 200 180, 350 220 T 600 200" stroke="#a8a29e" stroke-width="14" fill="none"/>
              <path d="M 0 200 Q 200 180, 350 220 T 600 200" stroke="#fff" stroke-width="10" fill="none"/>
              <g transform="translate(310, 200)">
                <circle r="28" fill="#95c121" opacity="0.25"/>
                <circle r="14" fill="#95c121"/>
                <circle r="6" fill="#fff"/>
              </g>
            </svg>
            <div class="map-tag">
              <strong>Volta Motor Büyükçekmece</strong>
              <span v-if="settings.address">{{ firstLine(settings.address) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Contact form -->
      <section v-else-if="s.kind === 'contact_form'" class="container contact-form-section">
        <div class="contact-form-wrap">
          <h2 v-if="s.title" class="section-title">{{ s.title }}</h2>
          <p v-if="s.body" class="page-lead" style="margin-top: 8px">{{ s.body }}</p>
          <form @submit.prevent="submit" class="contact-form">
            <label>
              <span>Ad Soyad</span>
              <input type="text" required v-model="form.name" placeholder="Adınız Soyadınız" />
            </label>
            <label>
              <span>Telefon</span>
              <input
                type="tel"
                required
                inputmode="tel"
                maxlength="17"
                :value="form.phone"
                @input="onPhoneInput"
                placeholder="0 (5xx) xxx xx xx"
              />
            </label>
            <label class="full">
              <span>Mesajınız</span>
              <textarea rows="5" required v-model="form.message" placeholder="İlgilendiğiniz model, sorunuz..."></textarea>
            </label>
            <p class="full" style="font-size:.85rem;color:#5b6770;margin:0">Formda paylaştığınız ad, telefon ve mesaj bilgileri, talebinize dönüş yapmak amacıyla işlenir. Ayrıntılı bilgi: <RouterLink to="/kvkk">KVKK Aydınlatma Metni</RouterLink>.</p>
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
    </template>
  </main>
</template>

<script setup>
import { HARITA_GOMULU, YOL_TARIFI, HARITADA_AC } from '../lib/konum';
import { reactive, ref, computed, onMounted } from 'vue';
import { useSettingsStore, usePageSectionsStore } from '../stores/site';
import SectionBlock from '../components/SectionBlock.vue';
import { trackEvent } from '../lib/analytics';

const settingsStore = useSettingsStore();
const pageStore = usePageSectionsStore();

const settings = computed(() => settingsStore.settings);
const sections = computed(() => pageStore.visibleByPage('contact'));

const CUSTOM_KINDS = ['contact_info', 'map', 'contact_form'];
function isCustomKind(k) { return CUSTOM_KINDS.includes(k); }

function nextIsMap(s) {
  const list = sections.value;
  const idx = list.findIndex((x) => x.id === s.id);
  return list[idx + 1]?.kind === 'map';
}
function prevIsInfo(s) {
  const list = sections.value;
  const idx = list.findIndex((x) => x.id === s.id);
  return list[idx - 1]?.kind === 'contact_info';
}

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
  void lat; void lng;
  return HARITA_GOMULU;
});

const hasSocial = computed(() =>
  !!(settings.value.social_instagram || settings.value.social_facebook || settings.value.social_youtube)
);

function firstLine(s) { return String(s).split('\n')[0]; }

onMounted(() => {
  if (!settingsStore.loaded) settingsStore.fetch();
  if (!pageStore.loaded) pageStore.fetchAll();
});

const form = reactive({ name: '', phone: '', message: '' });

// Turkish mobile mask: 0 (5XX) XXX XX XX
function formatTrPhone(value) {
  let d = String(value).replace(/\D/g, '');
  if (d && d[0] !== '0') d = '0' + d;
  d = d.slice(0, 11);
  if (d.length <= 1) return d;
  if (d.length <= 4) return `0 (${d.slice(1)}`;
  if (d.length <= 7) return `0 (${d.slice(1, 4)}) ${d.slice(4)}`;
  if (d.length <= 9) return `0 (${d.slice(1, 4)}) ${d.slice(4, 7)} ${d.slice(7)}`;
  return `0 (${d.slice(1, 4)}) ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9)}`;
}
function onPhoneInput(e) {
  form.phone = formatTrPhone(e.target.value);
}

const sent = ref(false);
const sending = ref(false);
const sendError = ref('');

async function submit() {
  trackEvent('submitContactForm');
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
    trackEvent('submitContactFormSuccess');
    sent.value = true;
    form.name = '';
    form.phone = '';
    form.message = '';
    setTimeout(() => { sent.value = false; }, 6000);
  } catch (e) {
    trackEvent('submitContactFormError');
    sendError.value = e.message || 'Mesaj gönderilemedi. Lütfen telefonla ulaşın.';
  } finally {
    sending.value = false;
  }
}
</script>
