import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, differenceInCalendarDays, parseISO, startOfDay } from 'date-fns';
import { AppData, UserProfile, DayRecord, TaskState, MissionState, DayMetrics, BadgeId, BADGE_DEFINITIONS, FitnessLevel, OnboardingData, CoachId } from '../types';
import { buildProgram } from '../data/program';
import { getMissionById, getDailyMissions, calcPoints, sumPoints, POINTS_TARGET_NORMAL, POINTS_TARGET_HARD, ALL_MISSIONS } from '../data/missions';
import { APP_DATA_KEY, ONBOARDING_KEY, ONBOARDING_STATUS_KEY } from '../lib/storageKeys';
import { supabase, SUPABASE_CONFIG_ERROR } from '../lib/supabase';
import {
  fetchProfile, upsertProfile,
  fetchDayRecords, upsertDayRecord,
  fetchMetrics, upsertMetrics, upsertUserMetricsDaily,
  fetchJournal, upsertJournal,
  rpcCompleteUserMissionSecure,
  clearUserProgress,
} from '../lib/db';
import {
  requestNotificationPermissions,
  syncNotificationSchedule,
} from '../lib/notifications';
import {
  trackAppOpened,
  trackMissionProgress,
  trackDayCompleted,
  trackGraceDayActivated,
  trackPenitenceTriggered,
  trackOnboardingCompleted,
  trackFirstMissionActivation,
  trackRpcMissionResult,
  trackRpcMissionFallback,
  trackReconcileDelta,
} from '../services/analytics';

const STORAGE_KEY = APP_DATA_KEY;
const TODAY = () => format(new Date(), 'yyyy-MM-dd');
const MONTH_REF = () => format(new Date(), 'yyyy-MM');
function isNetworkError(error: unknown): boolean {
  const msg = String((error as any)?.message ?? error ?? '').toLowerCase();
  return msg.includes('network request failed') || msg.includes('fetch failed');
}

function logUnexpectedError(scope: string, error: unknown) {
  if (isNetworkError(error)) return;
  console.warn(`[AppContext] ${scope}`, error);
}

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
  } catch (error) {
    console.error('[AppContext Error]: initProgram failed', error);
  }
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

