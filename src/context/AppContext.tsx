import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';
import { AppData, UserProfile, DayRecord, TaskState, DayMetrics } from '../types';
import { PROGRAM } from '../data/program';

const STORAGE_KEY = 'arise_data_v1';

const TODAY = () => format(new Date(), 'yyyy-MM-dd');
const MONTH_REF = () => format(new Date(), 'yyyy-MM');

// ─── Default initial state ────────────────────────────────────────────────────
function createInitialData(): AppData {
  const today = TODAY();
  return {
    user: {
      name: 'Teo',
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

// ─── XP & Level helpers ───────────────────────────────────────────────────────
export function xpForLevel(level: number): number {
  return level * level * 100;
}

export function levelFromXP(xp: number): number {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}

function xpForDay(dayNumber: number): number {
  // Base 50 XP + bonus por día avanzado
  return 50 + Math.floor(dayNumber / 10) * 10;
}

// ─── Context types ────────────────────────────────────────────────────────────
interface AppContextType {
  data: AppData | null;
  loading: boolean;

  // Today's operations
  todayRecord: DayRecord | null;
  todayDefinition: typeof PROGRAM[0] | null;
  completeTask: (taskId: string) => void;
  uncompleteTask: (taskId: string) => void;
  markDayComplete: () => void;

  // Journal & metrics
  saveJournal: (text: string) => void;
  saveMetrics: (metrics: DayMetrics) => void;

  // Grace day
  useGraceDay: () => void;
  canUseGrace: boolean;

  // Program
  getDayRecord: (dayNumber: number) => DayRecord | undefined;
  resetProgram: () => void;

  // Penalty
  hasPenalty: boolean;
  completePenalty: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  // Load data from storage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const stored: AppData = JSON.parse(raw);
          // Handle day transition on app open
          const updated = handleDayTransition(stored);
          setData(updated);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } else {
          const initial = createInitialData();
          setData(initial);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        }
      } catch (e) {
        console.error('Failed to load data', e);
        setData(createInitialData());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Persist data changes
  const persist = useCallback(async (newData: AppData) => {
    setData(newData);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  }, []);

  // ── Day transition logic ──────────────────────────────────────────────────
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

    if (daysDiff === 1) {
      // Normal progression — check if yesterday was completed
      const yesterdayRecord = stored.days.find(
        d => d.dayNumber === user.currentDay - 1
      );
      // If yesterday exists and was completed, streak continues
      // Otherwise it'll be handled when marking missed
    } else if (daysDiff > 1) {
      // Missed days
      user.streak = 0;
    }

    // Reset grace day if new month
    const currentMonth = MONTH_REF();
    if (user.graceMonthRef !== currentMonth) {
      user.graceUsedThisMonth = false;
      user.graceMonthRef = currentMonth;
    }

    updated.user = user;
    return updated;
  }

  // ── Derived state ─────────────────────────────────────────────────────────
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

  const canUseGrace = data
    ? !data.user.graceUsedThisMonth
    : false;

  // ── Task operations ───────────────────────────────────────────────────────
  function ensureTodayRecord(d: AppData): DayRecord {
    const existing = d.days.find(r => r.dayNumber === d.user.currentDay);
    if (existing) return existing;

    const today = TODAY();
    const def = PROGRAM[d.user.currentDay - 1];
    const newRecord: DayRecord = {
      dayNumber: d.user.currentDay,
      date: today,
      taskStates: def.tasks.map(t => ({ taskId: t.id, completed: false })),
      completed: false,
      missed: false,
    };
    return newRecord;
  }

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

    // Check if all tasks done
    const allDone = updatedRecord.taskStates.every(ts => ts.completed);
    updatedRecord.completed = allDone;

    newData.days = [
      ...newData.days.filter(d => d.dayNumber !== record.dayNumber),
      updatedRecord,
    ];

    if (allDone) {
      // Auto-complete the day
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

    persist(newData);
  }, [data, persist]);

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
    persist(newData);
  }, [data, persist]);

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

    persist(newData);
  }, [data, persist]);

  // ── Journal & Metrics ─────────────────────────────────────────────────────
  const saveJournal = useCallback((text: string) => {
    if (!data) return;
    const newData = { ...data };
    const record = ensureTodayRecord(newData);
    const updatedRecord = { ...record, journal: text };
    newData.days = [
      ...newData.days.filter(d => d.dayNumber !== record.dayNumber),
      updatedRecord,
    ];
    persist(newData);
  }, [data, persist]);

  const saveMetrics = useCallback((metrics: DayMetrics) => {
    if (!data) return;
    const newData = { ...data };
    const record = ensureTodayRecord(newData);
    const updatedRecord = { ...record, metrics };
    newData.days = [
      ...newData.days.filter(d => d.dayNumber !== record.dayNumber),
      updatedRecord,
    ];
    persist(newData);
  }, [data, persist]);

  // ── Grace day ─────────────────────────────────────────────────────────────
  const useGraceDay = useCallback(() => {
    if (!data || data.user.graceUsedThisMonth) return;
    const newData = { ...data };
    const user = { ...newData.user };
    user.graceUsedThisMonth = true;
    // Grace = no reset, but streak resets to 0
    user.streak = 0;
    newData.user = user;
    persist(newData);
  }, [data, persist]);

  // ── Penalty ───────────────────────────────────────────────────────────────
  const completePenalty = useCallback(() => {
    if (!data) return;
    const newData = { ...data };
    const record = ensureTodayRecord(newData);
    const updatedRecord = { ...record, penaltyCompleted: true };
    newData.days = [
      ...newData.days.filter(d => d.dayNumber !== record.dayNumber),
      updatedRecord,
    ];
    persist(newData);
  }, [data, persist]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getDayRecord = useCallback((dayNumber: number) => {
    return data?.days.find(d => d.dayNumber === dayNumber);
  }, [data]);

  const resetProgram = useCallback(async () => {
    const initial = createInitialData();
    persist(initial);
  }, [persist]);

  return (
    <AppContext.Provider value={{
      data,
      loading,
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
