// Pinia stores for admin-managed categories + site-wide settings (logo,
// address, hero banner, etc). Both back onto Supabase.
import { defineStore } from 'pinia';
import { supabase, SITE_ASSETS_BUCKET } from '../lib/supabase';
import { slugify } from '../data/seed';

// =========================================================================
// Categories
// =========================================================================
export const useCategoryStore = defineStore('categories', {
  state: () => ({
    categories: [],
    loading: false,
    loaded: false,
    error: null,
  }),

  getters: {
    sorted: (state) =>
      [...state.categories].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999)),
    bySlug: (state) => (slug) => state.categories.find((c) => c.slug === slug),
    labelOf: (state) => (slug) => state.categories.find((c) => c.slug === slug)?.label ?? slug,
  },

  actions: {
    async fetchAll(force = false) {
      if (this.loaded && !force) return;
      this.loading = true;
      this.error = null;
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });
        if (error) throw error;
        this.categories = data ?? [];
        this.loaded = true;
      } catch (e) {
        this.error = e.message ?? String(e);
        console.error('[categories] fetchAll', e);
      } finally {
        this.loading = false;
      }
    },

    async addCategory({ label, sort_order }) {
      const slug = slugify(label);
      if (!slug) throw new Error('Geçersiz isim');
      const payload = {
        slug,
        label: label.trim(),
        sort_order: Number.isFinite(sort_order) ? sort_order : 9999,
      };
      const { data, error } = await supabase
        .from('categories')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      this.categories.push(data);
      return data;
    },

    async updateCategory(id, patch) {
      const payload = { ...patch };
      if (payload.label) payload.label = payload.label.trim();
      const { data, error } = await supabase
        .from('categories')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      const idx = this.categories.findIndex((c) => c.id === id);
      if (idx >= 0) this.categories[idx] = data;
      return data;
    },

    async deleteCategory(id) {
      // Block deletion if any motor still uses this category.
      const cat = this.categories.find((c) => c.id === id);
      if (!cat) return;
      const { count, error: countErr } = await supabase
        .from('motors')
        .select('id', { count: 'exact', head: true })
        .eq('category', cat.slug);
      if (countErr) throw countErr;
      if ((count ?? 0) > 0) {
        throw new Error(
          `Bu kategoride ${count} model var. Önce modelleri başka bir kategoriye taşıyın.`
        );
      }
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      this.categories = this.categories.filter((c) => c.id !== id);
    },
  },
});

// =========================================================================
// Site settings (singleton row, id = 1)
// =========================================================================
const DEFAULT_SETTINGS = {
  id: 1,
  logo_url: null,
  address: '',
  phone: '',
  email: '',
  working_hours: '',
  map_lat: null,
  map_lng: null,
  hero_title: '',
  hero_subtitle: '',
  hero_cta_label: '',
  hero_cta_href: '/katalog',
  hero_image_url: null,
  social_facebook: '',
  social_instagram: '',
  social_youtube: '',
};

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: { ...DEFAULT_SETTINGS },
    loading: false,
    loaded: false,
    saving: false,
    error: null,
  }),

  actions: {
    async fetch(force = false) {
      if (this.loaded && !force) return;
      this.loading = true;
      this.error = null;
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .eq('id', 1)
          .maybeSingle();
        if (error) throw error;
        if (data) this.settings = { ...DEFAULT_SETTINGS, ...data };
        this.loaded = true;
      } catch (e) {
        this.error = e.message ?? String(e);
        console.error('[settings] fetch', e);
      } finally {
        this.loading = false;
      }
    },

    async save(patch) {
      this.saving = true;
      this.error = null;
      try {
        const merged = { ...this.settings, ...patch, id: 1 };
        const { data, error } = await supabase
          .from('site_settings')
          .upsert(merged, { onConflict: 'id' })
          .select()
          .single();
        if (error) throw error;
        this.settings = { ...DEFAULT_SETTINGS, ...data };
        return data;
      } catch (e) {
        this.error = e.message ?? String(e);
        throw e;
      } finally {
        this.saving = false;
      }
    },

    async uploadAsset(file, prefix = 'asset') {
      if (!file) return null;
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(SITE_ASSETS_BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(SITE_ASSETS_BUCKET).getPublicUrl(path);
      return pub.publicUrl;
    },
  },
});

