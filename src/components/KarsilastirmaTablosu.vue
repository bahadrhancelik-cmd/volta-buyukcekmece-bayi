<template>
  <section v-if="digerleri.length" class="kt" aria-labelledby="kt-baslik">
    <h2 id="kt-baslik" class="section-title">{{ kisaAd(motor) }} ve benzerleri</h2>
    <p class="kt-alt">Aynı türdeki modellerle yan yana. Değerler üretici verileridir.</p>
    <div class="kt-kaydir">
      <table class="kt-tablo">
        <thead>
          <tr>
            <th scope="col" class="kt-bos"></th>
            <th v-for="(m, i) in modeller" :key="m.id" scope="col" :class="{ 'kt-bu': i === 0 }">
              <span v-if="i === 0" class="kt-etiket">Bu model</span>
              <RouterLink v-else :to="`/motor/${m.url}`" @click="trackEvent('clickCompareModel')">
                <MotoImage :motor="m" className="kt-gorsel" />
              </RouterLink>
              <RouterLink v-if="i > 0" :to="`/motor/${m.url}`" class="kt-ad" @click="trackEvent('clickCompareModel')">{{ kisaAd(m) }}</RouterLink>
              <span v-else class="kt-ad">{{ kisaAd(m) }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in satirlar" :key="s.ad">
            <th scope="row">{{ s.ad }}</th>
            <td v-for="(m, i) in modeller" :key="m.id" :class="{ 'kt-bu': i === 0 }">{{ s.deger(m) || '—' }}</td>
          </tr>
          <tr>
            <th scope="row"></th>
            <td v-for="(m, i) in modeller" :key="m.id" :class="{ 'kt-bu': i === 0 }">
              <RouterLink v-if="i > 0" :to="`/motor/${m.url}`" class="kt-incele" @click="trackEvent('clickCompareModel')">İncele →</RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
// Ürün sayfası karşılaştırma tablosu (18.11.2026): aynı türden, fiyatı en yakın 2 model.
// Stoktakiler önce gelir. Satırlar yalnız veritabanındaki teknik özelliklerden dolar.
import { computed } from 'vue';
import { useMotorStore } from '../stores/motors';
import { formatPrice } from '../data/seed';
import { taksitMetni } from '../lib/magaza';
import { trackEvent } from '../lib/analytics';
import { modelTuru, spec } from '../lib/modelTur';
import MotoImage from './MotoImage.vue';

const props = defineProps({ motor: { type: Object, required: true } });
const store = useMotorStore();

// Rahat sürüş üç tekerlileri ile yük üç tekerlileri birbirinin alternatifi sayılır
const KOMSU = { 'uc-teker': ['yuk'], yuk: ['uc-teker'], kabinli: ['yuk'], 'iki-teker-elektrikli': ['bisiklet'], bisiklet: ['iki-teker-elektrikli'] };

const digerleri = computed(() => {
  const m = props.motor;
  const tur = modelTuru(m);
  const p = Number(m.price) || 0;
  const puanla = (x) => Math.abs((Number(x.price) || 0) - p) / Math.max(p, 1) - (x.inStock ? 0.25 : 0);
  const sec = (turler) => store.motors
    .filter((x) => x.id !== m.id && x.price > 0 && turler.includes(modelTuru(x)))
    .sort((a, b) => puanla(a) - puanla(b));
  let liste = sec([tur]);
  if (liste.length < 2) liste = liste.concat(sec(KOMSU[tur] || []));
  return liste.slice(0, 2);
});
const modeller = computed(() => [props.motor, ...digerleri.value]);

function kisaAd(m) {
  return String(m.name || '').replace(/ (Elektrikli|Benzinli|Üç|Dört).*$/i, '');
}
function deger(m, ...anahtarlar) {
  const s = spec(m, ...anahtarlar);
  if (!s || !String(s.value).trim()) return '';
  return `${s.value}${s.unit ? ' ' + s.unit : ''}`.trim();
}

const TUM_SATIRLAR = [
  { ad: 'Fiyat', deger: (m) => formatPrice(m.price) },
  { ad: '6 taksit', deger: (m) => taksitMetni(m.price) },
  { ad: 'Stok', deger: (m) => (m.inStock ? 'Stokta' : 'Şu an yok') },
  { ad: 'Azami hız', deger: (m) => deger(m, 'azami hız', 'maks. hız') },
  { ad: 'Menzil', deger: (m) => deger(m, 'menzil') },
  { ad: 'Yakıt tüketimi', deger: (m) => deger(m, 'yakıt tüketimi') },
  { ad: 'Motor', deger: (m) => deger(m, 'motor gücü', 'motor hacmi') },
  { ad: 'Taşıma kapasitesi', deger: (m) => deger(m, 'taşıma') },
  { ad: 'Şarj süresi', deger: (m) => deger(m, 'şarj süresi') },
  { ad: 'Batarya', deger: (m) => deger(m, 'batarya tipi') },
  { ad: 'Ağırlık', deger: (m) => deger(m, 'kütle') },
];
// Hiçbir modelde değeri olmayan satır gösterilmez
const satirlar = computed(() => TUM_SATIRLAR.filter((s) => modeller.value.some((m) => s.deger(m))));
</script>

<style scoped>
.kt { margin-top: 48px; }
.kt-alt { color: var(--muted); margin: 6px 0 16px; font-size: 14px; }
.kt-kaydir { overflow-x: auto; -webkit-overflow-scrolling: touch; border: 1px solid var(--line); border-radius: var(--radius); background: var(--surface); }
.kt-tablo { width: 100%; min-width: 440px; border-collapse: separate; border-spacing: 0; font-size: 14px; }
.kt-tablo th, .kt-tablo td { padding: 10px 14px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: middle; }
.kt-tablo tbody th, .kt-bos { color: var(--muted); font-weight: 600; width: 130px; position: sticky; left: 0; background: var(--surface); z-index: 1; }
.kt-tablo thead th { vertical-align: bottom; padding-top: 14px; }
.kt-tablo tr:last-child th, .kt-tablo tr:last-child td { border-bottom: 0; }
.kt-bu { background: var(--primary-bg); }
.kt-tablo thead .kt-bu, .kt-tablo td.kt-bu { color: #0a0a0a; }
.kt-etiket { display: inline-block; background: var(--primary); color: #0a0a0a; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 99px; margin-bottom: 8px; }
.kt-tablo :deep(.kt-gorsel) { width: 110px; height: 80px; border-radius: 8px; margin-bottom: 6px; background-color: var(--surface-2); }
.kt-ad { display: block; font-weight: 700; font-size: 15px; color: inherit; text-decoration: none; }
a.kt-ad:hover { color: var(--primary-dark); }
.kt-incele { color: var(--primary-dark); font-weight: 700; text-decoration: none; }
@media (max-width: 600px) {
  .kt-tablo { font-size: 13px; }
  .kt-tablo th, .kt-tablo td { padding: 9px 10px; }
  .kt-tablo tbody th, .kt-bos { width: 92px; }
  .kt-tablo :deep(.kt-gorsel) { width: 84px; height: 62px; }
}
</style>
