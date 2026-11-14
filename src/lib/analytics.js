// Site içi tıklama olayları Google etiketine (gtag) gönderilir.
// Bazı olaylar ayrıca Google Ads dönüşümü olarak sayılır (14.11.2026).
// Çerez onayı yoksa gtag consent mode gereği çerez yazmaz; Google yalnız modellenmiş sayım yapar.
const ADS = 'AW-18356226072';
const DONUSUM = {
  whatsapp: `${ADS}/8YnsCPjDldscEJiQ97BE`, // Siteden WhatsApp Tıklaması
  telefon: `${ADS}/6B36CPLDldscEJiQ97BE`, // Siteden Telefon Tıklaması
  form: `${ADS}/xFDyCPXDldscEJiQ97BE`, // Site İletişim Formu Gönderimi
};
const OLAY_DONUSUM = {
  clickWhatsappFloat: 'whatsapp',
  clickDetailWhatsappCta: 'whatsapp',
  clickHeaderPhone: 'telefon',
  clickContactPhoneLink: 'telefon',
  clickDetailCallDealerCta: 'telefon',
  submitContactFormSuccess: 'form',
  submitNotifyWhenInStock: 'form',
};

export function trackEvent(name) {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/admin')) return;
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
