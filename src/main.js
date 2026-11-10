import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/motors';
import './styles/main.css';

// Site güncellendikten sonra eski açık sekmede yeni sayfaya geçilince eski dosyalar bulunamaz
// ve sayfa açılmaz. Bu durumda sayfayı bir kez yenileyip güncel sürümü yükle (döngüye girmesin diye 30 sn sınırı).
function guncelSurumeGec(hedef) {
  try {
    const son = Number(sessionStorage.getItem('surumYenileme') || 0);
    if (Date.now() - son < 30000) return;
    sessionStorage.setItem('surumYenileme', String(Date.now()));
  } catch { /* depolama kapalıysa yine de yenile */ }
  if (hedef) window.location.assign(hedef); else window.location.reload();
}
window.addEventListener('vite:preloadError', (e) => { e.preventDefault(); guncelSurumeGec(); });
router.onError((err, to) => {
  if (/dynamically imported module|Importing a module script failed|Failed to fetch/i.test(String(err?.message))) {
    guncelSurumeGec(to?.fullPath);
  }
});

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

// Bootstrap auth (read existing session from storage + subscribe to changes)
// before mounting so the admin route guard sees the correct state.
async function bootstrap() {
  const auth = useAuthStore(pinia);
  await auth.init();
  app.use(router);
  app.mount('#app');
}

bootstrap();
