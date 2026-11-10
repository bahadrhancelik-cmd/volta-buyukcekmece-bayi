<template>
  <div class="admin-page">
    <div class="admin-page-head">
      <div>
        <RouterLink to="/admin" class="breadcrumb">← Modeller</RouterLink>
        <h1>{{ isEdit ? 'Modeli düzenle' : 'Yeni model ekle' }}</h1>
      </div>
    </div>

    <form @submit.prevent="save" class="admin-form">
      <div class="admin-form-grid">
        <!-- Sol kolon: alanlar -->
        <div class="admin-form-fields">
          <div class="form-section">
            <h3>Temel bilgiler</h3>
            <label class="field">
              <span>Model adı</span>
              <input type="text" v-model="form.name" required placeholder="Örn: Volta Lit Pro" />
            </label>
            <div class="field-row">
              <label class="field">
                <span>Kategori</span>
                <select v-model="form.category" required>
                  <option v-if="!categoryStore.sorted.length" value="">Kategori yükleniyor...</option>
                  <option
                    v-for="c in categoryStore.sorted"
                    :key="c.id"
                    :value="c.slug"
                  >{{ c.label }}</option>
                </select>
              </label>
              <label class="field">
                <span>Fiyat (₺)</span>
                <input type="number" v-model.number="form.price" required min="0" step="100" :disabled="!!form.appModel" />
              </label>
              <label class="field">
                <span>Karşılaştırma fiyatı (₺)</span>
                <input
                  type="number"
                  :disabled="!!form.appModel"
                  v-model.number="form.comparePrice"
                  min="0"
                  step="100"
                  placeholder="Boş bırakın"
                />
              </label>
            </div>
            <small v-if="form.appModel" style="color: var(--muted); display: block; margin-top: -4px;">
              Fiyat, üstü çizili tavsiye fiyatı ve stok durumu CDH Motor uygulamasından otomatik gelir ({{ form.appModel }}). Değiştirmek için uygulamadaki model fiyatını güncelleyin.
            </small>
            <small v-else-if="hasValidComparePrice" style="color: var(--muted); display: block; margin-top: -4px;">
              Karşılaştırma fiyatı, mevcut fiyatın üstünde olmalıdır — üzeri çizili olarak gösterilir.
            </small>
            <div class="field">
              <span class="field-label">Açıklama</span>
              <RichTextEditor v-model="form.description" />
            </div>
          </div>

          <div class="form-section">
            <h3>Teknik özellikler</h3>
            <p class="form-section-hint">
              Bu modelin teknik özelliklerini istediğiniz gibi tanımlayın.
              Elektrikli modeller için "Menzil / Maks. hız / Şarj süresi",
              benzinli modeller için "Motor hacmi / Maks. hız / Yakıt tüketimi" gibi.
            </p>
            <div class="spec-editor">
              <div
                v-for="(s, i) in form.specs"
                :key="i"
                class="spec-editor-row"
              >
                <input
                  type="text"
                  v-model="s.label"
                  placeholder="Özellik adı (örn: Menzil)"
                  class="spec-editor-label"
                />
                <input
                  type="text"
                  v-model="s.value"
                  placeholder="Değer (örn: 60)"
                  class="spec-editor-value"
                />
                <input
                  type="text"
                  v-model="s.unit"
                  placeholder="Birim (örn: km)"
                  class="spec-editor-unit"
                />
                <div class="spec-editor-actions">
                  <button
                    type="button"
                    class="btn-icon"
                    @click="moveSpec(i, -1)"
                    :disabled="i === 0"
                    title="Yukarı taşı"
                    aria-label="Yukarı taşı"
                  >↑</button>
                  <button
                    type="button"
                    class="btn-icon"
                    @click="moveSpec(i, 1)"
                    :disabled="i === form.specs.length - 1"
                    title="Aşağı taşı"
                    aria-label="Aşağı taşı"
                  >↓</button>
                  <button
                    type="button"
                    class="btn-icon"
                    @click="removeSpec(i)"
                    title="Bu özelliği sil"
                    aria-label="Sil"
                  >×</button>
                </div>
              </div>
              <button type="button" class="btn btn-ghost btn-sm" @click="addSpec">
                + Özellik ekle
              </button>
            </div>
          </div>

          <div class="form-section">
            <h3>Renkler</h3>
            <div class="color-editor">
              <div
                v-for="(c, i) in form.colors" :key="i"
                class="color-editor-item"
              >
                <div class="color-editor-row">
                  <input type="color" :value="c" @input="updateColor(i, $event.target.value)" />
                  <input type="text" :value="c" @input="updateColor(i, $event.target.value)" placeholder="#000000" />
                  <button type="button" class="btn-icon" @click="removeColor(i)" aria-label="Rengi sil">×</button>
                </div>

                <div class="color-editor-thumbs">
                  <div class="color-editor-thumbs-label">Vitrin görseli</div>
                  <template v-if="form.photos.length">
                    <button
                      v-for="(p, j) in form.photos"
                      :key="`${i}-${j}-${p}`"
                      type="button"
                      class="color-editor-thumb"
                      :class="{ selected: form.photoColors[j] === c }"
                      :style="{ backgroundImage: `url(${p})` }"
                      @click="toggleColorFeatured(i, j)"
                      :title="form.photoColors[j] === c ? 'Vitrin görseli — kaldırmak için tekrar tıkla' : 'Bu rengin vitrin görseli yap'"
                      :aria-pressed="form.photoColors[j] === c"
                      :aria-label="form.photoColors[j] === c ? `${c} vitrin görseli — kaldır` : `${c} için vitrin görseli ${j + 1}`"
                    ></button>
                  </template>
                  <span v-else class="color-editor-thumbs-empty">
                    Önce sağdaki bölümden fotoğraf yükleyin, sonra her renk için vitrin görselini buradan seçin.
                  </span>
                </div>
              </div>
              <button type="button" class="btn btn-ghost btn-sm" @click="addColor">+ Renk ekle</button>
            </div>
            <small style="color: var(--muted); display: block; margin-top: 12px;">
              Tek renk varsa ürün sayfasında renk seçenekleri bölümü gizlenir.
              Bir renge vitrin görseli atadığınızda, ürün sayfasında o renk seçilince ilgili fotoğraf öne çıkar.
            </small>
          </div>

          <div class="form-section">
            <h3>Durum</h3>
            <div class="checkbox-row">
              <label class="checkbox">
                <input type="checkbox" v-model="form.visible" />
                <span>Yayında (siteye görünür)</span>
              </label>
              <label class="checkbox">
                <input type="checkbox" v-model="form.inStock" :disabled="!!form.appModel" />
                <span>Stokta var</span>
              </label>
              <label class="checkbox">
                <input type="checkbox" v-model="form.featured" />
                <span>Öne çıkar</span>
              </label>
            </div>
            <small style="color: var(--muted); display: block; margin-top: 8px;">
              "Yayında" kapatılırsa motor herkese gizlenir — yalnızca admin panelden görünür kalır.
            </small>
          </div>
        </div>

        <!-- Sağ kolon: önizleme + foto -->
        <aside class="admin-form-side">
          <div class="form-section">
            <h3>Fotoğraflar</h3>
            <div class="photo-multi">
              <div class="photo-multi-grid">
                <div
                  v-for="(p, i) in form.photos"
                  :key="`${p}-${i}`"
                  class="photo-multi-item"
                  :class="{ dragging: dragIndex === i }"
                  draggable="true"
                  @dragstart="onPhotoDragStart(i, $event)"
                  @dragover.prevent
                  @drop="onPhotoDrop(i)"
                  :style="{ backgroundImage: `url(${p})` }"
                  :title="i === 0 ? 'Birincil fotoğraf — listede ve kapakta görünür' : `Fotoğraf ${i + 1}`"
                >
                  <span v-if="i === 0" class="photo-multi-primary-tag">Kapak</span>
                  <div class="photo-multi-actions">
                    <button
                      type="button"
                      class="btn-icon"
                      @click.stop="removePhoto(i)"
                      aria-label="Fotoğrafı sil"
                      title="Sil"
                    >×</button>
                  </div>
                  <span
                    v-if="form.photoColors[i]"
                    class="photo-color-swatch"
                    :style="{ background: form.photoColors[i] }"
                    :title="`${form.photoColors[i]} renginin vitrin görseli`"
                    aria-hidden="true"
                  ></span>
                </div>

                <label
                  class="photo-add-tile"
                  :class="{ over: dragOver }"
                  @dragover.prevent="dragOver = true"
                  @dragleave="dragOver = false"
                  @drop.prevent="onDrop"
                >
                  <div v-if="uploading">
                    <div class="photo-add-tile-icon">⏳</div>
                    <div>Yükleniyor…</div>
                  </div>
                  <template v-else>
                    <div class="photo-add-tile-icon">+</div>
                    <div>Fotoğraf ekle</div>
                    <small>sürükle-bırak veya tıkla</small>
                  </template>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    style="display: none"
                    @change="onFileChange"
                  />
                </label>
              </div>
              <small style="color: var(--muted)">
                Birden fazla fotoğraf yüklerseniz ürün sayfasında karusel görünür. Sürükleyerek sıralayın — ilk fotoğraf kapak görseli olur.
              </small>
            </div>
          </div>

          <div class="form-section">
            <h3>Önizleme</h3>
            <div class="preview-card">
              <MotoCard :motor="previewMotor" />
            </div>
          </div>
        </aside>
      </div>

      <div class="admin-form-actions">
        <p v-if="error" class="form-error">{{ error }}</p>
        <RouterLink to="/admin" class="btn btn-ghost">İptal</RouterLink>
        <button type="submit" class="btn btn-primary btn-lg" :disabled="saving || uploading">
          {{ saving ? 'Kaydediliyor…' : (isEdit ? 'Değişiklikleri kaydet' : 'Modeli ekle') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMotorStore } from '../../stores/motors';
import { useCategoryStore } from '../../stores/site';
import MotoCard from '../../components/MotoCard.vue';
import RichTextEditor from '../../components/RichTextEditor.vue';

const route = useRoute();
const router = useRouter();
const store = useMotorStore();
const categoryStore = useCategoryStore();

const isEdit = computed(() => !!route.params.id);
const dragOver = ref(false);
const uploading = ref(false);
const saving = ref(false);
const error = ref('');
const dragIndex = ref(null);

const blank = {
  name: '',
  category: '',
  price: 0,
  comparePrice: null,
  description: '',
  specs: [
    { label: 'Menzil',      value: '', unit: 'km' },
    { label: 'Maks. hız',   value: '', unit: 'km/s' },
    { label: 'Şarj süresi', value: '', unit: 'saat' },
  ],
  colors: ['#0a0a0a', '#95c121'],
  inStock: true,
  featured: false,
  visible: true,
  photos: [],
  photoColors: [],
};

const hasValidComparePrice = computed(() =>
  Number.isFinite(Number(form.comparePrice)) &&
  Number(form.comparePrice) > Number(form.price || 0)
);

const form = reactive({ ...blank });

onMounted(async () => {
  if (!categoryStore.loaded) await categoryStore.fetchAll();
  // Default category to first one if creating
  if (!isEdit.value && categoryStore.sorted.length && !form.category) {
    form.category = categoryStore.sorted[0].slug;
  }
  if (isEdit.value) {
    if (!store.loaded) await store.fetchAll();
    const existing = store.motors.find((m) => m.id === route.params.id);
    if (existing) {
      Object.assign(form, JSON.parse(JSON.stringify(existing)));
      if (!Array.isArray(form.photos)) form.photos = [];
      if (!Array.isArray(form.photoColors)) form.photoColors = [];
      // Normalise parallel arrays: photoColors must match photos length
      while (form.photoColors.length < form.photos.length) form.photoColors.push('');
      form.photoColors = form.photoColors.slice(0, form.photos.length);
      if (form.visible == null) form.visible = true;
      // Specs: ensure array of { label, value, unit }
      if (!Array.isArray(form.specs)) form.specs = [];
      form.specs = form.specs.map((s) => ({
        label: s.label ?? '',
        value: s.value ?? '',
        unit: s.unit ?? '',
      }));
    }
  }
});

// Re-default category once they load (in case fetchAll resolves after mount)
watch(
  () => categoryStore.sorted.length,
  (len) => {
    if (!isEdit.value && len && !form.category) {
      form.category = categoryStore.sorted[0].slug;
    }
  }
);

const previewMotor = computed(() => ({
  id: 'preview',
  slug: 'preview',
  order: 0,
  ...form,
}));

function addColor() { form.colors.push('#dddddd'); }
function updateColor(i, val) {
  const old = form.colors[i];
  form.colors[i] = val;
  // Migrate any photo tags using the old color to the new one
  if (old && old !== val) {
    form.photoColors = form.photoColors.map((c) => (c === old ? val : c));
  }
}
function removeColor(i) {
  if (form.colors.length > 1) {
    const removed = form.colors[i];
    form.colors.splice(i, 1);
    // Untag any photos that were bound to the removed color
    if (removed) {
      form.photoColors = form.photoColors.map((c) => (c === removed ? '' : c));
    }
  }
}

// Bind a photo as the featured image for a color. Enforces one-photo-per-color:
// when a new photo is set, any other photo previously tagged with this color is cleared.
// Clicking the already-bound thumbnail clears the binding.
function toggleColorFeatured(colorIndex, photoIndex) {
  const color = form.colors[colorIndex];
  if (!color) return;
  // Normalise photoColors length first
  while (form.photoColors.length < form.photos.length) form.photoColors.push('');
  const current = form.photoColors[photoIndex];
  if (current === color) {
    form.photoColors[photoIndex] = '';
    return;
  }
  form.photoColors = form.photoColors.map((c) => (c === color ? '' : c));
  form.photoColors[photoIndex] = color;
}

// ---- Specs ----
function addSpec() {
  form.specs.push({ label: '', value: '', unit: '' });
}
function removeSpec(i) {
  form.specs.splice(i, 1);
}
function moveSpec(i, delta) {
  const j = i + delta;
  if (j < 0 || j >= form.specs.length) return;
  const [moved] = form.specs.splice(i, 1);
  form.specs.splice(j, 0, moved);
}

// ---- Photos ----
function onFileChange(e) {
  const files = Array.from(e.target.files || []);
  if (files.length) handleFiles(files);
  e.target.value = '';
}
function onDrop(e) {
  dragOver.value = false;
  const files = Array.from(e.dataTransfer?.files || []);
  if (files.length) handleFiles(files);
}
async function handleFiles(files) {
  error.value = '';
  uploading.value = true;
  try {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const url = await store.uploadPhoto(file);
      if (url) {
        form.photos.push(url);
        form.photoColors.push(''); // start untagged
      }
    }
  } catch (e) {
    error.value = 'Fotoğraf yüklenemedi: ' + (e.message || e);
  } finally {
    uploading.value = false;
  }
}
function removePhoto(i) {
  form.photos.splice(i, 1);
  form.photoColors.splice(i, 1);
}
function onPhotoDragStart(i, e) {
  dragIndex.value = i;
  e.dataTransfer.effectAllowed = 'move';
}
function onPhotoDrop(i) {
  if (dragIndex.value === null || dragIndex.value === i) {
    dragIndex.value = null;
    return;
  }
  const from = dragIndex.value;
  const nextPhotos = [...form.photos];
  const nextColors = [...form.photoColors];
  while (nextColors.length < nextPhotos.length) nextColors.push('');
  const [movedPhoto] = nextPhotos.splice(from, 1);
  const [movedColor] = nextColors.splice(from, 1);
  nextPhotos.splice(i, 0, movedPhoto);
  nextColors.splice(i, 0, movedColor ?? '');
  form.photos = nextPhotos;
  form.photoColors = nextColors;
  dragIndex.value = null;
}

async function save() {
  error.value = '';
  saving.value = true;
  try {
    if (isEdit.value) {
      await store.updateMotor(route.params.id, { ...form });
    } else {
      await store.addMotor({ ...form });
    }
    router.push('/admin');
  } catch (e) {
    error.value = 'Kaydedilemedi: ' + (e.message || e);
  } finally {
    saving.value = false;
  }
}
</script>
