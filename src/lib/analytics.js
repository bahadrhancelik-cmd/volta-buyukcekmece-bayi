// Site içi tıklama olayları Google etiketine (gtag) gönderilir.
// Bazı olaylar ayrıca Google Ads dönüşümü olarak sayılır (14.11.2026).
// Çerez onayı yoksa gtag consent mode gereği çerez yazmaz; Google yalnız modellenmiş sayım yapar.
const ADS = 'AW-18356226072';
const DONUSUM = {
  whatsapp: `${ADS}/8YnsCPjDldscEJiQ97BE`, // Siteden WhatsApp Tıklaması
  telefon: `${ADS}/6B36CPLDldscEJiQ97BE`, // Siteden Telefon Tıklaması
  form: `${ADS}/xFDyCPXDldscEJiQ97BE`, // Site İletişim Formu Gönderimi
};
// Çerezsiz sayaç (20.11.2026): bu olaylar ayrıca Supabase'deki site_tiklamalar tablosuna yazılır.
// Kişisel veri yok; yalnız olay türü, sayfa yolu, geliş kaynağı ve cihaz türü. Çerez/depolama kullanılmaz.
const SAYAC_OLAY = {
  clickWhatsappFloat: ['whatsapp', 'yuzen_buton'],
  clickDetailWhatsappCta: ['whatsapp', 'urun_sayfasi'],
  clickQuizWhatsapp: ['whatsapp', 'model_testi'],
  clickHeaderPhone: ['telefon', 'ust_menu'],
  clickContactPhoneLink: ['telefon', 'iletisim'],
  clickDetailCallDealerCta: ['telefon', 'urun_sayfasi'],
  submitContactFormSuccess: ['form', 'iletisim_formu'],
  submitNotifyWhenInStock: ['form', 'gelince_haber_ver'],
  clickContactDirections: ['yol_tarifi', 'iletisim'],
};

// Ziyaretin geldiği kaynak, sayfa ilk açıldığında bir kez belirlenir (SPA içinde bellekte kalır, hiçbir yere yazılmaz).
function gelisKaynagi() {
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get('gclid') || q.get('gbraid') || q.get('wbraid') || /google|cpc/i.test(q.get('utm_medium') || '') && /google/i.test(q.get('utm_source') || '')) return 'google_reklam';
    if (q.get('fbclid')) return 'meta';
    if (q.get('utm_source')) return q.get('utm_source').toLowerCase().slice(0, 40);
    const r = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : '';
    if (!r || r.includes('voltamotorbuyukcekmece')) return 'direkt';
    if (/google\./.test(r)) return 'google';
    if (/instagram/.test(r)) return 'instagram';
    if (/facebook|fb\./.test(r)) return 'facebook';
    if (/sahibinden/.test(r)) return 'sahibinden';
    if (/bing|yandex|duckduckgo/.test(r)) return 'diger_arama';
    if (/chatgpt|openai|perplexity|claude|gemini|copilot/.test(r)) return 'yapay_zeka';
    return r.slice(0, 40);
  } catch {
    return 'bilinmiyor';
  }
}
const KAYNAK = typeof window === 'undefined' ? '' : gelisKaynagi();

function sayacaYaz(name) {
  const o = SAYAC_OLAY[name];
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!o || !url || !key) return;
  const govde = {
    olay: o[0],
    ayrinti: o[1],
    sayfa: window.location.pathname.slice(0, 200),
    kaynak: KAYNAK,
    cihaz: window.matchMedia && window.matchMedia('(max-width: 820px)').matches ? 'mobil' : 'masaustu',
  };
  try {
    // keepalive: WhatsApp/telefon bağlantısı sayfadan çıkarken de istek tamamlanır.
    fetch(`${url}/rest/v1/site_tiklamalar`, {
      method: 'POST',
      keepalive: true,
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify(govde),
    }).catch(() => {});
  } catch {
    // Sayaç arayüzü asla bozmamalı.
  }
}

const OLAY_DONUSUM = {
  clickWhatsappFloat: 'whatsapp',
  clickDetailWhatsappCta: 'whatsapp',
  clickQuizWhatsapp: 'whatsapp',
  clickHeaderPhone: 'telefon',
  clickContactPhoneLink: 'telefon',
  clickDetailCallDealerCta: 'telefon',
  submitContactFormSuccess: 'form',
  submitNotifyWhenInStock: 'form',
};

export function trackEvent(name) {
  if (typeof window === 'undefined') return;
  if (/^\/(admin|panel)/.test(window.location.pathname)) return;
  sayacaYaz(name);
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name);
      const tur = OLAY_DONUSUM[name];
      if (tur) window.gtag('event', 'conversion', { send_to: DONUSUM[tur], value: 1.0, currency: 'TRY' });
    } else if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: name });
  } catch {
    // Analytics must never break the UI.
  }
}

// Katalog araması (16.11.2026): GA4'ün önerilen "search" olayı, aranan kelimeyle.
export function trackSearch(terim) {
  if (typeof window === 'undefined' || !terim) return;
  try { if (typeof window.gtag === 'function') window.gtag('event', 'search', { search_term: terim }); } catch { /* yok say */ }
}
