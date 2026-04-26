import { supabase } from './supabase';
import { UserProfile, DayRecord, DayMetrics } from '../types';

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

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
  };
}

export async function upsertProfile(userId: string, profile: UserProfile): Promise<void> {
  await supabase.from('profiles').upsert({
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
  });
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
    completed: r.completed,
    missed: r.missed,
    penaltyCompleted: r.penalty_completed,
  }));
}

export async function upsertDayRecord(userId: string, record: DayRecord): Promise<void> {
  await supabase.from('day_records').upsert({
    user_id: userId,
    day_number: record.dayNumber,
    date: record.date,
    task_states: record.taskStates,
    completed: record.completed,
    missed: record.missed,
    penalty_completed: record.penaltyCompleted ?? false,
  }, { onConflict: 'user_id,day_number' });
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export async function upsertMetrics(userId: string, dayNumber: number, metrics: DayMetrics): Promise<void> {
  await supabase.from('metrics').upsert({
    user_id: userId,
    day_number: dayNumber,
    weight: metrics.weight ?? null,
    training_minutes: metrics.trainingMinutes ?? null,
    reading_pages: metrics.readingPages ?? null,
    meditation_minutes: metrics.breathingMinutes ?? null,
    notes: metrics.notes ?? null,
  }, { onConflict: 'user_id,day_number' });
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
      meditationMinutes: r.meditation_minutes,
      notes: r.notes,
    },
  }));
}

// ─── Journal ──────────────────────────────────────────────────────────────────

export async function upsertJournal(userId: string, dayNumber: number, content: string): Promise<void> {
  await supabase.from('journal').upsert({
    user_id: userId,
    day_number: dayNumber,
    content,
  }, { onConflict: 'user_id,day_number' });
}

export async function fetchJournal(userId: string): Promise<{ dayNumber: number; content: string }[]> {
  const { data, error } = await supabase
    .from('journal')
    .select('*')
    .eq('user_id', userId);

  if (error || !data) return [];

  return data.map(r => ({ dayNumber: r.day_number, content: r.content }));
}
