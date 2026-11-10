// Sayfa ön-yüzü (SEO): /katalog, /motor/:slug, /hakkimizda, /iletisim, /sss, /kvkk
// isteklerinde derlenmiş index.html'i alır; başlık, açıklama, canonical, og etiketleri,
// JSON-LD ve arama motorlarının okuyacağı düz HTML içeriği sayfaya yerleştirir.
// Vue uygulaması açılınca #app içeriğini kendi arayüzüyle değiştirir; ziyaretçi farkı görmez.
// vercel.json'daki rewrite'lar bu fonksiyona yönlendirir.
import { SITE, MARKA, esc, duzMetin, tl, veriGetir, ozellikMetni } from './_seo.js';

let sablon = null, sablonZamani = 0;
async function sablonGetir(host) {
  if (sablon && Date.now() - sablonZamani < 5 * 60 * 1000) return sablon;
  const r = await fetch(`https://${host}/index.html`);
  if (!r.ok) throw new Error('index.html alınamadı');
  sablon = await r.text(); sablonZamani = Date.now();
  return sablon;
}

const voltaAdi = (ad) => (/^volta\b/i.test(ad) ? ad : `Volta ${ad}`);
const kirp = (s, n) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s);

function breadcrumb(items) {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it[0], item: SITE + it[1] })),
  };
}

const SABIT = {
  hakkimizda: {
    baslik: `Hakkımızda | Volta Büyükçekmece Fabrika Satış Mağazası`,
    aciklama: 'Volta Motor Büyükçekmece Fabrika Satış Mağazası: Beykent\'te Volta elektrikli motosiklet, bisiklet, ATV ve benzinli motosiklet satışı. 1000+ mutlu müşteri.',
    h1: 'Hakkımızda',
    govde: '<p>Volta Motor Büyükçekmece Fabrika Satış Mağazası, Beykent Pınartepe Mahallesi Avrupa Caddesi No:83T adresinde Volta Motor ürünlerinin satışını yapar. Beylikdüzü, Esenyurt, Büyükçekmece, Avcılar ve Silivri\'den müşterilerimize hizmet veriyoruz.</p>',
  },
  iletisim: {
    baslik: `İletişim ve Yol Tarifi | Volta Motor Büyükçekmece Beykent`,
    aciklama: 'Volta Motor Büyükçekmece Fabrika Satış Mağazası adres, telefon ve yol tarifi: Pınartepe Mah. Avrupa Cd. No:83T Beykent, Büyükçekmece/İstanbul. Tel 0533 304 93 11.',
    h1: 'İletişim',
    govde: '<p>Adres: Pınartepe Mah. Avrupa Cd. No:83T, Beykent, Büyükçekmece / İstanbul</p><p>Telefon ve WhatsApp: <a href="tel:+905333049311">0533 304 93 11</a></p>',
  },
  sss: {
    baslik: `Sıkça Sorulan Sorular | ${MARKA}`,
    aciklama: 'Volta elektrikli motosiklet ve bisiklet hakkında sık sorulanlar: ehliyet, plaka, taksit, garanti ve teslimat. Volta Motor Büyükçekmece Fabrika Satış Mağazası.',
    h1: 'Sıkça sorulan sorular',
    govde: '',
  },
  kvkk: {
    baslik: `KVKK Aydınlatma Metni | ${MARKA}`,
    aciklama: 'CDH Motorlu Araçlar (Volta Motor Büyükçekmece) kişisel verilerin işlenmesine ilişkin aydınlatma metni.',
    h1: 'KVKK Aydınlatma Metni',
    govde: '',
  },
};

async function sssGetir() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const r = await fetch(`${url}/rest/v1/faqs?select=question,answer&visible=eq.true&order=sort_order.asc`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    return r.ok ? r.json() : [];
  } catch { return []; }
}

