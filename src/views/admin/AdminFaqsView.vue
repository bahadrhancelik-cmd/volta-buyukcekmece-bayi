<template>
  <div class="admin-page">
    <div class="admin-page-head">
      <div>
        <h1>Sıkça sorulan sorular</h1>
        <p class="admin-page-lead">
          /sss sayfasında görüntülenir. Sıralamayı değiştirmek için satırları sürükleyebilirsiniz.
        </p>
      </div>
      <div class="admin-page-actions">
        <button class="btn btn-primary" @click="openNew">+ Yeni soru</button>
      </div>
    </div>

    <p v-if="error" class="form-error">{{ error }}</p>

    <div v-if="form.show" class="form-section" style="margin-bottom: 24px">
      <h3>{{ form.id ? 'Soruyu düzenle' : 'Yeni soru' }}</h3>
      <form @submit.prevent="save" class="admin-form">
        <label class="field">
          <span>Soru</span>
          <input type="text" v-model="form.question" required placeholder="Örn: Garanti süresi ne kadar?" />
        </label>
        <label class="field">
          <span>Cevap</span>
          <textarea v-model="form.answer" rows="5" required placeholder="Sorunun cevabı..."></textarea>
        </label>
        <div class="field-row">
          <label class="field">
            <span>Sıralama</span>
            <input type="number" v-model.number="form.sort_order" min="0" />
          </label>
          <label class="checkbox" style="align-self: end; padding-bottom: 10px;">
            <input type="checkbox" v-model="form.visible" />
            <span>Yayında</span>
          </label>
        </div>
        <div class="admin-form-actions">
          <button type="button" class="btn btn-ghost" @click="form.show = false">İptal</button>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Kaydediliyor…' : (form.id ? 'Kaydet' : 'Ekle') }}
          </button>
        </div>
      </form>
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th class="col-drag"></th>
            <th style="width: 80px">Sıra</th>
            <th>Soru</th>
            <th>Yayında</th>
            <th class="col-actions">İşlem</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(f, i) in sorted"
            :key="f.id"
            draggable="true"
            @dragstart="dragStart(i, $event)"
            @dragover.prevent
            @drop="drop(i)"
            :class="{ dragging: dragIndex === i }"
          >
            <td class="col-drag"><span class="drag-handle">⋮⋮</span></td>
            <td>{{ f.sort_order }}</td>
            <td>
              <div class="admin-cell-strong">{{ f.question }}</div>
              <div class="admin-cell-sub" style="margin-top: 4px; max-width: 520px;">{{ truncate(f.answer, 120) }}</div>
            </td>
            <td>
              <button
                class="toggle-pill"
                :class="f.visible ? 'on' : 'off'"
                @click="toggleVisible(f)"
              >
                {{ f.visible ? 'Yayında' : 'Gizli' }}
              </button>
            </td>
            <td class="col-actions">
              <button class="btn-table" @click="openEdit(f)">Düzenle</button>
              <button class="btn-table danger" @click="onDelete(f)">Sil</button>
            </td>
          </tr>
          <tr v-if="!sorted.length">
            <td colspan="5" style="text-align: center; padding: 24px; color: var(--muted)">
              Henüz soru yok. Üstteki "Yeni soru" butonuyla başlayın.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useFaqStore } from '../../stores/site';

const store = useFaqStore();
const sorted = computed(() => store.sorted);
const error = ref('');
const saving = ref(false);
const dragIndex = ref(null);

const form = reactive({
  show: false,
  id: null,
  question: '',
  answer: '',
  sort_order: 9999,
  visible: true,
});

onMounted(() => {
  if (!store.loaded) store.fetchAll();
});

function truncate(s, n) {
  s = String(s || '');
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function openNew() {
  form.show = true;
  form.id = null;
  form.question = '';
  form.answer = '';
  form.sort_order = (sorted.value[sorted.value.length - 1]?.sort_order ?? 0) + 10;
  form.visible = true;
  error.value = '';
}

function openEdit(f) {
  form.show = true;
  form.id = f.id;
  form.question = f.question;
  form.answer = f.answer;
  form.sort_order = f.sort_order ?? 9999;
  form.visible = f.visible !== false;
  error.value = '';
}

async function save() {
  error.value = '';
  saving.value = true;
  try {
    if (form.id) {
      await store.updateFaq(form.id, {
        question: form.question,
        answer: form.answer,
        sort_order: form.sort_order,
        visible: form.visible,
      });
    } else {
      await store.addFaq({
        question: form.question,
        answer: form.answer,
        sort_order: form.sort_order,
        visible: form.visible,
      });
    }
    form.show = false;
  } catch (e) {
    error.value = e.message || String(e);
  } finally {
    saving.value = false;
  }
}

async function toggleVisible(f) {
  try {
    await store.updateFaq(f.id, { visible: !f.visible });
  } catch (e) {
    error.value = e.message || String(e);
  }
}

async function onDelete(f) {
  if (!confirm(`"${f.question}" silinecek. Emin misiniz?`)) return;
  error.value = '';
  try {
    await store.deleteFaq(f.id);
  } catch (e) {
    error.value = e.message || String(e);
  }
}

// Drag-reorder
function dragStart(i, e) {
  dragIndex.value = i;
  e.dataTransfer.effectAllowed = 'move';
}
async function drop(i) {
  if (dragIndex.value === null || dragIndex.value === i) {
    dragIndex.value = null;
    return;
  }
  const next = [...sorted.value];
  const [moved] = next.splice(dragIndex.value, 1);
  next.splice(i, 0, moved);
  dragIndex.value = null;
  // Persist new sort_order values
  try {
    await Promise.all(
      next.map((f, idx) => store.updateFaq(f.id, { sort_order: (idx + 1) * 10 }))
    );
  } catch (e) {
    error.value = e.message || String(e);
  }
}
</script>
