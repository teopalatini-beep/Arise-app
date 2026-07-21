import { supabase } from './supabase';
import { UserProfile, DayRecord, DayMetrics, MissionState, SaveDailyMetricsInput, TaskState } from '../types';
import { normalizeCoachId } from './coach';

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

function dateFromDayNumber(startDate: string, dayNumber: number): string {
  const base = new Date(`${startDate}T00:00:00`);
  base.setDate(base.getDate() + (dayNumber - 1));
  return base.toISOString().slice(0, 10);
}

function dayNumberFromDate(startDate: string, isoDate: string): number | null {
  const start = new Date(`${startDate}T00:00:00`);
  const current = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(current.getTime())) return null;
  const diffMs = current.getTime() - start.getTime();
  const dayNumber = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return dayNumber > 0 ? dayNumber : null;
}

async function fetchUserStartDate(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('start_date')
    .eq('id', userId)
    .single();
  if (error || !data?.start_date) return null;
  return data.start_date;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  const rawGoals = parseJson<Record<string, unknown> | undefined>(data.goals, undefined);
  const goals = rawGoals ? { ...rawGoals } : undefined;
  const meta = (goals?.__meta as Record<string, unknown> | undefined) ?? undefined;
  if (goals && '__meta' in goals) {
    delete goals.__meta;
  }

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
    goals: goals as UserProfile['goals'],
    adaptiveProfile: parseJson(data.adaptive_profile, undefined),
    nutritionProfile: parseJson(data.nutrition_profile, undefined),
    preferredCoachId: normalizeCoachId(data.preferred_coach_id),
    focusAreas: Array.isArray(data.focus_areas)
      ? (data.focus_areas as UserProfile['focusAreas'])
      : Array.isArray(meta?.focusAreas)
        ? (meta?.focusAreas as UserProfile['focusAreas'])
        : undefined,
    hasCompletedOnboarding: Boolean(
      data.has_completed_onboarding ??
      meta?.hasCompletedOnboarding ??
      false
    ),
    badges: parseJson(data.badges, []),
  };
}