// Merge badge arrays — union of both, no duplicates
function mergeBadges(a?: BadgeId[], b?: BadgeId[]): BadgeId[] {
  const set = new Set<BadgeId>([...(a ?? []), ...(b ?? [])]);
  return Array.from(set);
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
      focusAreas: onboarding?.focusAreas,
      hasCompletedOnboarding: Boolean(onboarding?.completed),
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
  hasRemoteProfile: boolean;
  hasCompletedOnboarding: boolean;
  syncing: boolean;
  todayRecord: DayRecord | null;
  todayDefinition: ReturnType<typeof getProgram>[0] | null;
  // Mission-based points system
  earnPoints: (missionId: string, units: number) => void;
  todayMissions: ReturnType<typeof getDailyMissions>;
  pointsTarget: number;
  hardMode: boolean;
  setHardMode: (val: boolean) => void;
  pinnedMissions: string[];
  pinMission: (missionId: string) => void;
  unpinMission: (missionId: string) => void;
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
  xpLastEarned: number;
  clearXpEarned: () => void;
  setPreferredCoach: (coachId: CoachId) => void;
  completeOnboarding: (
    onboardingData: OnboardingData
  ) => Promise<{ synced: boolean; warning?: string }>;
  applyOnboardingProfile: (onboarding: Partial<OnboardingData>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const HARD_MODE_KEY = 'arise_hard_mode';
const PINNED_KEY    = 'arise_pinned_missions';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasRemoteProfile, setHasRemoteProfile] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [newBadges, setNewBadges] = useState<BadgeId[]>([]);
  const [hardMode, setHardModeState] = useState(false);
  const [pinnedMissions, setPinnedMissions] = useState<string[]>([]);
  const [xpLastEarned, setXpLastEarned] = useState(0);
  const hasTrackedOpen = useRef(false);
  const hasTrackedFirstMission = useRef(false);
  const scheduledNotifKeyRef = useRef('');

  const clearXpEarned = useCallback(() => setXpLastEarned(0), []);

  const clearNewBadges = useCallback(() => setNewBadges([]), []);

  function resolveOnboardingStatus(
    profile?: Partial<UserProfile>,
    onboarding?: Partial<OnboardingData>,
    onboardingFlagRaw?: string | null,
  ): boolean {
    if (profile?.hasCompletedOnboarding) return true;
    if (onboardingFlagRaw === 'true') return true;
    return Boolean(onboarding?.completed);
  }

  function applyBadges(d: AppData): AppData {
    const earned = checkBadges(d);
    if (earned.length === 0) return d;
    setNewBadges(prev => [...prev, ...earned]);
    return {
      ...d,
      user: { ...d.user, badges: [...(d.user.badges ?? []), ...earned] },
    };
  }

  // ── Load hard mode + pinned missions ────────────────────────────────────
  useEffect(() => {
    AsyncStorage.multiGet([HARD_MODE_KEY, PINNED_KEY]).then(([hm, pm]) => {
      if (hm[1] === 'true') setHardModeState(true);
      if (pm[1]) {
        try {
          setPinnedMissions(JSON.parse(pm[1]));
        } catch (error) {
          console.error('[AppContext Error]: failed to parse pinned missions', error);
        }
      }
    });
  }, []);

  // ── Analytics: track app open once after data is fully hydrated ──────────
  useEffect(() => {
    if (!loading && data && !hasTrackedOpen.current) {
      hasTrackedOpen.current = true;
      void trackAppOpened(data.user.currentDay, data.user.level, data.user.streak, {
        installDate: data.user.startDate,
        coachId: data.user.preferredCoachId,
        hasCompletedOnboarding: data.user.hasCompletedOnboarding,
        hardMode,
      });
    }
  }, [loading, data, hardMode]);

  // ── Coach notifications: hydrate/on-day-change ────────────────────────────
  useEffect(() => {
    if (loading || !data || !data.user.hasCompletedOnboarding) return;

    const coachId = data.user.preferredCoachId ?? 'goku';
    const goals = data.user.goals;
    const scheduleKey = [
      coachId,
      data.user.currentDay,
      goals?.targetWaterLitersPerDay ?? '-',
      goals?.targetMeditationMinutesPerDay ?? '-',
      goals?.targetReadingPagesPerDay ?? '-',
    ].join(':');
    if (scheduledNotifKeyRef.current === scheduleKey) return;
    scheduledNotifKeyRef.current = scheduleKey;

    void (async () => {
      const granted = await requestNotificationPermissions('app_context');
      if (!granted) return;
      await syncNotificationSchedule(data.user, { requestPermission: false });
    })();
  }, [
    loading,
    data?.user.hasCompletedOnboarding,
    data?.user.preferredCoachId,
    data?.user.currentDay,
    data?.user.goals?.targetWaterLitersPerDay,
    data?.user.goals?.targetMeditationMinutesPerDay,
    data?.user.goals?.targetReadingPagesPerDay,
  ]);

  // ── Load & sync on mount ─────────────────────────────────────────────────
  useEffect(() => {
    initProgram().then(loadData);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') loadData();
      if (event === 'SIGNED_OUT') {
        setData(null);
        setHasRemoteProfile(false);
        setHasCompletedOnboarding(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadLocalDataFallback(defaultName = 'Usuario') {
    const [raw, onboardingRaw, onboardingStatusRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(ONBOARDING_KEY),
      AsyncStorage.getItem(ONBOARDING_STATUS_KEY),
    ]);
    if (raw) {
      const stored: AppData = JSON.parse(raw);
      const transitioned = handleDayTransition(stored);
      setData(transitioned);
      const onboarding = onboardingRaw ? JSON.parse(onboardingRaw) as Partial<OnboardingData> : undefined;
      setHasCompletedOnboarding(resolveOnboardingStatus(transitioned.user, onboarding, onboardingStatusRaw));
      setHasRemoteProfile(Boolean(transitioned.user.name));
      return;
    }
    const onboarding = onboardingRaw ? JSON.parse(onboardingRaw) as Partial<OnboardingData> : undefined;
    const initial = createInitialData(defaultName, onboarding);
    setData(initial);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    setHasCompletedOnboarding(resolveOnboardingStatus(initial.user, onboarding, onboardingStatusRaw));
    setHasRemoteProfile(false);
  }

  async function loadData() {
    setLoading(true);
    try {
      if (SUPABASE_CONFIG_ERROR) {
        await loadLocalDataFallback();
        return;
      }

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
          const [storedRaw, onboardingRaw, onboardingStatusRaw] = await Promise.all([
            AsyncStorage.getItem(STORAGE_KEY),
            AsyncStorage.getItem(ONBOARDING_KEY),
            AsyncStorage.getItem(ONBOARDING_STATUS_KEY),
          ]);
          const stored = storedRaw ? JSON.parse(storedRaw) as AppData : undefined;
          const onboarding = onboardingRaw ? JSON.parse(onboardingRaw) as Partial<OnboardingData> : undefined;

          // Enrich remote records with metrics + journal
          const enrichedDays = dayRecords.map(dr => {
            const m = metricsData.find(m => m.dayNumber === dr.dayNumber);
            const j = journalData.find(j => j.dayNumber === dr.dayNumber);
            return { ...dr, metrics: m?.metrics, journal: j?.content };
          });

          // ── Conflict resolution: most progress wins ──────────────────────
          // If local cache has days not yet in Supabase (user was offline),
          // merge them in and push back to Supabase.
          const localDays = stored?.days ?? [];
          const mergedDays: DayRecord[] = [...enrichedDays];
          let needsRemoteSync = false;

          for (const localDay of localDays) {
            const remoteIdx = mergedDays.findIndex(d => d.dayNumber === localDay.dayNumber);
            if (remoteIdx === -1) {
              // Day exists locally but not in Supabase — push it
              mergedDays.push(localDay);
              needsRemoteSync = true;
            } else if ((localDay.totalPoints ?? 0) > (mergedDays[remoteIdx].totalPoints ?? 0)) {
              // Local has more points for this day — local wins, keep remote journal/metrics
              mergedDays[remoteIdx] = {
                ...localDay,
                metrics: mergedDays[remoteIdx].metrics,
                journal: mergedDays[remoteIdx].journal,
              };
              needsRemoteSync = true;
            }
          }

          // Profile: take whichever has more progress (higher currentDay)
          const resolvedProfile =
            (stored?.user.currentDay ?? 0) > profile.currentDay ? stored!.user : profile;

          const today = TODAY();
          const appData: AppData = {
            user: {
              ...resolvedProfile,
              fitnessLevel: stored?.user.fitnessLevel ?? onboarding?.fitnessLevel,
              age: stored?.user.age ?? onboarding?.age,
              initialWeight: stored?.user.initialWeight ?? onboarding?.initialWeight,
              height: stored?.user.height ?? onboarding?.height,
              trainingDaysPerWeek: stored?.user.trainingDaysPerWeek ?? onboarding?.trainingDaysPerWeek,
              goals: stored?.user.goals ?? onboarding?.goals,
              adaptiveProfile: stored?.user.adaptiveProfile ?? onboarding?.adaptiveProfile,
              nutritionProfile: stored?.user.nutritionProfile ?? onboarding?.nutritionProfile,
              preferredCoachId: stored?.user.preferredCoachId ?? onboarding?.preferredCoachId ?? 'goku',
              focusAreas: stored?.user.focusAreas ?? profile.focusAreas ?? onboarding?.focusAreas,
              hasCompletedOnboarding: resolveOnboardingStatus(
                stored?.user,
                onboarding,
                onboardingStatusRaw
              ) || profile.hasCompletedOnboarding,
              badges: mergeBadges(profile.badges, stored?.user.badges),
            },
            days: mergedDays,
            lastOpenedDate: today,
          };

          const updated = handleDayTransition(appData);
          setData(updated);
          setHasRemoteProfile(true);
          setHasCompletedOnboarding(Boolean(updated.user.hasCompletedOnboarding));
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

          // Push local-ahead data to Supabase in background (no await — non-blocking)
          if (needsRemoteSync) {
            syncAllToSupabase(user.id, updated).catch((error) => {
              console.error('[AppContext Error]: background syncAllToSupabase failed', error);
            });
          }

          setLoading(false);
          return;
        }

        // No profile in Supabase — check AsyncStorage
        const [raw, onboardingRaw, onboardingStatusRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(ONBOARDING_KEY),
          AsyncStorage.getItem(ONBOARDING_STATUS_KEY),
        ]);
        if (raw) {
          const stored: AppData = JSON.parse(raw);
          const updated = handleDayTransition(stored);
          setData(updated);
          setHasRemoteProfile(true);
          const onboarding = onboardingRaw ? JSON.parse(onboardingRaw) as Partial<OnboardingData> : undefined;
          setHasCompletedOnboarding(resolveOnboardingStatus(updated.user, onboarding, onboardingStatusRaw));
          // Migrate to Supabase
          await syncAllToSupabase(user.id, updated);
        } else {
          // Brand new user
          const userName = user.user_metadata?.name ?? 'Usuario';
          const [onboardingRaw, onboardingStatusRaw] = await Promise.all([
            AsyncStorage.getItem(ONBOARDING_KEY),
            AsyncStorage.getItem(ONBOARDING_STATUS_KEY),
          ]);
          const onboarding = onboardingRaw ? JSON.parse(onboardingRaw) as Partial<OnboardingData> : undefined;
          const initial = createInitialData(userName, onboarding);
          setData(initial);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
          setHasRemoteProfile(false);
          setHasCompletedOnboarding(resolveOnboardingStatus(initial.user, onboarding, onboardingStatusRaw));
          if (resolveOnboardingStatus(initial.user, onboarding, onboardingStatusRaw)) {
            await upsertProfile(user.id, { ...initial.user, hasCompletedOnboarding: true });
            setHasRemoteProfile(true);
          }
        }
      } else {
        // Not logged in — load from AsyncStorage
        await loadLocalDataFallback();
        setHasRemoteProfile(false);
      }
    } catch (e) {
      logUnexpectedError('Failed to load data', e);
      try {
        const [onboardingRaw, onboardingStatusRaw, sessionRes] = await Promise.all([
          AsyncStorage.getItem(ONBOARDING_KEY),
          AsyncStorage.getItem(ONBOARDING_STATUS_KEY),
          supabase.auth.getSession().catch((error) => {
            console.error('[AppContext Error]: getSession fallback failed', error);
            return { data: { session: null } as any };
          }),
        ]);
        const fallbackName = sessionRes?.data?.session?.user?.user_metadata?.name ?? 'Usuario';
        const onboarding = onboardingRaw ? JSON.parse(onboardingRaw) as Partial<OnboardingData> : undefined;
        await loadLocalDataFallback(fallbackName || 'Usuario');
        setHasCompletedOnboarding(resolveOnboardingStatus(undefined, onboarding, onboardingStatusRaw));
      } catch (error) {
        console.error('[AppContext Error]: local fallback boot failed', error);
        const initial = createInitialData('Usuario');
        setData(initial);
        setHasRemoteProfile(false);
        setHasCompletedOnboarding(false);
      }
    } finally {
      setLoading(false);
    }
  }

  async function syncAllToSupabase(userId: string, appData: AppData) {
    setSyncing(true);
    try {
      await upsertProfile(userId, appData.user);
      // Each day fires all 3 upserts in parallel, and all days run concurrently
      await Promise.all(appData.days.map(dr =>
        Promise.all([
          upsertDayRecord(userId, dr),
          dr.metrics ? upsertMetrics(userId, dr.dayNumber, dr.metrics) : Promise.resolve(),
          dr.journal ? upsertJournal(userId, dr.dayNumber, dr.journal) : Promise.resolve(),
        ])
      ));
    } catch (e) {
      logUnexpectedError('Sync error', e);
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
            missionStates: [],
            totalPoints: 0,
            pointsTarget: hardMode ? POINTS_TARGET_HARD : POINTS_TARGET_NORMAL,
            completed: false,
            missed: true,
            penaltyCompleted: false,
          };
          updated.days = [...updated.days, missedRecord];
        }

        // Penitence is now active — fire non-blocking analytics signal
        void trackPenitenceTriggered(user.currentDay, {
          installDate: user.startDate,
          coachId: user.preferredCoachId,
          hasCompletedOnboarding: user.hasCompletedOnboarding,
          hardMode,
        });

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
    setHasCompletedOnboarding(Boolean(newData.user.hasCompletedOnboarding));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await upsertProfile(user.id, newData.user);
    } catch (e) {
      logUnexpectedError('Profile sync error', e);
    }
  }, []);

  const persistWithRecord = useCallback(async (newData: AppData, record: DayRecord) => {
    setData(newData);
    setHasCompletedOnboarding(Boolean(newData.user.hasCompletedOnboarding));
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
      logUnexpectedError('Record sync error', e);
    }
  }, []);

  // ── Derived state ────────────────────────────────────────────────────────
  const todayDefinition = (() => {
    if (!data) return null;
    const program = getProgram();
    if (!program.length) return null;
    const safeIndex = Math.max(0, Math.min((data.user.currentDay ?? 1) - 1, program.length - 1));
    return program[safeIndex] ?? null;
  })();

  const todayRecord: DayRecord | null = data
    ? (data.days.find(d => d.dayNumber === data.user.currentDay) ?? null)
    : null;

  const hasPenalty = (() => {
    if (!data || !todayRecord) return false;
    return todayRecord.missed && !todayRecord.penaltyCompleted;
  })();

  const canUseGrace = data ? !data.user.graceUsedThisMonth : false;
  const pointsTarget = hardMode ? POINTS_TARGET_HARD : POINTS_TARGET_NORMAL;

  const currentPhase: 1 | 2 | 3 = !data ? 1
    : data.user.currentDay <= 30 ? 1
    : data.user.currentDay <= 60 ? 2 : 3;

  const todayMissions = getDailyMissions(
    data?.user.currentDay ?? 1,
    currentPhase,
    pinnedMissions,
  );

  // ── Hard mode + pinned ───────────────────────────────────────────────────
  const setHardMode = useCallback(async (val: boolean) => {
    setHardModeState(val);
    await AsyncStorage.setItem(HARD_MODE_KEY, val ? 'true' : 'false');
  }, []);

  const pinMission = useCallback(async (missionId: string) => {
    if (pinnedMissions.includes(missionId)) return;
    const next = [...pinnedMissions, missionId].slice(0, 5); // max 5 pinned
    setPinnedMissions(next);
    await AsyncStorage.setItem(PINNED_KEY, JSON.stringify(next));
  }, [pinnedMissions]);

  const unpinMission = useCallback(async (missionId: string) => {
    const next = pinnedMissions.filter(id => id !== missionId);
    setPinnedMissions(next);
    await AsyncStorage.setItem(PINNED_KEY, JSON.stringify(next));
  }, [pinnedMissions]);

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
      missionStates: [],
      totalPoints: 0,
      pointsTarget: hardMode ? POINTS_TARGET_HARD : POINTS_TARGET_NORMAL,
      completed: false,
      missed: false,
    };
  }

  // ── Mission helper ───────────────────────────────────────────────────────
  function ensureMissionStates(record: DayRecord, missions: ReturnType<typeof getDailyMissions>): MissionState[] {
    const existing = record.missionStates ?? [];
    // Ensure every current mission has a state entry
    return missions.map(m => {
      const found = existing.find(s => s.missionId === m.id);
      return found ?? { missionId: m.id, units: 0, points: 0 };
    });
  }

  // ── Earn points ──────────────────────────────────────────────────────────
  const earnPoints = useCallback((missionId: string, units: number) => {
    if (!data) return;
    const mission = getMissionById(missionId);
    if (!mission) return;

    const newData = { ...data };
    const record = ensureTodayRecord(newData);
    const missions = getDailyMissions(newData.user.currentDay, currentPhase, pinnedMissions);
    const currentStates = ensureMissionStates(record, missions);

    const points = calcPoints(mission, units);
    if (points > 0) {
      void trackMissionProgress(missionId, mission.category, newData.user.currentDay, points, {
        installDate: newData.user.startDate,
        coachId: newData.user.preferredCoachId,
        hasCompletedOnboarding: newData.user.hasCompletedOnboarding,
        hardMode,
        units,
      });
      if (!hasTrackedFirstMission.current) {
        hasTrackedFirstMission.current = true;
        void trackFirstMissionActivation(
          missionId,
          mission.category,
          newData.user.currentDay,
          {
            installDate: newData.user.startDate,
            coachId: newData.user.preferredCoachId,
            hasCompletedOnboarding: newData.user.hasCompletedOnboarding,
            hardMode,
          }
        );
      }
    }

    const updatedStates: MissionState[] = currentStates.map(s =>
      s.missionId === missionId ? { ...s, units, points } : s
    );

    const totalPoints = sumPoints(updatedStates);
    const target = hardMode ? POINTS_TARGET_HARD : POINTS_TARGET_NORMAL;
    const completed = totalPoints >= target;

    const updatedRecord: DayRecord = {
      ...record,
      missionStates: updatedStates,
      totalPoints,
      pointsTarget: target,
      completed,
    };

    const wasCompleted = record.completed;
    newData.days = [
      ...newData.days.filter(d => d.dayNumber !== record.dayNumber),
      updatedRecord,
    ];

    const withBadges = applyBadges(newData);

    // ── Optimistic local save (immediate, offline-safe) ─────────────────
    setData(withBadges);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(withBadges)).catch((error) => {
      console.error('[AppContext Error]: failed to persist optimistic state', error);
    });

    // ── Background RPC (server-authoritative anti-cheat) ───────────────────
    void (async () => {
      try {
        const rpcStartedAt = Date.now();
        const secureResult = await rpcCompleteUserMissionSecure(missionId, record.dayNumber);
        const rpcLatency = Date.now() - rpcStartedAt;

        if (secureResult) {
          void trackRpcMissionResult(true, {
            missionId,
            dayNumber: record.dayNumber,
            latencyMs: rpcLatency,
          });
          if (secureResult.profile.xp !== withBadges.user.xp) {
            void trackReconcileDelta('xp', withBadges.user.xp, secureResult.profile.xp);
          }
          if (secureResult.profile.streak !== withBadges.user.streak) {
            void trackReconcileDelta('streak', withBadges.user.streak, secureResult.profile.streak);
          }
          if (secureResult.profile.current_day !== withBadges.user.currentDay) {
            void trackReconcileDelta('current_day', withBadges.user.currentDay, secureResult.profile.current_day);
          }
          if (secureResult.day_record.total_points !== updatedRecord.totalPoints) {
            void trackReconcileDelta('total_points', updatedRecord.totalPoints, secureResult.day_record.total_points);
          }
          if (secureResult.xp_earned > 0) {
            setXpLastEarned(secureResult.xp_earned);
          }
          if (secureResult.day_completed) {
            void trackDayCompleted(
              secureResult.day_record.day_number,
              secureResult.day_record.total_points,
              secureResult.profile.streak
            );
          }

          setData(prev => {
            if (!prev) return prev;
            const existingRecord = prev.days.find(d => d.dayNumber === secureResult.day_record.day_number);
            const reconciledRecord: DayRecord = {
              ...(existingRecord ?? updatedRecord),
              dayNumber: secureResult.day_record.day_number,
              totalPoints: secureResult.day_record.total_points,
              pointsTarget: secureResult.day_record.points_target,
              completed: secureResult.day_record.completed,
              taskStates: secureResult.day_record.task_states,
              missionStates: secureResult.day_record.mission_states,
            };

            const nextData: AppData = {
              ...prev,
              user: {
                ...prev.user,
                xp: secureResult.profile.xp,
                level: secureResult.profile.level,
                streak: secureResult.profile.streak,
                maxStreak: secureResult.profile.max_streak,
                currentDay: Math.min(secureResult.profile.current_day, 90),
                programCompleted: secureResult.profile.program_completed,
              },
              days: [
                ...prev.days.filter(d => d.dayNumber !== secureResult.day_record.day_number),
                reconciledRecord,
              ],
            };

            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextData)).catch((error) => {
              console.error('[AppContext Error]: failed to persist reconciled rpc state', error);
            });

            return nextData;
          });
          return;
        }

        // RPC failed (offline/network/server). Keep the app usable locally,
        // but do not upsert authoritative progression fields directly.
        void trackRpcMissionResult(false, {
          missionId,
          dayNumber: record.dayNumber,
          latencyMs: rpcLatency,
          errorCode: 'rpc_unavailable',
        });
        void trackRpcMissionFallback(missionId, record.dayNumber, 'rpc_unavailable');
        const fallbackData: AppData = {
          ...withBadges,
          user: { ...withBadges.user },
        };

        if (completed && !wasCompleted) {
          const earned = xpForDay(fallbackData.user.currentDay);
          fallbackData.user.xp += earned;
          fallbackData.user.level = levelFromXP(fallbackData.user.xp);
          fallbackData.user.streak += 1;
          if (fallbackData.user.streak > fallbackData.user.maxStreak) {
            fallbackData.user.maxStreak = fallbackData.user.streak;
          }
          fallbackData.user.currentDay = Math.min(fallbackData.user.currentDay + 1, 90);
          if (fallbackData.user.currentDay > 90) {
            fallbackData.user.programCompleted = true;
          }
          setXpLastEarned(earned);
          void trackDayCompleted(record.dayNumber, totalPoints, fallbackData.user.streak);
        }

        setData(fallbackData);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackData)).catch((error) => {
          console.error('[AppContext Error]: failed to persist fallback mission state', error);
        });

        if (__DEV__) {
          console.warn('[ANTI-CHEAT] RPC unavailable, applied local fallback only (no direct profile/day upsert).');
        }
      } catch (error) {
        void trackRpcMissionResult(false, {
          missionId,
          dayNumber: record.dayNumber,
          latencyMs: 0,
          errorCode: 'exception',
        });
        void trackRpcMissionFallback(missionId, record.dayNumber, 'exception');
        console.error('[AppContext Error]: failed to execute rpc mission flow', error);
      }
    })();
  }, [data, hardMode, pinnedMissions]);


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
  // Grace day FREEZES the streak (does not reset it) and advances the day.
  const useGraceDay = useCallback(() => {
    if (!data || data.user.graceUsedThisMonth) return;
    const newData = { ...data };
    const user = { ...newData.user };
    void trackGraceDayActivated(user.currentDay, user.streak, {
      installDate: user.startDate,
      coachId: user.preferredCoachId,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
      hardMode,
    });
    user.graceUsedThisMonth = true;
    // streak is intentionally preserved — grace days exist to protect it
    user.currentDay = Math.min(user.currentDay + 1, 90);
    if (user.currentDay > 90) user.programCompleted = true;
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

  const completeOnboarding = useCallback(async (onboardingData: OnboardingData) => {
    const profileName = onboardingData.name?.trim() || data?.user.name || 'Usuario';
    const base = data ?? createInitialData(profileName, onboardingData);
    const normalizedGoals = {
      ...(base.user.goals ?? {}),
      ...(onboardingData.goals ?? {}),
    };

    const newData: AppData = {
      ...base,
      user: {
        ...base.user,
        name: profileName,
        fitnessLevel: onboardingData.fitnessLevel ?? base.user.fitnessLevel,
        age: onboardingData.age ?? base.user.age,
        initialWeight: onboardingData.initialWeight ?? base.user.initialWeight,
        height: onboardingData.height ?? base.user.height,
        trainingDaysPerWeek: onboardingData.trainingDaysPerWeek ?? base.user.trainingDaysPerWeek,
        goals: normalizedGoals,
        adaptiveProfile: onboardingData.adaptiveProfile ?? base.user.adaptiveProfile,
        nutritionProfile: onboardingData.nutritionProfile ?? base.user.nutritionProfile,
        preferredCoachId: onboardingData.preferredCoachId ?? base.user.preferredCoachId ?? 'goku',
        focusAreas: onboardingData.focusAreas ?? base.user.focusAreas ?? [],
        hasCompletedOnboarding: true,
      },
      lastOpenedDate: TODAY(),
    };

    // Zero-latency local apply (always succeed first, even offline).
    setData(newData);
    setHasCompletedOnboarding(true);
    setHasRemoteProfile(true);
    await AsyncStorage.multiSet([
      [STORAGE_KEY, JSON.stringify(newData)],
      [ONBOARDING_KEY, JSON.stringify({ ...onboardingData, completed: true, name: profileName })],
      [ONBOARDING_STATUS_KEY, 'true'],
    ]);

    // Rebuild adaptive program from the newly stored onboarding.
    initProgram().catch((error) => {
      console.error('[AppContext Error]: initProgram after onboarding failed', error);
    });

    scheduledNotifKeyRef.current = '';

    void trackOnboardingCompleted(
      newData.user.preferredCoachId ?? 'goku',
      newData.user.focusAreas ?? [],
      {
        targetReadingPagesPerDay: normalizedGoals.targetReadingPagesPerDay,
        targetMeditationMinutesPerDay: normalizedGoals.targetMeditationMinutesPerDay,
        targetWaterLitersPerDay: normalizedGoals.targetWaterLitersPerDay,
        targetWeight: normalizedGoals.targetWeight,
      }
    );
    void trackAppOpened(newData.user.currentDay, newData.user.level, newData.user.streak, {
      installDate: newData.user.startDate,
      coachId: newData.user.preferredCoachId,
      hasCompletedOnboarding: true,
      hardMode,
    });

    if (SUPABASE_CONFIG_ERROR) {
      return {
        synced: false,
        warning: 'Guardado local activo. Conecta Supabase para sincronizar en la nube.',
      };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          synced: false,
          warning: 'No encontramos sesion de Supabase. Se guardo localmente.',
        };
      }

      await upsertProfile(user.id, newData.user);

      const onboardingMetrics: DayMetrics = {
        weight: onboardingData.initialWeight,
        readingPages: onboardingData.goals?.targetReadingPagesPerDay,
        breathingMinutes: onboardingData.goals?.targetMeditationMinutesPerDay,
        notes: JSON.stringify({
          source: 'onboarding',
          waterLitersPerDay: onboardingData.goals?.targetWaterLitersPerDay ?? null,
          focusAreas: onboardingData.focusAreas ?? [],
          coach: onboardingData.preferredCoachId ?? 'goku',
        }),
      };
      await upsertMetrics(user.id, 1, onboardingMetrics);
      await upsertUserMetricsDaily(user.id, {
        date: newData.user.startDate,
        currentWeight: onboardingData.initialWeight,
        waterLiters: onboardingData.goals?.targetWaterLitersPerDay,
        meditationMinutes: onboardingData.goals?.targetMeditationMinutesPerDay,
        readingPages: onboardingData.goals?.targetReadingPagesPerDay,
      });
      setHasRemoteProfile(true);
      return { synced: true };
    } catch (error) {
      logUnexpectedError('completeOnboarding remote sync failed', error);
      return {
        synced: false,
        warning: 'No pudimos sincronizar con la nube. Tu onboarding quedo guardado localmente.',
      };
    }
  }, [data]);

  const applyOnboardingProfile = useCallback((onboarding: Partial<OnboardingData>) => {
    if (!data) return;
    const newData: AppData = {
      ...data,
      user: {
        ...data.user,
        name: onboarding.name ?? data.user.name,
        fitnessLevel: onboarding.fitnessLevel ?? data.user.fitnessLevel,
        age: onboarding.age ?? data.user.age,
        initialWeight: onboarding.initialWeight ?? data.user.initialWeight,
        height: onboarding.height ?? data.user.height,
        trainingDaysPerWeek: onboarding.trainingDaysPerWeek ?? data.user.trainingDaysPerWeek,
        goals: onboarding.goals ?? data.user.goals,
        adaptiveProfile: onboarding.adaptiveProfile ?? data.user.adaptiveProfile,
        nutritionProfile: onboarding.nutritionProfile ?? data.user.nutritionProfile,
        preferredCoachId: onboarding.preferredCoachId ?? data.user.preferredCoachId,
        focusAreas: onboarding.focusAreas ?? data.user.focusAreas,
        hasCompletedOnboarding: onboarding.completed ?? data.user.hasCompletedOnboarding,
      },
    };
    persist(newData);
  }, [data, persist]);

  // ── Reset ────────────────────────────────────────────────────────────────
  const resetProgram = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const name = user?.user_metadata?.name ?? data?.user.name ?? 'Usuario';
    const initial = createInitialData(name, {
      completed: data?.user.hasCompletedOnboarding ?? true,
      goal: 'all',
      fitnessLevel: data?.user.fitnessLevel ?? 'intermediate',
      wakeUpHour: 7,
      age: data?.user.age,
      initialWeight: data?.user.initialWeight,
      height: data?.user.height,
      trainingDaysPerWeek: data?.user.trainingDaysPerWeek,
      goals: data?.user.goals,
      adaptiveProfile: data?.user.adaptiveProfile,
      nutritionProfile: data?.user.nutritionProfile,
      preferredCoachId: data?.user.preferredCoachId,
      focusAreas: data?.user.focusAreas,
    });
    setData(initial);
    setHasCompletedOnboarding(Boolean(initial.user.hasCompletedOnboarding));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    if (user) {
      const clearError = await clearUserProgress(user.id);
      if (clearError) {
        logUnexpectedError('resetProgram clearUserProgress failed', clearError);
      }
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
      hasRemoteProfile,
      hasCompletedOnboarding,
      syncing,
      todayRecord,
      todayDefinition,
      // Mission system
      earnPoints,
      todayMissions,
      pointsTarget,
      hardMode,
      setHardMode,
      pinnedMissions,
      pinMission,
      unpinMission,
      saveJournal,
      saveMetrics,
      useGraceDay,
      canUseGrace,
      getDayRecord,
      resetProgram,
      hasPenalty,
      completePenalty,
      setPreferredCoach,
      completeOnboarding,
      applyOnboardingProfile,
      newBadges,
      clearNewBadges,
      xpLastEarned,
      clearXpEarned,
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
