import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';
import { AppData, UserProfile, DayRecord, TaskState, DayMetrics } from '../types';
import { PROGRAM } from '../data/program';
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

function createInitialData(name: string): AppData {
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
  todayDefinition: typeof PROGRAM[0] | null;
  completeTask: (taskId: string) => void;
  uncompleteTask: (taskId: string) => void;
  markDayComplete: () => void;
  saveJournal: (text: string) => void;
  saveMetrics: (metrics: DayMetrics) => void;
  useGraceDay: () => void;
  canUseGrace: boolean;
  getDayRecord: (dayNumber: number) => DayRecord | undefined;
  resetProgram: () => void;
  hasPenalty: boolean;
  completePenalty: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // ── Load & sync on mount ─────────────────────────────────────────────────
  useEffect(() => {
    loadData();

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
            user: profile,
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
          const initial = createInitialData(userName);
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

    let updated = { ...stored, lastOpenedDate: today };
    const user = { ...updated.user };

    if (daysDiff > 1) user.streak = 0;

    const currentMonth = MONTH_REF();
    if (user.graceMonthRef !== currentMonth) {
      user.graceUsedThisMonth = false;
      user.graceMonthRef = currentMonth;
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
    ? (PROGRAM[data.user.currentDay - 1] ?? null)
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
    if (existing) return existing;
    const def = PROGRAM[d.user.currentDay - 1];
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

    persistWithRecord(newData, updatedRecord);
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

    persistWithRecord(newData, updatedRecord);
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
