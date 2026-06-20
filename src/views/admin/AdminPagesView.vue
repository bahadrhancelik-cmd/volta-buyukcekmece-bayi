<template>
  <div class="admin-page">
    <div class="admin-page-head">
      <div>
        <h1>Sayfa içerikleri</h1>
        <p class="admin-page-lead">
          Hakkımızda, İletişim ve SSS sayfalarının bölümlerini düzenleyin.
          Sıralamayı değiştirmek için bölümleri sürükleyin.
        </p>
      </div>
    </div>

    <div class="page-tabs">
      <button
        v-for="t in TABS"
        :key="t.value"
        type="button"
        class="page-tab"
        :class="{ active: activeTab === t.value }"
        @click="activeTab = t.value"
      >{{ t.label }}</button>
    </div>

    <p v-if="error" class="form-error">{{ error }}</p>
    <p v-if="savedFlash" class="form-sent">✓ Kaydedildi.</p>

    <div class="section-list">
      <div
        v-for="(s, i) in pageSections"
        :key="s.id"
        class="section-card"
        :class="{ dragging: dragIndex === i }"
        draggable="true"
        @dragstart="dragStart(i, $event)"
        @dragover.prevent
        @drop="onDrop(i)"
        @dragend="dragIndex = null"
      >
        <div class="section-card-head" @click="toggleOpen(s.id)">
          <span class="drag-handle" title="Sürükleyerek sıralayın">⋮⋮</span>
          <div class="section-card-meta">
            <span class="section-kind-pill">{{ kindLabel(s.kind) }}</span>
            <span class="section-card-title">
              {{ s.title || s.eyebrow || kindLabel(s.kind) }}
            </span>
          </div>
          <button
            type="button"
            class="toggle-pill"
            :class="s.visible ? 'on' : 'off'"
            @click.stop="toggleVisible(s)"
          >{{ s.visible ? 'Yayında' : 'Gizli' }}</button>
          <span class="section-chevron" aria-hidden="true">
            {{ openIds.includes(s.id) ? '−' : '+' }}
          </span>
        </div>

        <div v-show="openIds.includes(s.id)" class="section-card-body">
          <!-- HERO -->
          <template v-if="s.kind === 'hero'">
            <label class="field">
              <span>Üst başlık (eyebrow)</span>
              <input type="text" v-model="draft(s).eyebrow" placeholder="Örn: Hakkımızda" />
            </label>
            <label class="field">
              <span>Başlık</span>
              <input type="text" v-model="draft(s).title" placeholder="Sayfa başlığı" />
            </label>
            <label class="field">
              <span>Açıklama</span>
              <textarea v-model="draft(s).body" rows="3" placeholder="Kısa açıklama metni"></textarea>
            </label>
          </template>

          <!-- RICH TEXT -->
          <template v-else-if="s.kind === 'rich'">
            <label class="field">
              <span>Başlık (opsiyonel)</span>
              <input type="text" v-model="draft(s).title" placeholder="Örn: Hikâyemiz" />
            </label>
            <div class="field">
              <span class="field-label-block">İçerik</span>
              <RichTextEditor v-model="draft(s).body" />
            </div>
          </template>

          <!-- STATS -->
          <template v-else-if="s.kind === 'stats'">
            <label class="field">
              <span>Üst başlık (opsiyonel)</span>
              <input type="text" v-model="draft(s).eyebrow" placeholder="Örn: Rakamlarla biz" />
            </label>
            <label class="field">
              <span>Başlık (opsiyonel)</span>
              <input type="text" v-model="draft(s).title" />
            </label>
            <div class="items-editor">
              <div class="items-editor-head">
                <span>İstatistikler</span>
                <button type="button" class="btn-link" @click="addItem(s, { value: '', label: '' })">+ Yeni</button>
              </div>
              <div
                v-for="(item, idx) in items(s)"
                :key="idx"
                class="item-row"
              >
                <input
                  type="text"
                  v-model="item.value"
                  placeholder="Değer (ör: 2014)"
                  class="item-input item-input-strong"
                />
                <input
                  type="text"
                  v-model="item.label"
                  placeholder="Etiket (ör: Kuruluş)"
                  class="item-input"
                />
                <button type="button" class="btn-table danger" @click="removeItem(s, idx)">Sil</button>
              </div>
              <p v-if="!items(s).length" class="empty-hint">Henüz öğe yok.</p>
            </div>
          </template>

          <!-- CARDS -->
          <template v-else-if="s.kind === 'cards'">
            <label class="field">
              <span>Üst başlık (opsiyonel)</span>
              <input type="text" v-model="draft(s).eyebrow" placeholder="Örn: Değerlerimiz" />
            </label>
            <label class="field">
              <span>Başlık (opsiyonel)</span>
              <input type="text" v-model="draft(s).title" placeholder="Örn: Nasıl çalışıyoruz" />
            </label>
            <div class="items-editor">
              <div class="items-editor-head">
                <span>Kartlar</span>
                <button type="button" class="btn-link" @click="addItem(s, { title: '', description: '' })">+ Yeni kart</button>
              </div>
              <div
                v-for="(item, idx) in items(s)"
                :key="idx"
                class="item-row item-row-stack"
              >
                <input
                  type="text"
                  v-model="item.title"
                  placeholder="Kart başlığı"
                  class="item-input item-input-strong"
                />
                <textarea
                  v-model="item.description"
                  rows="2"
                  placeholder="Kart açıklaması"
                  class="item-input"
                ></textarea>
                <button type="button" class="btn-table danger" @click="removeItem(s, idx)">Sil</button>
              </div>
              <p v-if="!items(s).length" class="empty-hint">Henüz kart yok.</p>
            </div>
          </template>

          <!-- CTA -->
          <template v-else-if="s.kind === 'cta'">
            <label class="field">
              <span>Başlık</span>
              <input type="text" v-model="draft(s).title" placeholder="Örn: Sorunuz burada yok mu?" />
            </label>
            <label class="field">
              <span>Açıklama</span>
              <textarea v-model="draft(s).body" rows="2"></textarea>
            </label>
            <div class="field-row">
              <label class="field">
                <span>Buton metni</span>
                <input type="text" v-model="draft(s).data.cta_label" placeholder="İletişime geç →" />
              </label>
              <label class="field">
                <span>Buton bağlantısı</span>
                <input type="text" v-model="draft(s).data.cta_href" placeholder="/iletisim" />
              </label>
            </div>
          </template>

          <!-- FIXED: contact_info / map / contact_form / faq_list -->
          <template v-else-if="FIXED_KINDS.includes(s.kind)">
            <div class="fixed-section-note">
              <p>{{ FIXED_NOTES[s.kind] }}</p>
              <template v-if="s.kind === 'contact_form'">
                <label class="field" style="margin-top: 12px">
                  <span>Bölüm başlığı</span>
                  <input type="text" v-model="draft(s).title" placeholder="Örn: Bize bir mesaj bırakın" />
                </label>
              </template>
            </div>
          </template>

          <div class="admin-form-actions section-actions">
            <button type="button" class="btn-link danger" @click="onDelete(s)">Bölümü sil</button>
            <button
              type="button"
              class="btn btn-primary btn-sm"
              :disabled="saving === s.id"
              @click="saveSection(s)"
            >{{ saving === s.id ? 'Kaydediliyor…' : 'Kaydet' }}</button>
          </div>
        </div>
      </div>

      <div v-if="!pageSections.length && !loading" class="section-empty">
        Bu sayfada henüz bölüm yok. Aşağıdan ekleyin.
      </div>
      <p v-if="loading && !pageSections.length" class="empty">Yükleniyor…</p>
    </div>

    <div class="add-section">
      <select v-model="newKind" class="add-section-select">
        <option v-for="k in addableKinds" :key="k.value" :value="k.value">{{ k.label }}</option>
      </select>
      <button type="button" class="btn btn-primary" :disabled="adding" @click="addSection">
        {{ adding ? 'Ekleniyor…' : '+ Bölüm ekle' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue';
import { usePageSectionsStore } from '../../stores/site';
import RichTextEditor from '../../components/RichTextEditor.vue';

const store = usePageSectionsStore();

const TABS = [
  { value: 'about',   label: 'Hakkımızda' },
  { value: 'contact', label: 'İletişim' },
  { value: 'faq',     label: 'SSS' },
];

const KIND_LABELS = {
  hero:         'Hero',
  rich:         'Zengin metin',
  stats:        'İstatistikler',
  cards:        'Kart listesi',
  cta:          'CTA',
  contact_info: 'İletişim bilgileri',
  map:          'Harita',
  contact_form: 'İletişim formu',
  faq_list:     'SSS listesi',
};

const FIXED_KINDS = ['contact_info', 'map', 'contact_form', 'faq_list'];

const FIXED_NOTES = {
  contact_info: 'Bu bölümün içeriği "Site ayarları > İletişim bilgileri" alanından gelir. Buradan sadece sıralayabilir veya gizleyebilirsiniz.',
  map:          'Bu bölümün konumu "Site ayarları > Konum enlem / boylam" alanından gelir. Buradan sadece sıralayabilir veya gizleyebilirsiniz.',
  contact_form: 'Form içeriği site genelinde aynı. Buradan başlığı düzenleyebilir, sıralayabilir veya gizleyebilirsiniz.',
  faq_list:     'Bu bölüm "SSS" sayfa yönetimindeki soruları listeler. Buradan sadece sıralayabilir veya gizleyebilirsiniz.',
};

// Per-tab, which kinds can the admin add new instances of.
const ADDABLE_BY_PAGE = {
  about:   ['hero', 'rich', 'stats', 'cards', 'cta'],
  contact: ['hero', 'rich', 'cards', 'cta', 'contact_info', 'map', 'contact_form'],
  faq:     ['hero', 'rich', 'cards', 'cta', 'faq_list'],
};

const activeTab = ref('about');
const openIds = ref([]);
const dragIndex = ref(null);
const newKind = ref('rich');
const saving = ref(null);
const adding = ref(false);
const savedFlash = ref(false);
const error = ref('');

const loading = computed(() => store.loading);
const pageSections = computed(() => store.byPage(activeTab.value));

const addableKinds = computed(() =>
  (ADDABLE_BY_PAGE[activeTab.value] || []).map((value) => ({ value, label: KIND_LABELS[value] }))
);

function kindLabel(k) { return KIND_LABELS[k] || k; }

// Edit drafts — each section gets a reactive shallow copy edited in-place.
const drafts = reactive({});
function draft(s) {
  if (!drafts[s.id]) {
    drafts[s.id] = {
      eyebrow: s.eyebrow ?? '',
      title:   s.title ?? '',
      body:    s.body ?? '',
      data:    JSON.parse(JSON.stringify(s.data || {})),
    };
  }
  return drafts[s.id];
}

function items(s) {
  const d = draft(s);
  if (!Array.isArray(d.data.items)) d.data.items = [];
  return d.data.items;
}

function addItem(s, item) {
  const list = items(s);
  list.push({ ...item });
}
function removeItem(s, idx) {
  const list = items(s);
  list.splice(idx, 1);
}

function toggleOpen(id) {
  const i = openIds.value.indexOf(id);
  if (i >= 0) openIds.value.splice(i, 1);
  else openIds.value.push(id);
}

async function toggleVisible(s) {
  try {
    await store.updateSection(s.id, { visible: !s.visible });
  } catch (e) {
    error.value = e.message || String(e);
  }
}

async function saveSection(s) {
  error.value = '';
  const d = draft(s);
  saving.value = s.id;
  try {
    const patch = {
      eyebrow: d.eyebrow || null,
      title:   d.title || null,
      body:    d.body || null,
      data:    d.data || {},
    };
    await store.updateSection(s.id, patch);
    flashSaved();
  } catch (e) {
    error.value = e.message || String(e);
  } finally {
    saving.value = null;
  }
}

async function onDelete(s) {
  if (!confirm('Bu bölüm silinecek. Emin misiniz?')) return;
  try {
    await store.deleteSection(s.id);
    delete drafts[s.id];
  } catch (e) {
    error.value = e.message || String(e);
  }
}

async function addSection() {
  error.value = '';
  adding.value = true;
  try {
    const last = pageSections.value[pageSections.value.length - 1];
    const sort_order = (last?.sort_order ?? 0) + 10;
    const defaults = defaultsForKind(newKind.value);
    const row = await store.addSection({
      page: activeTab.value,
      kind: newKind.value,
      sort_order,
      ...defaults,
    });
    openIds.value.push(row.id);
  } catch (e) {
    error.value = e.message || String(e);
  } finally {
    adding.value = false;
  }
}

function defaultsForKind(kind) {
  switch (kind) {
    case 'hero':  return { eyebrow: 'Yeni bölüm', title: 'Başlık', body: '' };
    case 'rich':  return { title: 'Yeni başlık', body: '<p></p>' };
    case 'stats': return { data: { items: [] } };
    case 'cards': return { eyebrow: '', title: 'Yeni bölüm', data: { items: [] } };
    case 'cta':   return { title: 'Yeni CTA', body: '', data: { cta_label: 'Devam et →', cta_href: '/' } };
    default:      return {};
  }
}

function flashSaved() {
  savedFlash.value = true;
  setTimeout(() => { savedFlash.value = false; }, 2200);
}

// Drag-and-drop reorder within the current page.
function dragStart(i, e) {
  dragIndex.value = i;
  e.dataTransfer.effectAllowed = 'move';
}
async function onDrop(i) {
  const from = dragIndex.value;
  dragIndex.value = null;
  if (from === null || from === i) return;
  const next = [...pageSections.value];
  const [moved] = next.splice(from, 1);
  next.splice(i, 0, moved);
  try {
    await store.reorderPage(activeTab.value, next.map((s) => s.id));
  } catch (e) {
    error.value = e.message || String(e);
  }
}

onMounted(() => {
  if (!store.loaded) store.fetchAll();
});
</script>
