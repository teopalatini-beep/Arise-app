import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, Modal, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useApp, xpForLevel } from '@/context/AppContext';
import { COLORS, FONT, RADIUS, SPACING, SHADOW } from '@/theme';
import { AppData, CATEGORY_INFO, MissionDef, TaskCategory, UserProfile } from '@/types';
import { pointsByCategory, ALL_MISSIONS } from '@/data/missions';
import { buildDynamicChallenges, getNextStageHint, getPowerStage, getStageTheme } from '@/lib/progression';
import { buildWeeklyCoachReport, getCoachById, getCoachVisualProfile, getCoachTaskIcon } from '@/lib/coach';
import { addMissionsToCalendar } from '@/lib/calendar';
import PomodoroTimer from '@components/PomodoroTimer';
import CoachParticles from '@components/CoachParticles';
import ScreenLoadingState from '@components/ui/ScreenLoadingState';
import StaggerIn from '@components/ui/StaggerIn';
import MissionCard from '@components/misiones/MissionCard';
import BadgeModal from '@components/misiones/BadgeModal';
import WeeklyReview from '@components/misiones/WeeklyReview';
import PenaltyScreen from '@components/misiones/PenaltyScreen';
import { useTabScreenMotion } from '@/hooks/useTabScreenMotion';

const COACH_EMOJI: Record<string, string> = {
  goku: '⚡', itachi: '🪶', rengoku: '🔥', jiraiya: '📜', gojo: '💜', all_might: '💪',
};

const COACH_MISSION_ACCENT: Record<string, string> = {
  goku: '#E8460A',
  gojo: '#7C3AED',
  itachi: '#C41230',
};

const TRACK_DIRECTION: Record<string, string> = {
  fat_loss: 'Direccion: crear deficit sostenible sin perder masa muscular.',
  muscle_gain: 'Direccion: ganar fuerza y peso de calidad con progreso semanal.',
  recomposition: 'Direccion: bajar grasa y subir musculo manteniendo consistencia.',
  maintenance: 'Direccion: sostener resultados y evitar recaidas.',
};

const TRACK_QUOTES: Record<string, string[]> = {
  fat_loss: [
    'No se trata de sufrir, se trata de sostener.',
    'Constancia diaria vence cualquier plan extremo.',
    'Cada decision de hoy te acerca a tu version liviana y fuerte.',
  ],
  muscle_gain: [
    'Comer y entrenar con estrategia tambien es disciplina.',
    'No hay musculo sin progresion real en el tiempo.',
    'Subi el nivel semana a semana, no dia a dia.',
  ],
  recomposition: [
    'Equilibrio inteligente: menos impulso, mas sistema.',
    'Tu cuerpo cambia cuando tu consistencia deja de negociar.',
    'Pequenos ajustes sostenidos generan grandes cambios.',
  ],
  maintenance: [
    'Mantener tambien es progreso cuando antes habia recaida.',
    'Lo importante no es llegar, es quedarte.',
    'La disciplina estable construye libertad.',
  ],
};

const CHALLENGE_TOOLS: Record<string, { title: string; advice: string }> = {
  consistency: {
    title: 'Constancia',
    advice: 'Usa regla de no cero dias: aunque sea 10 minutos, la cadena no se rompe.',
  },
  nutrition: {
    title: 'Nutricion',
    advice: 'Prepara 2 comidas base con proteina para reducir decisiones impulsivas.',
  },
  time: {
    title: 'Tiempo',
    advice: 'Bloquea entrenamiento y lectura en el calendario como reuniones fijas.',
  },
  stress: {
    title: 'Estres',
    advice: 'Antes de abandonar una tarea: 2 minutos de respiracion box breathing.',
  },
  sleep: {
    title: 'Sueno',
    advice: 'Corta pantallas 45 min antes de dormir para mejorar recuperacion.',
  },
};

const FALLBACK_USER: UserProfile = {
  name: 'Usuario',
  startDate: '',
  currentDay: 1,
  streak: 0,
  maxStreak: 0,
  xp: 0,
  level: 1,
  graceUsedThisMonth: false,
  graceMonthRef: '',
  programActive: true,
  programCompleted: false,
  preferredCoachId: 'goku',
};

const EMPTY_DATA: AppData = {
  user: FALLBACK_USER,
  days: [],
  lastOpenedDate: '',
};

function clampProgress(value: number): number {
  return Math.max(0, Math.min(1, value));
}

