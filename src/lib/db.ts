import { supabase } from './supabase';
import { UserProfile, DayRecord, DayMetrics } from '../types';
import { trackError } from '../services/errorTracking';

function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  if (typeof value === 'object') return value as T;
  return fallback;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

// Mapea una fila cruda de `profiles` (snake_case) al modelo UserProfile (camelCase).
// Compartido entre fetchProfile y la RPC complete_day.
function mapProfileRow(data: any): UserProfile {
  return {
    name: data.name,
    startDate: data.start_date,
    currentDay: data.current_day,
    streak: data.streak,
    maxStreak: data.max_streak,
    xp: data.xp,
    level: data.level,
    graceUsedThisMonth: data.grace_used_this_month,
    graceMonthRef: data.grace_month_ref,
    programActive: data.program_active,
    programCompleted: data.program_completed,
    fitnessLevel: data.fitness_level ?? undefined,
    age: data.age ?? undefined,
    initialWeight: data.initial_weight ?? undefined,
    height: data.height ?? undefined,
    trainingDaysPerWeek: data.training_days_per_week ?? undefined,
    goals: parseJson(data.goals, undefined),
    adaptiveProfile: parseJson(data.adaptive_profile, undefined),
    nutritionProfile: parseJson(data.nutrition_profile, undefined),
    preferredCoachId: data.preferred_coach_id ?? undefined,
    badges: parseJson(data.badges, []),
  };
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return mapProfileRow(data);
}

/**
 * Completa el día actual vía la RPC server-side `complete_day` (anti-cheat).
 * El servidor es la autoridad de la progresión (XP/racha/día): devuelve el perfil
 * actualizado para que el cliente reconcilie su estado optimista con la verdad.
 * Devuelve null si falla (offline/error) — el llamador conserva el estado local.
 */
export async function completeDayRpc(record: DayRecord): Promise<UserProfile | null> {
  const { data, error } = await supabase.rpc('complete_day', {
    p_day_number: record.dayNumber,
    p_task_states: record.taskStates,
    p_mission_states: record.missionStates ?? [],
    p_total_points: record.totalPoints ?? 0,
    p_points_target: record.pointsTarget ?? 30,
  });

  if (error || !data) {
    if (error) trackError(error, { scope: 'db.completeDayRpc', extra: { dayNumber: record.dayNumber } });
    return null;
  }
  // La función devuelve una fila composite; según el shape puede venir como objeto o array.
  return mapProfileRow(Array.isArray(data) ? data[0] : data);
}

export async function upsertProfile(userId: string, profile: UserProfile): Promise<void> {
  const { error } = await supabase.from('profiles').upsert({
    id: userId,
    name: profile.name,
    start_date: profile.startDate,
    current_day: profile.currentDay,
    streak: profile.streak,
    max_streak: profile.maxStreak,
    xp: profile.xp,
    level: profile.level,
    grace_used_this_month: profile.graceUsedThisMonth,
    grace_month_ref: profile.graceMonthRef,
    program_active: profile.programActive,
    program_completed: profile.programCompleted,
    fitness_level: profile.fitnessLevel ?? null,
    age: profile.age ?? null,
    initial_weight: profile.initialWeight ?? null,
    height: profile.height ?? null,
    training_days_per_week: profile.trainingDaysPerWeek ?? null,
    goals: profile.goals ?? null,
    adaptive_profile: profile.adaptiveProfile ?? null,
    nutrition_profile: profile.nutritionProfile ?? null,
    preferred_coach_id: profile.preferredCoachId ?? null,
    badges: profile.badges ?? [],
  });
  if (error) trackError(error, { scope: 'db.upsertProfile', extra: { userId } });
}

// ─── Day records ──────────────────────────────────────────────────────────────

export async function fetchDayRecords(userId: string): Promise<DayRecord[]> {
  const { data, error } = await supabase
    .from('day_records')
    .select('*')
    .eq('user_id', userId)
    .order('day_number', { ascending: true });

  if (error || !data) return [];

  return data.map(r => ({
    dayNumber: r.day_number,
    date: r.date,
    taskStates: r.task_states ?? [],
    missionStates: r.mission_states ?? [],
    totalPoints: r.total_points ?? 0,
    pointsTarget: r.points_target ?? 30,
    completed: r.completed,
    missed: r.missed,
    penaltyCompleted: r.penalty_completed,
  }));
}

