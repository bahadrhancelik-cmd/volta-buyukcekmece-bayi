// Ürün sayfası adresi: veritabanındaki eski şablon kısaltmaları (lit, cyclone, e-bike-city…)
// yerine ürün adından okunur bir adres üretir: "VSM Elektrikli Motosiklet" → volta-vsm-elektrikli-motosiklet
// Eski adresler vercel.json'daki kalıcı yönlendirmelerle yenilerine gider.
export function motorUrl(name, fallback = '') {
  const s = String(name || '')
    .replace(/İ/g, 'i').replace(/I/g, 'ı')
    .toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (!s) return fallback;
  return s.startsWith('volta-') ? s : `volta-${s}`;
}