async function sayfaHazirla(p, slug) {
  if (p === 'katalog') {
    const { motors } = await veriGetir();
    const gruplar = {};
    for (const m of motors) (gruplar[m.kategori] ||= []).push(m);
    let govde = '<p>Volta Motor modellerinin güncel fiyatları (vergiler dahil) ve stok durumu. Kredi kartına vade farksız 6 taksit.</p>';
    for (const [kat, list] of Object.entries(gruplar)) {
      govde += `<h2>${esc(kat)}</h2><ul>` + list.map((m) =>
        `<li><a href="/motor/${esc(m.url)}">${esc(voltaAdi(m.name))}</a> — ${tl(m.price)} TL${m.in_stock ? '' : ' (stokta yok)'}</li>`).join('') + '</ul>';
    }
    return {
      baslik: 'Volta Motor Modelleri ve Fiyatları | Volta Büyükçekmece',
      aciklama: `Volta elektrikli motosiklet, elektrikli bisiklet, benzinli motosiklet ve ATV fiyatları. ${motors.length} model, güncel stok, 6 taksit. Büyükçekmece Beykent Fabrika Satış Mağazası.`,
      yol: '/katalog', h1: 'Volta Motor modelleri ve fiyatları', govde,
      ld: [
        breadcrumb([['Ana sayfa', '/'], ['Modeller', '/katalog']]),
        { '@context': 'https://schema.org', '@type': 'ItemList',
          itemListElement: motors.map((m, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/motor/${m.url}`, name: voltaAdi(m.name) })) },
      ],
    };
  }

  if (p === 'motor') {
    const { motors } = await veriGetir();
    const m = motors.find((x) => x.url === slug) || motors.find((x) => x.slug === slug);
    if (!m) return null;
    const ad = voltaAdi(m.name);
    const ozl = ozellikMetni(m);
    const metin = duzMetin(m.description);
    const aciklama = kirp(`${ad} fiyatı ${tl(m.price)} TL (vergiler dahil)${ozl ? '. ' + ozl : ''}. 6 taksit, Volta garantisi. Büyükçekmece Beykent mağazamızda inceleyin.`, 300);
    const yol = `/motor/${m.url}`;
    const benzer = motors.filter((x) => x.category === m.category && x.id !== m.id).slice(0, 6);
    let govde = `<p>${esc(m.kategori)}</p><p><strong>${tl(m.price)} TL</strong> (vergiler dahil) · ${m.in_stock ? 'Stokta' : 'Şu an stokta yok'} · Kredi kartına vade farksız 6 taksit</p>`;
    if (m.images[0]) govde += `<img src="${esc(m.images[0])}" alt="${esc(ad)} — ${esc(m.kategori)}" width="800" height="600">`;
    if (m.specs.length) govde += '<h2>Teknik özellikler</h2><ul>' + m.specs.map((s) => `<li>${esc(s.label)}: ${esc(s.value)}${s.unit ? ' ' + esc(s.unit) : ''}</li>`).join('') + '</ul>';
    if (metin) govde += `<h2>${esc(ad)} hakkında</h2><p>${esc(metin)}</p>`;
    govde += `<p>${esc(ad)} modelini Volta Motor Büyükçekmece Fabrika Satış Mağazası'nda (Avrupa Cd. No:83T Beykent) detaylı inceleyebilirsiniz. Telefon / WhatsApp: 0533 304 93 11.</p>`;
    if (benzer.length) govde += '<h2>Benzer modeller</h2><ul>' + benzer.map((x) => `<li><a href="/motor/${esc(x.url)}">${esc(voltaAdi(x.name))}</a></li>`).join('') + '</ul>';
    const urun = {
      '@context': 'https://schema.org', '@type': 'Product',
      name: ad, description: metin || aciklama, category: m.kategori,
      image: m.images.length ? m.images : undefined,
      brand: { '@type': 'Brand', name: 'Volta Motor' },
      additionalProperty: m.specs.length ? m.specs.map((s) => ({ '@type': 'PropertyValue', name: s.label, value: s.unit ? `${s.value} ${s.unit}` : s.value })) : undefined,
      offers: {
        '@type': 'Offer', price: Number(m.price), priceCurrency: 'TRY', url: SITE + yol,
        availability: m.in_stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
        seller: { '@type': 'Organization', name: 'Volta Motor Büyükçekmece Fabrika Satış Mağazası' },
      },
    };
    return {
      baslik: `${ad} Fiyatı ve Özellikleri | Volta Büyükçekmece`,
      aciklama, yol, h1: ad, govde, resim: m.images[0],
      urunLd: urun,
      ld: [breadcrumb([['Ana sayfa', '/'], ['Modeller', '/katalog'], [ad, yol]])],
    };
  }

  const s = SABIT[p];
  if (!s) return null;
  let govde = s.govde;
  let ld = [breadcrumb([['Ana sayfa', '/'], [s.h1, '/' + p]])];
  if (p === 'sss') {
    const sorular = await sssGetir();
    govde = sorular.map((q) => `<h2>${esc(q.question)}</h2><p>${esc(duzMetin(q.answer))}</p>`).join('');
    if (sorular.length) ld.push({ '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: sorular.map((q) => ({ '@type': 'Question', name: q.question, acceptedAnswer: { '@type': 'Answer', text: duzMetin(q.answer) } })) });
  }
  return { ...s, yol: '/' + p, govde, ld };
}

function etiketDegistir(html, sayfa) {
  const url = SITE + sayfa.yol;
  const t = esc(sayfa.baslik), d = esc(sayfa.aciklama);
  html = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${t}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${d}$2`)
    .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${t}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${d}$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${t}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${d}$2`);
  if (sayfa.resim) {
    html = html
      .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${esc(sayfa.resim)}$2`)
      .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${esc(sayfa.resim)}$2`);
  }
  const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
  let ek = (sayfa.ld || []).map((o) => `<script type="application/ld+json">${json(o)}</script>`).join('');
  if (sayfa.urunLd) ek += `<script type="application/ld+json" data-detail-jsonld>${json(sayfa.urunLd)}</script>`;
  html = html.replace('</head>', `${ek}</head>`);
  const icerik = `<main class="ssr-icerik"><nav><a href="/">Ana sayfa</a> · <a href="/katalog">Modeller</a> · <a href="/iletisim">İletişim</a></nav><h1>${esc(sayfa.h1)}</h1>${sayfa.govde}</main>`;
  return html.replace(/<!--ssr-->[\s\S]*?<!--\/ssr-->/, `<!--ssr-->${icerik}<!--/ssr-->`);
}

export default async function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'www.voltamotorbuyukcekmece.com';
  const p = String(req.query.p || '');
  const slug = String(req.query.slug || '');
  let html;
  try {
    html = await sablonGetir(host);
  } catch {
    res.statusCode = 302; res.setHeader('Location', '/'); return res.end();
  }
  let sayfa = null;
  try { sayfa = await sayfaHazirla(p, slug); } catch { sayfa = null; }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (!sayfa) {
    // Bulunamayan model: SPA yine açılır (kendi "bulunamadı" ekranı) ama arama motoru indekslemez
    if (p === 'motor') {
      res.statusCode = 404;
      html = html.replace(/(<meta name="robots" content=")[^"]*(")/, '$1noindex$2');
    }
    res.setHeader('Cache-Control', 'public, s-maxage=300');
    return res.end(html);
  }
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
  return res.end(etiketDegistir(html, sayfa));
}
