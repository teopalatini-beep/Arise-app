begin;

-- Lock direct client-side progression writes.
-- Server-authoritative progression must flow through SECURITY DEFINER RPCs.

alter table public.profiles enable row level security;

drop policy if exists "profiles own rows" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_non_progression_own" on public.profiles;

create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "profiles_update_non_progression_own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and xp = (
      select p.xp
      from public.profiles as p
      where p.id = public.profiles.id
    )
    and streak = (
      select p.streak
      from public.profiles as p
      where p.id = public.profiles.id
    )
    and current_day = (
      select p.current_day
      from public.profiles as p
      where p.id = public.profiles.id
    )
  );

comment on policy "profiles_update_non_progression_own" on public.profiles
  is 'Authenticated users can update own profile but cannot mutate progression fields (xp, streak, current_day) directly.';

commit;
