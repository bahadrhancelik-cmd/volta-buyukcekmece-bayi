import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from './stores/motors';

const SITE_NAME = 'Volta Motor Büyükçekmece';
const DEFAULT_DESC = 'Volta Motor Büyükçekmece Fabrika Satış Mağazası. Elektrikli scooter, motosiklet, ATV ve elektrikli bisiklet modelleri, güncel fiyatlar ve özellikler.';

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('./views/HomeView.vue'),
    meta: {
      title: `${SITE_NAME} · Elektrikli Scooter, ATV, Bisiklet`,
      description: DEFAULT_DESC,
    },
  },
  {
    path: '/katalog',
    name: 'catalog',
    component: () => import('./views/CatalogView.vue'),
    meta: {
      title: `Model Kataloğu · ${SITE_NAME}`,
      description: 'Tüm Volta Motor modelleri — elektrikli scooter, ATV, elektrikli bisiklet ve daha fazlası. Fiyat ve özelliklere göre filtreleyin.',
    },
  },
  {
    path: '/motor/:slug',
    name: 'detail',
    component: () => import('./views/DetailView.vue'),
    meta: { title: `Motor Detayı · ${SITE_NAME}`, description: DEFAULT_DESC },
  },
  {
    path: '/hakkimizda',
    name: 'about',
    component: () => import('./views/AboutView.vue'),
    meta: {
      title: `Hakkımızda · ${SITE_NAME}`,
      description: 'Volta Motor Büyükçekmece Fabrika Satış Mağazası olarak elektrikli mobilite çözümlerinde sizi destekliyoruz.',
    },
  },
  {
    path: '/iletisim',
    name: 'contact',
    component: () => import('./views/ContactView.vue'),
    meta: {
      title: `İletişim · ${SITE_NAME}`,
      description: 'Volta Motor Büyükçekmece Fabrika Satış Mağazası adresi, telefon ve iletişim formu.',
    },
  },
  {
    path: '/sss',
    name: 'faq',
    component: () => import('./views/FaqView.vue'),
    meta: {
      title: `Sıkça sorulan sorular · ${SITE_NAME}`,
      description: 'Volta Motor Büyükçekmece Fabrika Satış Mağazası — sıkça sorulan sorular ve cevapları. Satış ve garanti hakkında bilgi.',
    },
  },
  {
    path: '/kvkk',
    name: 'kvkk',
    component: () => import('./views/KvkkView.vue'),
    meta: {
      title: `KVKK Aydınlatma Metni · ${SITE_NAME}`,
      description: 'CDH Motor (Volta Motor Büyükçekmece) kişisel verilerin işlenmesine ilişkin aydınlatma metni.',
    },
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('./views/admin/AdminLayout.vue'),
    meta: { title: `Yönetim · ${SITE_NAME}`, robots: 'noindex, nofollow' },
    children: [
      { path: '', name: 'admin-list', component: () => import('./views/admin/AdminListView.vue'), meta: { robots: 'noindex, nofollow' } },
      { path: 'yeni', name: 'admin-new', component: () => import('./views/admin/AdminFormView.vue'), meta: { robots: 'noindex, nofollow' } },
      { path: 'duzenle/:id', name: 'admin-edit', component: () => import('./views/admin/AdminFormView.vue'), meta: { robots: 'noindex, nofollow' } },
      { path: 'kategoriler', name: 'admin-categories', component: () => import('./views/admin/AdminCategoriesView.vue'), meta: { robots: 'noindex, nofollow' } },
      { path: 'sayfalar', name: 'admin-pages', component: () => import('./views/admin/AdminPagesView.vue'), meta: { robots: 'noindex, nofollow' } },
      { path: 'sss', name: 'admin-faqs', component: () => import('./views/admin/AdminFaqsView.vue'), meta: { robots: 'noindex, nofollow' } },
      { path: 'mesajlar', name: 'admin-messages', component: () => import('./views/admin/AdminMessagesView.vue'), meta: { robots: 'noindex, nofollow' } },
      { path: 'ayarlar', name: 'admin-settings', component: () => import('./views/admin/AdminSettingsView.vue'), meta: { robots: 'noindex, nofollow' } },
    ],
  },
  {
    path: '/admin-login',
    name: 'admin-login',
    component: () => import('./views/admin/AdminLoginView.vue'),
    meta: { title: `Yönetim Girişi · ${SITE_NAME}`, robots: 'noindex, nofollow' },
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('./views/NotFoundView.vue'),
    meta: { title: `Sayfa bulunamadı · ${SITE_NAME}`, robots: 'noindex' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 }; },
});

// Admin guard — waits for Supabase session bootstrap (idempotent).
router.beforeEach(async (to) => {
  if (to.path.startsWith('/admin') && to.name !== 'admin-login') {
    const auth = useAuthStore();
    await auth.init();
    if (!auth.isAuthed) {
      return { name: 'admin-login' };
    }
  }
});

// SEO: per-route title, meta description, robots, canonical
router.afterEach((to) => {
  if (typeof document === 'undefined') return;

  if (to.meta?.title) document.title = to.meta.title;

  const setMeta = (selector, attr, value) => {
    if (!value) return;
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      const [, name] = selector.match(/\[(?:name|property)="([^"]+)"\]/) || [];
      if (selector.includes('property=')) el.setAttribute('property', name);
      else el.setAttribute('name', name);
      document.head.appendChild(el);
    }
    el.setAttribute(attr, value);
  };

  setMeta('meta[name="description"]', 'content', to.meta?.description || DEFAULT_DESC);
  setMeta('meta[property="og:title"]', 'content', to.meta?.title || SITE_NAME);
  setMeta('meta[property="og:description"]', 'content', to.meta?.description || DEFAULT_DESC);
  setMeta('meta[name="robots"]', 'content', to.meta?.robots || 'index, follow, max-image-preview:large');

  const origin = window.location.origin;
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', origin + to.path);

  setMeta('meta[property="og:url"]', 'content', origin + to.path);
});

export default router;
