import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';
import { AppData, UserProfile, DayRecord, TaskState, DayMetrics, BadgeId, BADGE_DEFINITIONS, FitnessLevel, OnboardingData, CoachId } from '../types';
import { buildProgram } from '../data/program';
import { ONBOARDING_KEY } from '../../app/onboarding';
import { supabase } from '../lib/supabase';
import {
  fetchProfile, upsertProfile,
  fetchDayRecords, upsertDayRecord,
  fetchMetrics, upsertMetrics,
  fetchJournal, upsertJournal,
} from '../lib/db';

const STORAGE_KEY = 'arise_data_v1';
const TODAY = () => format(new Date(), 'yyyy-MM-dd');
const MONTH_REF = () => format(new Date(), 'yyyy-MM');

// ── Programa adaptativo ──────────────────────────────────────────────────────
let _cachedLevel: FitnessLevel = 'intermediate';
let _cachedProgram: ReturnType<typeof buildProgram> = buildProgram('intermediate');

export async function initProgram(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(ONBOARDING_KEY);
    if (raw) {
      const ob = JSON.parse(raw) as Partial<OnboardingData>;
      _cachedLevel = ob.fitnessLevel ?? 'intermediate';
      _cachedProgram = buildProgram(_cachedLevel, {
        goal: ob.goal,
        trainingDaysPerWeek: ob.trainingDaysPerWeek,
        adaptiveProfile: ob.adaptiveProfile,
        initialWeight: ob.initialWeight,
        targetWeight: ob.goals?.targetWeight,
      });
    }
  } catch {}
}

export function getProgram() { return _cachedProgram; }

// ── Badge checker ────────────────────────────────────────────────────────────
function checkBadges(data: AppData): BadgeId[] {
  const { user, days } = data;
  const earned: BadgeId[] = [];
  const has = (id: BadgeId) => (user.badges ?? []).includes(id);

  const completedDays = days.filter(d => d.completed).length;
  const totalPages = days.reduce((s, d) => s + (d.metrics?.readingPages ?? 0), 0);
  const totalTrainMin = days.reduce((s, d) => s + (d.metrics?.trainingMinutes ?? 0), 0);

  if (!has('first_day') && completedDays >= 1) earned.push('first_day');
  if (!has('week1') && completedDays >= 7) earned.push('week1');
  if (!has('week2') && completedDays >= 14) earned.push('week2');
  if (!has('week4') && completedDays >= 30) earned.push('week4');
  if (!has('week8') && completedDays >= 60) earned.push('week8');
  if (!has('week12') && completedDays >= 90) earned.push('week12');

  if (!has('streak7') && user.streak >= 7) earned.push('streak7');
  if (!has('streak14') && user.streak >= 14) earned.push('streak14');
  if (!has('streak30') && user.streak >= 30) earned.push('streak30');
  if (!has('streak60') && user.streak >= 60) earned.push('streak60');
  if (!has('streak90') && user.streak >= 90) earned.push('streak90');

  if (!has('phase1') && user.currentDay > 30) earned.push('phase1');
  if (!has('phase2') && user.currentDay > 60) earned.push('phase2');
  if (!has('phase3') && user.programCompleted) earned.push('phase3');

  if (!has('bookworm') && totalPages >= 500) earned.push('bookworm');
  if (!has('iron_body') && totalTrainMin >= 3000) earned.push('iron_body');

  // Perfect week: 7 consecutive completed in the last 7 days
  if (!has('perfect_week')) {
    const last7 = days.filter(d => d.dayNumber >= user.currentDay - 7 && d.dayNumber < user.currentDay);
    if (last7.length >= 7 && last7.every(d => d.completed)) earned.push('perfect_week');
  }

  // No miss: 30 days without any missed
  if (!has('no_miss') && completedDays >= 30) {
    const first30 = days.filter(d => d.dayNumber <= 30);
    if (first30.length >= 30 && first30.every(d => !d.missed)) earned.push('no_miss');
  }

  if (!has('arise_complete') && user.programCompleted) earned.push('arise_complete');

  return earned;
}

