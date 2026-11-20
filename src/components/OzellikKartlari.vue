<template>
  <div class="ozk">
    <div v-if="oneCikan.length" class="ozk-buyuk" :style="{ '--n': oneCikan.length }">
      <div v-for="(s, i) in oneCikan" :key="'b' + i" class="ozk-kart">
        <span class="ozk-ikon" aria-hidden="true"><svg viewBox="0 0 24 24" v-html="s.ikon"></svg></span>
        <div class="ozk-deger">{{ s.sayi }}<small v-if="s.birim">{{ s.birim }}</small></div>
        <div class="ozk-etiket">{{ s.label }}</div>
      </div>
    </div>
    <div v-if="elektrikli" class="ozk-rozet">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 2v5M15 2v5"/><path d="M6 7h12v4a6 6 0 0 1-12 0z"/><path d="M12 17v5"/></svg>
      <span><b>Normal prizden şarj edilir</b></span>
    </div>
    <div v-if="digerleri.length" class="ozk-kucuk">
      <div v-for="(s, i) in digerleri" :key="'k' + i" class="ozk-satir" :class="{ genis: s.genis }">
        <span class="ozk-ikon kucuk" aria-hidden="true"><svg viewBox="0 0 24 24" v-html="s.ikon"></svg></span>
        <div>
          <div class="ozk-etiket">{{ s.label }}</div>
          <div class="ozk-metin">{{ s.birim ? s.sayi + ' ' + s.birim : s.sayi }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({ specs: { type: Array, default: () => [] } });

const I = {
  hiz: '<path d="M4 15a8 8 0 1 1 16 0"/><path d="M12 15l4-5"/><circle cx="12" cy="15" r="1.3" fill="currentColor"/>',
  menzil: '<path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/>',
  guc: '<path d="M13 2L5 13h6l-1 9 8-11h-6z"/>',
  sarj: '<path d="M9 2v5M15 2v5"/><path d="M6 7h12v4a6 6 0 0 1-12 0z"/><path d="M12 17v5"/>',
  batarya: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10v4"/><path d="M6 10v4M9 10v4"/>',
  agirlik: '<path d="M6 8h12l2 12H4z"/><circle cx="12" cy="5" r="2"/>',
  tasima: '<rect x="3" y="9" width="18" height="11" rx="2"/><path d="M8 9V6h8v3"/>',
  fren: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2.5"/><path d="M12 4v3M20 12h-3M12 20v-3M4 12h3"/>',
  hacim: '<rect x="5" y="8" width="14" height="10" rx="2"/><path d="M9 8V5h6v3M3 12h2M19 12h2"/>',
  yakit: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  tork: '<path d="M20 12a8 8 0 1 1-3-6.2"/><path d="M20 4v5h-5"/>',
  vites: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><path d="M6 8v8M18 8v4H6"/>',
  teker: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>',
  varsayilan: '<circle cx="12" cy="12" r="8"/><path d="M12 8v5M12 16h.01"/>',
};

// [anahtar kelime, ikon, renk, öne çıkar mı]
const KURALLAR = [
  [/hız/i, 'hiz', '#e85d2a', true],
  [/menzil/i, 'menzil', '#95c121', true],
  [/motor gücü|azami güç/i, 'guc', '#f2b705', true],
  [/motor hacmi/i, 'hacim', '#2f7fd8', true],
  [/şarj/i, 'sarj', '#14b8a6', true],
  [/yakıt tüketimi/i, 'yakit', '#14b8a6', true],
  [/batarya kap/i, 'batarya', '#7c5cff', false],
  [/batarya/i, 'batarya', '#7c5cff', false],
  [/tork/i, 'tork', '#f2b705', false],
  [/kütle|ağırlık/i, 'agirlik', '#64748b', false],
  [/taşıma/i, 'tasima', '#64748b', false],
  [/fren/i, 'fren', '#e11d48', false],
  [/aktarma|vites/i, 'vites', '#2f7fd8', false],
  [/teker/i, 'teker', '#64748b', false],
  [/yakıt/i, 'yakit', '#14b8a6', false],
];

function ayir(value, unit) {
  const v = String(value).trim();
  const u = (unit || '').trim();
  // Değerin içinde zaten birim varsa ("2.8 L/ 100 KM"): baştaki sayı + kalan metin
  const ic = v.match(/^([\d.,]+(?:\s*-\s*[\d.,]+)?)\s*([A-Za-zçğıöşüÇĞİÖŞÜ].*)$/);
  if (ic) return { sayi: ic[1], birim: ic[2].replace(/\s*\/\s*/g, '/').trim() };
  if (u) return { sayi: v, birim: u };
  // "95 KM/H" -> sayı + birim; "3 - 4 Saat" gibi aralıkları da ayır
  const m = v.match(/^([\d.,]+(?:\s*-\s*[\d.,]+)?)\s*([A-Za-zçğıöşüÇĞİÖŞÜ³/0-9 ]{1,14})$/);
  if (m && !/^\d+$/.test(m[2].trim())) return { sayi: m[1], birim: m[2].trim() };
  return { sayi: v, birim: '' };
}

// Veritabanında aynı birim farklı yazılmış ("KG", "Kg", "KM/H", "SA"); ekranda tek tip göster
function birimDuzelt(b) {
  const k = b.toLocaleLowerCase('tr').replace(/\s+/g, '');
  if (/^kg$/.test(k)) return 'kg';
  if (/^km\/(h|sa|s|saat)$/.test(k)) return 'km/sa';
  if (/^km$/.test(k)) return 'km';
  if (/^(sa|saat|h)$/.test(k)) return 'saat';
  if (/^cm3$|^cm³$|^cc$/.test(k)) return 'cc';
  if (/^nm$/.test(k)) return 'Nm';
  if (/^(l|lt)\/100km$/.test(k)) return 'L/100 km';
  if (/^lt?$/.test(k)) return 'L';
  if (/^kw$/.test(k)) return 'kW';
  if (/^w$/.test(k)) return 'W';
  if (/^ps$/.test(k)) return 'PS';
  return b;
}

const liste = computed(() =>
  props.specs.map((s) => {
    const k = KURALLAR.find(([re]) => re.test(s.label));
    // Batarya kapasitesi ("48V 22 Ah") olduğu gibi kalır
    const ham = /batarya kap/i.test(s.label);
    const ay = ham ? { sayi: [s.value, s.unit].filter(Boolean).join(' '), birim: '' } : ayir(s.value, s.unit);
    const sayi = ay.sayi.replace(/\s*-\s*/, '–');
    const birim = birimDuzelt(ay.birim);
    return {
      label: s.label,
      sayi,
      birim,
      ikon: I[k ? k[1] : 'varsayilan'],
      renk: k ? k[2] : '#64748b',
      onde: k ? k[3] && sayi.length <= 14 : false,
      sira: k ? KURALLAR.indexOf(k) : 99,
      genis: (sayi + birim).length > 16,
    };
  })
);

const oneCikan = computed(() => liste.value.filter((s) => s.onde).sort((a, b) => a.sira - b.sira).slice(0, 4));
// Elektrikli mi: şarj/batarya bilgisi var, yakıt/motor hacmi yok
const elektrikli = computed(() => {
  const e = props.specs.map((x) => String(x.label));
  return e.some((l) => /şarj|batarya/i.test(l)) && !e.some((l) => /yakıt|motor hacmi/i.test(l));
});

const digerleri = computed(() => liste.value.filter((s) => !oneCikan.value.includes(s)));
</script>

<style scoped>
.ozk { --lacivert: #14212d; --yesil: #95c11f; margin-bottom: 28px; display: flex; flex-direction: column; gap: 10px; }

/* Öne çıkan değerler: tek lacivert blok, ince ayraçlarla bölünmüş */
.ozk-buyuk {
  display: grid; grid-template-columns: repeat(var(--n, 4), minmax(0, 1fr));
  background: var(--lacivert); border-radius: var(--radius); overflow: hidden;
  border-top: 3px solid var(--yesil);
  box-shadow: 0 14px 30px -18px rgba(20, 33, 45, 0.55);
}
.ozk-kart { padding: 18px 16px 16px; position: relative; }
.ozk-kart + .ozk-kart::before {
  content: ''; position: absolute; left: 0; top: 18px; bottom: 18px; width: 1px; background: rgba(255, 255, 255, 0.12);
}
.ozk-ikon { display: inline-flex; color: var(--yesil); margin-bottom: 10px; }
.ozk-ikon svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.ozk-deger { font-size: 26px; font-weight: 600; letter-spacing: -0.03em; line-height: 1.05; color: #fff; overflow-wrap: anywhere; }
.ozk-deger small { font-size: 12px; font-weight: 600; margin-left: 4px; color: var(--yesil); letter-spacing: 0.02em; }
.ozk-etiket { font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.09em; margin-top: 6px; color: rgba(255, 255, 255, 0.55); }

/* Diğer özellikler: sade iki sütunlu liste */
.ozk-kucuk {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 24px;
  border: 1px solid var(--line); border-radius: var(--radius); padding: 4px 16px; background: var(--surface);
}
.ozk-satir { display: flex; gap: 12px; align-items: center; padding: 11px 0; border-bottom: 1px solid var(--line); }
.ozk-satir:nth-last-child(1), .ozk-satir:nth-last-child(2):nth-child(odd) { border-bottom: none; }
.ozk-ikon.kucuk { margin: 0; flex-shrink: 0; color: var(--yesil); }
.ozk-ikon.kucuk svg { width: 18px; height: 18px; }
.ozk-satir .ozk-etiket { margin-top: 0; color: var(--muted); }
.ozk-metin { font-size: 14.5px; font-weight: 600; color: var(--ink); margin-top: 2px; }

.ozk-rozet {
  display: flex; gap: 10px; align-items: center; padding: 10px 14px; border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--yesil) 12%, var(--surface)); border: 1px solid color-mix(in srgb, var(--yesil) 40%, var(--line));
  font-size: 13.5px; color: var(--ink);
}
.ozk-rozet svg { width: 20px; height: 20px; flex-shrink: 0; fill: none; stroke: var(--yesil); stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.ozk-rozet b { font-weight: 700; }

@media (max-width: 720px) {
  .ozk-buyuk { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ozk-kart:nth-child(3)::before { display: none; }
  .ozk-kart:nth-child(n+3) { border-top: 1px solid rgba(255, 255, 255, 0.12); }
  .ozk-deger { font-size: 24px; }
  .ozk-kucuk { column-gap: 14px; padding: 2px 12px; }
  .ozk-satir { gap: 9px; padding: 10px 0; }
  .ozk-satir.genis { grid-column: 1 / -1; }
  .ozk-ikon.kucuk svg { width: 16px; height: 16px; }
  .ozk-metin { font-size: 13.5px; }
  .ozk-satir .ozk-etiket { font-size: 9.5px; letter-spacing: 0.06em; }
}
</style>
