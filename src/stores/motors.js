// Pinia stores: motor inventory + admin auth, backed by Supabase.
// Public site reads via the anon key; admin writes require an authenticated session.
import { defineStore } from 'pinia';
import { supabase, PHOTOS_BUCKET } from '../lib/supabase';
import { slugify } from '../data/seed';
import { motorUrl } from '../lib/motorUrl';

// DB <-> app field mapping (DB uses snake_case, app uses camelCase).
function mapFromDb(row) {
  return {
    id: row.id,
    slug: row.slug,
    url: motorUrl(row.name, row.slug),
    name: row.name,
    category: row.category,
    price: Number(row.price),
    comparePrice: row.compare_price == null ? null : Number(row.compare_price),
    specs: Array.isArray(row.specs) ? row.specs : [],
    colors: row.colors ?? [],
    inStock: row.in_stock,
    featured: row.featured,
    visible: row.visible ?? true,
    order: row.sort_order,
    description: row.description ?? '',
    photos: row.images ?? [],
    photoColors: row.photo_colors ?? [],
  };
}

function mapToDb(m) {
  return {
    slug: m.slug,
    name: m.name,
    category: m.category,
    price: m.price,
    compare_price: m.comparePrice == null || m.comparePrice === '' ? null : Number(m.comparePrice),
    specs: Array.isArray(m.specs)
      ? m.specs
          .map((s) => ({
            label: String(s.label || '').trim(),
            value: String(s.value ?? '').trim(),
            unit: String(s.unit ?? '').trim(),
          }))
          .filter((s) => s.label && s.value)
      : [],
    colors: m.colors ?? [],
    in_stock: m.inStock,
    featured: m.featured,
    visible: m.visible ?? true,
    sort_order: m.order ?? 9999,
    description: m.description ?? null,
    images: Array.isArray(m.photos) ? m.photos : [],
    photo_colors: Array.isArray(m.photoColors) ? m.photoColors : [],
  };
}

export const useMotorStore = defineStore('motors', {
  state: () => ({
    motors: [],
    loading: false,
    loaded: false,
    error: null,
  }),

  getters: {
    sorted: (state) => [...state.motors].sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
    bySlug: (state) => (slug) => state.motors.find((m) => m.url === slug) || state.motors.find((m) => m.slug === slug),
    byCategory: (state) => (cat) => state.motors.filter((m) => m.category === cat),
    featured: (state) => state.motors.filter((m) => m.featured && m.inStock),
    stats: (state) => ({
      total: state.motors.length,
      inStock: state.motors.filter((m) => m.inStock).length,
      featured: state.motors.filter((m) => m.featured).length,
    }),
  },

  actions: {
    async fetchAll(force = false) {
      if (this.loaded && !force) return;
      this.loading = true;
      this.error = null;
      try {
        const { data, error } = await supabase
          .from('motors')
          .select('*')
          .order('sort_order', { ascending: true });
        if (error) throw error;
        this.motors = (data ?? []).map(mapFromDb);
        this.loaded = true;
      } catch (e) {
        this.error = e.message ?? String(e);
        console.error('[motors] fetchAll', e);
      } finally {
        this.loading = false;
      }
    },

    async addMotor(motor) {
      const slug = slugify(motor.name) || `motor-${Date.now()}`;
      const payload = mapToDb({ ...motor, slug });
      const { data, error } = await supabase
        .from('motors')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      const created = mapFromDb(data);
      this.motors.push(created);
      return created;
    },

    async updateMotor(id, patch) {
      const current = this.motors.find((m) => m.id === id);
      if (!current) throw new Error('Motor not found: ' + id);
      const merged = { ...current, ...patch };
      const payload = mapToDb(merged);
      const { data, error } = await supabase
        .from('motors')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      const updated = mapFromDb(data);
      const idx = this.motors.findIndex((m) => m.id === id);
      if (idx >= 0) this.motors[idx] = updated;
      return updated;
    },

    async deleteMotor(id) {
      const { error } = await supabase.from('motors').delete().eq('id', id);
      if (error) throw error;
      this.motors = this.motors.filter((m) => m.id !== id);
    },

    async reorderMotors(nextList) {
      const ordered = nextList.map((m, i) => ({ ...m, order: i + 1 }));
      this.motors = ordered;
      const updates = ordered.map((m) =>
        supabase.from('motors').update({ sort_order: m.order }).eq('id', m.id)
      );
      const results = await Promise.all(updates);
      const firstErr = results.find((r) => r.error);
      if (firstErr) {
        console.error('[motors] reorder error', firstErr.error);
        await this.fetchAll(true);
        throw firstErr.error;
      }
    },

    async uploadPhoto(file) {
      if (!file) return null;
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(path);
      return pub.publicUrl;
    },
  },
});

// =========================================================================
// Auth store — wraps Supabase Auth.
// Sign-ups must be DISABLED in the Supabase dashboard so only the dealer's
// pre-created admin account can sign in.
// =========================================================================
export const useAuthStore = defineStore('auth', {
  state: () => ({
    session: null,
    loading: false,
    error: null,
    initialized: false,
  }),

  getters: {
    isAuthed: (state) => !!state.session,
    user: (state) => state.session?.user ?? null,
  },

  actions: {
    async init() {
      if (this.initialized) return;
      this.initialized = true;
      const { data } = await supabase.auth.getSession();
      this.session = data.session;
      supabase.auth.onAuthStateChange((_event, session) => {
        this.session = session;
      });
    },

    async login(email, password) {
      this.loading = true;
      this.error = null;
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        this.session = data.session;
        return true;
      } catch (e) {
        this.error = e.message ?? String(e);
        return false;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      await supabase.auth.signOut();
      this.session = null;
    },
  },
});