function createInitialData(name: string, onboarding?: Partial<OnboardingData>): AppData {
  const today = TODAY();
  return {
    user: {
      name,
      startDate: today,
      currentDay: 1,
      streak: 0,
      maxStreak: 0,
      xp: 0,
      level: 1,
      graceUsedThisMonth: false,
      graceMonthRef: MONTH_REF(),
      programActive: true,
      programCompleted: false,
      fitnessLevel: onboarding?.fitnessLevel,
      age: onboarding?.age,
      initialWeight: onboarding?.initialWeight,
      height: onboarding?.height,
      trainingDaysPerWeek: onboarding?.trainingDaysPerWeek,
      goals: onboarding?.goals,
      adaptiveProfile: onboarding?.adaptiveProfile,
      nutritionProfile: onboarding?.nutritionProfile,
      preferredCoachId: onboarding?.preferredCoachId,
    },
    days: [],
    lastOpenedDate: today,
  };
}

export function xpForLevel(level: number): number {
  return level * level * 100;
}

export function levelFromXP(xp: number): number {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}

function xpForDay(dayNumber: number): number {
  return 50 + Math.floor(dayNumber / 10) * 10;
}

interface AppContextType {
  data: AppData | null;
  loading: boolean;
  syncing: boolean;
  todayRecord: DayRecord | null;
  todayDefinition: ReturnType<typeof getProgram>[0] | null;
  completeTask: (taskId: string) => void;
  uncompleteTask: (taskId: string) => void;
  markDayComplete: () => void;
  saveJournal: (text: string) => void;
  newBadges: BadgeId[];
  clearNewBadges: () => void;
  saveMetrics: (metrics: DayMetrics) => void;
  useGraceDay: () => void;
  canUseGrace: boolean;
  getDayRecord: (dayNumber: number) => DayRecord | undefined;
  resetProgram: () => void;
  hasPenalty: boolean;
  completePenalty: () => void;
  setPreferredCoach: (coachId: CoachId) => void;
  applyOnboardingProfile: (onboarding: Partial<OnboardingData>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [newBadges, setNewBadges] = useState<BadgeId[]>([]);

  const clearNewBadges = useCallback(() => setNewBadges([]), []);

  function applyBadges(d: AppData): AppData {
    const earned = checkBadges(d);
    if (earned.length === 0) return d;
    setNewBadges(prev => [...prev, ...earned]);
    return {
      ...d,
      user: { ...d.user, badges: [...(d.user.badges ?? []), ...earned] },
    };
  }

  // ── Load & sync on mount ─────────────────────────────────────────────────
  useEffect(() => {
    initProgram().then(loadData);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') loadData();
      if (event === 'SIGNED_OUT') {
        setData(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Try Supabase first
        const [profile, dayRecords, metricsData, journalData] = await Promise.all([
          fetchProfile(user.id),
          fetchDayRecords(user.id),
          fetchMetrics(user.id),
          fetchJournal(user.id),
        ]);

        if (profile) {
          const [storedRaw, onboardingRaw] = await Promise.all([
            AsyncStorage.getItem(STORAGE_KEY),
            AsyncStorage.getItem(ONBOARDING_KEY),
          ]);
          const stored = storedRaw ? JSON.parse(storedRaw) as AppData : undefined;
          const onboarding = onboardingRaw ? JSON.parse(onboardingRaw) as Partial<OnboardingData> : undefined;

          // Merge metrics and journal into day records
          const enrichedDays = dayRecords.map(dr => {
            const m = metricsData.find(m => m.dayNumber === dr.dayNumber);
            const j = journalData.find(j => j.dayNumber === dr.dayNumber);
            return {
              ...dr,
              metrics: m?.metrics,
              journal: j?.content,
            };
          });

          const today = TODAY();
          const appData: AppData = {
            user: {
              ...profile,
              fitnessLevel: stored?.user.fitnessLevel ?? onboarding?.fitnessLevel,
              age: stored?.user.age ?? onboarding?.age,
              initialWeight: stored?.user.initialWeight ?? onboarding?.initialWeight,
              height: stored?.user.height ?? onboarding?.height,
              trainingDaysPerWeek: stored?.user.trainingDaysPerWeek ?? onboarding?.trainingDaysPerWeek,
              goals: stored?.user.goals ?? onboarding?.goals,
              adaptiveProfile: stored?.user.adaptiveProfile ?? onboarding?.adaptiveProfile,
              nutritionProfile: stored?.user.nutritionProfile ?? onboarding?.nutritionProfile,
              preferredCoachId: stored?.user.preferredCoachId ?? onboarding?.preferredCoachId ?? 'normal',
              badges: stored?.user.badges ?? profile.badges,
            },
            days: enrichedDays,
            lastOpenedDate: today,
          };

          const updated = handleDayTransition(appData);
          setData(updated);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          setLoading(false);
          return;
        }

        // No profile in Supabase — check AsyncStorage
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored: AppData = JSON.parse(raw);
          const updated = handleDayTransition(stored);
          setData(updated);
          // Migrate to Supabase
          await syncAllToSupabase(user.id, updated);
        } else {
          // Brand new user
          const userName = user.user_metadata?.name ?? 'Usuario';
          const onboardingRaw = await AsyncStorage.getItem(ONBOARDING_KEY);
          const onboarding = onboardingRaw ? JSON.parse(onboardingRaw) as Partial<OnboardingData> : undefined;
          const initial = createInitialData(userName, onboarding);
          setData(initial);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
          await upsertProfile(user.id, initial.user);
        }
      } else {
        // Not logged in — load from AsyncStorage
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored: AppData = JSON.parse(raw);
          setData(handleDayTransition(stored));
        }
      }
    } catch (e) {
      console.error('Failed to load data', e);
    } finally {
      setLoading(false);
    }
  }

