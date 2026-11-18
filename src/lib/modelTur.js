// Model türü ve teknik değer okuma: "Hangi model bana uygun?" testi ve
// ürün sayfasındaki karşılaştırma tablosu bu yardımcıları kullanır (18.11.2026).
// Değerler yalnız veritabanındaki teknik özelliklerden (specs) okunur; tahmin yapılmaz.

// specs içinde etiketi verilen kelimelerden birini içeren ilk satır
export function spec(m, ...anahtarlar) {
  const arr = Array.isArray(m?.specs) ? m.specs : [];
  return arr.find((x) => anahtarlar.some((a) => String(x.label || '').toLocaleLowerCase('tr').includes(a))) || null;
}

// "58 km", "30-55 KM", "45 km/sa" → ilk/son sayı. enBuyuk: aralıkta üst değeri al.
export function sayi(s, enBuyuk = false) {
  if (!s) return null;
  const sayilar = String(s.value).replace(',', '.').match(/\d+(\.\d+)?/g);
  if (!sayilar) return null;
  const n = Number(enBuyuk ? sayilar[sayilar.length - 1] : sayilar[0]);
  return Number.isFinite(n) ? n : null;
}

export const azamiHiz = (m) => sayi(spec(m, 'azami hız', 'maks. hız', 'azami hiz'));
export const menzil = (m) => sayi(spec(m, 'menzil'), true);
export const tasima = (m) => sayi(spec(m, 'taşıma'));

// Model türü: ürün adı ve kategoriden.
//  cocuk · bisiklet · iki-teker-elektrikli · uc-teker · yuk · kabinli · benzinli · golf
export function modelTuru(m) {
  const ad = String(m?.name || '').toLocaleLowerCase('tr');
  const kat = String(m?.category || '');
  if (kat === 'scooter' || ad.includes('çocuk')) return 'cocuk';
  if (kat === 'elektrikli-bisiklet') return 'bisiklet';
  if (ad.includes('golf')) return 'golf';
  if (ad.includes('kamyonet')) return 'yuk';
  if (kat === 'elektrikli-arac') return 'kabinli';
  if (kat === 'atv' && !ad.includes('motosiklet')) return 'atv';
  if (kat === 'benzinli-motosiklet' || kat === 'atv') return 'benzinli';
  if (ad.includes('üç tekerlekli')) {
    // Taşıma kapasitesi 200 kg ve üstü olan üç tekerliler yük işine uygun (APT4, VT5, VT5 PRO, VT7 PRO)
    return (tasima(m) || 0) >= 200 ? 'yuk' : 'uc-teker';
  }
  return 'iki-teker-elektrikli';
}

export const TUR_ADI = {
  cocuk: 'Çocuk modeli',
  bisiklet: 'Elektrikli bisiklet',
  'iki-teker-elektrikli': 'Elektrikli motosiklet',
  'uc-teker': 'Üç tekerli elektrikli',
  yuk: 'Yük ve iş aracı',
  kabinli: 'Kapalı kabinli araç',
  benzinli: 'Benzinli motosiklet',
  golf: 'Golf arabası',
  atv: 'ATV',
};
