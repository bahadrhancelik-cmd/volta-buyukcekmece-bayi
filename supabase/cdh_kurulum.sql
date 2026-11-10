-- CDH Motor Supabase'ine (uygulama veritabanı) internet sitesi tablolarının kurulumu.
-- Alp'in 0001–0007 göçlerinin son hâli tek dosyada; yazma yetkileri uygulamadaki
-- personel_mi() / yonetici_mi() fonksiyonlarına bağlıdır:
--   herkes okur (yalnız görünür kayıtlar), personel (izleyici hariç) düzenler,
--   iletişim mesajlarını personel okur, yalnız yönetici siler.

create or replace function public.site_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;

-- Ürünler
create table if not exists public.motors (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  name          text not null,
  category      text not null,
  price         numeric(10,2) not null check (price >= 0),
  compare_price numeric(10,2),
  colors        text[] not null default '{}',
  photo_colors  text[] not null default '{}',
  images        text[] not null default '{}',
  specs         jsonb not null default '[]'::jsonb,
  in_stock      boolean not null default true,
  featured      boolean not null default false,
  visible       boolean not null default true,
  sort_order    integer not null default 9999,
  description   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists motors_sort_order_idx on public.motors (sort_order);
create index if not exists motors_category_idx   on public.motors (category);
create trigger motors_updated_at before update on public.motors
  for each row execute function public.site_updated_at();

-- Kategoriler
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  label       text not null,
  sort_order  integer not null default 9999,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger categories_updated_at before update on public.categories
  for each row execute function public.site_updated_at();

-- Site ayarları (tek satır)
create table if not exists public.site_settings (
  id                integer primary key default 1 check (id = 1),
  logo_url          text,
  address           text,
  phone             text,
  email             text,
  working_hours     text,
  map_lat           numeric(9,6),
  map_lng           numeric(9,6),
  hero_title        text,
  hero_subtitle     text,
  hero_cta_label    text,
  hero_cta_href     text,
  hero_image_url    text,
  social_facebook   text,
  social_instagram  text,
  social_youtube    text,
  updated_at        timestamptz not null default now()
);
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.site_updated_at();

-- SSS
create table if not exists public.faqs (
  id          uuid primary key default gen_random_uuid(),
  question    text not null,
  answer      text not null,
  sort_order  integer not null default 9999,
  visible     boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger faqs_updated_at before update on public.faqs
  for each row execute function public.site_updated_at();

-- Sayfa bölümleri (Hakkımızda, İletişim, SSS)
create table if not exists public.page_sections (
  id          uuid primary key default gen_random_uuid(),
  page        text not null,
  kind        text not null,
  eyebrow     text,
  title       text,
  body        text,
  data        jsonb not null default '{}'::jsonb,
  sort_order  integer not null default 9999,
  visible     boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists page_sections_sort_idx on public.page_sections (page, sort_order);
create trigger page_sections_updated_at before update on public.page_sections
  for each row execute function public.site_updated_at();

-- İletişim formu mesajları
create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) <= 200),
  phone       text not null check (char_length(phone) <= 40),
  message     text not null check (char_length(message) <= 5000),
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);

-- Güvenlik kuralları (ziyaretçi = anon personel_mi() çağıramaz; okuma kuralı bu yüzden ikiye ayrıldı)
alter table public.motors           enable row level security;
alter table public.categories       enable row level security;
alter table public.site_settings    enable row level security;
alter table public.faqs             enable row level security;
alter table public.page_sections    enable row level security;
alter table public.contact_messages enable row level security;

create policy "site motors herkes okur"   on public.motors for select to anon using (visible);
create policy "site motors personel okur" on public.motors for select to authenticated using (visible or (select public.personel_mi()));
create policy "site motors personel" on public.motors for insert to authenticated with check ((select public.personel_mi()));
create policy "site motors guncelle" on public.motors for update to authenticated using ((select public.personel_mi())) with check ((select public.personel_mi()));
create policy "site motors siler"    on public.motors for delete to authenticated using ((select public.personel_mi()));

