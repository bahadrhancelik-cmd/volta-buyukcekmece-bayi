// Thin wrapper around the Testerify widget loaded in index.html.
// The script is deferred and can be blocked by the browser, so every
// call is guarded. Admin pages (/admin, /admin-login) are never tracked.
export function trackEvent(name) {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/admin')) return;
  try {
    window.testerify?.customEvent?.(name);
  } catch {
    // Analytics must never break the UI.
  }
}
