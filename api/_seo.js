// SEO ortak yardımcıları: Supabase'ten modelleri okur, sayfa başlığı/açıklaması ve
// arama motorlarının JavaScript çalıştırmadan görebileceği HTML içeriği üretir.
// api/sayfa.js (sayfalar) ve api/sitemap.js (site haritası) kullanır.

export const SITE = 'https://www.voltamotorbuyukcekmece.com';
export const MARKA = 'Volta Motor Büyükçekmece';

const CAT_FALLBACK = {
  bike: 'Elektrikli Motosiklet',
  'benzinli-motosiklet': 'Benzinli Motosiklet',
  'elektrikli-bisiklet': 'Elektrikli Bisiklet',
  'elektrikli-arac': 'Elektrikli Araçlar',
  atv: 'Arazi Araçları',
  scooter: 'Elektrikli Çocuk Ürünleri',
};

// src/lib/motorUrl.js ile aynı kural (sunucu tarafı kopyası)
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

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

export function duzMetin(html) {
  return String(html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

export function tl(n) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Number(n) || 0);
}

function supaEnv() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  return { url, key };
}

async function supaGet(path) {
  const { url, key } = supaEnv();
  if (!url || !key) return [];
  const r = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!r.ok) return [];
  return r.json();
}

// Görünür modeller + kategori adları (hata olursa boş liste; sayfa yine açılır)
export async function veriGetir() {
  const [motors, cats] = await Promise.all([
    supaGet('motors?select=id,slug,name,category,price,compare_price,specs,in_stock,visible,description,images,sort_order,updated_at&order=sort_order.asc')
      .catch(() => []),
    supaGet('categories?select=slug,label,sort_order&order=sort_order.asc').catch(() => []),
  ]);
  const etiket = { ...CAT_FALLBACK };
  for (const c of Array.isArray(cats) ? cats : []) if (c.slug && c.label) etiket[c.slug] = c.label;
  const liste = (Array.isArray(motors) ? motors : [])
    .filter((m) => m.visible !== false)
    .map((m) => ({
      ...m,
      url: motorUrl(m.name, m.slug),
      kategori: etiket[m.category] || m.category || '',
      specs: Array.isArray(m.specs) ? m.specs.filter((s) => s && s.label && s.value) : [],
      images: Array.isArray(m.images) ? m.images : [],
    }));
  return { motors: liste, etiket };
}

export function ozellikMetni(m, adet = 4) {
  return m.specs.slice(0, adet).map((s) => `${s.label} ${s.value}${s.unit ? ' ' + s.unit : ''}`).join(', ');
}
