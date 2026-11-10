// Site içi tıklama olayları Google etiketine (gtag) gönderilir.
// Etiket engellenmiş olabilir; her çağrı korumalı. Admin sayfaları izlenmez.
export function trackEvent(name) {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/admin')) return;
  try {
    if (typeof window.gtag === 'function') window.gtag('event', name);
    else if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: name });
  } catch {
    // Analytics must never break the UI.
  }
}
