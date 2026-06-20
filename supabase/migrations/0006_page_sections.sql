-- Volta Büyükçekmece Bayi — page_sections
-- Per-page editable sections for /hakkimizda, /iletisim, /sss.
-- Admin can reorder via drag-and-drop and edit content per section.
-- Run AFTER 0005_specs_jsonb.sql. Idempotent.

-- =========================================================================
-- 1. page_sections table
-- =========================================================================
create table if not exists public.page_sections (
  id          uuid primary key default gen_random_uuid(),
  page        text not null,                       -- 'about' | 'contact' | 'faq'
  kind        text not null,                       -- see admin views
  eyebrow     text,
  title       text,
  body        text,                                -- plain or HTML
  data        jsonb not null default '{}'::jsonb,  -- items[], cta_*, etc.
  sort_order  integer not null default 9999,
  visible     boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists page_sections_page_idx on public.page_sections (page);
create index if not exists page_sections_sort_idx on public.page_sections (page, sort_order);

drop trigger if exists page_sections_set_updated_at on public.page_sections;
create trigger page_sections_set_updated_at
  before update on public.page_sections
  for each row execute function public.set_updated_at();

alter table public.page_sections enable row level security;

drop policy if exists "page_sections public read"   on public.page_sections;
drop policy if exists "page_sections authed select" on public.page_sections;
drop policy if exists "page_sections authed insert" on public.page_sections;
drop policy if exists "page_sections authed update" on public.page_sections;
drop policy if exists "page_sections authed delete" on public.page_sections;

create policy "page_sections public read"
  on public.page_sections for select
  using (visible);

create policy "page_sections authed select"
  on public.page_sections for select
  to authenticated
  using (true);

create policy "page_sections authed insert"
  on public.page_sections for insert
  to authenticated
  with check (true);

create policy "page_sections authed update"
  on public.page_sections for update
  to authenticated
  using (true) with check (true);

create policy "page_sections authed delete"
  on public.page_sections for delete
  to authenticated
  using (true);

-- =========================================================================
-- 2. Seed defaults — mirrors current hardcoded copy so existing site
--    is preserved after migration. Skipped if page already has rows.
-- =========================================================================
do $$
begin
  if not exists (select 1 from public.page_sections where page = 'about') then
    insert into public.page_sections (page, kind, eyebrow, title, body, sort_order) values
      ('about', 'hero',
       'Hakkımızda',
       'Büyükçekmece''nin elektrikli mobilite adresi.',
       'Volta Motor yetkili bayisi olarak 2014''ten bu yana Büyükçekmece ve çevresinde elektrikli ulaşımın yaygınlaşmasına katkı sağlıyoruz.',
       10);

    insert into public.page_sections (page, kind, title, body, sort_order) values
      ('about', 'rich', 'Hikâyemiz',
       '<p>Aile şirketi olarak yola çıktığımız ilk günden bu yana inandığımız bir şey var: şehirlerin geleceği sessiz, temiz ve elektrikli. 2014''te kurduğumuz showroom''umuz, bugün üç kategoride toplam 30+ farklı modeli tek çatı altında buluşturuyor.</p><p>Sadece satış değil, satış sonrası destek, periyodik bakım ve yedek parça konusunda da bölgenin en kapsamlı hizmetini sunmayı hedefliyoruz.</p>',
       20);

    insert into public.page_sections (page, kind, data, sort_order) values
      ('about', 'stats',
       '{"items":[
          {"value":"2014","label":"Kuruluş"},
          {"value":"3.500+","label":"Mutlu müşteri"},
          {"value":"30+","label":"Aktif model"},
          {"value":"2","label":"Servis noktası"}
        ]}'::jsonb,
       30);

    insert into public.page_sections (page, kind, eyebrow, title, data, sort_order) values
      ('about', 'cards',
       'Değerlerimiz',
       'Nasıl çalışıyoruz',
       '{"items":[
          {"title":"Şeffaflık","description":"Fiyat, garanti ve servis koşulları konusunda net iletişim. Sürpriz yok."},
          {"title":"Uzun vadeli ilişki","description":"Aracın size tesliminden sonra başlayan bir ilişki kurmayı hedefliyoruz."},
          {"title":"Sürdürülebilirlik","description":"Sattığımız her elektrikli araç şehre nefes aldırıyor. İşimiz çevreyi gözetiyor."},
          {"title":"Yerel olma","description":"Büyükçekmece''liyiz. Müşterilerimiz komşularımız."}
        ]}'::jsonb,
       40);
  end if;

  if not exists (select 1 from public.page_sections where page = 'contact') then
    insert into public.page_sections (page, kind, eyebrow, title, body, sort_order) values
      ('contact', 'hero',
       'İletişim',
       'Bize ulaşın.',
       'Showroom''umuzu ziyaret edin, telefon edin ya da formu doldurun — en kısa sürede dönüş yapalım.',
       10);

    insert into public.page_sections (page, kind, sort_order) values
      ('contact', 'contact_info', 20);

    insert into public.page_sections (page, kind, sort_order) values
      ('contact', 'map', 30);

    insert into public.page_sections (page, kind, title, sort_order) values
      ('contact', 'contact_form', 'Bize bir mesaj bırakın', 40);
  end if;

  if not exists (select 1 from public.page_sections where page = 'faq') then
    insert into public.page_sections (page, kind, eyebrow, title, body, sort_order) values
      ('faq', 'hero',
       'Sıkça sorulan sorular',
       'Yardım & destek',
       'Showroom, garanti, servis ve ürünlerimiz hakkında en çok sorulan sorular ve cevapları.',
       10);

    insert into public.page_sections (page, kind, sort_order) values
      ('faq', 'faq_list', 20);

    insert into public.page_sections (page, kind, title, body, data, sort_order) values
      ('faq', 'cta',
       'Sorunuz burada yok mu?',
       'Bayimizi arayın ya da iletişim formunu doldurun, hemen yardımcı olalım.',
       '{"cta_label":"İletişime geç →","cta_href":"/iletisim"}'::jsonb,
       30);
  end if;
end $$;
