<template>
  <section id="model-secici" class="ms container" aria-labelledby="ms-baslik">
    <div class="ms-kart">
      <!-- Giriş -->
      <div v-if="adim === -1" class="ms-giris">
        <div>
          <div class="section-eyebrow">Kararsız mısınız?</div>
          <h2 id="ms-baslik" class="ms-baslik">Size uygun modeli birlikte bulalım</h2>
          <p class="ms-alt">En fazla 4 kısa soru. Cevaplarınıza göre size en yakın üç modeli gösterelim.</p>
        </div>
        <button class="btn btn-primary btn-lg" @click="basla">Başlayalım →</button>
      </div>

      <!-- Sorular -->
      <div v-else-if="!bitti" class="ms-soru">
        <div class="ms-ust">
          <button v-if="adim > 0" class="ms-geri" @click="geri">← Geri</button>
          <span v-else></span>
          <span class="ms-sayac">Soru {{ adim + 1 }}<template v-if="cevap.kullanim"> / {{ sorular.length }}</template></span>
        </div>
        <div class="ms-cubuk"><span :style="{ width: `${((adim) / sorular.length) * 100}%` }"></span></div>
        <h2 id="ms-baslik" class="ms-baslik">{{ soru.metin }}</h2>
        <p v-if="soru.not" class="ms-not">{{ soru.not }}</p>
        <div class="ms-secenekler">
          <button
            v-for="s in soru.secenekler" :key="s.d"
            class="ms-secenek" :class="{ secili: cevap[soru.id] === s.d }"
            @click="sec(soru.id, s.d)"
          >
            <strong>{{ s.baslik }}</strong>
            <span v-if="s.alt">{{ s.alt }}</span>
          </button>
        </div>
      </div>

      <!-- Sonuç -->
      <div v-else class="ms-sonuc">
        <div class="ms-ust">
          <button class="ms-geri" @click="geri">← Cevabı değiştir</button>
          <button class="ms-geri" @click="sifirla">Baştan başla</button>
        </div>
        <h2 id="ms-baslik" class="ms-baslik">{{ !oneriler.length ? 'Tam uyan model bulamadık' : sonuc.butceUstu ? 'Bütçenize en yakın modeller' : 'Size en yakın modeller' }}</h2>
        <p class="ms-alt" v-if="sonuc.butceUstu">Bu bütçede uygun model yok; fiyatı en yakın olanları gösteriyoruz. Taksitle aylık tutar düşer.</p>
        <p class="ms-alt" v-else-if="oneriler.length">Fiyatlara vergiler dahildir. Mağazamızda hepsini detaylı inceleyebilirsiniz.</p>
        <p class="ms-alt" v-else>Bütçenizi biraz esnetirseniz ya da WhatsApp'tan yazarsanız size uygun seçeneği birlikte bulalım.</p>

        <div class="ms-oneriler">
          <RouterLink
            v-for="(o, i) in oneriler" :key="o.m.id"
            :to="`/motor/${o.m.url}`" class="ms-oneri"
            @click="trackEvent('clickQuizResult')"
          >
            <span v-if="i === 0" class="ms-rozet">En uygun</span>
            <MotoImage :motor="o.m" className="ms-gorsel" />
            <div class="ms-oneri-govde">
              <div class="ms-tur">{{ TUR_ADI[o.tur] }}</div>
              <h3>{{ o.m.name }}</h3>
              <div class="ms-fiyat">{{ formatPrice(o.m.price) }} <small>· {{ taksitMetni(o.m.price) }}</small></div>
              <ul class="ms-neden">
                <li v-for="(n, j) in o.neden" :key="j">{{ n }}</li>
              </ul>
              <span class="ms-stok" :class="{ yok: !o.m.inStock }">{{ o.m.inStock ? 'Stokta, mağazada görebilirsiniz' : 'Şu an stokta yok, gelince haber verebiliriz' }}</span>
              <span class="ms-incele">İncele →</span>
            </div>
          </RouterLink>
        </div>

        <p v-if="cevap.kullanim === 'cocuk'" class="ms-not">Çocuk modelleri yetişkin gözetiminde kullanılmalıdır.</p>

        <div class="ms-cta">
          <a :href="waLink" target="_blank" rel="noopener" class="btn btn-whatsapp btn-lg" @click="trackEvent('clickQuizWhatsapp')">Bu modelleri WhatsApp'tan sorun</a>
          <RouterLink to="/katalog" class="btn btn-ghost btn-lg" @click="trackEvent('clickQuizCatalog')">Tüm modellere bak</RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
