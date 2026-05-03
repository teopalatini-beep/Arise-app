-- ARISE backend schema (Supabase / Postgres)
-- Run this in Supabase SQL Editor.

-- ── Profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Usuario',
  start_date date not null default current_date,
  current_day int not null default 1,
  streak int not null default 0,
  max_streak int not null default 0,
  xp int not null default 0,
  level int not null default 1,
  grace_used_this_month boolean not null default false,
  grace_month_ref text not null default to_char(current_date, 'YYYY-MM'),
  program_active boolean not null default true,
  program_completed boolean not null default false,
  fitness_level text,
  age int,
  initial_weight numeric,
  height numeric,
  training_days_per_week int,
  goals jsonb,
  adaptive_profile jsonb,
  nutrition_profile jsonb,
  preferred_coach_id text,
  badges jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Day records ─────────────────────────────────────────────────────────────
create table if not exists public.day_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  day_number int not null check (day_number between 1 and 90),
  date date not null,
  task_states jsonb not null default '[]'::jsonb,
  completed boolean not null default false,
  missed boolean not null default false,
  penalty_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, day_number)
);

-- ── Metrics ─────────────────────────────────────────────────────────────────
create table if not exists public.metrics (
  user_id uuid not null references auth.users(id) on delete cascade,
  day_number int not null check (day_number between 1 and 90),
  weight numeric,
  training_minutes int,
  reading_pages int,
  breathing_minutes int,
  sleep_hours numeric,
  energy_level int check (energy_level between 1 and 10),
  mood int check (mood between 1 and 5),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, day_number)
);

-- ── Journal ─────────────────────────────────────────────────────────────────
create table if not exists public.journal (
  user_id uuid not null references auth.users(id) on delete cascade,
  day_number int not null check (day_number between 1 and 90),
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, day_number)
);

-- ── Updated_at trigger ─────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_day_records_updated_at on public.day_records;
create trigger trg_day_records_updated_at
before update on public.day_records
for each row execute function public.set_updated_at();

drop trigger if exists trg_metrics_updated_at on public.metrics;
create trigger trg_metrics_updated_at
before update on public.metrics
for each row execute function public.set_updated_at();

drop trigger if exists trg_journal_updated_at on public.journal;
create trigger trg_journal_updated_at
before update on public.journal
for each row execute function public.set_updated_at();

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.day_records enable row level security;
alter table public.metrics enable row level security;
alter table public.journal enable row level security;

drop policy if exists "profiles own rows" on public.profiles;
create policy "profiles own rows"
on public.profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "day_records own rows" on public.day_records;
create policy "day_records own rows"
on public.day_records
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "metrics own rows" on public.metrics;
create policy "metrics own rows"
on public.metrics
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "journal own rows" on public.journal;
create policy "journal own rows"
on public.journal
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

