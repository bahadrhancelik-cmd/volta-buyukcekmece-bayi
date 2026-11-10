// Dinamik site haritası: sabit sayfalar + Supabase'teki görünür tüm modeller.
// Yeni model eklenince/gizlenince elle güncellemeye gerek kalmaz. /sitemap.xml buraya yönlendirilir.
import { SITE, esc, veriGetir } from './_seo.js';

export default async function handler(req, res) {
  const { motors } = await veriGetir().catch(() => ({ motors: [] }));
  const sabit = [['/', '1.0', 'weekly'], ['/katalog', '0.9', 'daily'], ['/iletisim', '0.8', 'monthly'],
    ['/hakkimizda', '0.6', 'monthly'], ['/sss', '0.6', 'monthly'], ['/kvkk', '0.2', 'yearly']];
  const satir = (loc, pr, cf, lm) =>
    `<url><loc>${esc(SITE + loc)}</loc>${lm ? `<lastmod>${lm.slice(0, 10)}</lastmod>` : ''}<changefreq>${cf}</changefreq><priority>${pr}</priority></url>`;
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    + sabit.map((s) => satir(...s)).join('')
    + motors.map((m) => satir(`/motor/${m.url}`, m.in_stock ? '0.8' : '0.5', 'weekly', m.updated_at)).join('')
    + '</urlset>';
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.end(xml);
}