// "Hangi model bana uygun?" testi (18.11.2026). Öneriler yalnız veritabanındaki
// fiyat, stok ve teknik özelliklerden hesaplanır; metinlerde teyitsiz iddia yok.
import { ref, reactive, computed } from 'vue';
import { useMotorStore } from '../stores/motors';
import { formatPrice } from '../data/seed';
import { taksitMetni, whatsappLink } from '../lib/magaza';
import { trackEvent } from '../lib/analytics';
import { modelTuru, azamiHiz, menzil, tasima, spec, sayi, TUR_ADI } from '../lib/modelTur';
import MotoImage from './MotoImage.vue';

const store = useMotorStore();
const adim = ref(-1);
const bitti = ref(false);
const cevap = reactive({ kullanim: null, mesafe: null, yakit: null, butce: null });

const BUTCE = {
  sehir: [
    { d: 'b1', baslik: "35 bin TL'ye kadar", min: 0, max: 35000 },
    { d: 'b2', baslik: '35 – 60 bin TL', min: 35000, max: 60000 },
    { d: 'b3', baslik: '60 – 90 bin TL', min: 60000, max: 90000 },
    { d: 'b4', baslik: '90 bin TL ve üstü', min: 90000, max: Infinity },
  ],
  uc: [
    { d: 'b1', baslik: "60 bin TL'ye kadar", min: 0, max: 60000 },
    { d: 'b2', baslik: '60 – 100 bin TL', min: 60000, max: 100000 },
    { d: 'b3', baslik: '100 bin TL ve üstü', min: 100000, max: Infinity },
  ],
  yuk: [
    { d: 'b1', baslik: "70 bin TL'ye kadar", min: 0, max: 70000 },
    { d: 'b2', baslik: '70 – 150 bin TL', min: 70000, max: 150000 },
    { d: 'b3', baslik: '150 bin TL ve üstü', min: 150000, max: Infinity },
  ],
  kabin: [
    { d: 'b1', baslik: "300 bin TL'ye kadar", min: 0, max: 300000 },
    { d: 'b2', baslik: '300 – 450 bin TL', min: 300000, max: 450000 },
    { d: 'b3', baslik: '450 bin TL ve üstü', min: 450000, max: Infinity },
  ],
  cocuk: [
    { d: 'b1', baslik: "30 bin TL'ye kadar", min: 0, max: 30000 },
    { d: 'b2', baslik: 'Fark etmez', min: 0, max: Infinity },
  ],
};

const S_KULLANIM = {
  id: 'kullanim',
  metin: 'Aracı en çok ne için kullanacaksınız?',
  secenekler: [
    { d: 'sehir', baslik: 'Günlük ulaşım', alt: 'İşe, okula, çarşıya gidip gelmek' },
    { d: 'yuk', baslik: 'İş için', alt: 'Yük, sipariş ya da pazar malı taşımak' },
    { d: 'uc', baslik: 'Rahat sürüş', alt: 'Dengede durması kolay, üç tekerli bir araç' },
    { d: 'kabin', baslik: 'Kapalı araç', alt: 'Yağmurda, soğukta ıslanmadan gitmek' },
    { d: 'cocuk', baslik: 'Çocuğum için', alt: 'Çocuk motosikleti ya da arazi aracı' },
  ],
};
const S_MESAFE = {
  id: 'mesafe',
  metin: 'Günde aşağı yukarı ne kadar yol yaparsınız?',
  secenekler: [
    { d: 'kisa', baslik: "10 km'den az", alt: 'Mahalle içi, kısa mesafe' },
    { d: 'orta', baslik: '10 – 30 km', alt: 'İlçe içinde gidip gelme' },
    { d: 'uzun', baslik: "30 km'den fazla", alt: 'İlçeler arası, uzun yol' },
  ],
};
const S_YAKIT = {
  id: 'yakit',
  metin: 'Elektrikli mi olsun, benzinli mi?',
  secenekler: [
    { d: 'elektrik', baslik: 'Elektrikli', alt: 'Evde normal prize takıp şarj ederim' },
    { d: 'benzin', baslik: 'Benzinli', alt: 'Depoyu doldurup yola çıkarım' },
    { d: 'farketmez', baslik: 'Fark etmez', alt: 'Hangisi uygunsa' },
  ],
};

const sorular = computed(() => {
  const k = cevap.kullanim;
  const liste = [S_KULLANIM];
  if (k === 'sehir' || k === 'uc' || k === 'yuk') liste.push(S_MESAFE);
  if (k === 'sehir') liste.push(S_YAKIT);
  liste.push({
    id: 'butce',
    metin: 'Ne kadarlık bir bütçe düşünüyorsunuz?',
    not: 'Kredi kartına 6 aya kadar vade farksız taksit yapılabiliyor.',
    secenekler: BUTCE[k || 'sehir'],
  });
  return liste;
});
const soru = computed(() => sorular.value[adim.value]);

