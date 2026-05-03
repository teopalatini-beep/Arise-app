import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, TextInput, Modal, KeyboardAvoidingView, Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp, xpForLevel, levelFromXP } from '../../src/context/AppContext';
import { COLORS, FONT, RADIUS, SPACING, SHADOW } from '../../src/theme';
import { CATEGORY_INFO, TaskCategory, BADGE_DEFINITIONS, RANK_COLORS, BadgeId, MissionDef } from '../../src/types';
import { calcPoints, pointsByCategory, ALL_MISSIONS } from '../../src/data/missions';
import { buildDynamicChallenges, getNextStageHint, getPowerStage, getStageTheme } from '../../src/lib/progression';
import { getCoachById, getCoachVisualProfile, getCoachTaskIcon } from '../../src/lib/coach';

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

function clampProgress(value: number): number {
  return Math.max(0, Math.min(1, value));
}

// ─── Badge unlock modal ───────────────────────────────────────────────────────
function BadgeUnlockModal({ badges, onClose }: { badges: BadgeId[]; onClose: () => void }) {
  if (!badges.length) return null;
  const first = badges[0];
  const def = BADGE_DEFINITIONS[first];
  const rankColor = RANK_COLORS[def.rank];
  return (
    <Modal transparent animationType="fade" visible>
      <View style={badgeModalStyles.overlay}>
        <LinearGradient
          colors={['#0A0A14', '#12121F']}
          style={[badgeModalStyles.card, { borderColor: rankColor + '60' }]}
        >
          <Text style={badgeModalStyles.unlocked}>🏅 ¡LOGRO DESBLOQUEADO!</Text>
          <Text style={[badgeModalStyles.emoji]}>{def.emoji}</Text>
          <Text style={[badgeModalStyles.name, { color: rankColor }]}>{def.name}</Text>
          <Text style={badgeModalStyles.rank}>{def.rank.toUpperCase()}</Text>
          <Text style={badgeModalStyles.desc}>{def.description}</Text>
          {badges.length > 1 && (
            <Text style={badgeModalStyles.more}>+{badges.length - 1} logro{badges.length > 2 ? 's' : ''} más</Text>
          )}
          <TouchableOpacity
            style={[badgeModalStyles.btn, { backgroundColor: rankColor }]}
            onPress={onClose}
          >
            <Text style={badgeModalStyles.btnText}>GENIAL 🔥</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const badgeModalStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center', justifyContent: 'center', padding: SPACING.lg,
  },
  card: {
    width: '100%', borderRadius: RADIUS.xl, padding: SPACING.xl,
    alignItems: 'center', borderWidth: 2, gap: SPACING.sm,
  },
  unlocked: { fontSize: FONT.xs, color: '#F59E0B', fontWeight: '800', letterSpacing: 2 },
  emoji: { fontSize: 64, marginVertical: SPACING.sm },
  name: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  rank: { fontSize: FONT.xs, fontWeight: '800', letterSpacing: 2, color: COLORS.textMuted },
  desc: { fontSize: FONT.base, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  more: { fontSize: FONT.sm, color: COLORS.textMuted, fontStyle: 'italic' },
  btn: {
    marginTop: SPACING.sm, paddingHorizontal: SPACING.xl, paddingVertical: 12,
    borderRadius: RADIUS.full,
  },
  btnText: { color: '#fff', fontWeight: '900', fontSize: FONT.base, letterSpacing: 1 },
});

