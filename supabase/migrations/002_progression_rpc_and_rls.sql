-- ─────────────────────────────────────────────────────────────────────────────
-- 002 — Anti-cheat de progresión: RPC server-side + endurecimiento de RLS
--
-- Problema que resuelve:
--   Hoy `profiles` tiene una policy amplia ("Users can manage own profile", FOR ALL)
--   que coexiste con la policy anti-cheat. Como las policies permisivas se combinan
--   con OR, un cliente con la anon key puede hacer:
--       update profiles set xp = 999999, streak = 90, current_day = 90;
--   y pasar por la policy amplia. El anti-cheat queda neutralizado.
--
-- Solución:
--   1. La progresión (xp, streak, max_streak, level, current_day, program_*) SOLO
--      puede escribirse vía la función `complete_day` (SECURITY DEFINER → bypassa RLS).
--   2. El cliente pierde el permiso de escribir columnas de progresión directamente:
--      se elimina la policy amplia y se fija un WITH CHECK que congela esas columnas.
--   3. El cliente conserva SELECT / INSERT / DELETE propios y UPDATE de campos
--      no-progresivos (nombre, datos físicos, coach, etc.).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── RPC: completar el día actual (autoridad de progresión en el servidor) ──────
create or replace function public.complete_day(
  p_day_number    int,
  p_task_states   jsonb default '[]'::jsonb,
  p_mission_states jsonb default '[]'::jsonb,
  p_total_points  int  default 0,
  p_points_target int  default 30
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_profile   public.profiles;
  v_completed boolean;
  v_xp_award  int;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  -- Bloqueo de fila para evitar condiciones de carrera en la progresión
  select * into v_profile from public.profiles where id = v_uid for update;
  if not found then
    raise exception 'profile not found';
  end if;

  -- Guard 1: solo se puede completar el día ACTUAL del usuario
  if p_day_number <> v_profile.current_day then
    raise exception 'solo se puede completar el día actual (esperado %, recibido %)',
      v_profile.current_day, p_day_number;
  end if;

  -- Guard 2: no se puede re-completar un día ya completado
  if exists (
    select 1 from public.day_records
    where user_id = v_uid and day_number = p_day_number and completed = true
  ) then
    raise exception 'el día % ya estaba completado', p_day_number;
  end if;

  v_completed := p_total_points >= p_points_target;

  -- Persistir el day_record (los puntos se guardan como los reporta el cliente;
  -- ver NOTA de hardening al final sobre recomputar puntos server-side).
  insert into public.day_records (
    user_id, day_number, date, task_states, mission_states,
    total_points, points_target, completed, missed, penalty_completed
  ) values (
    v_uid, p_day_number, current_date, p_task_states, p_mission_states,
    p_total_points, p_points_target, v_completed, false, false
  )
  on conflict (user_id, day_number) do update set
    task_states   = excluded.task_states,
    mission_states = excluded.mission_states,
    total_points  = excluded.total_points,
    points_target = excluded.points_target,
    completed     = excluded.completed;

  -- La recompensa se otorga SOLO si el día está realmente completo, y el monto
  -- de XP lo calcula el servidor (el cliente no puede influir en cuánto suma).
  if v_completed then
    v_xp_award := 50 + (p_day_number / 10) * 10;  -- espeja xpForDay() del cliente

    update public.profiles p set
      xp                = p.xp + v_xp_award,
      streak            = p.streak + 1,
      max_streak        = greatest(p.max_streak, p.streak + 1),
      current_day       = least(p.current_day + 1, 90),
      program_completed = (least(p.current_day + 1, 90) >= 90),
      level             = greatest(1, floor(sqrt((p.xp + v_xp_award)::numeric / 100.0))::int)
    where p.id = v_uid
    returning p.* into v_profile;
  end if;

  return v_profile;
end;
$$;

-- Solo usuarios autenticados pueden invocarla
revoke all on function public.complete_day(int, jsonb, jsonb, int, int) from public;
grant execute on function public.complete_day(int, jsonb, jsonb, int, int) to authenticated;

-- ── Endurecimiento de RLS en profiles ─────────────────────────────────────────
-- Eliminar la policy amplia que habilita el bypass (OR con la anti-cheat)
drop policy if exists "Users can manage own profile" on public.profiles;
drop policy if exists "profiles own rows" on public.profiles;  -- baseline vieja de schema.sql

-- SELECT propio
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

-- INSERT propio (alta inicial del perfil)
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

-- DELETE propio (necesario para deleteUserData / borrado de cuenta)
drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles
  for delete using (auth.uid() = id);

-- UPDATE propio, pero con las columnas de progresión CONGELADAS: solo la RPC
-- (SECURITY DEFINER) puede modificarlas. El cliente solo edita campos "de perfil".
drop policy if exists profiles_update_non_progression_own on public.profiles;
create policy profiles_update_non_progression_own on public.profiles
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and xp                = (select p.xp                from public.profiles p where p.id = profiles.id)
    and streak            = (select p.streak            from public.profiles p where p.id = profiles.id)
    and max_streak        = (select p.max_streak        from public.profiles p where p.id = profiles.id)
    and level             = (select p.level             from public.profiles p where p.id = profiles.id)
    and current_day       = (select p.current_day       from public.profiles p where p.id = profiles.id)
    and program_completed = (select p.program_completed from public.profiles p where p.id = profiles.id)
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTA de hardening futuro (residual conocido):
--   La RPC confía en `p_total_points` reportado por el cliente para decidir
--   `v_completed`. Un cliente malicioso podría reportar total_points >= target sin
--   haber hecho el trabajo. Esto ya elimina el exploit grave (xp arbitrario, salto
--   a día 90, badges falsos), pero el cierre total requiere recomputar los puntos
--   server-side desde un catálogo de misiones (tabla mission_catalog). Queda como
--   iteración siguiente si se decide llevar el anti-cheat a grado "competitivo".
-- ─────────────────────────────────────────────────────────────────────────────
