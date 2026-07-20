begin;

-- Extend canonical metrics table to preserve legacy fields used by AppContext.
alter table public.user_metrics
  add column if not exists training_minutes integer,
  add column if not exists breathing_minutes integer,
  add column if not exists sleep_hours numeric,
  add column if not exists energy_level integer check (energy_level between 1 and 10),
  add column if not exists mood integer check (mood between 1 and 5),
  add column if not exists notes text;

-- Backfill metrics(day_number) -> user_metrics(date), using profile start_date.
insert into public.user_metrics (
  user_id,
  date,
  current_weight,
  reading_pages,
  meditation_minutes,
  training_minutes,
  breathing_minutes,
  sleep_hours,
  energy_level,
  mood,
  notes
)
select
  m.user_id,
  (p.start_date + ((m.day_number - 1) * interval '1 day'))::date as date,
  m.weight as current_weight,
  m.reading_pages,
  m.breathing_minutes as meditation_minutes,
  m.training_minutes,
  m.breathing_minutes,
  m.sleep_hours,
  m.energy_level,
  m.mood,
  m.notes
from public.metrics m
join public.profiles p on p.id = m.user_id
on conflict (user_id, date) do update
set
  current_weight = coalesce(excluded.current_weight, public.user_metrics.current_weight),
  reading_pages = coalesce(excluded.reading_pages, public.user_metrics.reading_pages),
  meditation_minutes = coalesce(excluded.meditation_minutes, public.user_metrics.meditation_minutes),
  training_minutes = coalesce(excluded.training_minutes, public.user_metrics.training_minutes),
  breathing_minutes = coalesce(excluded.breathing_minutes, public.user_metrics.breathing_minutes),
  sleep_hours = coalesce(excluded.sleep_hours, public.user_metrics.sleep_hours),
  energy_level = coalesce(excluded.energy_level, public.user_metrics.energy_level),
  mood = coalesce(excluded.mood, public.user_metrics.mood),
  notes = coalesce(excluded.notes, public.user_metrics.notes);

-- Backfill journal(day_number) -> journal_entries(date).
insert into public.journal_entries (
  user_id,
  date,
  reflection,
  tags
)
select
  j.user_id,
  (p.start_date + ((j.day_number - 1) * interval '1 day'))::date as date,
  j.content as reflection,
  '{}'::text[] as tags
from public.journal j
join public.profiles p on p.id = j.user_id
where coalesce(j.content, '') <> ''
on conflict (user_id, date) do update
set reflection = excluded.reflection;

-- Allow delete operations for canonical tables (used by reset/delete flows).
drop policy if exists "user_metrics_delete_own" on public.user_metrics;
create policy "user_metrics_delete_own"
  on public.user_metrics
  for delete
  using (auth.uid() = user_id);

drop policy if exists "journal_entries_delete_own" on public.journal_entries;
create policy "journal_entries_delete_own"
  on public.journal_entries
  for delete
  using (auth.uid() = user_id);

grant delete on public.user_metrics to authenticated;
grant delete on public.journal_entries to authenticated;

commit;