// ─── Mission card components ──────────────────────────────────────────────────
function MissionCard({
  mission,
  currentUnits,
  onEarn,
  stageTheme,
}: {
  mission: MissionDef;
  currentUnits: number;
  onEarn: (missionId: string, units: number) => void;
  stageTheme: ReturnType<typeof getStageTheme>;
}) {
  const catInfo = CATEGORY_INFO[mission.category as TaskCategory];
  const pts = calcPoints(mission, currentUnits);
  const done = pts >= mission.maxPoints;
  const accentColor = done ? catInfo.color : COLORS.textMuted;

  function handleBinary() {
    const next = currentUnits >= 1 ? 0 : 1;
    Haptics.impactAsync(next === 1 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    onEarn(mission.id, next);
  }

  function handleStepped(units: number) {
    const next = currentUnits === units ? 0 : units;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEarn(mission.id, next);
  }

  function handleProportional(delta: number) {
    const next = Math.max(0, currentUnits + delta);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEarn(mission.id, next);
  }

  return (
    <View style={[mStyles.card, done && { borderColor: catInfo.color + '60' }]}>
      {/* Color bar */}
      <View style={[mStyles.colorBar, { backgroundColor: catInfo.color }]} />

      <View style={mStyles.body}>
        {/* Header row */}
        <View style={mStyles.headerRow}>
          <Text style={mStyles.emoji}>{mission.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[mStyles.name, done && { color: catInfo.color }]}>{mission.name}</Text>
            <Text style={mStyles.desc}>{mission.description}</Text>
          </View>
          {/* Points badge */}
          <View style={[mStyles.ptsBadge, done && { backgroundColor: catInfo.color + '20', borderColor: catInfo.color + '60' }]}>
            <Text style={[mStyles.ptsText, { color: done ? catInfo.color : COLORS.textMuted }]}>
              {pts}/{mission.maxPoints}pt
            </Text>
          </View>
        </View>

        {/* Controls */}
        {mission.type === 'binary' && (
          <TouchableOpacity
            style={[mStyles.binaryBtn, done && { backgroundColor: catInfo.color }]}
            onPress={handleBinary}
            activeOpacity={0.8}
          >
            <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={done ? '#fff' : COLORS.textMuted} />
            <Text style={[mStyles.binaryText, done && { color: '#fff' }]}>
              {done ? '¡Completado!' : 'Marcar como hecho'}
            </Text>
          </TouchableOpacity>
        )}

        {mission.type === 'stepped' && mission.steps && (
          <View style={mStyles.stepsRow}>
            {mission.steps.map(step => {
              const active = currentUnits >= step.units;
              return (
                <TouchableOpacity
                  key={step.units}
                  style={[mStyles.stepBtn, active && { backgroundColor: catInfo.color, borderColor: catInfo.color }]}
                  onPress={() => handleStepped(step.units)}
                  activeOpacity={0.8}
                >
                  <Text style={[mStyles.stepText, active && { color: '#fff' }]}>{step.label}</Text>
                  <Text style={[mStyles.stepPts, active && { color: '#fff' }]}>+{step.points}pt</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {mission.type === 'proportional' && (
          <View style={mStyles.counterRow}>
            <TouchableOpacity style={mStyles.counterBtn} onPress={() => handleProportional(-1)} activeOpacity={0.7}>
              <Text style={mStyles.counterBtnText}>−</Text>
            </TouchableOpacity>
            <View style={mStyles.counterDisplay}>
              <Text style={[mStyles.counterValue, { color: catInfo.color }]}>{currentUnits}</Text>
              <Text style={mStyles.counterUnit}>{mission.unit}</Text>
            </View>
            <TouchableOpacity style={mStyles.counterBtn} onPress={() => handleProportional(1)} activeOpacity={0.7}>
              <Text style={mStyles.counterBtnText}>＋</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const mStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  colorBar: { width: 4 },
  body: { flex: 1, padding: SPACING.sm, gap: SPACING.sm },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  emoji: { fontSize: 22 },
  name: { fontSize: FONT.base, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2 },
  desc: { fontSize: FONT.xs, color: COLORS.textMuted, lineHeight: 16 },
  ptsBadge: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  ptsText: { fontSize: 11, fontWeight: '800' },

  // Binary
  binaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.md, padding: 10,
  },
  binaryText: { fontSize: FONT.sm, fontWeight: '700', color: COLORS.textMuted },

  // Stepped
  stepsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  stepBtn: {
    paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
  },
  stepText: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted },
  stepPts: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },

  // Proportional counter
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  counterBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  counterBtnText: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '700', lineHeight: 22 },
  counterDisplay: { alignItems: 'center', minWidth: 50 },
  counterValue: { fontSize: FONT.xl, fontWeight: '900' },
  counterUnit: { fontSize: FONT.xs, color: COLORS.textMuted },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HoyScreen() {
  const {
    data, todayRecord, todayDefinition, syncing,
    earnPoints, todayMissions, pointsTarget,
    pinnedMissions, pinMission, unpinMission,
    hasPenalty, completePenalty, useGraceDay, canUseGrace,
    newBadges, clearNewBadges,
  } = useApp();

  const [showMissionRepo, setShowMissionRepo] = useState(false);

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

  if (!data || !todayDefinition) {
    const opacity = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
    return (
      <LinearGradient colors={['#05050A', '#0A0A14', '#0F0F1E']} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scroll}>
            {[140, 80, 100, 80, 80].map((h, i) => (
              <Animated.View
                key={i}
                style={[styles.skeletonBlock, { height: h, opacity, marginBottom: 12 }]}
              />
            ))}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const { user } = data;
  // ── Points derived state ───────────────────���────────────────────────────
  const missionStates = todayRecord?.missionStates ?? [];
  const totalPoints = todayRecord?.totalPoints ?? 0;
  const pointsProgress = Math.min(totalPoints / pointsTarget, 1);
  const dayCompleted = totalPoints >= pointsTarget;
  const catPts = pointsByCategory(missionStates, todayMissions);

  function getMissionUnits(missionId: string): number {
    return missionStates.find(s => s.missionId === missionId)?.units ?? 0;
  }
  const completedDays = data.days.filter(d => d.completed).length;
  const totalReadingPages = data.days.reduce((sum, d) => sum + (d.metrics?.readingPages ?? 0), 0);
  const latestWeight = [...data.days]
    .reverse()
    .map(d => d.metrics?.weight)
    .find((w): w is number => typeof w === 'number');

  const xpNeeded = xpForLevel(user.level + 1);
  const xpCurrent = xpForLevel(user.level);
  const xpProgress = (user.xp - xpCurrent) / (xpNeeded - xpCurrent);
  const track = user.adaptiveProfile?.track ?? 'maintenance';
  const direction = TRACK_DIRECTION[track] ?? TRACK_DIRECTION.maintenance;
  const challengeTools = (user.adaptiveProfile?.challenges ?? [])
    .map(c => CHALLENGE_TOOLS[c])
    .filter(Boolean)
    .slice(0, 3);

  const goalProgressItems: { label: string; current: string; target: string; progress: number }[] = [];
  if (typeof user.goals?.targetStreak === 'number' && user.goals.targetStreak > 0) {
    goalProgressItems.push({
      label: 'Racha objetivo',
      current: `${user.streak} dias`,
      target: `${user.goals.targetStreak} dias`,
      progress: clampProgress(user.streak / user.goals.targetStreak),
    });
  }
  if (typeof user.goals?.targetReadingPages === 'number' && user.goals.targetReadingPages > 0) {
    goalProgressItems.push({
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
    goalProgressItems.push({
      label: 'Peso',
      current: `${latestWeight.toFixed(1)} kg`,
      target: `${user.goals.targetWeight.toFixed(1)} kg`,
      progress: clampProgress(ratio),
    });
  }

  if (goalProgressItems.length === 0) {
    goalProgressItems.push({
      label: 'Programa 90 dias',
      current: `${completedDays} dias`,
      target: '90 dias',
      progress: clampProgress(completedDays / 90),
    });
  }

  const avgGoalProgress = goalProgressItems.reduce((sum, g) => sum + g.progress, 0) / goalProgressItems.length;
  const quotes = TRACK_QUOTES[track] ?? TRACK_QUOTES.maintenance;
  const quoteIndex = Math.min(quotes.length - 1, Math.floor(avgGoalProgress * quotes.length));
  const coachId = user.preferredCoachId ?? 'goku';
  const coach = getCoachById(coachId);
  const coachVisual = getCoachVisualProfile(coachId);
  const coachPhraseIndex = Math.min(
    coachVisual.homePhrases.length - 1,
    Math.floor(avgGoalProgress * coachVisual.homePhrases.length)
  );
  const coachingQuote = `${coachVisual.homePhrases[coachPhraseIndex]} ${quotes[quoteIndex]}`;
  const powerStage = getPowerStage(user);
  const stageTheme = getStageTheme(user);
  const nextStageHint = getNextStageHint(user);
  const dynamicChallenges = buildDynamicChallenges(user, data.days).slice(0, 2);
  const coachCardStyle = {
    backgroundColor: coachVisual.cardBackground,
    borderColor: coachVisual.cardBorder,
    shadowColor: coachVisual.glowColor,
    shadowOpacity: 0.32,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 10,
  } as const;

  function handleGrace() {
    if (!canUseGrace) {
      Alert.alert('Sin día de gracia', 'Ya usaste tu día de gracia este mes.');
      return;
    }
    Alert.alert(
      '¿Usar día de gracia?',
      'Esto usará tu único día de gracia del mes. Tu racha se reseteará a 0 pero no perderás tu progreso.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Usar gracia', onPress: useGraceDay, style: 'destructive' },
      ]
    );
  }

  // ── Program complete screen (day 90 done) ──────────────────────────────
  if (user.programCompleted) {
    return (
      <LinearGradient colors={['#05050A', '#0D0520', '#1A0830']} style={styles.container}>
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
  if (dayCompleted && todayRecord?.completed) {
    return (
      <LinearGradient colors={['#051A10', '#0A2D1A', '#0D1117']} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.completeHeader}>
              <Text style={styles.completeEmoji}>🏆</Text>
              <Text style={styles.completeTitle}>DÍA {user.currentDay - 1} COMPLETADO</Text>
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
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Main daily screen ───────────────────────────────────────────────────
  return (
    <LinearGradient colors={stageTheme.background} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View pointerEvents="none" style={styles.overlayLayer}>
          {coachVisual.overlays.map((overlay, idx) => (
            <View
              key={`${overlay.emoji}-${idx}`}
              style={[
                styles.overlayOrb,
                {
                  left: overlay.x,
                  top: overlay.y,
                  width: overlay.size * 2.4,
                  height: overlay.size * 2.4,
                  borderRadius: overlay.size * 1.2,
                  backgroundColor: coachVisual.glowColor,
                  opacity: overlay.opacity * 0.45,
                },
              ]}
            />
          ))}
          {coachVisual.overlays.map((overlay, idx) => (
            <Text
              key={`${overlay.emoji}-txt-${idx}`}
              style={[
                styles.overlayGlyph,
                {
                  left: overlay.x,
                  top: overlay.y,
                  fontSize: overlay.size,
                  opacity: overlay.opacity,
                },
              ]}
            >
              {overlay.emoji}
            </Text>
          ))}
        </View>
        {newBadges.length > 0 && (
          <BadgeUnlockModal badges={newBadges} onClose={clearNewBadges} />
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
                    <Ionicons name="cloud-upload-outline" size={10} color="#60A5FA" />
                    <Text style={styles.syncText}>sync</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakNumber}>{user.streak}</Text>
              <Text style={styles.streakFire}>🔥</Text>
            </View>
          </View>

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

          {/* Quote */}
          <View style={[styles.quoteBox, coachCardStyle]}>
            <Text style={styles.quoteText}>"{todayDefinition.quote}"</Text>
          </View>

          {/* Objetivos medibles + direccion */}
          <View style={styles.goalSection}>
            <Text style={styles.sectionTitle}>OBJETIVOS MEDIBLES</Text>
            <Text style={styles.goalDirection}>{direction}</Text>

            {goalProgressItems.map(item => (
              <View key={item.label} style={[styles.goalCard, coachCardStyle]}>
                <View style={styles.goalHeader}>
                  <Text style={styles.goalLabel}>{item.label}</Text>
                  <Text style={styles.goalNumbers}>{item.current} / {item.target}</Text>
                </View>
                <View style={styles.goalBarBg}>
                  <LinearGradient
                    colors={stageTheme.accent}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.goalBarFill, { width: `${item.progress * 100}%` as any }]}
                  />
                </View>
              </View>
            ))}

            <View style={[styles.coachBox, coachCardStyle]}>
              <Text style={[styles.coachLabel, { color: stageTheme.tabActive }]}>FRASE MOTIVADORA DEL OBJETIVO</Text>
              <Text style={styles.coachText}>{coachingQuote}</Text>
            </View>

            <View style={[styles.toolsBox, coachCardStyle]}>
              <Text style={[styles.toolsLabel, { color: stageTheme.tabActive }]}>HERRAMIENTAS Y CONSEJOS</Text>
              {(challengeTools.length > 0 ? challengeTools : (user.adaptiveProfile?.recommendations ?? []).map(advice => ({
                title: 'Plan semanal',
                advice,
              }))).slice(0, 3).map(tool => (
                <View key={`${tool.title}-${tool.advice}`} style={styles.toolRow}>
                  <Text style={[styles.toolBullet, { color: stageTheme.tabActive }]}>•</Text>
                  <Text style={styles.toolText}><Text style={styles.toolTitle}>{tool.title}: </Text>{tool.advice}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.challengeBox, coachCardStyle]}>
              <Text style={[styles.challengeLabel, { color: stageTheme.tabActive }]}>DESAFIOS EVOLUTIVOS</Text>
              {dynamicChallenges.map(ch => {
                const progressValue = clampProgress(ch.current / Math.max(ch.target, 1));
                return (
                  <View key={ch.id} style={styles.challengeRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.challengeTitle}>{ch.label}</Text>
                      <Text style={styles.challengeMeta}>{ch.current} / {ch.target} {ch.unit}</Text>
                    </View>
                    <View style={styles.challengeBarBg}>
                      <View style={[styles.challengeBarFill, { width: `${progressValue * 100}%` as any, backgroundColor: stageTheme.tabActive }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── Points bar ── */}
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

          {/* XP Bar */}
          <View style={styles.xpSection}>
            <Text style={styles.xpLabel}>Nivel {user.level} — {user.xp} XP</Text>
            <View style={styles.xpBarBg}>
              <View style={[styles.xpBarFill, { width: `${Math.min(xpProgress * 100, 100)}%` as any }]} />
            </View>
          </View>

          {/* ── Missions ── */}
          <View style={styles.missionsHeader}>
            <Text style={styles.sectionTitle}>MISIONES DE HOY</Text>
            <Text style={styles.missionsMeta}>{todayMissions.length} misiones · tope 10pt/categoría</Text>
          </View>

          {/* Fixed missions first */}
          <Text style={styles.missionGroupLabel}>📌 FIJAS</Text>
          {todayMissions.filter(m => m.isFixed).map(mission => (
            <MissionCard
              key={mission.id}
              mission={mission}
              currentUnits={getMissionUnits(mission.id)}
              onEarn={earnPoints}
              stageTheme={stageTheme}
            />
          ))}

          {/* Daily rotating missions */}
          <Text style={[styles.missionGroupLabel, { marginTop: SPACING.sm }]}>🎲 MISIONES DEL DÍA</Text>
          {todayMissions.filter(m => !m.isFixed).map(mission => (
            <MissionCard
              key={mission.id}
              mission={mission}
              currentUnits={getMissionUnits(mission.id)}
              onEarn={earnPoints}
              stageTheme={stageTheme}
            />
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

          <View style={{ height: 32 }} />
        </ScrollView>

        {/* ── Mission repository modal ── */}
        <Modal visible={showMissionRepo} animationType="slide" presentationStyle="pageSheet">
          <LinearGradient colors={['#0A0A14', '#0F0F1E']} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
              <View style={repoStyles.header}>
                <Text style={repoStyles.title}>Repositorio de misiones</Text>
                <TouchableOpacity onPress={() => setShowMissionRepo(false)}>
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
    width: 32, height: 32, borderRadius: 16,
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
  overlayLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  overlayOrb: {
    position: 'absolute',
  },
  overlayGlyph: {
    position: 'absolute',
  },
  scroll: { padding: SPACING.md },
  loadingText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 100 },
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
  syncBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(96,165,250,0.12)',
    borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: 'rgba(96,165,250,0.3)',
  },
  syncText: { fontSize: 9, color: '#60A5FA', fontWeight: '700' },

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
  missionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 },
  missionsMeta: { fontSize: FONT.xs, color: COLORS.textMuted },
  missionGroupLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, color: COLORS.textMuted, marginBottom: SPACING.sm },
  repoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: SPACING.sm, padding: SPACING.sm,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  repoBtnText: { fontSize: FONT.sm, fontWeight: '700' },

  // legacy (kept for safety)
  progressSection: { marginBottom: SPACING.md },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: FONT.sm, color: COLORS.textSecondary, fontWeight: '600' },
  progressCount: { fontSize: FONT.sm, color: COLORS.accent, fontWeight: '700' },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
    minWidth: 6,
  },

  xpSection: { marginBottom: SPACING.lg },
  xpLabel: { fontSize: FONT.xs, color: COLORS.textMuted, marginBottom: 4, letterSpacing: 0.5 },
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

  taskCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  taskCardDone: {
    borderColor: COLORS.success + '30',
    backgroundColor: 'rgba(52,211,153,0.05)',
  },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start' },
  taskColorBar: { width: 4, alignSelf: 'stretch', borderRadius: 2, margin: 2 },
  taskInfo: { flex: 1, padding: SPACING.sm },
  taskHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  taskCategory: { fontSize: FONT.xs, fontWeight: '700', letterSpacing: 1 },
  taskName: { fontSize: FONT.base, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  taskNameDone: { color: COLORS.textMuted, textDecorationLine: 'line-through' },
  taskTarget: { fontSize: FONT.sm, color: COLORS.textSecondary },
  taskDescription: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    lineHeight: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },

  checkbox: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
    margin: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },

  ctaButton: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginTop: SPACING.md,
    ...SHADOW.glow,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
  },
  ctaGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#FFF',
    fontSize: FONT.md,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  graceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    gap: 6,
  },
  graceButtonText: {
    color: COLORS.warning,
    fontSize: FONT.sm,
    fontWeight: '600',
  },

  // Penalty
  penaltyHeader: { alignItems: 'center', marginVertical: SPACING.xl },
  penaltyTitle: {
    fontSize: FONT.xl,
    fontWeight: '900',
    color: COLORS.danger,
    letterSpacing: 2,
    marginTop: SPACING.md,
  },
  penaltySubtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontSize: FONT.base,
    lineHeight: 24,
  },
  penaltyTask: {
    color: COLORS.textPrimary,
    fontSize: FONT.base,
    marginVertical: 4,
    fontWeight: '600',
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

// ─── Penalty Screen ───────────────────────────────────────────────────────────
const PENALTY_TASKS = [
  { emoji: '💥', text: '100 sentadillas + 50 flexiones + 30 burpees (sin descanso)' },
  { emoji: '🧊', text: '5 minutos de ducha fría — sin negociar' },
  { emoji: '🏃', text: '30 minutos de cardio intenso (carrera, HIIT o saltar la soga)' },
  { emoji: '✍️', text: 'Carta de compromiso: escribí 200 palabras sobre por qué vas a terminar estos 90 días' },
];

function PenaltyScreen({
  dayNumber, onComplete, onGrace,
}: { dayNumber: number; onComplete: () => void; onGrace?: () => void }) {
  const [letter, setLetter] = useState('');
  const [checked, setChecked] = useState<boolean[]>([false, false, false, false]);
  const allChecked = checked.every(Boolean) && letter.trim().split(/\s+/).length >= 50;

  function toggleCheck(i: number) {
    setChecked(prev => prev.map((v, idx) => idx === i ? !v : v));
  }

  function handleComplete() {
    if (!allChecked) {
      Alert.alert(
        'Penitencia incompleta',
        'Completá todas las tareas y escribí al menos 50 palabras en la carta de compromiso.',
        [{ text: 'OK' }]
      );
      return;
    }
    Alert.alert(
      '¿Confirmás que completaste todo?',
      'Tu palabra es tu honor. Solo marcá como completo si realmente lo hiciste.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, lo hice', onPress: onComplete },
      ]
    );
  }

  const wordCount = letter.trim() === '' ? 0 : letter.trim().split(/\s+/).length;

  return (
    <LinearGradient colors={['#0A0005', '#1A0008', '#0D0000']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            <View style={penaltyStyles.header}>
              <Text style={penaltyStyles.skull}>💀</Text>
              <Text style={penaltyStyles.title}>MISIÓN DE{'\n'}PENITENCIA</Text>
              <Text style={penaltyStyles.subtitle}>
                Día {dayNumber} — fallaste ayer. No se negocia, no se pospone.{'\n'}
                Completá todo antes de seguir.
              </Text>
            </View>

            <Text style={penaltyStyles.sectionLabel}>LAS 4 PRUEBAS</Text>
            {PENALTY_TASKS.map((task, i) => (
              <TouchableOpacity
                key={i}
                style={[penaltyStyles.taskCard, checked[i] && penaltyStyles.taskCardDone]}
                onPress={() => toggleCheck(i)}
                activeOpacity={0.8}
              >
                <View style={[penaltyStyles.checkbox, checked[i] && penaltyStyles.checkboxDone]}>
                  {checked[i] && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>✓</Text>}
                </View>
                <Text style={penaltyStyles.taskEmoji}>{task.emoji}</Text>
                <Text style={[penaltyStyles.taskText, checked[i] && penaltyStyles.taskTextDone]}>
                  {task.text}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={[penaltyStyles.sectionLabel, { marginTop: SPACING.lg }]}>
              CARTA DE COMPROMISO
            </Text>
            <Text style={penaltyStyles.letterHint}>
              ¿Por qué empezaste esto? ¿Quién querés ser en 90 días? ¿Qué cambiaría si terminás?
            </Text>
            <TextInput
              style={penaltyStyles.letterInput}
              value={letter}
              onChangeText={setLetter}
              multiline
              placeholder="Escribí desde el corazón. Mínimo 50 palabras..."
              placeholderTextColor={COLORS.textMuted}
              textAlignVertical="top"
            />
            <Text style={[penaltyStyles.wordCount, wordCount >= 50 && { color: COLORS.success }]}>
              {wordCount} palabras {wordCount >= 50 ? '✓' : '(mínimo 50)'}
            </Text>

            <TouchableOpacity
              style={[penaltyStyles.completeBtn, !allChecked && { opacity: 0.5 }]}
              onPress={handleComplete}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={allChecked ? ['#EF4444', '#7C3AED'] : ['#333', '#222']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={penaltyStyles.completeBtnInner}
              >
                <Text style={penaltyStyles.completeBtnText}>
                  {allChecked ? '⚔️ COMPLETÉ LA PENITENCIA' : `Faltan ${checked.filter(Boolean).length}/4 tareas`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {onGrace && (
              <TouchableOpacity style={penaltyStyles.graceBtn} onPress={onGrace}>
                <Text style={{ fontSize: 16 }}>🛡️</Text>
                <Text style={penaltyStyles.graceBtnText}>Usar día de gracia (1 disponible este mes)</Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const penaltyStyles = StyleSheet.create({
  header: { alignItems: 'center', paddingVertical: SPACING.lg },
  skull: { fontSize: 56, marginBottom: SPACING.sm },
  title: { fontSize: 34, fontWeight: '900', color: '#F5F0FF', textAlign: 'center',
    lineHeight: 38, marginBottom: SPACING.sm,
    textShadowColor: '#EF4444', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12 },
  subtitle: { fontSize: FONT.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  sectionLabel: { fontSize: FONT.xs, color: '#EF4444', fontWeight: '800',
    letterSpacing: 2, marginBottom: SPACING.sm },
  taskCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' },
  taskCardDone: { backgroundColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2,
    borderColor: '#EF4444', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  checkboxDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  taskEmoji: { fontSize: 20, flexShrink: 0 },
  taskText: { flex: 1, fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 20 },
  taskTextDone: { color: COLORS.textMuted, textDecorationLine: 'line-through' },
  letterHint: { fontSize: FONT.xs, color: COLORS.textMuted, marginBottom: SPACING.sm, lineHeight: 18 },
  letterInput: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    color: COLORS.textPrimary, fontSize: FONT.base, padding: SPACING.md,
    minHeight: 160, lineHeight: 24 },
  wordCount: { fontSize: FONT.xs, color: COLORS.textMuted, textAlign: 'right',
    marginTop: 4, marginBottom: SPACING.lg },
  completeBtn: { borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: SPACING.md },
  completeBtnInner: { paddingVertical: 16, alignItems: 'center' },
  completeBtnText: { color: '#fff', fontSize: FONT.base, fontWeight: '900', letterSpacing: 1.5 },
  graceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, padding: SPACING.md,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
    backgroundColor: 'rgba(245,158,11,0.08)' },
  graceBtnText: { fontSize: FONT.sm, color: COLORS.warning, fontWeight: '600' },
});
