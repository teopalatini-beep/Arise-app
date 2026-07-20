begin;

-- Ensure required day_records fields exist in environments where
-- schema.sql has not yet been patched with mission-based columns.
alter table public.day_records
  add column if not exists mission_states jsonb not null default '[]'::jsonb,
  add column if not exists total_points int not null default 0,
  add column if not exists points_target int not null default 30;

-- Retire legacy RPC path to keep a single secure engine endpoint.
drop function if exists public.submit_mission_progress(text, int, int, boolean);

-- Keep this helper aligned with frontend progression math.
create or replace function public.level_from_xp(p_xp int)
returns int
language plpgsql
immutable
strict
as $$
declare
  v_level int := 1;
begin
  while p_xp >= (v_level + 1) * (v_level + 1) * 100 loop
    v_level := v_level + 1;
  end loop;
  return v_level;
end;
$$;

create or replace function public.complete_user_mission_secure(
  p_task_id text,
  p_day_number int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_profile public.profiles%rowtype;
  v_record public.day_records%rowtype;
  v_old_task_states jsonb := '[]'::jsonb;
  v_new_task_states jsonb := '[]'::jsonb;
  v_old_mission_states jsonb := '[]'::jsonb;
  v_new_mission_states jsonb := '[]'::jsonb;
  v_task_already_completed boolean := false;
  v_points_target int := 30;
  v_total_points int := 0;
  v_was_completed boolean := false;
  v_is_completed boolean := false;
  v_xp_earned int := 0;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'UNAUTHORIZED: Authentication required';
  end if;

  if p_task_id is null or btrim(p_task_id) = '' then
    raise exception 'INVALID_TASK: p_task_id is required';
  end if;

  if p_day_number is null or p_day_number < 1 or p_day_number > 90 then
    raise exception 'INVALID_DAY: p_day_number must be between 1 and 90';
  end if;

  select *
  into v_profile
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'NOT_FOUND: Profile does not exist for this user';
  end if;

  -- Penitence guard: if today's record is marked missed and penalty is pending,
  -- block normal mission progress.
  if exists (
    select 1
    from public.day_records dr
    where dr.user_id = v_user_id
      and dr.day_number = v_profile.current_day
      and dr.missed = true
      and coalesce(dr.penalty_completed, false) = false
  ) then
    raise exception 'BLOCKED_PENITENCE: Complete your penalty before earning new points';
  end if;

  select *
  into v_record
  from public.day_records
  where user_id = v_user_id
    and day_number = p_day_number
  for update;

  if found then
    v_old_task_states := coalesce(v_record.task_states, '[]'::jsonb);
    v_old_mission_states := coalesce(v_record.mission_states, '[]'::jsonb);
    v_points_target := coalesce(v_record.points_target, 30);
    v_was_completed := v_record.completed;
  end if;

  -- Prevent duplicate reward for the same mission/task in the same day.
  select exists (
    select 1
    from jsonb_array_elements(v_old_task_states) as ts
    where ts->>'taskId' = p_task_id
      and coalesce((ts->>'completed')::boolean, false) = true
  )
  into v_task_already_completed;

  select coalesce(jsonb_agg(ts), '[]'::jsonb)
  into v_new_task_states
  from (
    select ts
    from jsonb_array_elements(v_old_task_states) as ts
    where ts->>'taskId' <> p_task_id
    union all
    select jsonb_build_object('taskId', p_task_id, 'completed', true)
  ) rows(ts);

  select coalesce(jsonb_agg(ms), '[]'::jsonb)
  into v_new_mission_states
  from (
    select ms
    from jsonb_array_elements(v_old_mission_states) as ms
    where ms->>'missionId' <> p_task_id
    union all
    select jsonb_build_object('missionId', p_task_id, 'units', 1, 'points', 10)
  ) rows(ms);

  select coalesce(sum((ms->>'points')::int), 0)
  into v_total_points
  from jsonb_array_elements(v_new_mission_states) as ms;

  v_is_completed := v_total_points >= v_points_target;
  v_xp_earned := case when v_task_already_completed then 0 else 10 end;

  insert into public.day_records (
    user_id,
    day_number,
    date,
    task_states,
    mission_states,
    total_points,
    points_target,
    completed
  )
  values (
    v_user_id,
    p_day_number,
    current_date,
    v_new_task_states,
    v_new_mission_states,
    v_total_points,
    v_points_target,
    v_is_completed
  )
  on conflict (user_id, day_number) do update
  set
    task_states = excluded.task_states,
    mission_states = excluded.mission_states,
    total_points = excluded.total_points,
    points_target = excluded.points_target,
    completed = excluded.completed,
    updated_at = now();

  update public.profiles
  set
    xp = xp + v_xp_earned,
    level = public.level_from_xp(xp + v_xp_earned),
    streak = case
      when v_is_completed and not v_was_completed then streak + 1
      else streak
    end,
    max_streak = case
      when v_is_completed and not v_was_completed then greatest(max_streak, streak + 1)
      else max_streak
    end,
    current_day = case
      when v_is_completed and not v_was_completed then least(current_day + 1, 91)
      else current_day
    end,
    program_completed = case
      when v_is_completed and not v_was_completed and current_day + 1 > 90 then true
      else program_completed
    end,
    updated_at = now()
  where id = v_user_id
  returning * into v_profile;

  return jsonb_build_object(
    'xp_earned', v_xp_earned,
    'day_completed', (v_is_completed and not v_was_completed),
    'profile', jsonb_build_object(
      'xp', v_profile.xp,
      'level', v_profile.level,
      'streak', v_profile.streak,
      'max_streak', v_profile.max_streak,
      'current_day', v_profile.current_day,
      'program_completed', v_profile.program_completed
    ),
    'day_record', jsonb_build_object(
      'day_number', p_day_number,
      'total_points', v_total_points,
      'points_target', v_points_target,
      'completed', v_is_completed,
      'task_states', v_new_task_states,
      'mission_states', v_new_mission_states
    )
  );
end;
$$;

revoke all on function public.complete_user_mission_secure(text, int) from public;
grant execute on function public.complete_user_mission_secure(text, int) to authenticated;

commit;
