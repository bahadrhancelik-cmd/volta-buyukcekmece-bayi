<template>
  <div class="admin-page">
    <div class="admin-page-head">
      <div>
        <h1>Mesajlar</h1>
        <p class="admin-page-lead">
          /iletisim formundan gelen mesajlar. Yeni mesajlar ayrıca
          <strong>cdhmotorluaraclar@gmail.com</strong> adresine e-posta olarak iletilir.
        </p>
      </div>
    </div>

    <p v-if="error" class="form-error">{{ error }}</p>

    <p v-if="store.loading && !sorted.length" class="empty">Yükleniyor…</p>
    <p v-else-if="!sorted.length" class="empty">Henüz mesaj yok.</p>

    <div v-else class="messages-list">
      <article
        v-for="m in sorted"
        :key="m.id"
        class="message-card"
        :class="{ unread: !m.read }"
      >
        <div class="message-card-top">
          <div>
            <div class="admin-cell-strong">{{ m.name }}</div>
            <a class="message-phone" :href="phoneHref(m.phone)">{{ m.phone }}</a>
          </div>
          <div class="message-meta">
            <span class="message-date">{{ formatDate(m.created_at) }}</span>
            <button
              class="toggle-pill"
              :class="m.read ? 'off' : 'on'"
              @click="toggleRead(m)"
            >
              {{ m.read ? 'Okundu' : 'Yeni' }}
            </button>
          </div>
        </div>
        <p class="message-body">{{ m.message }}</p>
        <div class="message-actions">
          <button class="btn-table danger" @click="onDelete(m)">Sil</button>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useContactMessagesStore } from '../../stores/site';

const store = useContactMessagesStore();
const sorted = computed(() => store.sorted);
const error = ref('');

const dateFmt = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

onMounted(() => {
  if (!store.loaded) store.fetchAll();
});

function formatDate(s) {
  if (!s) return '';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? '' : dateFmt.format(d);
}

function phoneHref(p) {
  const cleaned = String(p || '').replace(/[^+\d]/g, '');
  return cleaned ? `tel:${cleaned}` : '#';
}

async function toggleRead(m) {
  error.value = '';
  try {
    await store.setRead(m.id, !m.read);
  } catch (e) {
    error.value = e.message || String(e);
  }
}

async function onDelete(m) {
  if (!confirm(`${m.name} adlı kişinin mesajı silinecek. Emin misiniz?`)) return;
  error.value = '';
  try {
    await store.remove(m.id);
  } catch (e) {
    error.value = e.message || String(e);
  }
}
</script>

<style scoped>
.messages-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.message-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px 18px;
  background: var(--surface, #fff);
}
.message-card.unread {
  border-color: var(--primary-light);
  background: var(--primary-bg);
}
.message-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}
.message-phone {
  display: inline-block;
  margin-top: 2px;
  font-size: 0.9rem;
  color: var(--muted);
}
.message-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}
.message-date {
  font-size: 0.82rem;
  color: var(--muted);
}
.message-body {
  margin: 12px 0 0;
  white-space: pre-wrap;
  line-height: 1.5;
}
.message-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