export async function upsertDayRecord(userId: string, record: DayRecord): Promise<void> {
  const { error } = await supabase.from('day_records').upsert({
    user_id: userId,
    day_number: record.dayNumber,
    date: record.date,
    task_states: record.taskStates,
    mission_states: record.missionStates ?? [],
    total_points: record.totalPoints ?? 0,
    points_target: record.pointsTarget ?? 30,
    completed: record.completed,
    missed: record.missed,
    penalty_completed: record.penaltyCompleted ?? false,
  }, { onConflict: 'user_id,day_number' });
  if (error) trackError(error, { scope: 'db.upsertDayRecord', extra: { userId, dayNumber: record.dayNumber } });
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export async function upsertMetrics(userId: string, dayNumber: number, metrics: DayMetrics): Promise<void> {
  const { error } = await supabase.from('metrics').upsert({
    user_id: userId,
    day_number: dayNumber,
    weight: metrics.weight ?? null,
    training_minutes: metrics.trainingMinutes ?? null,
    reading_pages: metrics.readingPages ?? null,
    breathing_minutes: metrics.breathingMinutes ?? null,
    sleep_hours: metrics.sleepHours ?? null,
    energy_level: metrics.energyLevel ?? null,
    mood: metrics.mood ?? null,
    notes: metrics.notes ?? null,
  }, { onConflict: 'user_id,day_number' });
  if (error) trackError(error, { scope: 'db.upsertMetrics', extra: { userId, dayNumber } });
}

export async function fetchMetrics(userId: string): Promise<{ dayNumber: number; metrics: DayMetrics }[]> {
  const { data, error } = await supabase
    .from('metrics')
    .select('*')
    .eq('user_id', userId);

  if (error || !data) return [];

  return data.map(r => ({
    dayNumber: r.day_number,
    metrics: {
      weight: r.weight,
      trainingMinutes: r.training_minutes,
      readingPages: r.reading_pages,
      breathingMinutes: r.breathing_minutes,
      sleepHours: r.sleep_hours,
      energyLevel: r.energy_level,
      mood: r.mood,
      notes: r.notes,
    },
  }));
}

// ─── Journal ──────────────────────────────────────────────────────────────────

export async function upsertJournal(userId: string, dayNumber: number, content: string): Promise<void> {
  const { error } = await supabase.from('journal').upsert({
    user_id: userId,
    day_number: dayNumber,
    content,
  }, { onConflict: 'user_id,day_number' });
  if (error) trackError(error, { scope: 'db.upsertJournal', extra: { userId, dayNumber } });
}

export async function fetchJournal(userId: string): Promise<{ dayNumber: number; content: string }[]> {
  const { data, error } = await supabase
    .from('journal')
    .select('*')
    .eq('user_id', userId);

  if (error || !data) return [];

  return data.map(r => ({ dayNumber: r.day_number, content: r.content }));
}

// ─── User data lifecycle ─────────────────────────────────────────────────────

export async function deleteUserData(userId: string): Promise<string | null> {
  const [journalRes, metricsRes, dayRes, profileRes] = await Promise.all([
    supabase.from('journal').delete().eq('user_id', userId),
    supabase.from('metrics').delete().eq('user_id', userId),
    supabase.from('day_records').delete().eq('user_id', userId),
    supabase.from('profiles').delete().eq('id', userId),
  ]);

  const firstError = journalRes.error ?? metricsRes.error ?? dayRes.error ?? profileRes.error;
  if (firstError) {
    // Con Promise.all el borrado puede quedar parcial: registrar qué tablas fallaron.
    trackError(firstError, {
      scope: 'db.deleteUserData',
      severity: 'fatal',
      extra: {
        userId,
        journal: journalRes.error?.message ?? 'ok',
        metrics: metricsRes.error?.message ?? 'ok',
        dayRecords: dayRes.error?.message ?? 'ok',
        profiles: profileRes.error?.message ?? 'ok',
      },
    });
  }
  return firstError ? firstError.message : null;
}
