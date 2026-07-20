begin;

create extension if not exists pgcrypto;

create table if not exists public.user_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  current_weight numeric,
  water_liters numeric,
  meditation_minutes numeric,
  reading_pages numeric,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, date)
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  mood text,
  reflection text not null,
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, date)
);

alter table public.user_metrics enable row level security;
alter table public.journal_entries enable row level security;

drop policy if exists "user_metrics_select_own" on public.user_metrics;
create policy "user_metrics_select_own"
  on public.user_metrics
  for select
  using (auth.uid() = user_id);

drop policy if exists "user_metrics_insert_own" on public.user_metrics;
create policy "user_metrics_insert_own"
  on public.user_metrics
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_metrics_update_own" on public.user_metrics;
create policy "user_metrics_update_own"
  on public.user_metrics
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "journal_entries_select_own" on public.journal_entries;
create policy "journal_entries_select_own"
  on public.journal_entries
  for select
  using (auth.uid() = user_id);

drop policy if exists "journal_entries_insert_own" on public.journal_entries;
create policy "journal_entries_insert_own"
  on public.journal_entries
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "journal_entries_update_own" on public.journal_entries;
create policy "journal_entries_update_own"
  on public.journal_entries
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists user_metrics_user_date_idx
  on public.user_metrics (user_id, date desc);

create index if not exists journal_entries_user_date_idx
  on public.journal_entries (user_id, date desc);

grant select, insert, update on public.user_metrics to authenticated;
grant select, insert, update on public.journal_entries to authenticated;

commit;
