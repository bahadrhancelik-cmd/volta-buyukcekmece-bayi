-- Volta Büyükçekmece Bayi — contact_messages
-- Audit log for /iletisim contact-form submissions. The email itself is sent
-- by the api/contact serverless function (Resend); this table is a best-effort
-- backup so leads are never lost if email delivery fails.
-- Run AFTER 0006_page_sections.sql. Idempotent.

-- =========================================================================
-- 1. contact_messages table
-- =========================================================================
create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text not null,
  message     text not null,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists contact_messages_created_idx
  on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

-- Anyone (anon) may submit the public form, but nobody anonymous may read
-- back the stored leads — that protects customer PII (name + phone).
drop policy if exists "contact_messages anon insert"   on public.contact_messages;
drop policy if exists "contact_messages authed select" on public.contact_messages;
drop policy if exists "contact_messages authed update" on public.contact_messages;
drop policy if exists "contact_messages authed delete" on public.contact_messages;

create policy "contact_messages anon insert"
  on public.contact_messages for insert
  to anon
  with check (true);

create policy "contact_messages authed select"
  on public.contact_messages for select
  to authenticated
  using (true);

create policy "contact_messages authed update"
  on public.contact_messages for update
  to authenticated
  using (true) with check (true);

create policy "contact_messages authed delete"
  on public.contact_messages for delete
  to authenticated
  using (true);