export async function upsertProfile(userId: string, profile: UserProfile): Promise<void> {
  const goalsPayload = {
    ...(profile.goals ?? {}),
    __meta: {
      hasCompletedOnboarding: profile.hasCompletedOnboarding ?? false,
      focusAreas: profile.focusAreas ?? [],
    },
  };

  const basePayload = {
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
    goals: goalsPayload,
    adaptive_profile: profile.adaptiveProfile ?? null,
    nutrition_profile: profile.nutritionProfile ?? null,
    preferred_coach_id: profile.preferredCoachId ?? null,
    badges: profile.badges ?? [],
  };

  const extendedPayload = {
    ...basePayload,
    has_completed_onboarding: profile.hasCompletedOnboarding ?? false,
    focus_areas: profile.focusAreas ?? [],
  };

  let { error } = await supabase.from('profiles').upsert(extendedPayload);

  if (
    error &&
    (
      error.message.includes('has_completed_onboarding') ||
      error.message.includes('focus_areas')
    )
  ) {
    const retry = await supabase.from('profiles').upsert(basePayload);
    error = retry.error;
  }

  if (error) console.error('upsertProfile error', error.message);
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
  if (error) console.error('upsertDayRecord error', error.message);
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export async function upsertMetrics(userId: string, dayNumber: number, metrics: DayMetrics): Promise<void> {
  const startDate = await fetchUserStartDate(userId);
  if (!startDate) {
    console.error('upsertMetrics error', 'missing profile start_date');
    return;
  }
  const date = dateFromDayNumber(startDate, dayNumber);

  const { error } = await supabase.from('user_metrics').upsert({
    user_id: userId,
    date,
    current_weight: metrics.weight ?? null,
    water_liters: null,
    meditation_minutes: metrics.breathingMinutes ?? null,
    reading_pages: metrics.readingPages ?? null,
    training_minutes: metrics.trainingMinutes ?? null,
    breathing_minutes: metrics.breathingMinutes ?? null,
    sleep_hours: metrics.sleepHours ?? null,
    energy_level: metrics.energyLevel ?? null,
    mood: metrics.mood ?? null,
    notes: metrics.notes ?? null,
  }, { onConflict: 'user_id,date' });

  if (!error) return;
  console.warn('upsertMetrics canonical error, falling back to legacy table', error.message);

  // Legacy fallback for environments where canonical table isn't migrated yet.
  const legacy = await supabase.from('metrics').upsert({
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
  if (legacy.error) console.error('upsertMetrics fallback error', legacy.error.message);
}

export async function fetchMetrics(userId: string): Promise<{ dayNumber: number; metrics: DayMetrics }[]> {
  const startDate = await fetchUserStartDate(userId);
  if (!startDate) return [];

  const canonical = await supabase
    .from('user_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  if (!canonical.error && canonical.data) {
    const mapped: { dayNumber: number; metrics: DayMetrics }[] = [];
    for (const r of canonical.data) {
      const dayNumber = dayNumberFromDate(startDate, r.date);
      if (!dayNumber) continue;
      mapped.push({
        dayNumber,
        metrics: {
          weight: r.current_weight ?? undefined,
          trainingMinutes: r.training_minutes ?? undefined,
          readingPages: r.reading_pages ?? undefined,
          breathingMinutes: r.breathing_minutes ?? r.meditation_minutes ?? undefined,
          sleepHours: r.sleep_hours ?? undefined,
          energyLevel: r.energy_level ?? undefined,
          mood: r.mood ?? undefined,
          notes: r.notes ?? undefined,
        },
      });
    }
    return mapped;
  }

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

export async function upsertUserMetricsDaily(
  userId: string,
  input: SaveDailyMetricsInput
): Promise<void> {
  const date = input.date ?? new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from('user_metrics').upsert({
    user_id: userId,
    date,
    current_weight: input.currentWeight ?? null,
    water_liters: input.waterLiters ?? null,
    meditation_minutes: input.meditationMinutes ?? null,
    reading_pages: input.readingPages ?? null,
  }, { onConflict: 'user_id,date' });

  if (error) console.error('upsertUserMetricsDaily error', error.message);
}

// ─── Journal ──────────────────────────────────────────────────────────────────

export async function upsertJournal(userId: string, dayNumber: number, content: string): Promise<void> {
  const startDate = await fetchUserStartDate(userId);
  if (!startDate) {
    console.error('upsertJournal error', 'missing profile start_date');
    return;
  }
  const date = dateFromDayNumber(startDate, dayNumber);

  const { error } = await supabase.from('journal_entries').upsert({
    user_id: userId,
    date,
    reflection: content || '',
    mood: null,
    tags: [],
  }, { onConflict: 'user_id,date' });

  if (!error) return;
  console.warn('upsertJournal canonical error, falling back to legacy table', error.message);

  // Legacy fallback for environments where canonical table isn't migrated yet.
  const legacy = await supabase.from('journal').upsert({
    user_id: userId,
    day_number: dayNumber,
    content,
  }, { onConflict: 'user_id,day_number' });
  if (legacy.error) console.error('upsertJournal fallback error', legacy.error.message);
}

export async function fetchJournal(userId: string): Promise<{ dayNumber: number; content: string }[]> {
  const startDate = await fetchUserStartDate(userId);
  if (!startDate) return [];

  const canonical = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  if (!canonical.error && canonical.data) {
    return canonical.data
      .map((r) => {
        const dayNumber = dayNumberFromDate(startDate, r.date);
        if (!dayNumber) return null;
        return { dayNumber, content: r.reflection ?? '' };
      })
      .filter((row): row is { dayNumber: number; content: string } => Boolean(row));
  }

  const { data, error } = await supabase
    .from('journal')
    .select('*')
    .eq('user_id', userId);

  if (error || !data) return [];

  return data.map(r => ({ dayNumber: r.day_number, content: r.content }));
}

export async function clearUserProgress(userId: string): Promise<string | null> {
  const [dayRes, metricsRes, journalRes, canonicalMetricsRes, canonicalJournalRes] = await Promise.all([
    supabase.from('day_records').delete().eq('user_id', userId),
    supabase.from('metrics').delete().eq('user_id', userId),
    supabase.from('journal').delete().eq('user_id', userId),
    supabase.from('user_metrics').delete().eq('user_id', userId),
    supabase.from('journal_entries').delete().eq('user_id', userId),
  ]);

  const firstError =
    dayRes.error ??
    metricsRes.error ??
    journalRes.error ??
    canonicalMetricsRes.error ??
    canonicalJournalRes.error;

  return firstError ? firstError.message : null;
}

// ─── Anti-Cheat RPC ──────────────────────────────────────────────────────────

export interface CompleteUserMissionSecureResult {
  xp_earned: number;
  day_completed: boolean;
  profile: {
    xp: number;
    level: number;
    streak: number;
    max_streak: number;
    current_day: number;
    program_completed: boolean;
  };
  day_record: {
    day_number: number;
    total_points: number;
    points_target: number;
    completed: boolean;
    task_states: TaskState[];
    mission_states: MissionState[];
  };
}

const COMPLETE_USER_MISSION_RPC = 'complete_user_mission_secure';

function isSecureResultPayload(value: unknown): value is CompleteUserMissionSecureResult {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Record<string, unknown>;
  const profile = payload.profile as Record<string, unknown> | undefined;
  const dayRecord = payload.day_record as Record<string, unknown> | undefined;
  return (
    typeof payload.xp_earned === 'number' &&
    typeof payload.day_completed === 'boolean' &&
    !!profile &&
    typeof profile.xp === 'number' &&
    typeof profile.level === 'number' &&
    typeof profile.streak === 'number' &&
    typeof profile.max_streak === 'number' &&
    typeof profile.current_day === 'number' &&
    typeof profile.program_completed === 'boolean' &&
    !!dayRecord &&
    typeof dayRecord.day_number === 'number' &&
    typeof dayRecord.total_points === 'number' &&
    typeof dayRecord.points_target === 'number' &&
    typeof dayRecord.completed === 'boolean' &&
    Array.isArray(dayRecord.task_states) &&
    Array.isArray(dayRecord.mission_states)
  );
}

/**
 * Calls the secure server-side game engine. The response is authoritative for
 * XP, level, streak, and day progression. Returns null on network/server
 * failure so callers can keep offline/local resilience.
 */
export async function rpcCompleteUserMissionSecure(
  taskId: string,
  dayNumber: number,
): Promise<CompleteUserMissionSecureResult | null> {
  const { data, error } = await supabase.rpc(COMPLETE_USER_MISSION_RPC, {
    p_task_id: taskId,
    p_day_number: dayNumber,
  });

  if (error) {
    const msg = error.message ?? '';
    if (!msg.includes('network request failed') && !msg.includes('fetch failed')) {
      console.warn('[RPC] complete_user_mission_secure error:', msg);
    }
    return null;
  }

  if (!isSecureResultPayload(data)) {
    console.warn('[RPC] complete_user_mission_secure returned invalid payload shape');
    return null;
  }

  return data;
}

// ─── User data lifecycle ─────────────────────────────────────────────────────

export async function deleteUserData(userId: string): Promise<string | null> {
  const [journalRes, metricsRes, dayRes, canonicalMetricsRes, canonicalJournalRes, coachCtxRes, coachMsgRes, profileRes] = await Promise.all([
    supabase.from('journal').delete().eq('user_id', userId),
    supabase.from('metrics').delete().eq('user_id', userId),
    supabase.from('day_records').delete().eq('user_id', userId),
    supabase.from('user_metrics').delete().eq('user_id', userId),
    supabase.from('journal_entries').delete().eq('user_id', userId),
    supabase.from('coach_daily_context').delete().eq('user_id', userId),
    supabase.from('coach_messages').delete().eq('user_id', userId),
    supabase.from('profiles').delete().eq('id', userId),
  ]);

  const firstError =
    journalRes.error ??
    metricsRes.error ??
    dayRes.error ??
    canonicalMetricsRes.error ??
    canonicalJournalRes.error ??
    coachCtxRes.error ??
    coachMsgRes.error ??
    profileRes.error;
  return firstError ? firstError.message : null;
}
