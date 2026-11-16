<template>
  <main class="panel">
    <!-- Giriş -->
    <section v-if="durum === 'giris'" class="giris">
      <div class="giris-kart">
        <img src="/logo-volta.png" alt="" class="giris-logo" />
        <h1>CDH Motor Paneli</h1>
        <p class="soluk">iPhone uygulamasındaki e-posta ve şifrenizle giriş yapın.</p>
        <form @submit.prevent="girisYap">
          <input v-model="eposta" type="email" placeholder="E-posta" autocomplete="username" required />
          <input v-model="sifre" type="password" placeholder="Şifre" autocomplete="current-password" required />
          <button type="submit" class="btn btn-primary" :disabled="bekliyor">{{ bekliyor ? 'Giriş yapılıyor…' : 'Giriş yap' }}</button>
          <p v-if="hata" class="hata">{{ hata }}</p>
        </form>
        <p class="kucuk soluk">Oturum, tarayıcı kapanınca kendiliğinden kapanır.</p>
      </div>
    </section>

    <section v-else-if="durum === 'yukleniyor'" class="ortala soluk">Yükleniyor…</section>

    <section v-else-if="durum === 'yetkisiz'" class="ortala">
      <p>{{ hata }}</p>
      <button class="btn" @click="cikis">Çıkış</button>
    </section>

    <!-- Panel -->
    <template v-else>
      <header class="ust">
        <div class="ust-sol">
          <strong>CDH Motor</strong>
          <span class="rozet" :class="{ izleyici }">{{ izleyici ? 'İzleyici · yalnız görüntüleme' : 'Yönetici' }}</span>
        </div>
        <div class="ust-sag">
          <span class="soluk kucuk">{{ kullaniciAdi }}</span>
          <button class="btn btn-kucuk" @click="yukle" :disabled="bekliyor">Yenile</button>
          <button class="btn btn-kucuk" @click="cikis">Çıkış</button>
        </div>
      </header>

      <nav class="sekmeler">
        <button v-for="s in SEKMELER" :key="s.id" :class="{ aktif: sekme === s.id }" @click="sekme = s.id">{{ s.ad }}</button>
      </nav>

      <p v-if="hata" class="hata icerik">{{ hata }}</p>

      <!-- Özet -->
      <section v-if="sekme === 'ozet'" class="icerik">
        <div class="kartlar">
          <div class="kart"><span class="soluk">Stokta</span><b>{{ stok.length }}</b><small>araç</small></div>
          <div class="kart"><span class="soluk">Rezerve</span><b>{{ rezerveSayisi }}</b><small>araç</small></div>
          <div class="kart"><span class="soluk">{{ ayAdi }} satış</span><b>{{ buAySatis.length }}</b><small>adet</small></div>
          <div class="kart"><span class="soluk">{{ ayAdi }} ciro</span><b>{{ tl(buAyCiro) }}</b><small>vergiler dahil</small></div>
          <div class="kart"><span class="soluk">Stok değeri</span><b>{{ tl(stokDegeri) }}</b><small>alış fiyatıyla</small></div>
          <div class="kart"><span class="soluk">Volta'dan beklenen</span><b>{{ acikSiparisAdet }}</b><small>onaylı, henüz gelmedi (son 6 ay)</small></div>
        </div>

        <h2>Modele göre stok</h2>
        <div class="tablo-kap">
          <table>
            <thead><tr><th>Model</th><th class="sag">Stok</th><th class="sag">Asgari</th><th class="sag">Liste fiyatı</th><th class="sag">Son 30 gün satış</th></tr></thead>
            <tbody>
              <tr v-for="m in modelOzeti" :key="m.model" :class="{ uyari: m.asgari && m.stok < m.asgari }">
                <td>{{ m.model }}</td><td class="sag">{{ m.stok }}</td><td class="sag">{{ m.asgari || '–' }}</td>
                <td class="sag">{{ m.fiyat ? tl(m.fiyat) : '–' }}</td><td class="sag">{{ m.satis30 }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <template v-if="raporlar[0]">
          <h2>Son asistan raporu · {{ tarih(raporlar[0].tarih) }}</h2>
          <pre class="rapor">{{ raporlar[0].metin }}</pre>
        </template>
      </section>

      <!-- Kâr / Zarar (uygulamadaki Aylık Özet ile aynı hesap) -->
      <section v-if="sekme === 'kar'" class="icerik">
        <div class="filtre">
          <select v-model="karAy"><option v-for="a in karAylari" :key="a" :value="a">{{ ayEtiketi(a) }}</option></select>
          <span class="soluk kucuk">{{ kz.adet }} araç satışı</span>
        </div>
        <div class="kartlar">
          <div class="kart"><span class="soluk">Ciro</span><b>{{ tl(kz.ciro) }}</b><small>vergiler dahil</small></div>
          <div class="kart"><span class="soluk">Araç satış kârı</span><b>{{ tl(kz.satisKari) }}</b><small>KDV, ÖTV, damga, komisyon düşülmüş</small></div>
          <div class="kart"><span class="soluk">Masraflar</span><b>{{ tl(kz.masraf) }}</b><small>sabit giderler dahil</small></div>
          <div class="kart vurgu" :class="{ eksi: kz.net < 0 }"><span class="soluk">Net sonuç</span><b>{{ tl(kz.net) }}</b><small>KDV hariç</small></div>
        </div>
        <p v-if="kz.alisiEksik" class="uyari-not">{{ kz.alisiEksik }} satışta alış fiyatı girilmemiş; bunların kârı hesaba katılamadı.</p>

        <h2>Hesap dökümü</h2>
        <div class="tablo-kap">
          <table class="dokum">
            <tbody>
              <tr><td>Ciro (vergiler dahil)</td><td class="sag">{{ tl(kz.ciro) }}</td></tr>
              <tr><td class="soluk">· içindeki ÖTV</td><td class="sag soluk">{{ tl(kz.otv) }}</td></tr>
              <tr><td class="soluk">· ödenecek KDV farkı</td><td class="sag soluk">{{ tl(kz.kdv) }}</td></tr>
              <tr><td>Araç satış kârı (net)</td><td class="sag">{{ tl(kz.satisKari) }}</td></tr>
              <tr><td>Aksesuar kârı</td><td class="sag">{{ tl(kz.aksesuar) }}</td></tr>
              <tr><td>Parça kârı</td><td class="sag">{{ tl(kz.parca) }}</td></tr>
              <tr><td>Volta garanti hakedişi ({{ kz.adet }} × {{ tl(hakedis) }})</td><td class="sag">{{ tl(kz.garanti) }}</td></tr>
              <tr><td>Masraflar</td><td class="sag">−{{ tl(kz.masraf) }}</td></tr>
              <tr class="toplam"><td>Net sonuç</td><td class="sag">{{ tl(kz.net) }}</td></tr>
              <tr><td class="soluk">KDV dahil satış kârı (kasaya kalan, KDV farkı ayrıca ödenir)</td><td class="sag soluk">{{ tl(kz.kdvDahilKar) }}</td></tr>
            </tbody>
          </table>
        </div>

        <div class="iki-sutun">
          <div>
            <h2>Model bazında</h2>
            <div class="tablo-kap"><table>
              <thead><tr><th>Model</th><th class="sag">Adet</th><th class="sag">Kâr</th></tr></thead>
              <tbody><tr v-for="r in kz.modeller" :key="r.ad"><td>{{ r.ad }}</td><td class="sag">{{ r.adet }}</td><td class="sag">{{ tl(r.kar) }}</td></tr></tbody>
            </table></div>
          </div>
          <div>
            <h2>Satan personel</h2>
            <div class="tablo-kap"><table>
              <thead><tr><th>Personel</th><th class="sag">Adet</th><th class="sag">Kâr</th></tr></thead>
              <tbody><tr v-for="r in kz.personel" :key="r.ad"><td>{{ r.ad }}</td><td class="sag">{{ r.adet }}</td><td class="sag">{{ tl(r.kar) }}</td></tr></tbody>
            </table></div>
            <h2>Masraf kalemleri</h2>
            <div class="tablo-kap"><table>
              <thead><tr><th>Kategori</th><th class="sag">Tutar</th></tr></thead>
              <tbody><tr v-for="r in kz.masrafKalemleri" :key="r.ad"><td>{{ r.ad }}</td><td class="sag">{{ tl(r.tutar) }}</td></tr></tbody>
            </table></div>
          </div>
        </div>

        <h2>Son 6 ay</h2>
        <div class="tablo-kap"><table>
          <thead><tr><th>Ay</th><th class="sag">Satış</th><th class="sag">Ciro</th><th class="sag">Satış kârı</th><th class="sag">Masraf</th><th class="sag">Net</th></tr></thead>
          <tbody><tr v-for="r in altiAy" :key="r.ay"><td>{{ ayEtiketi(r.ay) }}</td><td class="sag">{{ r.adet }}</td><td class="sag">{{ tl(r.ciro) }}</td><td class="sag">{{ tl(r.satisKari) }}</td><td class="sag">{{ tl(r.masraf) }}</td><td class="sag" :class="{ kirmizi: r.net < 0 }">{{ tl(r.net) }}</td></tr></tbody>
        </table></div>
        <p class="soluk kucuk">Satışlar Ekim 2026'dan itibaren uygulamaya kayıtlıdır; önceki aylar burada görünmez.</p>
      </section>

      <!-- Stok -->
      <section v-if="sekme === 'stok'" class="icerik">
        <div class="filtre">
          <input v-model="arama" placeholder="Model, renk veya şasi ara" />
          <select v-model="modelFiltre"><option value="">Tüm modeller</option><option v-for="m in stokModelleri" :key="m">{{ m }}</option></select>
          <span class="soluk kucuk">{{ stokFiltreli.length }} araç</span>
        </div>
        <div class="tablo-kap">
          <table>
            <thead><tr><th>Model</th><th>Renk</th><th>Şasi no</th><th>Giriş</th><th class="sag">Gün</th><th class="sag">Alış</th><th>Durum</th></tr></thead>
            <tbody>
              <tr v-for="m in stokFiltreli" :key="m.id">
                <td>{{ m.model }}</td><td>{{ m.renk }}</td><td class="mono">{{ m.sasi_no }}</td><td>{{ tarih(m.giris_tarihi) }}</td>
                <td class="sag">{{ gun(m.giris_tarihi) }}</td><td class="sag">{{ m.alis_fiyati ? tl(m.alis_fiyati) : '–' }}</td>
                <td><span v-if="m.rezerve_adi" class="etiket">Rezerve{{ m.rezerve_bitis ? ' · ' + tarih(m.rezerve_bitis) : '' }}</span><span v-else-if="m.engel_notu" class="etiket gri">{{ m.engel_notu }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Satışlar -->
      <section v-if="sekme === 'satis'" class="icerik">
        <div class="filtre">
          <select v-model="satisAy"><option v-for="a in satisAylari" :key="a" :value="a">{{ ayEtiketi(a) }}</option></select>
          <span class="soluk kucuk">{{ satisFiltreli.length }} satış · {{ tl(toplam(satisFiltreli)) }}</span>
        </div>
        <div class="tablo-kap">
          <table>
            <thead><tr><th>Tarih</th><th>Model</th><th>Renk</th><th>Şasi no</th><th class="sag">Satış</th><th class="sag">Alış</th><th>Ödeme</th><th>Satan</th><th>Müşteri</th></tr></thead>
            <tbody>
              <tr v-for="m in satisFiltreli" :key="m.id">
                <td>{{ tarih(m.satis_tarihi) }}</td><td>{{ m.model }}</td><td>{{ m.renk }}</td><td class="mono">{{ m.sasi_no }}</td>
                <td class="sag">{{ tl(m.satis_fiyati) }}</td><td class="sag">{{ m.alis_fiyati ? tl(m.alis_fiyati) : '–' }}</td>
                <td>{{ odeme(m) }}</td><td>{{ m.satan_adi }}</td><td>{{ m.musteri_adi }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Volta siparişleri -->
      <section v-if="sekme === 'siparis'" class="icerik">
        <div class="filtre">
          <label class="kucuk"><input type="checkbox" v-model="yalnizAcik" /> Yalnız açık siparişler</label>
          <span class="soluk kucuk">{{ siparisFiltreli.length }} kalem · son 6 ayda beklenen {{ acikSiparisAdet }} adet</span>
        </div>
        <p v-if="yalnizAcik && eskiAcikAdet" class="uyari-not">{{ eskiAcikAdet }} adet, 6 aydan eski siparişlerde hâlâ "Açık" görünüyor (Volta sisteminde kapatılmamış eski kayıtlar). Bunlar beklenen adede sayılmadı; Volta'ya kapatılmalarını sorabilirsiniz.</p>
        <div class="tablo-kap">
          <table>
            <thead><tr><th>Sipariş</th><th>Tarih</th><th>Ürün</th><th class="sag">Adet</th><th class="sag">Onaylı</th><th class="sag">Gelen</th><th class="sag">Birim</th><th>Onay</th><th>Bölge</th><th>Durum</th></tr></thead>
            <tbody>
              <tr v-for="s in siparisFiltreli" :key="s.siparis_no + '-' + s.kalem" :class="{ soluk: yalnizAcik && siparisEski(s) }">
                <td class="mono">{{ s.siparis_no }}</td><td>{{ tarih(s.siparis_zamani) }}</td><td>{{ s.model || s.urun }}</td>
                <td class="sag">{{ s.miktar }}</td><td class="sag">{{ s.onayli_miktar ?? '–' }}</td><td class="sag">{{ s.gelen_adet ?? 0 }}</td>
                <td class="sag">{{ s.birim_fiyat ? tl(s.birim_fiyat) : '–' }}</td><td>{{ s.onay_durumu || '–' }}</td><td>{{ s.bolge_onayi || '–' }}</td><td>{{ s.durum || '–' }}<span v-if="yalnizAcik && siparisEski(s)" class="etiket gri">eski kayıt</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Asistan raporları -->
      <section v-if="sekme === 'rapor'" class="icerik">
        <details v-for="(r, i) in raporlar" :key="r.tarih + i" :open="i === 0" class="rapor-kutu">
          <summary>{{ tarih(r.tarih) }}</summary>
          <pre class="rapor">{{ r.metin }}</pre>
        </details>
        <p v-if="!raporlar.length" class="soluk">Rapor yok.</p>
      </section>

      <footer class="alt soluk kucuk">
        Veriler canlıdır, son yükleme {{ sonYukleme }}. Bu panel yalnız görüntüleme içindir; kayıtlar iPhone uygulamasından girilir.
        <template v-if="izleyici"> Müşteri bilgileri gizlidir.</template>
      </footer>
    </template>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { panelSupabase, tabloAdi } from '../../lib/panelSupabase';

const SEKMELER = [
  { id: 'ozet', ad: 'Özet' },
  { id: 'kar', ad: 'Kâr / Zarar' },
  { id: 'stok', ad: 'Stok' },
  { id: 'satis', ad: 'Satışlar' },
  { id: 'siparis', ad: 'Volta siparişleri' },
  { id: 'rapor', ad: 'Asistan raporu' },
];
const AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

const sb = panelSupabase();
const durum = ref('yukleniyor');
const eposta = ref('');
const sifre = ref('');
const hata = ref('');
const bekliyor = ref(false);
const izleyici = ref(false);
const kullaniciAdi = ref('');
const sekme = ref('ozet');
const sonYukleme = ref('');

const motorlar = ref([]);
const fiyatlar = ref([]);
const siparisler = ref([]);
const raporlar = ref([]);
const masraflar = ref([]);
const sabitMasraflar = ref([]);
const aksesuarSatis = ref([]);
const parcalar = ref([]);
const hakedis = ref(300);
const karAy = ref('');

const arama = ref('');
const modelFiltre = ref('');
const satisAy = ref('');
const yalnizAcik = ref(true);

const tlBicim = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 });
const tl = (n) => `${tlBicim.format(Number(n) || 0)} ₺`;
const tarih = (t) => {
  if (!t) return '';
  const [y, a, g] = String(t).slice(0, 10).split('-');
  return `${g}.${a}.${y}`;
};
const bugun = new Date();
const gun = (t) => (t ? Math.max(0, Math.floor((bugun - new Date(String(t).slice(0, 10))) / 86400000)) : '');
const ayAnahtari = (t) => String(t || '').slice(0, 7);
const ayEtiketi = (a) => (a ? `${AYLAR[Number(a.slice(5, 7)) - 1]} ${a.slice(0, 4)}` : '');
const buAy = ayAnahtari(bugun.toISOString());
const ayAdi = AYLAR[bugun.getMonth()];
const toplam = (liste) => liste.reduce((t, m) => t + (Number(m.satis_fiyati) || 0), 0);
const odeme = (m) => {
  const p = [];
  if (Number(m.odeme_nakit)) p.push('Nakit');
  if (Number(m.odeme_havale)) p.push('Havale');
  if (Number(m.odeme_kart)) p.push(m.kart_taksit > 1 ? `Kart ${m.kart_taksit} tk` : 'Kart');
  return p.join(' + ') || '–';
};

const stok = computed(() => motorlar.value.filter((m) => m.durum === 'Stokta'));
const satislar = computed(() => motorlar.value.filter((m) => m.durum === 'Satıldı' && m.satis_tarihi)
  .sort((a, b) => String(b.satis_tarihi).localeCompare(String(a.satis_tarihi))));
const rezerveSayisi = computed(() => stok.value.filter((m) => m.rezerve_adi).length);
const buAySatis = computed(() => satislar.value.filter((m) => ayAnahtari(m.satis_tarihi) === buAy));
const buAyCiro = computed(() => toplam(buAySatis.value));
const stokDegeri = computed(() => stok.value.reduce((t, m) => t + (Number(m.alis_fiyati) || 0), 0));
const acikSiparisAdet = computed(() => siparisler.value.filter((s) => siparisAcik(s) && !siparisEski(s))
  .reduce((t, s) => t + kalanAdet(s), 0));
const eskiAcikAdet = computed(() => siparisler.value.filter((s) => siparisAcik(s) && siparisEski(s))
  .reduce((t, s) => t + kalanAdet(s), 0));

const modelOzeti = computed(() => {
  const otuzGun = new Date(bugun - 30 * 86400000).toISOString().slice(0, 10);
  const harita = new Map();
  const al = (model) => {
    if (!harita.has(model)) harita.set(model, { model, stok: 0, satis30: 0, asgari: 0, fiyat: 0 });
    return harita.get(model);
  };
  stok.value.forEach((m) => { al(m.model).stok += 1; });
  satislar.value.forEach((m) => { if (String(m.satis_tarihi) >= otuzGun) al(m.model).satis30 += 1; });
  fiyatlar.value.forEach((f) => {
    if (!harita.has(f.model)) return;
    const k = harita.get(f.model);
    k.asgari = f.min_stok || 0;
    k.fiyat = f.guncel || f.tavsiye || 0;
  });
  return [...harita.values()].sort((a, b) => b.stok - a.stok || a.model.localeCompare(b.model, 'tr'));
});

const stokModelleri = computed(() => [...new Set(stok.value.map((m) => m.model))].sort((a, b) => a.localeCompare(b, 'tr')));
const stokFiltreli = computed(() => {
  const q = arama.value.trim().toLocaleLowerCase('tr');
  return stok.value
    .filter((m) => !modelFiltre.value || m.model === modelFiltre.value)
    .filter((m) => !q || [m.model, m.renk, m.sasi_no].some((v) => String(v || '').toLocaleLowerCase('tr').includes(q)))
    .sort((a, b) => a.model.localeCompare(b.model, 'tr') || String(a.giris_tarihi).localeCompare(String(b.giris_tarihi)));
});

const satisAylari = computed(() => [...new Set(satislar.value.map((m) => ayAnahtari(m.satis_tarihi)))]);
const satisFiltreli = computed(() => satislar.value.filter((m) => ayAnahtari(m.satis_tarihi) === satisAy.value));

// ---- Kâr / Zarar: uygulamadaki SatisHesabi ve AylikOzet ile aynı formül ----
// net kâr = KDV hariç satış − KDV hariç alış − ÖTV − damga − 12 taksit komisyonu
const KDV = 0.2;
function satisHesabi(m) {
  const satis = Number(m.satis_fiyati);
  if (!satis) return null;
  const otvOrani = Number(m.satis_otv_orani) || 0;
  const kdvHaric = satis / (1 + KDV);
  const otv = (kdvHaric * otvOrani) / (1 + otvOrani);
  const kart = Number(m.odeme_kart) || 0;
  const komisyon = m.kart_taksit === 12 ? (kart > 0 ? kart : satis) * 0.12 : 0;
  const alis = m.alis_fiyati == null ? null : Number(m.alis_fiyati);
  const net = alis == null ? null : kdvHaric - alis - otv - (Number(m.satis_damga) || 0) - komisyon;
  const kdv = alis == null ? null : (satis - kdvHaric) - alis * KDV;
  return { satis, otv, net, kdv, kdvDahil: net == null ? null : net + kdv };
}
const ayIcinde = (t, ay) => ayAnahtari(t) === ay;
const sonrakiAyBasi = (ay) => {
  const [y, a] = ay.split('-').map(Number);
  return a === 12 ? `${y + 1}-01-01` : `${y}-${String(a + 1).padStart(2, '0')}-01`;
};
function ayMasraflari(ay) {
  const bas = `${ay}-01`;
  const son = sonrakiAyBasi(ay);
  const girilen = masraflar.value.filter((x) => ayIcinde(x.tarih, ay));
  const sabit = sabitMasraflar.value
    .filter((x) => String(x.baslangic) < son && (!x.bitis || String(x.bitis) >= bas))
    .map((x) => ({ ...x, kategori: x.kategori }));
  return [...girilen, ...sabit];
}
function grupla(liste, anahtar, deger) {
  const h = new Map();
  liste.forEach((x) => {
    const k = anahtar(x);
    const r = h.get(k) || { ad: k, adet: 0, kar: 0, tutar: 0 };
    r.adet += 1;
    r.kar += deger(x);
    r.tutar += deger(x);
    h.set(k, r);
  });
  return [...h.values()];
}
function ayHesabi(ay) {
  const satilan = satislar.value.filter((m) => ayIcinde(m.satis_tarihi, ay));
  const hesaplar = satilan.map((m) => ({ m, h: satisHesabi(m) })).filter((x) => x.h);
  const topla = (f) => hesaplar.reduce((t, x) => t + (f(x.h) || 0), 0);
  const ms = ayMasraflari(ay);
  const masraf = ms.reduce((t, x) => t + (Number(x.tutar) || 0), 0);
  const aksesuar = aksesuarSatis.value.filter((x) => ayIcinde(x.tarih, ay))
    .reduce((t, x) => t + (x.birim_maliyet == null ? 0 : (Number(x.birim_fiyat) - Number(x.birim_maliyet)) * Number(x.adet)), 0);
  const parca = parcalar.value.filter((x) => x.durum === 'Satıldı' && ayIcinde(x.satis_tarihi, ay))
    .reduce((t, x) => t + (x.satis_tutari == null || x.birim_alis == null ? 0 : Number(x.satis_tutari) - Number(x.birim_alis)), 0);
  const satisKari = topla((h) => h.net);
  const garanti = satilan.length * hakedis.value;
  const netKar = (m) => satisHesabi(m)?.net || 0;
  return {
    adet: satilan.length,
    ciro: topla((h) => h.satis),
    otv: topla((h) => h.otv),
    kdv: topla((h) => h.kdv),
    kdvDahilKar: topla((h) => h.kdvDahil),
    satisKari,
    alisiEksik: hesaplar.filter((x) => x.h.net == null).length,
    aksesuar,
    parca,
    garanti,
    masraf,
    net: satisKari + aksesuar + parca + garanti - masraf,
    modeller: grupla(satilan, (m) => m.model, netKar).sort((a, b) => b.kar - a.kar),
    personel: grupla(satilan, (m) => m.satan_adi || 'Belirtilmemiş', netKar).sort((a, b) => b.kar - a.kar),
    masrafKalemleri: grupla(ms, (x) => x.kategori || 'Diğer', (x) => Number(x.tutar) || 0).sort((a, b) => b.tutar - a.tutar),
  };
}
const karAylari = computed(() => {
  const liste = [];
  const d = new Date(bugun.getFullYear(), bugun.getMonth(), 1);
  // Uygulama kayıtları Ekim 2026'da başladı; öncesi boş görünmesin.
  for (let i = 0; i < 24 && d >= new Date(2026, 9, 1); i += 1) {
    liste.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    d.setMonth(d.getMonth() - 1);
  }
  return liste;
});
const kz = computed(() => ayHesabi(karAy.value || buAy));
const altiAy = computed(() => karAylari.value.slice(0, 6).map((ay) => ({ ay, ...ayHesabi(ay) })));

// Açık sipariş: kapanmamış, reddedilmemiş (bölge onayı dahil) ve onaylı adedi gelmemiş kalemler.
// 6 aydan eski "Açık" kalemler Volta sisteminde kapatılmamış eski kayıtlardır; ayrıca gösterilir.
const altiAyOnce = new Date(bugun - 180 * 86400000).toISOString().slice(0, 10);
function siparisAcik(s) {
  const d = String(s.durum || '');
  if (d.startsWith('Tamamlandı') || d.includes('Reddedildi')) return false;
  if (s.onay_durumu === 'Reddedildi' || s.bolge_onayi === 'Reddedildi') return false;
  return kalanAdet(s) > 0;
}
const kalanAdet = (s) => Math.max(0, (s.onayli_miktar ?? s.miktar ?? 0) - (s.gelen_adet ?? 0));
const siparisEski = (s) => String(s.siparis_zamani).slice(0, 10) < altiAyOnce;
const siparisFiltreli = computed(() => (yalnizAcik.value ? siparisler.value.filter(siparisAcik) : siparisler.value));

async function rolBelirle() {
  const { data: oturum } = await sb.auth.getSession();
  const kullanici = oturum?.session?.user;
  if (!kullanici) { durum.value = 'giris'; return false; }
  const { data, error } = await sb.from('personel').select('ad, rol').eq('user_id', kullanici.id).maybeSingle();
  if (error || !data) {
    hata.value = 'Bu hesabın panele erişimi yok.';
    durum.value = 'yetkisiz';
    return false;
  }
  if (data.rol === 'personel') {
    hata.value = 'Web paneli şimdilik yalnız yönetici ve izleyici hesapları içindir. Lütfen iPhone uygulamasını kullanın.';
    durum.value = 'yetkisiz';
    return false;
  }
  izleyici.value = data.rol === 'izleyici';
  kullaniciAdi.value = data.ad || kullanici.email;
  return true;
}

async function yukle() {
  bekliyor.value = true;
  hata.value = '';
  const t = (ad) => tabloAdi(ad, izleyici.value);
  const [m, f, s, r, ...ek] = await Promise.all([
    sb.from(t('motorlar')).select('id, model, renk, sasi_no, durum, giris_tarihi, alis_fiyati, satis_fiyati, satis_tarihi, satan_adi, musteri_adi, rezerve_adi, rezerve_bitis, engel_notu, odeme_nakit, odeme_havale, odeme_kart, kart_taksit, satis_otv_orani, satis_damga').limit(5000),
    sb.from(t('model_fiyatlari')).select('model, tavsiye, guncel, min_stok'),
    sb.from(t('volta_siparisleri')).select('siparis_no, kalem, siparis_zamani, urun, model, miktar, onayli_miktar, gelen_adet, birim_fiyat, onay_durumu, bolge_onayi, durum').order('siparis_zamani', { ascending: false }).limit(500),
    sb.from(t('asistan_raporlari')).select('tarih, metin').order('tarih', { ascending: false }).limit(30),
    sb.from(t('masraflar')).select('tarih, kategori, tutar').limit(5000),
    sb.from(t('sabit_masraflar')).select('kategori, tutar, baslangic, bitis'),
    sb.from(t('aksesuar_hareketleri')).select('tarih, adet, birim_fiyat, birim_maliyet').eq('tur', 'satis').limit(5000),
    sb.from(t('parcalar')).select('durum, satis_tarihi, satis_tutari, birim_alis').limit(5000),
    sb.from(t('genel_ayarlar')).select('anahtar, deger').eq('anahtar', 'garanti_hakedisi'),
  ]);
  const [ma, sm, ak, pa, ga] = ek;
  const ilkHata = [m, f, s, r, ma, sm, ak, pa, ga].find((x) => x.error)?.error;
  masraflar.value = ma.data || [];
  sabitMasraflar.value = sm.data || [];
  aksesuarSatis.value = ak.data || [];
  parcalar.value = pa.data || [];
  if (ga.data?.[0]?.deger != null) hakedis.value = Number(ga.data[0].deger);
  if (ilkHata) hata.value = `Veri alınamadı: ${ilkHata.message}`;
  motorlar.value = m.data || [];
  fiyatlar.value = f.data || [];
  siparisler.value = s.data || [];
  raporlar.value = r.data || [];
  if (!satisAy.value || !satisAylari.value.includes(satisAy.value)) satisAy.value = satisAylari.value[0] || buAy;
  if (!karAy.value) karAy.value = buAy;
  sonYukleme.value = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  bekliyor.value = false;
}

async function ac() {
  durum.value = 'yukleniyor';
  if (await rolBelirle()) {
    await yukle();
    durum.value = 'panel';
  }
}

async function girisYap() {
  hata.value = '';
  bekliyor.value = true;
  const { error } = await sb.auth.signInWithPassword({ email: eposta.value.trim(), password: sifre.value });
  bekliyor.value = false;
  sifre.value = '';
  if (error) {
    hata.value = 'Giriş başarısız. E-posta veya şifre hatalı.';
    return;
  }
  await ac();
}

async function cikis() {
  await sb.auth.signOut();
  motorlar.value = []; fiyatlar.value = []; siparisler.value = []; raporlar.value = [];
  masraflar.value = []; sabitMasraflar.value = []; aksesuarSatis.value = []; parcalar.value = [];
  hata.value = '';
  durum.value = 'giris';
}

onMounted(ac);
</script>

<style scoped>
.panel { min-height: 100vh; background: var(--bg); color: var(--ink); font-family: var(--font-sans); }
.soluk { color: var(--muted); }
.kucuk { font-size: 13px; }
.mono { font-family: var(--font-mono); font-size: 12px; }
.sag { text-align: right; }
.hata { color: #c0392b; }
.ortala { display: grid; place-items: center; gap: 12px; min-height: 60vh; text-align: center; padding: 16px; }

.giris { display: grid; place-items: center; min-height: 100vh; padding: 16px; }
.giris-kart { width: 100%; max-width: 380px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); padding: 32px 24px; box-shadow: var(--shadow); text-align: center; }
.giris-logo { height: 40px; margin-bottom: 12px; }
.giris-kart h1 { font-size: 22px; margin: 0 0 6px; }
.giris-kart form { display: grid; gap: 10px; margin: 20px 0 12px; }
input, select { font: inherit; padding: 10px 12px; border: 1px solid var(--line-2); border-radius: var(--radius-sm); background: var(--surface); color: var(--ink); }
input[type='checkbox'] { padding: 0; }

.btn { font: inherit; cursor: pointer; padding: 8px 14px; border-radius: var(--radius-sm); border: 1px solid var(--line-2); background: var(--surface); color: var(--ink); }
.btn-primary { background: var(--primary); border-color: var(--primary); color: #0a0a0a; font-weight: 600; padding: 11px; }
.btn-kucuk { padding: 6px 10px; font-size: 13px; }
.btn:disabled { opacity: 0.6; cursor: default; }

.ust { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; padding: 14px 20px; background: var(--surface); border-bottom: 1px solid var(--line); position: sticky; top: 0; z-index: 5; }
.ust-sol, .ust-sag { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.rozet { font-size: 12px; padding: 3px 8px; border-radius: 999px; background: var(--primary-bg); color: var(--primary-dark); }
.rozet.izleyici { background: #e8f0fb; color: #1d4f91; }

.sekmeler { display: flex; gap: 4px; padding: 10px 20px 0; overflow-x: auto; border-bottom: 1px solid var(--line); background: var(--surface); }
.sekmeler button { font: inherit; border: 0; background: none; padding: 10px 14px; cursor: pointer; color: var(--muted); border-bottom: 2px solid transparent; white-space: nowrap; }
.sekmeler button.aktif { color: var(--ink); border-bottom-color: var(--primary); font-weight: 600; }

.icerik { padding: 20px; max-width: 1200px; margin: 0 auto; }
.icerik h2 { font-size: 17px; margin: 28px 0 10px; }
.kartlar { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; }
.kart { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 14px 16px; display: grid; gap: 2px; }
.kart b { font-size: 24px; font-variant-numeric: tabular-nums; }
.kart small { color: var(--muted); }

.filtre { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
.filtre input { flex: 1 1 220px; }
.tablo-kap { overflow-x: auto; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); }
table { width: 100%; border-collapse: collapse; font-size: 14px; font-variant-numeric: tabular-nums; }
th, td { padding: 9px 12px; border-bottom: 1px solid var(--line); text-align: left; white-space: nowrap; }
th { font-size: 12px; color: var(--muted); font-weight: 600; background: var(--surface-2); position: sticky; top: 0; }
tr.uyari td { background: rgba(230, 126, 34, 0.08); }
.etiket { font-size: 12px; padding: 2px 8px; border-radius: 999px; background: var(--primary-bg); color: var(--primary-dark); }
.etiket.gri { background: var(--surface-2); color: var(--muted); }

.rapor { white-space: pre-wrap; font-family: var(--font-sans); font-size: 14px; line-height: 1.55; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; margin: 0; }
.rapor-kutu { margin-bottom: 10px; }
.rapor-kutu summary { cursor: pointer; padding: 8px 0; font-weight: 600; }
.kart.vurgu { border-color: var(--primary); }
.kart.vurgu.eksi { border-color: #c0392b; }
.kirmizi { color: #c0392b; }
.uyari-not { background: rgba(230, 126, 34, 0.1); border-radius: var(--radius-sm); padding: 10px 12px; font-size: 14px; }
.dokum tr.toplam td { font-weight: 700; border-top: 2px solid var(--line-2); }
.dokum td { white-space: normal; }
.iki-sutun { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 0 20px; }
.alt { padding: 24px 20px 40px; text-align: center; }

@media (max-width: 600px) {
  .ust, .sekmeler, .icerik { padding-left: 16px; padding-right: 16px; }
}
</style>
