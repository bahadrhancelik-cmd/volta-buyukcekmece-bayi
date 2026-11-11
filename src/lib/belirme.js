// Kaydırınca hafif belirme: bölümler ve kartlar ekrana girerken aşağıdan yumuşakça gelir.
// Hafif tutuldu (tek IntersectionObserver, yalnız opacity/transform); hareket azaltmayı
// seçen kullanıcıda ve eski tarayıcıda hiç çalışmaz, içerik hep görünür kalır.
const SECICI = [
  '.cat-card', '.vitrin-kart', '.moto-card', '.why-card',
  '.store-grid img', '.delivery-grid', '.review-card', '.reviews-more',
  '.local-section', '.cta-section', '.value-card', '.faq-item', '.contact-card',
].join(',');

export function belirmeBaslat() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('belirme-acik');

  const io = new IntersectionObserver((girisler) => {
    for (const g of girisler) {
      if (!g.isIntersecting) continue;
      g.target.classList.add('belirdi');
      io.unobserve(g.target);
    }
  }, { rootMargin: '0px 0px -30px 0px', threshold: 0 });

  const tara = () => {
    const ekranAlti = window.innerHeight;
    document.querySelectorAll(SECICI).forEach((el) => {
      if (el.dataset.belirme) return;
      el.dataset.belirme = '1';
      // Sayfa açılırken zaten ekranda olanlar beklemeden görünsün (titreme olmasın)
      if (el.getBoundingClientRect().top < ekranAlti - 30) { el.classList.add('belirdi'); return; }
      // Yan yana kartlar sırayla gelsin
      const kardes = el.parentElement ? [...el.parentElement.children].indexOf(el) : 0;
      el.style.setProperty('--belirme-gecikme', `${Math.min(kardes % 4, 3) * 50}ms`);
      el.classList.add('belirme');
      io.observe(el);
    });
  };

  let bekleyen = false;
  new MutationObserver(() => {
    if (bekleyen) return;
    bekleyen = true;
    requestAnimationFrame(() => { bekleyen = false; tara(); });
  }).observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
  tara();
}
