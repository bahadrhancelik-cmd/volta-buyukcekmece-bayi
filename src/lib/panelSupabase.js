// CDH Motor web paneli (16.11.2026): iPhone uygulamasının tarayıcı sürümü, şimdilik yalnız görüntüleme.
// Sitenin yönetim girişinden ayrı bir oturum tutar (ayrı anahtar, sessionStorage):
// tarayıcı kapanınca oturum düşer, ortak bilgisayarda açık kalmaz.
// Veriyi koruyan bu anahtar değil, Supabase'teki rol kurallarıdır (personel_mi / izleyici_mi).
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let istemci = null;

export function panelSupabase() {
  if (istemci) return istemci;
  let depo;
  try { depo = window.sessionStorage; } catch { depo = undefined; }
  istemci = createClient(url ?? '', anonKey ?? '', {
    auth: {
      storageKey: 'cdh-panel-oturum',
      storage: depo,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
  return istemci;
}

// İzleyici (Volta) hesabı gerçek tablolar yerine müşteri bilgisi maskeli "izleyici_" görünümlerinden okur.
// Uygulamadaki Sunucu.swift ile aynı kural.
export function tabloAdi(ad, izleyici) {
  return izleyici ? `izleyici_${ad}` : ad;
}