// ─── Weekly Review Modal ──────────────────────────────────────────────────────
const WEEKLY_REVIEW_KEY = (week: number) => `arise_weekly_review_v1_week_${week}`;

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HoyScreen() {
  const router = useRouter();
  const { reducedMotion, screenAnimStyle } = useTabScreenMotion('index');
  const {
    data, todayRecord, todayDefinition, syncing,
    earnPoints, todayMissions, pointsTarget,
    pinnedMissions, pinMission, unpinMission,
    hasPenalty, completePenalty, useGraceDay, canUseGrace,
    newBadges, clearNewBadges,
    xpLastEarned, clearXpEarned,
  } = useApp();

  // ── Floating +XP animation + screen flash ────────────────────────────────
  const xpFloatY    = useRef(new Animated.Value(0)).current;
  const xpFloatOp   = useRef(new Animated.Value(0)).current;
  const xpScale     = useRef(new Animated.Value(0.5)).current;
  const screenFlash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (xpLastEarned <= 0) return;
    xpFloatY.setValue(0);
    xpFloatOp.setValue(1);
    xpScale.setValue(0.5);
    screenFlash.setValue(0);
    Animated.parallel([
      // Float upward
      Animated.timing(xpFloatY, { toValue: -60, duration: 2000, useNativeDriver: true }),
      // Fade out (delay 1.3s)
      Animated.sequence([
        Animated.delay(1300),
        Animated.timing(xpFloatOp, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
      // Bounce in scale: 0.5 → 1.2 → 1.0
      Animated.sequence([
        Animated.timing(xpScale, { toValue: 1.25, duration: 180, useNativeDriver: true }),
        Animated.timing(xpScale, { toValue: 1.00, duration: 120, useNativeDriver: true }),
      ]),
      // Screen flash: 0 → 0.10 → 0 in 280ms
      Animated.sequence([
        Animated.timing(screenFlash, { toValue: 0.10, duration: 80,  useNativeDriver: true }),
        Animated.timing(screenFlash, { toValue: 0,    duration: 200, useNativeDriver: true }),
      ]),
    ]).start(() => clearXpEarned());
  }, [xpLastEarned]);

  // ── Combo streak blink ────────────────────────────────────────────────────
  const comboOpac = useRef(new Animated.Value(1)).current;
  const comboAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!data || data.user.streak <= 3) {
      comboAnim.current?.stop();
      comboOpac.setValue(1);
      return;
    }
    comboAnim.current = Animated.loop(Animated.sequence([
      Animated.timing(comboOpac, { toValue: 0.35, duration: 550, useNativeDriver: true }),
      Animated.timing(comboOpac, { toValue: 1.00, duration: 550, useNativeDriver: true }),
    ]));
    comboAnim.current.start();
    return () => { comboAnim.current?.stop(); };
  }, [data?.user.streak]);

  const [showMissionRepo, setShowMissionRepo] = useState(false);
  const [addingToCalendar, setAddingToCalendar] = useState(false);
  const [timerMission, setTimerMission] = useState<MissionDef | null>(null);
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);
  const [weekIntention, setWeekIntention] = useState<string | null>(null);
  const [dismissedDayComplete, setDismissedDayComplete] = useState(false);

  // Stable ref so React.memo on MissionCard bails out correctly
  const handleEarnPoints = useCallback(
    (missionId: string, units: number) => earnPoints(missionId, units),
    [earnPoints],
  );
  const handleOpenTimer = useCallback((m: MissionDef) => setTimerMission(m), []);

  // ── Weekly review trigger ─────────────────────────────────────────────
  useEffect(() => {
    if (!data) return;
    const currentDay = data.user.currentDay;
    const weekNumber = Math.ceil(currentDay / 7);
    // Show on the first day of each week (after week 1)
    if (currentDay % 7 !== 1 || weekNumber <= 1) return;
    AsyncStorage.getItem(WEEKLY_REVIEW_KEY(weekNumber)).then(seen => {
      if (!seen) setShowWeeklyReview(true);
    });
  }, [data?.user.currentDay]);

  useEffect(() => {
    if (!data) return;
    const weekNum = Math.ceil(data.user.currentDay / 7);
    AsyncStorage.getItem(`arise_week_intention_${weekNum}`).then(val => {
      setWeekIntention(val ?? null);
    });
  }, [data?.user.currentDay]);

  function handleCloseWeeklyReview(intention: string) {
    if (!data) return;
    const weekNumber = Math.ceil(data.user.currentDay / 7);
    AsyncStorage.setItem(WEEKLY_REVIEW_KEY(weekNumber), 'seen');
    if (intention.trim()) {
      AsyncStorage.setItem(`arise_week_intention_${weekNumber}`, intention.trim());
      setWeekIntention(intention.trim());
    }
    setShowWeeklyReview(false);
  }

  // ── Loading skeleton ──────────────────────────────────────────────────
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!data) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(shimmerAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [data]);

  const user = data?.user ?? FALLBACK_USER;
  const safeDays = data?.days ?? EMPTY_DATA.days;
  // ── Points derived state ─────────────────────────────────────────────────
  const missionStates = todayRecord?.missionStates ?? [];
  const totalPoints = todayRecord?.totalPoints ?? 0;
  const pointsProgress = Math.min(totalPoints / pointsTarget, 1);
  const dayCompleted = totalPoints >= pointsTarget;
  const completedDayNumber = todayRecord?.dayNumber ?? Math.max(1, user.currentDay - 1);
  const catPts = useMemo(
    () => pointsByCategory(missionStates, todayMissions),
    [missionStates, todayMissions],
  );

  const missionUnitsById = useMemo(() => {
    const map = new Map<string, number>();
    for (const state of missionStates) map.set(state.missionId, state.units);
    return map;
  }, [missionStates]);

  const getMissionUnits = useCallback(
    (missionId: string): number => missionUnitsById.get(missionId) ?? 0,
    [missionUnitsById],
  );

  const { completedDays, totalReadingPages, latestWeight } = useMemo(() => {
    let completed = 0;
    let readPages = 0;
    let latestKnownWeight: number | undefined;

    for (const day of safeDays) {
      if (day.completed) completed++;
      readPages += day.metrics?.readingPages ?? 0;
      if (typeof day.metrics?.weight === 'number') latestKnownWeight = day.metrics.weight;
    }

    return {
      completedDays: completed,
      totalReadingPages: readPages,
      latestWeight: latestKnownWeight,
    };
  }, [safeDays]);

  const xpNeeded = xpForLevel(user.level + 1);
  const xpCurrent = xpForLevel(user.level);
  const xpProgress = (user.xp - xpCurrent) / (xpNeeded - xpCurrent);
  const track = user.adaptiveProfile?.track ?? 'maintenance';
  const direction = TRACK_DIRECTION[track] ?? TRACK_DIRECTION.maintenance;
  const challengeTools = useMemo(
    () => (user.adaptiveProfile?.challenges ?? [])
      .map(c => CHALLENGE_TOOLS[c])
      .filter(Boolean)
      .slice(0, 3),
    [user.adaptiveProfile?.challenges],
  );

  const goalProgressItems = useMemo(() => {
    const items: { label: string; current: string; target: string; progress: number }[] = [];

    if (typeof user.goals?.targetStreak === 'number' && user.goals.targetStreak > 0) {
      items.push({
        label: 'Racha objetivo',
        current: `${user.streak} dias`,
        target: `${user.goals.targetStreak} dias`,
        progress: clampProgress(user.streak / user.goals.targetStreak),
      });
    }
    if (typeof user.goals?.targetReadingPages === 'number' && user.goals.targetReadingPages > 0) {
      items.push({
        label: 'Lectura',
        current: `${totalReadingPages} pags`,
        target: `${user.goals.targetReadingPages} pags`,
        progress: clampProgress(totalReadingPages / user.goals.targetReadingPages),
      });
    }
    if (
      typeof user.goals?.targetWeight === 'number' &&
      typeof user.initialWeight === 'number' &&
      typeof latestWeight === 'number'
    ) {
      const totalDelta = user.goals.targetWeight - user.initialWeight;
      const doneDelta = latestWeight - user.initialWeight;
      const ratio = Math.abs(totalDelta) < 0.1 ? 1 : doneDelta / totalDelta;
      items.push({
        label: 'Peso',
        current: `${latestWeight.toFixed(1)} kg`,
        target: `${user.goals.targetWeight.toFixed(1)} kg`,
        progress: clampProgress(ratio),
      });
    }

    if (items.length === 0) {
      items.push({
        label: 'Programa 90 dias',
        current: `${completedDays} dias`,
        target: '90 dias',
        progress: clampProgress(completedDays / 90),
      });
    }

    return items;
  }, [user.streak, user.goals, user.initialWeight, totalReadingPages, latestWeight, completedDays]);

  const avgGoalProgress = useMemo(
    () => goalProgressItems.reduce((sum, g) => sum + g.progress, 0) / goalProgressItems.length,
    [goalProgressItems],
  );
  const quotes = TRACK_QUOTES[track] ?? TRACK_QUOTES.maintenance;
  const quoteIndex = useMemo(
    () => Math.min(quotes.length - 1, Math.floor(avgGoalProgress * quotes.length)),
    [quotes, avgGoalProgress],
  );
  const coachId = user.preferredCoachId ?? 'goku';
  const coach = useMemo(() => getCoachById(coachId), [coachId]);
  const coachVisual = useMemo(() => getCoachVisualProfile(coachId), [coachId]);
  const missionAccentColor = COACH_MISSION_ACCENT[coachId] ?? coachVisual.glowColor;
  const coachPhraseIndex = useMemo(
    () => Math.min(
      coachVisual.homePhrases.length - 1,
      Math.floor(avgGoalProgress * coachVisual.homePhrases.length),
    ),
    [coachVisual.homePhrases.length, avgGoalProgress],
  );
  const coachingQuote = `${coachVisual.homePhrases[coachPhraseIndex]} ${quotes[quoteIndex]}`;
  const powerStage = getPowerStage(user);
  const stageTheme = getStageTheme(user);
  const nextStageHint = getNextStageHint(user);
  const dynamicChallenges = useMemo(
    () => buildDynamicChallenges(user, safeDays).slice(0, 2),
    [user, safeDays],
  );
  const coachCardStyle = {
    backgroundColor: coachVisual.cardBackground,
    borderColor: coachVisual.cardBorder,
    shadowColor: coachVisual.glowColor,
    shadowOpacity: 0.40,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  } as const;

  useEffect(() => {
    if (!dayCompleted) {
      setDismissedDayComplete(false);
    }
  }, [dayCompleted, user.currentDay]);

  // ── Weekly review data ────────────────────────────────────────────────
  const currentWeekNum = useMemo(() => Math.ceil(user.currentDay / 7), [user.currentDay]);
  const weeklyStats = useMemo(() => {
    const prevWeekStart = Math.max(1, (currentWeekNum - 2) * 7 + 1);
    const prevWeekEnd = prevWeekStart + 6;
    const prevWeekDays = safeDays.filter(d => d.dayNumber >= prevWeekStart && d.dayNumber <= prevWeekEnd);

    return {
      completed: prevWeekDays.filter(d => d.completed).length,
      trainMin: prevWeekDays.reduce((s, d) => s + (d.metrics?.trainingMinutes ?? 0), 0),
      readPages: prevWeekDays.reduce((s, d) => s + (d.metrics?.readingPages ?? 0), 0),
      breathMin: prevWeekDays.reduce((s, d) => s + (d.metrics?.breathingMinutes ?? 0), 0),
    };
  }, [currentWeekNum, safeDays]);
  const weeklyReport = useMemo(() => buildWeeklyCoachReport(data ?? EMPTY_DATA, coachId), [data, coachId]);

  if (!data || !todayDefinition) {
    const opacity = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
    return (
      <LinearGradient colors={['#05050A', '#0A0A14', '#0F0F1E']} style={styles.container}>
        <Animated.View style={[styles.motionLayer, screenAnimStyle]}>
          <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <ScreenLoadingState
              title="Hoy"
              subtitle="Armando misiones, coach activo y progreso diario..."
              icon="flame-outline"
              accent="#E8460A"
              reducedMotion={reducedMotion}
              hints={[
                'Calculando puntos de hoy',
                'Cargando misiones fijas y rotativas',
                'Preparando bonus de XP',
              ]}
            />
            {[140, 80, 100, 80, 80].map((h, i) => (
              <Animated.View
                key={i}
                style={[styles.skeletonBlock, { height: h, opacity, marginBottom: 12 }]}
              />
            ))}
          </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </LinearGradient>
    );
  }
  const calendarWakeHour =
    typeof data?.user.goals?.targetTrainingDays === 'number' && data.user.goals.targetTrainingDays >= 5
      ? 6
      : 7;

  async function handleAddToCalendar() {
    if (addingToCalendar) return;
    setAddingToCalendar(true);
    try {
      const count = await addMissionsToCalendar(
        todayMissions,
        user.currentDay,
        calendarWakeHour,
      );
      if (count > 0) {
        Alert.alert(
          '📅 Agregado al calendario',
          `${count} misiones del día ${user.currentDay} fueron agregadas a tu calendario ARISE.`,
        );
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo acceder al calendario. Verificá los permisos en Ajustes.');
    } finally {
      setAddingToCalendar(false);
    }
  }

  function handleGrace() {
    if (!canUseGrace) {
      Alert.alert('Sin día de gracia', 'Ya usaste tu día de gracia este mes.');
      return;
    }
    Alert.alert(
      '🛡️ ¿Usar día de gracia?',
      'Usarás tu único escudo del mes. Tu racha queda CONGELADA — no se pierde. El programa avanza al día siguiente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Activar escudo', onPress: useGraceDay },
      ]
    );
  }

  // ── Program complete screen (day 90 done) ──────────────────────────────
  if (user.programCompleted) {
    return (
      <LinearGradient colors={['#05050A', '#0D0520', '#1A0830']} style={styles.container}>
        <Animated.View style={[styles.motionLayer, screenAnimStyle]}>
          <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={[styles.scroll, { alignItems: 'center', paddingTop: 40 }]}>
            <Text style={styles.ariseCompleteKanji}>炎</Text>
            <Text style={styles.ariseCompleteTitle}>ARISE{'\n'}COMPLETE</Text>
            <Text style={styles.ariseCompleteSubtitle}>
              90 días. Sin excusas.{'\n'}Lo lograste.
            </Text>

            <View style={[styles.card, { borderColor: '#F59E0B60', width: '100%' }]}>
              <Text style={[styles.cardLabel, { color: '#F59E0B' }]}>TUS NÚMEROS FINALES</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: SPACING.sm }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={[styles.bigNumber, { color: '#F59E0B' }]}>{user.maxStreak}🔥</Text>
                  <Text style={styles.cardLabel}>RACHA MÁX</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={[styles.bigNumber, { color: COLORS.accent }]}>{user.xp}</Text>
                  <Text style={styles.cardLabel}>XP TOTAL</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={[styles.bigNumber, { color: COLORS.purple }]}>Nv.{user.level}</Text>
                  <Text style={styles.cardLabel}>NIVEL</Text>
                </View>
              </View>
            </View>

            <View style={[styles.card, { borderColor: '#7C3AED60', width: '100%' }]}>
              <Text style={[styles.cardLabel, { color: '#C084FC' }]}>LOGRO MÁXIMO</Text>
              <Text style={{ fontSize: 48, textAlign: 'center', marginVertical: 8 }}>👑</Text>
              <Text style={{ color: '#F5F0FF', fontWeight: '900', fontSize: 18, textAlign: 'center' }}>ARISE COMPLETE</Text>
              <Text style={{ color: COLORS.textSecondary, textAlign: 'center', marginTop: 4, fontSize: FONT.sm }}>
                Leyenda. Solo el 1% de los que empiezan llegan aquí.
              </Text>
            </View>

            <Text style={{ color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.lg, fontSize: FONT.sm, lineHeight: 22 }}>
              "El poder no viene del cuerpo. Viene de una voluntad indomable."
            </Text>
          </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </LinearGradient>
    );
  }

  // ── Penalty screen ──────────────────────────────────────────────────────
  if (hasPenalty) {
    return <PenaltyScreen
      dayNumber={user.currentDay}
      onComplete={completePenalty}
      onGrace={canUseGrace ? handleGrace : undefined}
    />;
  }

  // ── Day complete screen ─────────────────────────────────────────────────
  if (dayCompleted && todayRecord?.completed && !dismissedDayComplete) {
    return (
      <LinearGradient colors={['#051A10', '#0A2D1A', '#0D1117']} style={styles.container}>
        <Animated.View style={[styles.motionLayer, screenAnimStyle]}>
          <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.completeHeader}>
              <Text style={styles.completeEmoji}>🏆</Text>
              <Text style={styles.completeTitle}>DÍA {completedDayNumber} COMPLETADO</Text>
              <Text style={styles.completeSubtitle}>"{todayDefinition.quote}"</Text>
            </View>

            <View style={[styles.card, { borderColor: COLORS.success + '40' }]}>
              <Text style={[styles.cardLabel, { color: COLORS.success }]}>RACHA ACTUAL</Text>
              <Text style={styles.bigNumber}>{user.streak} 🔥</Text>
            </View>

            <View style={styles.row}>
              <View style={[styles.card, styles.halfCard]}>
                <Text style={styles.cardLabel}>XP GANADO</Text>
                <Text style={[styles.bigNumber, { color: COLORS.accent }]}>
                  +{50 + Math.floor((user.currentDay - 1) / 10) * 10}
                </Text>
              </View>
              <View style={[styles.card, styles.halfCard]}>
                <Text style={styles.cardLabel}>NIVEL</Text>
                <Text style={[styles.bigNumber, { color: COLORS.purple }]}>
                  {user.level}
                </Text>
              </View>
            </View>

            <Text style={styles.nextDayText}>
              Mañana: Día {user.currentDay} de 90
            </Text>
            <TouchableOpacity
              style={styles.completeCta}
              onPress={() => setDismissedDayComplete(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Continuar en la pantalla de hoy"
            >
              <Ionicons name="rocket-outline" size={18} color="#FFFFFF" />
              <Text style={styles.completeCtaText}>Seguir entrenando hoy</Text>
            </TouchableOpacity>
          </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </LinearGradient>
    );
  }

  // ── Main daily screen ───────────────────────────────────────────────────
  return (
    <LinearGradient colors={stageTheme.background} style={styles.container}>
      <CoachParticles coachId={coachId ?? 'goku'} tappable reducedMotion={reducedMotion} />
      {/* Screen flash overlay — fires when XP is earned */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: coachVisual.glowColor, opacity: screenFlash, zIndex: 10 },
        ]}
      />
      <Animated.View style={[styles.motionLayer, screenAnimStyle]}>
        <SafeAreaView style={styles.safe}>
        {newBadges.length > 0 && (
          <BadgeModal badges={newBadges} onClose={clearNewBadges} />
        )}

        {/* Weekly review modal — triggers on first day of each new week */}
        {showWeeklyReview && (
          <WeeklyReview
            weekNumber={currentWeekNum}
            stats={weeklyStats}
            coachName={coach.name}
            coachEmoji={COACH_EMOJI[coachId] ?? '🏆'}
            wins={weeklyReport.wins}
            focus={weeklyReport.focus}
            coachMessage={weeklyReport.message}
            onClose={handleCloseWeeklyReview}
          />
        )}

        {/* Pomodoro / Deep Work timer modal */}
        {timerMission && (
          <PomodoroTimer
            visible={!!timerMission}
            mission={timerMission}
            currentUnits={getMissionUnits(timerMission.id)}
            onEarn={earnPoints}
            onClose={() => setTimerMission(null)}
          />
        )}
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Arise, {user.name}.</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Text style={styles.dayLabel}>DÍA {user.currentDay} DE 90</Text>
                {syncing && (
                  <View style={styles.syncBadge}>
                    <Ionicons name="cloud-upload-outline" size={12} color="#60A5FA" />
                    <Text style={styles.syncText}>Sincronizando</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <TouchableOpacity
                style={styles.configBtn}
                onPress={() => router.push('/(tabs)/config')}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Abrir configuracion"
              >
                <Ionicons name="settings-outline" size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
              {currentWeekNum > 1 && (
                <TouchableOpacity
                  style={styles.weekReviewBtn}
                  onPress={() => setShowWeeklyReview(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="bar-chart-outline" size={14} color={COLORS.accent} />
                  <Text style={styles.weekReviewBtnText}>Sem. {currentWeekNum - 1}</Text>
                </TouchableOpacity>
              )}
              {user.streak > 3 && (
                <Animated.View style={[styles.comboBadge, {
                  opacity: comboOpac,
                  borderColor: coachVisual.glowColor + '70',
                  backgroundColor: coachVisual.glowColor + '18',
                }]}>
                  <Text style={[styles.comboText, { color: coachVisual.glowColor }]}>
                    COMBO 🔥
                  </Text>
                </Animated.View>
              )}
              <View style={styles.streakBadge}>
                <Text style={styles.streakNumber}>{user.streak}</Text>
                <Text style={styles.streakFire}>🔥</Text>
              </View>
            </View>
          </View>

          {/* ── Primary loop first: progress + missions ── */}
          <View style={styles.pointsSection}>
            <View style={styles.pointsHeader}>
              <Text style={styles.pointsLabel}>
                {dayCompleted ? '✅ DÍA COMPLETADO' : 'PUNTOS DE HOY'}
              </Text>
              <Text style={[styles.pointsCount, { color: dayCompleted ? COLORS.success : stageTheme.tabActive }]}>
                {totalPoints} / {pointsTarget} pts
              </Text>
            </View>
            <View style={styles.pointsBarBg}>
              <LinearGradient
                colors={dayCompleted ? ['#22C55E', '#16A34A'] : stageTheme.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.pointsBarFill, { width: `${pointsProgress * 100}%` as any }]}
              />
            </View>
            {/* Category breakdown pills */}
            <View style={styles.catRow}>
              {(Object.keys(CATEGORY_INFO) as TaskCategory[]).map(cat => {
                const pts = catPts[cat] ?? 0;
                const info = CATEGORY_INFO[cat];
                return pts > 0 ? (
                  <View key={cat} style={[styles.catPill, { borderColor: info.color + '50', backgroundColor: info.color + '15' }]}>
                    <Text style={[styles.catPillText, { color: info.color }]}>
                      {info.label} {pts}pt
                    </Text>
                  </View>
                ) : null;
              })}
            </View>
          </View>

          {/* XP Bar + floating reward */}
          <View style={styles.xpSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.xpLabel}>Nivel {user.level} — {user.xp} XP</Text>
              {xpLastEarned > 0 && (
                <Animated.Text style={[styles.xpFloat, {
                  opacity: xpFloatOp,
                  color: coachVisual.glowColor,
                  transform: [{ translateY: xpFloatY }, { scale: xpScale }],
                  textShadowColor: coachVisual.glowColor,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 14,
                }]}>
                  +{xpLastEarned} XP ⚡
                </Animated.Text>
              )}
            </View>
            <View style={styles.xpBarBg}>
              {/* Bar fill uses coach glow color instead of static purple */}
              <View style={[styles.xpBarFill, {
                width: `${Math.min(xpProgress * 100, 100)}%` as any,
                backgroundColor: coachVisual.glowColor,
              }]} />
            </View>
          </View>

          {/* ── Missions ── */}
          <View style={styles.missionsHeader}>
            <View>
              <Text style={styles.sectionTitle}>MISIONES DE HOY</Text>
              <Text style={styles.missionsMeta}>{todayMissions.length} misiones · tope 10pt/categoría</Text>
            </View>
            <TouchableOpacity
              style={[styles.calendarBtn, addingToCalendar && { opacity: 0.5 }]}
              onPress={handleAddToCalendar}
              activeOpacity={0.8}
              disabled={addingToCalendar}
            >
              <Ionicons name="calendar-outline" size={16} color={stageTheme.tabActive} />
              <Text style={[styles.calendarBtnText, { color: stageTheme.tabActive }]}>
                {addingToCalendar ? '...' : 'Agendar'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Fixed missions first */}
          <Text style={styles.missionGroupLabel}>📌 FIJAS</Text>
          {todayMissions.filter(m => m.isFixed).map((mission, index) => (
            <StaggerIn key={mission.id} index={index} reducedMotion={reducedMotion}>
              <MissionCard
                mission={mission}
                currentUnits={getMissionUnits(mission.id)}
                onEarn={handleEarnPoints}
                onOpenTimer={handleOpenTimer}
                accentColor={missionAccentColor}
              />
            </StaggerIn>
          ))}

          {/* Daily rotating missions */}
          <Text style={[styles.missionGroupLabel, { marginTop: SPACING.sm }]}>🎲 MISIONES DEL DÍA</Text>
          {todayMissions.filter(m => !m.isFixed).map((mission, index) => (
            <StaggerIn
              key={mission.id}
              index={todayMissions.filter(m => m.isFixed).length + index}
              reducedMotion={reducedMotion}
            >
              <MissionCard
                mission={mission}
                currentUnits={getMissionUnits(mission.id)}
                onEarn={handleEarnPoints}
                onOpenTimer={handleOpenTimer}
                accentColor={missionAccentColor}
              />
            </StaggerIn>
          ))}

          {/* More missions button */}
          <TouchableOpacity
            style={styles.repoBtn}
            onPress={() => setShowMissionRepo(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={18} color={stageTheme.tabActive} />
            <Text style={[styles.repoBtnText, { color: stageTheme.tabActive }]}>Ver repositorio de misiones</Text>
          </TouchableOpacity>

          {/* ── Compact coach briefing (secondary) ── */}
          <View style={[styles.coachIdentityCard, coachCardStyle]}>
            <View style={styles.coachIdentityRow}>
              <Ionicons name={coachVisual.icon as any} size={16} color={stageTheme.tabActive} />
              <Text style={[styles.coachIdentityLabel, { color: stageTheme.tabActive }]}>{coachVisual.headerLabel}</Text>
            </View>
            <Text style={styles.coachIdentityName}>Coach activo: {coach.name}</Text>
            <Text style={styles.coachIdentityNote}>{coach.motivator}</Text>
          </View>

          <View style={[styles.powerCard, coachCardStyle]}>
            <LinearGradient colors={powerStage.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.powerAura}>
              <Text style={styles.powerAuraText}>{powerStage.auraLabel}</Text>
            </LinearGradient>
            <Text style={styles.powerTitle}>{powerStage.title}</Text>
            <Text style={styles.powerHint}>{nextStageHint}</Text>
          </View>

          {weekIntention && (
            <TouchableOpacity
              style={[styles.intentionCard, coachCardStyle]}
              onPress={() => setShowWeeklyReview(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.intentionLabel}>⚡ INTENCIÓN SEMANA {currentWeekNum}</Text>
              <Text style={styles.intentionText}>"{weekIntention}"</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ── Mission repository modal ── */}
        <Modal visible={showMissionRepo} animationType="slide" presentationStyle="pageSheet">
          <LinearGradient colors={['#0A0A14', '#0F0F1E']} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={repoStyles.header}>
                <Text style={repoStyles.title}>Repositorio de misiones</Text>
                <TouchableOpacity onPress={() => setShowMissionRepo(false)} style={{ padding: 8 }}>
                  <Ionicons name="close-circle" size={28} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
              <Text style={repoStyles.subtitle}>
                Ancla hasta 5 misiones para que aparezcan todos los días junto a las fijas.
              </Text>
              <ScrollView contentContainerStyle={{ padding: SPACING.md, paddingBottom: 40 }}>
                {(Object.keys(CATEGORY_INFO) as TaskCategory[]).map(cat => {
                  const catMissions = ALL_MISSIONS.filter(m => m.category === cat && !m.isFixed);
                  if (!catMissions.length) return null;
                  const info = CATEGORY_INFO[cat];
                  return (
                    <View key={cat} style={{ marginBottom: SPACING.lg }}>
                      <Text style={[repoStyles.catTitle, { color: info.color }]}>
                        {info.label.toUpperCase()}
                      </Text>
                      {catMissions.map(m => {
                        const isPinned = pinnedMissions.includes(m.id);
                        const inToday = todayMissions.some(tm => tm.id === m.id);
                        return (
                          <View key={m.id} style={repoStyles.repoCard}>
                            <Text style={repoStyles.repoEmoji}>{m.emoji}</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={repoStyles.repoName}>{m.name}</Text>
                              <Text style={repoStyles.repoDesc}>{m.description}</Text>
                              <Text style={repoStyles.repoPts}>Máx {m.maxPoints} pts</Text>
                            </View>
                            {inToday && !isPinned ? (
                              <Text style={repoStyles.todayBadge}>Hoy</Text>
                            ) : (
                              <TouchableOpacity
                                style={[repoStyles.pinBtn, isPinned && { backgroundColor: info.color }]}
                                onPress={() => isPinned ? unpinMission(m.id) : pinMission(m.id)}
                                activeOpacity={0.8}
                              >
                                <Ionicons
                                  name={isPinned ? 'pin' : 'pin-outline'}
                                  size={16}
                                  color={isPinned ? '#fff' : COLORS.textMuted}
                                />
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </ScrollView>
            </SafeAreaView>
          </LinearGradient>
        </Modal>

        </SafeAreaView>
      </Animated.View>
    </LinearGradient>
  );
}

const repoStyles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg },
  title: { fontSize: FONT.xl, fontWeight: '900', color: COLORS.textPrimary },
  subtitle: { fontSize: FONT.sm, color: COLORS.textSecondary, paddingHorizontal: SPACING.lg, marginBottom: SPACING.md, lineHeight: 20 },
  catTitle: { fontSize: FONT.xs, fontWeight: '800', letterSpacing: 2, marginBottom: SPACING.sm },
  repoCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: RADIUS.md, padding: SPACING.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: 8,
  },
  repoEmoji: { fontSize: 22 },
  repoName: { fontSize: FONT.sm, fontWeight: '800', color: COLORS.textPrimary },
  repoDesc: { fontSize: FONT.xs, color: COLORS.textMuted, marginTop: 2, lineHeight: 16 },
  repoPts: { fontSize: FONT.xs, color: COLORS.accent, fontWeight: '700', marginTop: 4 },
  pinBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  todayBadge: {
    fontSize: 10, fontWeight: '800', color: COLORS.accent,
    borderWidth: 1, borderColor: COLORS.accent + '50',
    borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 3,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  motionLayer: { flex: 1 },
  safe: { flex: 1 },

  // ── Program Complete styles ──────────────────────────────────────────────
  ariseCompleteKanji: {
    fontSize: 80,
    color: '#F59E0B',
    textAlign: 'center',
    marginBottom: SPACING.md,
    textShadowColor: '#F59E0B',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  ariseCompleteTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#F5F0FF',
    textAlign: 'center',
    letterSpacing: 4,
    lineHeight: 54,
    marginBottom: SPACING.sm,
  },
  ariseCompleteSubtitle: {
    fontSize: FONT.lg,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: SPACING.xl,
  },
  scroll: { padding: SPACING.md },
  skeletonBlock: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14,
    width: '100%',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  greeting: {
    fontSize: FONT.xxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  dayLabel: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251,146,60,0.15)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.3)',
  },
  streakNumber: {
    fontSize: FONT.lg,
    fontWeight: '800',
    color: COLORS.streak,
  },
  streakFire: { fontSize: FONT.lg, marginLeft: 2 },
  weekReviewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.accent + '15',
    borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: COLORS.accent + '30',
  },
  weekReviewBtnText: { fontSize: FONT.xs, fontWeight: '700', color: COLORS.accent },
  syncBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(96,165,250,0.12)',
    borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(96,165,250,0.3)',
  },
  syncText: { fontSize: 10, color: '#60A5FA', fontWeight: '700' },
  configBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  coachIdentityCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  coachIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  coachIdentityLabel: { fontSize: FONT.xs, fontWeight: '800', letterSpacing: 1 },
  coachIdentityName: { fontSize: FONT.sm, color: COLORS.textPrimary, fontWeight: '700' },
  coachIdentityNote: { fontSize: FONT.xs, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18 },

  powerCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  powerAura: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    marginBottom: 6,
  },
  powerAuraText: { color: '#fff', fontSize: FONT.xs, fontWeight: '800', letterSpacing: 1 },
  powerTitle: { fontSize: FONT.lg, color: COLORS.textPrimary, fontWeight: '800' },
  powerHint: { fontSize: FONT.sm, color: COLORS.textSecondary, marginTop: 2 },

  quoteBox: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  quoteText: {
    fontSize: FONT.base,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 22,
  },

  intentionCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  intentionLabel: {
    fontSize: FONT.xs,
    color: COLORS.accent,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: SPACING.sm,
  },
  intentionText: {
    fontSize: FONT.base,
    color: COLORS.textPrimary,
    fontStyle: 'italic',
    lineHeight: 24,
    fontWeight: '600',
  },

  goalSection: { marginBottom: SPACING.md },
  goalDirection: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  goalCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, gap: SPACING.sm },
  goalLabel: { fontSize: FONT.sm, color: COLORS.textPrimary, fontWeight: '700' },
  goalNumbers: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '700' },
  goalBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: RADIUS.full, overflow: 'hidden' },
  goalBarFill: { height: '100%', borderRadius: RADIUS.full, minWidth: 5 },

  coachBox: {
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.35)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  coachLabel: { fontSize: FONT.xs, color: '#D8B4FE', fontWeight: '800', letterSpacing: 1 },
  coachText: { fontSize: FONT.sm, color: COLORS.textPrimary, marginTop: 4, lineHeight: 20, fontWeight: '600' },

  toolsBox: {
    backgroundColor: 'rgba(232,70,10,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232,70,10,0.25)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
  },
  toolsLabel: { fontSize: FONT.xs, color: '#E8460A', fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  toolRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 6 },
  toolBullet: { color: '#E8460A', fontWeight: '900', marginTop: -1 },
  toolText: { flex: 1, color: COLORS.textSecondary, fontSize: FONT.sm, lineHeight: 19 },
  toolTitle: { color: COLORS.textPrimary, fontWeight: '700' },

  challengeBox: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  challengeLabel: { fontSize: FONT.xs, color: COLORS.gold, fontWeight: '800', letterSpacing: 1, marginBottom: 6 },
  challengeRow: { marginBottom: 8 },
  challengeTitle: { fontSize: FONT.sm, color: COLORS.textPrimary, fontWeight: '700' },
  challengeMeta: { fontSize: FONT.xs, color: COLORS.textMuted, marginBottom: 4 },
  challengeBarBg: { height: 5, backgroundColor: 'rgba(255,255,255,0.09)', borderRadius: RADIUS.full, overflow: 'hidden' },
  challengeBarFill: { height: '100%', backgroundColor: COLORS.gold, borderRadius: RADIUS.full },

  // ── Points section ───────────────────────────────────────────────────────
  pointsSection: { marginBottom: SPACING.md },
  pointsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pointsLabel: { fontSize: FONT.xs, color: COLORS.textSecondary, fontWeight: '800', letterSpacing: 1.5 },
  pointsCount: { fontSize: FONT.lg, fontWeight: '900' },
  pointsBarBg: { height: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: 10 },
  pointsBarFill: { height: '100%', borderRadius: RADIUS.full, minWidth: 6 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full, borderWidth: 1 },
  catPillText: { fontSize: 10, fontWeight: '800' },

  // ── Missions section ─────────────────────────────────────────────────────
  missionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  calendarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  calendarBtnText: { fontSize: FONT.xs, fontWeight: '700' },
  missionsMeta: { fontSize: FONT.xs, color: COLORS.textMuted },
  missionGroupLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: COLORS.textMuted, marginBottom: SPACING.sm },
  repoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: SPACING.sm, padding: SPACING.sm,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  repoBtnText: { fontSize: FONT.sm, fontWeight: '700' },


  xpSection: { marginBottom: SPACING.lg },
  xpLabel: { fontSize: FONT.xs, color: COLORS.textMuted, marginBottom: 4, letterSpacing: 0.5 },
  xpFloat: {
    fontSize: FONT.xl, fontWeight: '900',
    letterSpacing: 0.5, position: 'absolute', left: 0,
  },

  comboBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  comboText: {
    fontSize: 10, fontWeight: '900', letterSpacing: 1.5,
  },
  xpBarBg: {
    height: 3,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: COLORS.purple,
    borderRadius: RADIUS.full,
    minWidth: 4,
  },

  sectionTitle: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },


  // Complete
  completeHeader: { alignItems: 'center', marginVertical: SPACING.xl },
  completeEmoji: { fontSize: 64 },
  completeTitle: {
    fontSize: FONT.xl,
    fontWeight: '900',
    color: COLORS.success,
    letterSpacing: 2,
    marginTop: SPACING.md,
  },
  completeSubtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontSize: FONT.base,
    fontStyle: 'italic',
    paddingHorizontal: SPACING.lg,
  },
  nextDayText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: FONT.base,
    marginTop: SPACING.lg,
  },
  completeCta: {
    marginTop: SPACING.lg,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.accent,
  },
  completeCtaText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: FONT.sm,
    letterSpacing: 0.5,
  },

  // Shared
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: { flexDirection: 'row', gap: SPACING.sm },
  halfCard: { flex: 1 },
  cardLabel: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: SPACING.xs,
  },
  bigNumber: {
    fontSize: FONT.xxxl,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
});

