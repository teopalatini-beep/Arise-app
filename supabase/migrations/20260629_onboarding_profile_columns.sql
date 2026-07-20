-- ARISE Onboarding profile columns
-- Adds first-class onboarding fields to public.profiles
-- Safe to run multiple times.

begin;

alter table public.profiles
  add column if not exists has_completed_onboarding boolean,
  add column if not exists focus_areas text[];

-- Defaults + non-null guarantees for consistent app behavior
alter table public.profiles
  alter column has_completed_onboarding set default false,
  alter column focus_areas set default '{}'::text[];

-- Backfill from legacy goals.__meta payload if present
update public.profiles p
set has_completed_onboarding = true
where coalesce(p.has_completed_onboarding, false) = false
  and lower(coalesce((p.goals::jsonb -> '__meta' ->> 'hasCompletedOnboarding'), 'false')) = 'true';

update public.profiles p
set focus_areas = coalesce(
  (
    select array_agg(area)::text[]
    from jsonb_array_elements_text(
      case
        when jsonb_typeof(p.goals::jsonb -> '__meta' -> 'focusAreas') = 'array'
          then p.goals::jsonb -> '__meta' -> 'focusAreas'
        else '[]'::jsonb
      end
    ) as area
  ),
  '{}'::text[]
)
where (p.focus_areas is null or cardinality(p.focus_areas) = 0)
  and p.goals is not null;

-- Normalize remaining nulls before enforcing NOT NULL
update public.profiles set has_completed_onboarding = false where has_completed_onboarding is null;
update public.profiles set focus_areas = '{}'::text[] where focus_areas is null;

alter table public.profiles
  alter column has_completed_onboarding set not null,
  alter column focus_areas set not null;

comment on column public.profiles.has_completed_onboarding
  is 'True when user completed onboarding flow.';
comment on column public.profiles.focus_areas
  is 'Primary onboarding focus areas selected by user.';

-- Optional but useful if you filter by focus areas in queries
create index if not exists profiles_focus_areas_gin_idx
  on public.profiles using gin (focus_areas);

commit;
