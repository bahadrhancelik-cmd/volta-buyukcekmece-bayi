<template>
  <div class="admin-shell">
    <aside class="admin-sidebar">
      <div class="admin-sidebar-top">
        <RouterLink to="/" class="brand">
          <span class="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="24" height="24">
              <path d="M 8 4 L 16 28 L 24 4 L 19 4 L 16 18 L 13 4 Z" fill="currentColor" />
            </svg>
          </span>
          <span class="brand-text">
            <span class="brand-name">VOLTA</span>
            <span class="brand-sub">Yönetim</span>
          </span>
        </RouterLink>
      </div>

      <nav class="admin-nav">
        <RouterLink to="/admin" exact-active-class="active" class="admin-nav-link">
          <span class="admin-nav-icon">▤</span> Modeller
        </RouterLink>
        <RouterLink to="/admin/yeni" active-class="active" class="admin-nav-link">
          <span class="admin-nav-icon">＋</span> Yeni model
        </RouterLink>
        <RouterLink to="/admin/kategoriler" active-class="active" class="admin-nav-link">
          <span class="admin-nav-icon">▦</span> Kategoriler
        </RouterLink>
        <RouterLink to="/admin/sss" active-class="active" class="admin-nav-link">
          <span class="admin-nav-icon">?</span> SSS
        </RouterLink>
        <RouterLink to="/admin/mesajlar" active-class="active" class="admin-nav-link">
          <span class="admin-nav-icon">✉</span> Mesajlar
        </RouterLink>
        <RouterLink to="/admin/ayarlar" active-class="active" class="admin-nav-link">
          <span class="admin-nav-icon">⚙</span> Site ayarları
        </RouterLink>
      </nav>

      <div class="admin-sidebar-bottom">
        <RouterLink to="/" class="admin-nav-link subtle">← Siteyi görüntüle</RouterLink>
        <button class="admin-nav-link subtle" @click="logout">⎋ Çıkış yap</button>
      </div>
    </aside>

    <div class="admin-main">
      <RouterView />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/motors';

const router = useRouter();
const auth = useAuthStore();

async function logout() {
  await auth.logout();
  router.push('/admin-login');
}
</script>