  async function syncAllToSupabase(userId: string, appData: AppData) {
    setSyncing(true);
    try {
      await upsertProfile(userId, appData.user);
      await Promise.all(appData.days.map(async (dr) => {
        await upsertDayRecord(userId, dr);
        if (dr.metrics) await upsertMetrics(userId, dr.dayNumber, dr.metrics);
        if (dr.journal) await upsertJournal(userId, dr.dayNumber, dr.journal);
      }));
    } catch (e) {
      console.error('Sync error', e);
    } finally {
      setSyncing(false);
    }
  }

  // ── Day transition ───────────────────────────────────────────────────────
  function handleDayTransition(stored: AppData): AppData {
    const today = TODAY();
    if (stored.lastOpenedDate === today) return stored;

    const lastDate = stored.lastOpenedDate;
    const daysDiff = differenceInCalendarDays(
      startOfDay(new Date(today)),
      startOfDay(parseISO(lastDate))
    );

    let updated = { ...stored, lastOpenedDate: today, days: [...stored.days] };
    const user = { ...updated.user };

    // Reset grace month if needed
    const currentMonth = MONTH_REF();
    if (user.graceMonthRef !== currentMonth) {
      user.graceUsedThisMonth = false;
      user.graceMonthRef = currentMonth;
    }

    if (daysDiff >= 1) {
      // Check if yesterday's program day was completed
      const existingRecord = updated.days.find(d => d.dayNumber === user.currentDay);
      const wasCompleted = existingRecord?.completed ?? false;
      const wasMissedAlready = existingRecord?.missed ?? false;

      // If they skipped 1+ days without completing → missed day + penalty
      if (!wasCompleted && !wasMissedAlready && daysDiff >= 1) {
        user.streak = 0;

        if (existingRecord) {
          // Mark existing record as missed
          updated.days = updated.days.map(d =>
            d.dayNumber === user.currentDay
              ? { ...d, missed: true, penaltyCompleted: false }
              : d
          );
        } else {
          // Create a missed record so penalty screen triggers
          const program = getProgram();
          const def = program[user.currentDay - 1] ?? program[program.length - 1];
          const missedRecord: DayRecord = {
            dayNumber: user.currentDay,
            date: lastDate,
            taskStates: def.tasks.map(t => ({ taskId: t.id, completed: false })),
            completed: false,
            missed: true,
            penaltyCompleted: false,
          };
          updated.days = [...updated.days, missedRecord];
        }

        // For multiple missed days, advance currentDay so user stays on calendar
        if (daysDiff > 1) {
          const skipDays = Math.min(daysDiff - 1, 90 - user.currentDay);
          user.currentDay = Math.min(user.currentDay + skipDays, 90);
          if (user.currentDay >= 90) user.programCompleted = true;
        }
      }
    }

    updated.user = user;
    return updated;
  }