function basla() {
  adim.value = 0;
  trackEvent('startQuiz');
}
function sec(id, deger) {
  if (id === 'kullanim' && cevap.kullanim !== deger) {
    cevap.mesafe = null; cevap.yakit = null; cevap.butce = null;
  }
  cevap[id] = deger;
  if (adim.value < sorular.value.length - 1) adim.value++;
  else { bitti.value = true; trackEvent('completeQuiz'); }
  basaKaydir();
}
// Telefonda kart boyu değişince soru ekranın üstünde kalmasın
function basaKaydir() {
  if (typeof document === 'undefined') return;
  requestAnimationFrame(() => {
    const el = document.getElementById('model-secici');
    if (el && el.getBoundingClientRect().top < 60) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
function geri() {
  if (bitti.value) { bitti.value = false; return; }
  if (adim.value > 0) adim.value--;
}
function sifirla() {
  Object.assign(cevap, { kullanim: null, mesafe: null, yakit: null, butce: null });
  bitti.value = false;
  adim.value = 0;
}

// Kullanım → uygun model türleri
function uygunTurler() {
  switch (cevap.kullanim) {
    case 'yuk': return ['yuk'];
    case 'uc': return ['uc-teker', 'yuk'];
    case 'kabin': return ['kabinli'];
    case 'cocuk': return ['cocuk'];
    default: {
      if (cevap.yakit === 'benzin') return ['benzinli'];
      const t = ['iki-teker-elektrikli', 'bisiklet'];
      if (cevap.yakit === 'farketmez') t.push('benzinli');
      return t;
    }
  }
}

const sonuc = computed(() => {
  if (!bitti.value) return { liste: [], butceUstu: false };
  const butce = (BUTCE[cevap.kullanim] || []).find((b) => b.d === cevap.butce) || { min: 0, max: Infinity };
  const liste = hesapla(butce);
  if (liste.length) return { liste, butceUstu: false };
  // Bütçeye uyan yoksa bütçenin en az aşıldığı modeller (ör. 35 bine kadar benzinli)
  const yakin = hesapla({ min: 0, max: Infinity }).sort((a, b) => a.m.price - b.m.price).slice(0, 3);
  return { liste: yakin, butceUstu: yakin.length > 0 };
});
const oneriler = computed(() => sonuc.value.liste);

function hesapla(butce) {
  const turler = uygunTurler();
  const adaylar = [];
  for (const m of store.motors) {
    const tur = modelTuru(m);
    if (!turler.includes(tur) || !(m.price > 0)) continue;
    let puan = 0;
    const hiz = azamiHiz(m);
    const mz = menzil(m);
    const yk = tasima(m);

    // Bütçe: aralıkta en iyi; biraz altı iyi; %10'a kadar üstü olur; daha fazlası elenir
    if (m.price > butce.max * 1.1) continue;
    if (m.price >= butce.min && m.price <= butce.max) puan += 4;
    else if (m.price < butce.min) puan += 1;

    // Kullanım içinde birincil tür öne çıksın (rahat sürüşte üç teker, yük işinde kapasite)
    if (cevap.kullanim === 'uc' && tur === 'uc-teker') puan += 2;
    if (cevap.kullanim === 'yuk' && yk) puan += Math.min(2, yk / 300);

    // Mesafe
    if (cevap.mesafe === 'uzun') {
      if (tur === 'benzinli') puan += 2;
      else if (mz != null && mz < 50) puan -= 3;
      if (hiz != null && hiz <= 25) puan -= 2;
      if (hiz != null && hiz >= 45) puan += 1;
      if (tur === 'bisiklet') puan -= 2;
    } else if (cevap.mesafe === 'orta') {
      if (mz != null && mz < 40 && tur !== 'benzinli') puan -= 1;
      if (hiz != null && hiz >= 45) puan += 0.5;
    } else if (cevap.mesafe === 'kisa') {
      if (tur === 'bisiklet' || (hiz != null && hiz <= 25)) puan += 0.5;
    }

    if (m.inStock) puan += 3;
    adaylar.push({ m, tur, puan, neden: neden(m, tur, { hiz, mz, yk }) });
  }
  adaylar.sort((a, b) => b.puan - a.puan || a.m.price - b.m.price);
  return adaylar.slice(0, 3);
}

function neden(m, tur, { hiz, mz, yk }) {
  const n = [];
  if (tur === 'benzinli') {
    const y = sayi(spec(m, 'yakıt tüketimi'));
    if (y) n.push(`Yakıt tüketimi ${String(y).replace('.', ',')} L / 100 km`);
  } else if (mz) n.push(`Menzil ${mz} km'ye kadar`);
  if (hiz) n.push(`Azami hız ${hiz} km/sa`);
  if (yk && (cevap.kullanim === 'yuk' || cevap.kullanim === 'uc' || tur === 'cocuk')) n.push(`Taşıma kapasitesi ${yk} kg`);
  return n.slice(0, 3);
}

const waLink = computed(() => {
  const adlar = oneriler.value.map((o) => o.m.name.replace(/ (Elektrikli|Benzinli|Üç|Dört).*$/i, '')).join(', ');
  const metin = adlar
    ? `Merhaba, sitedeki testte ${adlar} modelleri çıktı. Bu modeller hakkında bilgi almak istiyorum. (voltamotorbuyukcekmece.com)`
    : 'Merhaba, bana uygun bir model hakkında bilgi almak istiyorum. (voltamotorbuyukcekmece.com)';
  return whatsappLink(metin);
});
</script>

<style scoped>
.ms { margin-top: 48px; margin-bottom: 48px; scroll-margin-top: 90px; }
.ms-kart {
  background: var(--primary-bg);
  border: 1px solid var(--primary-light);
  border-radius: var(--radius-lg);
  padding: 28px;
}
.ms-giris { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
.ms-baslik { font-size: clamp(22px, 3vw, 30px); line-height: 1.2; margin: 6px 0 8px; color: #0a0a0a; }
.ms-alt { color: var(--ink-3); margin: 0; max-width: 620px; line-height: 1.5; }
.ms-not { color: var(--ink-3); font-size: 14px; margin: 0 0 12px; }
.ms-ust { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.ms-geri { background: none; border: 0; color: var(--primary-dark); font-weight: 600; cursor: pointer; padding: 4px 0; font-size: 14px; }
.ms-sayac { font-size: 13px; color: var(--ink-3); font-weight: 600; }
.ms-cubuk { height: 6px; background: #fff; border-radius: 99px; overflow: hidden; margin-bottom: 18px; }
.ms-cubuk span { display: block; height: 100%; background: var(--primary); transition: width .25s; }
.ms-secenekler { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 10px; margin-top: 14px; }
.ms-secenek {
  text-align: left; background: #fff; border: 1.5px solid #e7e5e4; border-radius: var(--radius);
  padding: 14px 16px; cursor: pointer; display: flex; flex-direction: column; gap: 3px; font: inherit; color: #0a0a0a;
  transition: border-color .15s, transform .15s;
}
.ms-secenek:hover { border-color: var(--primary); transform: translateY(-1px); }
.ms-secenek.secili { border-color: var(--primary-dark); background: #fbfef6; }
.ms-secenek strong { font-size: 16px; }
.ms-secenek span { font-size: 14px; color: #57534e; }
.ms-oneriler { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin: 18px 0; }
.ms-oneri {
  position: relative; background: #fff; border: 1px solid #e7e5e4; border-radius: var(--radius);
  overflow: hidden; text-decoration: none; color: #0a0a0a; display: flex; flex-direction: column;
  transition: box-shadow .15s, transform .15s;
}
.ms-oneri:hover { box-shadow: var(--shadow-lg); transform: translateY(-2px); }
.ms-rozet { position: absolute; top: 10px; left: 10px; z-index: 1; background: var(--primary); color: #0a0a0a; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 99px; }
.ms-oneri :deep(.ms-gorsel) { width: 100%; aspect-ratio: 4 / 3; object-fit: contain; background: #f5f5f4; display: block; }
.ms-oneri-govde { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
.ms-tur { font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #78716c; font-weight: 600; }
.ms-oneri h3 { margin: 0; font-size: 17px; }
.ms-fiyat { font-weight: 700; font-size: 18px; }
.ms-fiyat small { font-weight: 500; font-size: 13px; color: #57534e; }
.ms-neden { margin: 2px 0 0; padding-left: 18px; color: #44403c; font-size: 14px; line-height: 1.5; }
.ms-stok { font-size: 13px; color: #3f6212; font-weight: 600; margin-top: auto; padding-top: 6px; }
.ms-stok.yok { color: #a16207; }
.ms-incele { color: var(--primary-dark); font-weight: 700; font-size: 14px; }
.ms-cta { display: flex; gap: 10px; flex-wrap: wrap; }
@media (max-width: 600px) {
  .ms-kart { padding: 20px 16px; }
  .ms-giris .btn { width: 100%; }
  .ms-cta .btn { width: 100%; text-align: center; }
  .ms-oneri { flex-direction: row; }
  .ms-oneri :deep(.ms-gorsel) { width: 112px; min-height: 100%; aspect-ratio: auto; flex-shrink: 0; }
  .ms-oneri-govde { padding: 12px 14px; gap: 4px; }
  .ms-rozet { top: 6px; left: 6px; font-size: 11px; padding: 3px 8px; }
  .ms-oneri h3 { font-size: 15px; }
  .ms-fiyat { font-size: 16px; }
  .ms-neden { font-size: 13px; }
}
</style>