create policy "site kategori okunur"  on public.categories for select using (true);
create policy "site kategori ekler"   on public.categories for insert to authenticated with check ((select public.personel_mi()));
create policy "site kategori gunceller" on public.categories for update to authenticated using ((select public.personel_mi())) with check ((select public.personel_mi()));
create policy "site kategori siler"   on public.categories for delete to authenticated using ((select public.personel_mi()));

create policy "site ayar okunur"    on public.site_settings for select using (true);
create policy "site ayar ekler"     on public.site_settings for insert to authenticated with check ((select public.personel_mi()));
create policy "site ayar gunceller" on public.site_settings for update to authenticated using ((select public.personel_mi())) with check ((select public.personel_mi()));

create policy "site sss herkes okur"   on public.faqs for select to anon using (visible);
create policy "site sss personel okur" on public.faqs for select to authenticated using (visible or (select public.personel_mi()));
create policy "site sss ekler"     on public.faqs for insert to authenticated with check ((select public.personel_mi()));
create policy "site sss gunceller" on public.faqs for update to authenticated using ((select public.personel_mi())) with check ((select public.personel_mi()));
create policy "site sss siler"     on public.faqs for delete to authenticated using ((select public.personel_mi()));

create policy "site sayfa herkes okur"   on public.page_sections for select to anon using (visible);
create policy "site sayfa personel okur" on public.page_sections for select to authenticated using (visible or (select public.personel_mi()));
create policy "site sayfa ekler"     on public.page_sections for insert to authenticated with check ((select public.personel_mi()));
create policy "site sayfa gunceller" on public.page_sections for update to authenticated using ((select public.personel_mi())) with check ((select public.personel_mi()));
create policy "site sayfa siler"     on public.page_sections for delete to authenticated using ((select public.personel_mi()));

create policy "site mesaj gonderilir" on public.contact_messages for insert to anon, authenticated with check (true);
create policy "site mesaj okunur"     on public.contact_messages for select to authenticated using ((select public.personel_mi()));
create policy "site mesaj gunceller"  on public.contact_messages for update to authenticated using ((select public.personel_mi())) with check ((select public.personel_mi()));
create policy "site mesaj siler"      on public.contact_messages for delete to authenticated using ((select public.yonetici_mi()));

-- Fotoğraf ve logo depoları (herkese açık okuma)
insert into storage.buckets (id, name, public) values ('motor-photos', 'motor-photos', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('site-assets',  'site-assets',  true) on conflict (id) do nothing;

create policy "site foto yukler"   on storage.objects for insert to authenticated with check (bucket_id in ('motor-photos','site-assets') and (select public.personel_mi()));
create policy "site foto gunceller" on storage.objects for update to authenticated using (bucket_id in ('motor-photos','site-assets') and (select public.personel_mi()));
create policy "site foto siler"    on storage.objects for delete to authenticated using (bucket_id in ('motor-photos','site-assets') and (select public.personel_mi()));

-- 10.11.2026 eklemeleri (Supabase'te "site_uygulama_baglantisi" ve "site_gelince_haber_ver" göçleri):
-- * motors.app_model: site ürünü ↔ uygulama modeli (model_fiyatlari.model).
-- * site_motor_senkron(): price = güncel (yoksa tavsiye), compare_price = tavsiye (yüksekse, üstü çizili),
--   in_stock = motorlar'da durum='Stokta' kayıt var mı. model_fiyatlari / motorlar / motors.app_model
--   değişince tetikleyicilerle çalışır.
-- * site_haber_ver(p_motor, p_ad, p_telefon): anon çağırabilir; uygulamadaki talepler tablosuna
--   "İnternet sitesi: stoğa gelince haber verilecek" notuyla kayıt açar (aynı numara+ürün günde 1, saatte 30 sınırı).