  // ── Persist (local + Supabase) ───────────────────────────────────────────
  const persist = useCallback(async (newData: AppData) => {
    setData(newData);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await upsertProfile(user.id, newData.user);
    } catch (e) {
      console.error('Profile sync error', e);
    }
  }, []);

  const persistWithRecord = useCallback(async (newData: AppData, record: DayRecord) => {
    setData(newData);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await Promise.all([
          upsertProfile(user.id, newData.user),
          upsertDayRecord(user.id, record),
        ]);
      }
    } catch (e) {
      console.error('Record sync error', e);
    }
  }, []);

  // ── Derived state ────────────────────────────────────────────────────────
  const todayDefinition = data
    ? (getProgram()[data.user.currentDay - 1] ?? null)
    : null;

  const todayRecord: DayRecord | null = data
    ? (data.days.find(d => d.dayNumber === data.user.currentDay) ?? null)
    : null;

  const hasPenalty = (() => {
    if (!data || !todayRecord) return false;
    return todayRecord.missed && !todayRecord.penaltyCompleted;
  })();

  const canUseGrace = data ? !data.user.graceUsedThisMonth : false;

  // ── Helpers ──────────────────────────────────────────────────────────────
  function ensureTodayRecord(d: AppData): DayRecord {
    const existing = d.days.find(r => r.dayNumber === d.user.currentDay);
    const program = getProgram();
    const def = program[d.user.currentDay - 1] ?? program[program.length - 1];
    if (existing) {
      // Migrate: keep completed states for matching IDs, initialise new ones
      const migratedStates = def.tasks.map(t => {
        const match = existing.taskStates.find(ts => ts.taskId === t.id);
        return match ?? { taskId: t.id, completed: false };
      });
      return { ...existing, taskStates: migratedStates };
    }
    return {
      dayNumber: d.user.currentDay,
      date: TODAY(),
      taskStates: def.tasks.map(t => ({ taskId: t.id, completed: false })),
      completed: false,
      missed: false,
    };
  }

  // ── Task operations ──────────────────────────────────────────────────────
  const completeTask = useCallback((taskId: string) => {
    if (!data) return;
    const newData = { ...data };
    const record = ensureTodayRecord(newData);

    const updatedRecord = {
      ...record,
      taskStates: record.taskStates.map(ts =>
        ts.taskId === taskId ? { ...ts, completed: true } : ts
      ),
    };

    const allDone = updatedRecord.taskStates.every(ts => ts.completed);
    updatedRecord.completed = allDone;

    newData.days = [
      ...newData.days.filter(d => d.dayNumber !== record.dayNumber),
      updatedRecord,
    ];

    if (allDone) {
      const user = { ...newData.user };
      const earned = xpForDay(user.currentDay);
      user.xp += earned;
      user.level = levelFromXP(user.xp);
      user.streak += 1;
      if (user.streak > user.maxStreak) user.maxStreak = user.streak;
      user.currentDay = Math.min(user.currentDay + 1, 90);
      if (user.currentDay > 90) user.programCompleted = true;
      newData.user = user;
    }

    const withBadges = applyBadges(newData);
    persistWithRecord(withBadges, updatedRecord);
  }, [data, persistWithRecord]);

  const uncompleteTask = useCallback((taskId: string) => {
    if (!data) return;
    const newData = { ...data };
    const record = ensureTodayRecord(newData);

    const updatedRecord = {
      ...record,
      taskStates: record.taskStates.map(ts =>
        ts.taskId === taskId ? { ...ts, completed: false } : ts
      ),
      completed: false,
    };

    newData.days = [
      ...newData.days.filter(d => d.dayNumber !== record.dayNumber),
      updatedRecord,
    ];
    persistWithRecord(newData, updatedRecord);
  }, [data, persistWithRecord]);

  const markDayComplete = useCallback(() => {
    if (!data) return;
    const newData = { ...data };
    const record = ensureTodayRecord(newData);

    const updatedRecord = {
      ...record,
      taskStates: record.taskStates.map(ts => ({ ...ts, completed: true })),
      completed: true,
    };
    newData.days = [
      ...newData.days.filter(d => d.dayNumber !== record.dayNumber),
      updatedRecord,
    ];

    const user = { ...newData.user };
    const earned = xpForDay(user.currentDay);
    user.xp += earned;
    user.level = levelFromXP(user.xp);
    user.streak += 1;
    if (user.streak > user.maxStreak) user.maxStreak = user.streak;
    user.currentDay = Math.min(user.currentDay + 1, 90);
    if (user.currentDay >= 90) user.programCompleted = true;
    newData.user = user;

    const withBadges = applyBadges(newData);
    persistWithRecord(withBadges, updatedRecord);
  }, [data, persistWithRecord]);

  // ── Journal ──────────────────────────────────────────────────────────────
  const saveJournal = useCallback((text: string) => {
    if (!data) return;
    const newData = { ...data };
    const record = ensureTodayRecord(newData);
    const updatedRecord = { ...record, journal: text };
    newData.days = [
      ...newData.days.filter(d => d.dayNumber !== record.dayNumber),
      updatedRecord,
    ];
    setData(newData);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) upsertJournal(user.id, record.dayNumber, text);
    });
  }, [data]);

  // ── Metrics ──────────────────────────────────────────────────────────────
  const saveMetrics = useCallback((metrics: DayMetrics) => {
    if (!data) return;
    const newData = { ...data };
    const record = ensureTodayRecord(newData);
    const updatedRecord = { ...record, metrics };
    newData.days = [
      ...newData.days.filter(d => d.dayNumber !== record.dayNumber),
      updatedRecord,
    ];
    setData(newData);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) upsertMetrics(user.id, record.dayNumber, metrics);
    });
  }, [data]);

  // ── Grace day ────────────────────────────────────────────────────────────
  const useGraceDay = useCallback(() => {
    if (!data || data.user.graceUsedThisMonth) return;
    const newData = { ...data };
    const user = { ...newData.user };
    user.graceUsedThisMonth = true;
    user.streak = 0;
    newData.user = user;
    persist(newData);
  }, [data, persist]);

  // ── Penalty ──────────────────────────────────────────────────────────────
  const completePenalty = useCallback(() => {
    if (!data) return;
    const newData = { ...data };
    const record = ensureTodayRecord(newData);
    const updatedRecord = { ...record, penaltyCompleted: true };
    newData.days = [
      ...newData.days.filter(d => d.dayNumber !== record.dayNumber),
      updatedRecord,
    ];
    persistWithRecord(newData, updatedRecord);
  }, [data, persistWithRecord]);

  const setPreferredCoach = useCallback((coachId: CoachId) => {
    if (!data) return;
    const newData: AppData = {
      ...data,
      user: {
        ...data.user,
        preferredCoachId: coachId,
      },
    };
    persist(newData);
  }, [data, persist]);

  const applyOnboardingProfile = useCallback((onboarding: Partial<OnboardingData>) => {
    if (!data) return;
    const newData: AppData = {
      ...data,
      user: {
        ...data.user,
        fitnessLevel: onboarding.fitnessLevel ?? data.user.fitnessLevel,
        age: onboarding.age ?? data.user.age,
        initialWeight: onboarding.initialWeight ?? data.user.initialWeight,
        height: onboarding.height ?? data.user.height,
        trainingDaysPerWeek: onboarding.trainingDaysPerWeek ?? data.user.trainingDaysPerWeek,
        goals: onboarding.goals ?? data.user.goals,
        adaptiveProfile: onboarding.adaptiveProfile ?? data.user.adaptiveProfile,
        nutritionProfile: onboarding.nutritionProfile ?? data.user.nutritionProfile,
        preferredCoachId: onboarding.preferredCoachId ?? data.user.preferredCoachId,
      },
    };
    persist(newData);
  }, [data, persist]);

  // ── Reset ────────────────────────────────────────────────────────────────
  const resetProgram = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const name = user?.user_metadata?.name ?? data?.user.name ?? 'Usuario';
    const initial = createInitialData(name);
    setData(initial);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    if (user) {
      await upsertProfile(user.id, initial.user);
    }
  }, [data]);

  const getDayRecord = useCallback((dayNumber: number) => {
    return data?.days.find(d => d.dayNumber === dayNumber);
  }, [data]);

  return (
    <AppContext.Provider value={{
      data,
      loading,
      syncing,
      todayRecord,
      todayDefinition,
      completeTask,
      uncompleteTask,
      markDayComplete,
      saveJournal,
      saveMetrics,
      useGraceDay,
      canUseGrace,
      getDayRecord,
      resetProgram,
      hasPenalty,
      completePenalty,
      setPreferredCoach,
      applyOnboardingProfile,
      newBadges,
      clearNewBadges,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