// =========================================================================
// FAQ store — admin-managed Q&A list. RLS filters hidden rows for anon.
// =========================================================================
export const useFaqStore = defineStore('faqs', {
  state: () => ({
    faqs: [],
    loading: false,
    loaded: false,
    error: null,
  }),

  getters: {
    sorted: (state) =>
      [...state.faqs].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999)),
    visibleSorted: (state) =>
      state.faqs
        .filter((f) => f.visible !== false)
        .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999)),
  },

  actions: {
    async fetchAll(force = false) {
      if (this.loaded && !force) return;
      this.loading = true;
      this.error = null;
      try {
        const { data, error } = await supabase
          .from('faqs')
          .select('*')
          .order('sort_order', { ascending: true });
        if (error) throw error;
        this.faqs = data ?? [];
        this.loaded = true;
      } catch (e) {
        this.error = e.message ?? String(e);
        console.error('[faqs] fetchAll', e);
      } finally {
        this.loading = false;
      }
    },

    async addFaq({ question, answer, sort_order = 9999, visible = true }) {
      const payload = { question: question.trim(), answer: answer.trim(), sort_order, visible };
      const { data, error } = await supabase
        .from('faqs')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      this.faqs.push(data);
      return data;
    },

    async updateFaq(id, patch) {
      const payload = { ...patch };
      if (payload.question) payload.question = payload.question.trim();
      if (payload.answer) payload.answer = payload.answer.trim();
      const { data, error } = await supabase
        .from('faqs')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      const idx = this.faqs.findIndex((f) => f.id === id);
      if (idx >= 0) this.faqs[idx] = data;
      return data;
    },

    async deleteFaq(id) {
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      if (error) throw error;
      this.faqs = this.faqs.filter((f) => f.id !== id);
    },
  },
});

// =========================================================================
// Page sections — flexible per-page content blocks (about / contact / faq).
// Each row: { page, kind, eyebrow, title, body, data, sort_order, visible }.
// Anon sees only visible rows (RLS); admin sees everything.
// =========================================================================
export const usePageSectionsStore = defineStore('pageSections', {
  state: () => ({
    sections: [],
    loading: false,
    loaded: false,
    error: null,
  }),

  getters: {
    byPage: (state) => (page) =>
      state.sections
        .filter((s) => s.page === page)
        .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999)),

    visibleByPage: (state) => (page) =>
      state.sections
        .filter((s) => s.page === page && s.visible !== false)
        .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999)),
  },

  actions: {
    async fetchAll(force = false) {
      if (this.loaded && !force) return;
      this.loading = true;
      this.error = null;
      try {
        const { data, error } = await supabase
          .from('page_sections')
          .select('*')
          .order('sort_order', { ascending: true });
        if (error) throw error;
        this.sections = data ?? [];
        this.loaded = true;
      } catch (e) {
        this.error = e.message ?? String(e);
        console.error('[page_sections] fetchAll', e);
      } finally {
        this.loading = false;
      }
    },

    async addSection({ page, kind, eyebrow = null, title = null, body = null, data = {}, sort_order = 9999, visible = true }) {
      const payload = { page, kind, eyebrow, title, body, data, sort_order, visible };
      const { data: row, error } = await supabase
        .from('page_sections')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      this.sections.push(row);
      return row;
    },

    async updateSection(id, patch) {
      const { data, error } = await supabase
        .from('page_sections')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      const idx = this.sections.findIndex((s) => s.id === id);
      if (idx >= 0) this.sections[idx] = data;
      return data;
    },

    async deleteSection(id) {
      const { error } = await supabase.from('page_sections').delete().eq('id', id);
      if (error) throw error;
      this.sections = this.sections.filter((s) => s.id !== id);
    },

    async reorderPage(page, orderedIds) {
      // Persist new sort_order values (10, 20, 30, ...) for the given page.
      // Mutates store rows first for snappy UI, then writes in parallel.
      const next = orderedIds.map((id, idx) => ({ id, sort_order: (idx + 1) * 10 }));
      next.forEach(({ id, sort_order }) => {
        const row = this.sections.find((s) => s.id === id);
        if (row) row.sort_order = sort_order;
      });
      await Promise.all(
        next.map(({ id, sort_order }) =>
          supabase.from('page_sections').update({ sort_order }).eq('id', id)
        )
      );
    },
  },
});
