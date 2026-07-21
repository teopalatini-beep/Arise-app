import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Pressable, SafeAreaView, KeyboardAvoidingView, Platform, Dimensions, Share, Modal, ActivityIndicator, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop, Rect, G, Text as SvgText, Line } from 'react-native-svg';
import { useApp } from '@/context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONT, METAL, RADIUS, SEMANTIC, SPACING, SURFACES, TOUCH } from '@/theme';
import { BADGE_DEFINITIONS, DayMetrics, RANK_COLORS, RANK_LABELS, BadgeId, CoachId } from '@/types';
import { buildDynamicChallenges, getNextStageHint, getPowerStage, getStageTheme, StageTheme } from '@/lib/progression';
import { buildWeeklyCoachReport, COACH_STORAGE_KEY } from '@/lib/coach';
import CoachParticles from '@components/CoachParticles';
import ScreenLoadingState from '@components/ui/ScreenLoadingState';
import { useMetrics } from '@/hooks/useMetrics';
import Heatmap from '@components/progreso/Heatmap';
import WeightChart from '@components/progreso/WeightChart';
import XPRing from '@components/progreso/XPRing';
import MetricsForm from '@components/progreso/MetricsForm';
import StaggerIn from '@components/ui/StaggerIn';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { trackMissionProgress } from '@/services/analytics';
import { useTabScreenMotion } from '@/hooks/useTabScreenMotion';
import { dateFromDayNumber } from '@/lib/dates';

const SCREEN_W = Dimensions.get('window').width - SPACING.md * 2;

// ─── Day Detail Sheet ─────────────────────────────────────────────────────────
const MOOD_EMOJIS = ['', '😞', '😕', '😐', '🙂', '😄'];

function DayDetailSheet({ dayNum, record, stageTheme, onClose }: {
  dayNum: number | null;
  record: any | null;
  stageTheme: ReturnType<typeof getStageTheme>;
  onClose: () => void;
}) {
  if (!dayNum) return null;

  const statusColor = record?.completed ? SEMANTIC.success : record?.missed ? SEMANTIC.destructive : SEMANTIC.onSurfaceMuted;
  const statusLabel = record?.completed ? 'Completado' : record?.missed ? 'Fallado' : 'Pendiente / sin datos';
  const statusIcon = record?.completed ? 'checkmark-circle' : record?.missed ? 'close-circle' : 'time-outline';
  const metrics = record?.metrics;
  const journal = record?.journal;
  const completedMissions = (record?.missionStates ?? []).filter((s: any) => s.points > 0).length;
  const totalPoints = record?.totalPoints ?? 0;
  const pointsTarget = record?.pointsTarget ?? 30;

  return (
    <Modal visible={!!dayNum} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <LinearGradient
          colors={[stageTheme.background[1], stageTheme.background[2]]}
          style={dayDetailStyles.sheet}
        >
          <ScrollView contentContainerStyle={dayDetailStyles.content} showsVerticalScrollIndicator={false}>
            <View style={dayDetailStyles.handle} />

            {/* Title */}
            <View style={dayDetailStyles.titleRow}>
              <Text style={dayDetailStyles.title}>DÍA {dayNum}</Text>
              <View style={dayDetailStyles.statusRow}>
                <Ionicons name={statusIcon as any} size={14} color={statusColor} />
                <Text style={[dayDetailStyles.status, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            </View>

            {/* Points bar */}
            {record && (
              <View style={dayDetailStyles.pointsBlock}>
                <View style={dayDetailStyles.pointsHeader}>
                  <Text style={dayDetailStyles.pointsLabel}>PUNTOS</Text>
                  <Text style={[dayDetailStyles.pointsValue, { color: record.completed ? COLORS.success : stageTheme.tabActive }]}>
                    {totalPoints} / {pointsTarget}
                  </Text>
                </View>
                <View style={dayDetailStyles.barBg}>
                  <LinearGradient
                    colors={record.completed ? ['#22C55E', '#16A34A'] : stageTheme.accent}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[dayDetailStyles.barFill, { width: `${Math.min(totalPoints / pointsTarget, 1) * 100}%` as any }]}
                  />
                </View>
                {completedMissions > 0 && (
                  <Text style={dayDetailStyles.missionsCount}>
                    {completedMissions} misión{completedMissions !== 1 ? 'es' : ''} con puntos
                  </Text>
                )}
              </View>
            )}

            {/* Metrics grid */}
            {metrics && (
              <>
                <Text style={dayDetailStyles.sectionLabel}>MÉTRICAS</Text>
                <View style={dayDetailStyles.metricsGrid}>
                  {metrics.weight != null && (
                    <View style={dayDetailStyles.metricBox}>
                      <Text style={dayDetailStyles.metricEmoji}>⚖️</Text>
                      <Text style={dayDetailStyles.metricVal}>{metrics.weight.toFixed(1)} kg</Text>
                      <Text style={dayDetailStyles.metricKey}>Peso</Text>
                    </View>
                  )}
                  {metrics.trainingMinutes != null && (
                    <View style={dayDetailStyles.metricBox}>
                      <Text style={dayDetailStyles.metricEmoji}>🏋️</Text>
                      <Text style={dayDetailStyles.metricVal}>{metrics.trainingMinutes} min</Text>
                      <Text style={dayDetailStyles.metricKey}>Entreno</Text>
                    </View>
                  )}
                  {metrics.readingPages != null && (
                    <View style={dayDetailStyles.metricBox}>
                      <Text style={dayDetailStyles.metricEmoji}>📚</Text>
                      <Text style={dayDetailStyles.metricVal}>{metrics.readingPages} p</Text>
                      <Text style={dayDetailStyles.metricKey}>Lectura</Text>
                    </View>
                  )}
                  {metrics.sleepHours != null && (
                    <View style={dayDetailStyles.metricBox}>
                      <Text style={dayDetailStyles.metricEmoji}>😴</Text>
                      <Text style={dayDetailStyles.metricVal}>{metrics.sleepHours} hs</Text>
                      <Text style={dayDetailStyles.metricKey}>Sueño</Text>
                    </View>
                  )}
                  {metrics.energyLevel != null && (
                    <View style={dayDetailStyles.metricBox}>
                      <Text style={dayDetailStyles.metricEmoji}>⚡</Text>
                      <Text style={dayDetailStyles.metricVal}>{metrics.energyLevel}/10</Text>
                      <Text style={dayDetailStyles.metricKey}>Energía</Text>
                    </View>
                  )}
                  {metrics.mood != null && (
                    <View style={dayDetailStyles.metricBox}>
                      <Text style={dayDetailStyles.metricEmoji}>{MOOD_EMOJIS[metrics.mood] ?? '😐'}</Text>
                      <Text style={dayDetailStyles.metricVal}>{metrics.mood}/5</Text>
                      <Text style={dayDetailStyles.metricKey}>Ánimo</Text>
                    </View>
                  )}
                </View>
                {metrics.notes ? (
                  <View style={dayDetailStyles.notesBox}>
                    <Text style={dayDetailStyles.notesLabel}>NOTAS</Text>
                    <Text style={dayDetailStyles.notesText}>{metrics.notes}</Text>
                  </View>
                ) : null}
              </>
            )}

            {/* Journal preview */}
            {journal ? (
              <>
                <Text style={dayDetailStyles.sectionLabel}>DIARIO</Text>
                <View style={dayDetailStyles.journalBox}>
                  <Text style={dayDetailStyles.journalText} numberOfLines={5}>{journal}</Text>
                </View>
              </>
            ) : null}

            {!record && (
              <View style={dayDetailStyles.emptyBox}>
                <Text style={dayDetailStyles.emptyText}>Sin datos registrados para este día.</Text>
              </View>
            )}

            <Pressable style={dayDetailStyles.closeBtn} onPress={onClose}>
              <LinearGradient
                colors={stageTheme.accent}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={dayDetailStyles.closeBtnInner}
              >
                <Text style={dayDetailStyles.closeBtnText}>Cerrar</Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const dayDetailStyles = StyleSheet.create({
  sheet: {
    maxHeight: '78%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  content: { padding: SPACING.lg, paddingBottom: 32 },
  handle: {
    width: 36, height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  title: { fontSize: FONT.xxl, fontWeight: '900', color: COLORS.textPrimary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  status: { fontSize: FONT.sm, fontWeight: '700' },

  pointsBlock: { marginBottom: SPACING.md },
  pointsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  pointsLabel: { fontSize: FONT.xs, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 1 },
  pointsValue: { fontSize: FONT.base, fontWeight: '900' },
  barBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  barFill: { height: '100%', borderRadius: 4, minWidth: 5 },
  missionsCount: { fontSize: FONT.xs, color: COLORS.textMuted, marginTop: 2 },

  sectionLabel: {
    fontSize: FONT.xs, fontWeight: '800', color: COLORS.textMuted,
    letterSpacing: 2, marginBottom: SPACING.sm, marginTop: SPACING.sm,
  },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.sm },
  metricBox: {
    width: '30%', backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md, padding: SPACING.sm,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, gap: 2,
  },
  metricEmoji: { fontSize: 20 },
  metricVal: { fontSize: FONT.sm, fontWeight: '900', color: COLORS.textPrimary },
  metricKey: { fontSize: 9, color: COLORS.textMuted, fontWeight: '600' },

  notesBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  notesLabel: { fontSize: FONT.xs, fontWeight: '700', color: COLORS.textMuted, marginBottom: 4, letterSpacing: 1 },
  notesText: { fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 20 },

  journalBox: {
    backgroundColor: 'rgba(72,149,239,0.07)',
    borderRadius: RADIUS.md, padding: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(72,149,239,0.2)',
    marginBottom: SPACING.md,
  },
  journalText: { fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 22, fontStyle: 'italic' },

  emptyBox: { alignItems: 'center', paddingVertical: SPACING.xl },
  emptyText: { color: COLORS.textMuted, fontSize: FONT.sm },

  closeBtn: { borderRadius: RADIUS.xl, overflow: 'hidden', marginTop: SPACING.sm },
  closeBtnInner: { paddingVertical: 14, alignItems: 'center' },
  closeBtnText: { color: '#fff', fontWeight: '800', fontSize: FONT.base, letterSpacing: 1 },
});

// ─── Line chart (peso) ────────────────────────────────────────────────────────
function LineChart({ data, color, label }: { data: { x: number; y: number }[]; color: string; label: string }) {
  const W = SCREEN_W - 32;
  const H = 100;
  const pad = { top: 10, bottom: 20, left: 30, right: 10 };

  if (data.length < 2) {
    return (
      <View style={[chartStyles.empty, { height: H + pad.top + pad.bottom }]}>
        <Ionicons name="analytics-outline" size={24} color={COLORS.textMuted} />
        <Text style={chartStyles.emptyText}>Cargá datos para ver el gráfico</Text>
      </View>
    );
  }

  const ys = data.map(d => d.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeY = maxY - minY || 1;
  const totalW = W - pad.left - pad.right;
  const totalH = H;

  const toX = (i: number) => pad.left + (i / (data.length - 1)) * totalW;
  const toY = (v: number) => pad.top + totalH - ((v - minY) / rangeY) * totalH;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d.y).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${toX(data.length - 1).toFixed(1)},${(pad.top + totalH).toFixed(1)} L${toX(0).toFixed(1)},${(pad.top + totalH).toFixed(1)} Z`;
  const gradId = `lineGrad_${label.replace(/\s/g, '_')}`;

  return (
    <Svg width={W} height={H + pad.top + pad.bottom}>
      <Defs>
        <SvgGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.3" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </SvgGradient>
      </Defs>
      {/* Area */}
      <Path d={areaPath} fill={`url(#${gradId})`} />
      {/* Line */}
      <Path d={linePath} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots for first and last */}
      <Circle cx={toX(0)} cy={toY(data[0].y)} r={3} fill={color} />
      <Circle cx={toX(data.length - 1)} cy={toY(data[data.length - 1].y)} r={4} fill={color} />
      {/* Y axis labels */}
      <SvgText x={pad.left - 4} y={pad.top + 4} textAnchor="end" fontSize="9" fill={COLORS.textMuted}>{maxY.toFixed(1)}</SvgText>
      <SvgText x={pad.left - 4} y={pad.top + totalH} textAnchor="end" fontSize="9" fill={COLORS.textMuted}>{minY.toFixed(1)}</SvgText>
    </Svg>
  );
}

// ─── Bar chart semanal ────────────────────────────────────────────────────────
function WeeklyBars({ days, field, color, unit }: {
  days: any[]; field: 'trainingMinutes' | 'breathingMinutes' | 'readingPages'; color: string; unit: string;
}) {
  const W = SCREEN_W - 32;
  const H = 80;
  const weeks = Array.from({ length: 13 }, (_, wi) => {
    const start = wi * 7 + 1;
    const end = Math.min(start + 6, 90);
    const total = days
      .filter(d => d.dayNumber >= start && d.dayNumber <= end)
      .reduce((sum, d) => sum + (d.metrics?.[field] ?? 0), 0);
    return { week: wi + 1, total };
  }).filter(w => w.total > 0);

  if (weeks.length === 0) {
    return (
      <View style={[chartStyles.empty, { height: H }]}>
        <Text style={chartStyles.emptyText}>Sin datos aún</Text>
      </View>
    );
  }

  const maxVal = Math.max(...weeks.map(w => w.total), 1);
  const barW = Math.floor((W - 16) / weeks.length) - 4;

  return (
    <Svg width={W} height={H + 20}>
      {weeks.map((w, i) => {
        const barH = Math.max((w.total / maxVal) * H, 4);
        const x = 8 + i * (barW + 4);
        const y = H - barH;
        return (
          <G key={w.week}>
            <Rect x={x} y={y} width={barW} height={barH} rx={3} fill={color} opacity={0.85} />
            <SvgText x={x + barW / 2} y={H + 14} textAnchor="middle" fontSize="8" fill={COLORS.textMuted}>
              S{w.week}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ─── Energy Trend Strip ───────────────────────────────────────────────────────
function EnergyTrendStrip({ data }: { data: { dayNumber: number; level: number }[] }) {
  if (data.length === 0) {
    return (
      <View style={[chartStyles.empty, { height: 60 }]}>
        <Text style={chartStyles.emptyText}>Registrá tu energía diaria para ver la tendencia</Text>
      </View>
    );
  }

  const recent = data.slice(-14);
  const avg = recent.reduce((s, d) => s + d.level, 0) / recent.length;

  const energyColor = (level: number) => {
    if (level <= 3) return COLORS.danger;
    if (level <= 6) return COLORS.warning;
    return COLORS.success;
  };

  return (
    <View>
      <View style={energyStyles.strip}>
        {recent.map(d => (
          <View key={d.dayNumber} style={energyStyles.dotCol}>
            <View style={[energyStyles.dot, { backgroundColor: energyColor(d.level) }]} />
            <Text style={energyStyles.dotNum}>{d.level}</Text>
          </View>
        ))}
      </View>
      <View style={energyStyles.footer}>
        <View style={energyStyles.legendRow}>
          {[{ color: COLORS.success, label: '7-10' }, { color: COLORS.warning, label: '4-6' }, { color: COLORS.danger, label: '1-3' }].map(l => (
            <View key={l.label} style={energyStyles.legendItem}>
              <View style={[energyStyles.legendDot, { backgroundColor: l.color }]} />
              <Text style={energyStyles.legendText}>{l.label}</Text>
            </View>
          ))}
        </View>
        <Text style={energyStyles.avg}>Promedio: {avg.toFixed(1)}/10</Text>
      </View>
    </View>
  );
}

const energyStyles = StyleSheet.create({
  strip: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: SPACING.sm },
  dotCol: { alignItems: 'center', gap: 2 },
  dot: { width: 20, height: 20, borderRadius: 10 },
  dotNum: { fontSize: 8, color: COLORS.textMuted, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  legendRow: { flexDirection: 'row', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 9, color: COLORS.textMuted },
  avg: { fontSize: FONT.xs, color: COLORS.textSecondary, fontWeight: '700' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ProgresoScreen() {
  const { reducedMotion, screenAnimStyle } = useTabScreenMotion('progreso');
  const { data, todayRecord, saveMetrics, newBadges, clearNewBadges, setPreferredCoach, loading } = useApp();
  const {
    syncing: metricsSyncing,
    error: metricsError,
    chartData: remoteWeightData,
    heatmapDayNumbers,
    saveDailyMetrics: saveDailyMetricsRemote,
  } = useMetrics({ startDate: data?.user.startDate });
  const [weight, setWeight] = useState(todayRecord?.metrics?.weight?.toString() ?? '');
  const [trainMin, setTrainMin] = useState(todayRecord?.metrics?.trainingMinutes?.toString() ?? '');
  const [readPages, setReadPages] = useState(todayRecord?.metrics?.readingPages?.toString() ?? '');
  const [breathMin, setBreathMin] = useState(todayRecord?.metrics?.breathingMinutes?.toString() ?? '');
  const [sleepHours, setSleepHours] = useState(todayRecord?.metrics?.sleepHours?.toString() ?? '');
  const [energyLevel, setEnergyLevel] = useState(todayRecord?.metrics?.energyLevel ?? 0);
  const [metricNotes, setMetricNotes] = useState(todayRecord?.metrics?.notes ?? '');
  const [saved, setSaved] = useState(false);
  const [savingMetrics, setSavingMetrics] = useState(false);
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [sharingStory, setSharingStory] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const storyRef = useRef<ViewShot | null>(null);

  if (!data) {
    const fallbackTheme = getStageTheme();
    return (
      <LinearGradient colors={fallbackTheme.background} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          {loading ? (
            <ScreenLoadingState
              title="Progreso"
              subtitle="Sincronizando métricas, badges y reportes..."
              icon="analytics-outline"
              accent={fallbackTheme.tabActive}
              reducedMotion={reducedMotion}
              hints={[
                'Calculando estadisticas',
                'Trayendo datos de metricas',
                'Cargando reporte del coach',
              ]}
            />
          ) : (
            <View style={chartStyles.empty}>
              <Ionicons name="analytics-outline" size={40} color={COLORS.textMuted} />
              <Text style={chartStyles.emptyText}>
                No pudimos cargar tu progreso.{'\n'}Revisa conexión e inicia sesión nuevamente.
              </Text>
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>
    );
  }
  const { user, days } = data;
  const powerStage = getPowerStage(user);
  const stageTheme = getStageTheme(user);
  const nextStageHint = getNextStageHint(user);
  const earnedBadges = useMemo(
    () => (user.badges ?? []).map(id => ({ id, ...BADGE_DEFINITIONS[id] })),
    [user.badges],
  );
  const recentBadges = useMemo(
    () => [...earnedBadges].reverse().slice(0, 6),
    [earnedBadges],
  );
  const lockedBadges = useMemo(
    () => (Object.keys(BADGE_DEFINITIONS) as BadgeId[])
      .filter(id => !(user.badges ?? []).includes(id))
      .slice(0, 3)
      .map(id => ({ id, ...BADGE_DEFINITIONS[id] })),
    [user.badges],
  );
  const dynamicChallenges = useMemo(
    () => buildDynamicChallenges(user, days).slice(0, 3),
    [user, days],
  );
  const weeklyReport = useMemo(() => buildWeeklyCoachReport(data, 'arise'), [data]);

  useEffect(() => {
    // Migrate legacy anime coach preference → single ARISE coach
    if (user.preferredCoachId && user.preferredCoachId !== 'arise') {
      setPreferredCoach('arise');
    }
    void AsyncStorage.setItem(COACH_STORAGE_KEY, 'arise');
  }, [user.preferredCoachId, setPreferredCoach]);

  function xpForLevel(level: number) { return level * level * 100; }

  async function handleSave() {
    if (savingMetrics) return;
    setSavingMetrics(true);
    const existingMetrics = todayRecord?.metrics ?? {};
    const metrics: DayMetrics = {
      ...existingMetrics,
      weight: weight ? parseFloat(weight) : undefined,
      trainingMinutes: trainMin ? parseInt(trainMin) : undefined,
      readingPages: readPages ? parseInt(readPages) : undefined,
      breathingMinutes: breathMin ? parseInt(breathMin) : undefined,
      sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
      energyLevel: energyLevel || undefined,
      notes: metricNotes || undefined,
    };
    saveMetrics(metrics);
    try {
      const metricDate = user.startDate
        ? dateFromDayNumber(user.startDate, user.currentDay)
        : new Date().toISOString().slice(0, 10);
      const remotePayload = {
        date: metricDate,
        currentWeight: metrics.weight,
        readingPages: metrics.readingPages,
        meditationMinutes: metrics.breathingMinutes,
        breathingMinutes: metrics.breathingMinutes,
        trainingMinutes: metrics.trainingMinutes,
        sleepHours: metrics.sleepHours,
        energyLevel: metrics.energyLevel,
        mood: metrics.mood,
        notes: metrics.notes,
      };
      await saveDailyMetricsRemote(remotePayload);
      const filledFields = [
        remotePayload.currentWeight,
        remotePayload.readingPages,
        remotePayload.meditationMinutes,
        remotePayload.trainingMinutes,
        remotePayload.sleepHours,
        remotePayload.energyLevel,
        remotePayload.mood,
      ].filter((value) => typeof value === 'number').length;
      if (filledFields > 0) {
        void trackMissionProgress('daily_metrics_saved', 'bienestar', user.currentDay, filledFields);
      }
    } catch (error) {
      console.error('[Progreso] saveDailyMetricsRemote failed', error);
    } finally {
      setSavingMetrics(false);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleShareProgress() {
    const shareText = buildShareText({
      currentWeek,
      weeklySummary: weeklyReport.summary,
      streak: user.streak,
      coachName: 'Coach ARISE',
    });
    await Share.share({
      title: 'Mi progreso en ARISE',
      message: shareText,
    });
  }

  async function handleShareStoryImage() {
    if (!storyRef.current) return;
    try {
      setSharingStory(true);
      const uri = await storyRef.current.capture?.();
      if (!uri) return;
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Compartir story de progreso',
        });
      } else {
        await Share.share({ url: uri, message: 'Mi progreso en ARISE' });
      }
    } finally {
      setSharingStory(false);
    }
  }

  const currentWeek = useMemo(() => Math.ceil(user.currentDay / 7), [user.currentDay]);
  const weekDays = useMemo(() => {
    const weekStart = (currentWeek - 1) * 7 + 1;
    const weekEnd = Math.min(currentWeek * 7, user.currentDay);
    return days.filter(d => d.dayNumber >= weekStart && d.dayNumber <= weekEnd);
  }, [days, currentWeek, user.currentDay]);
  const weekCompleted = useMemo(() => weekDays.filter(d => d.completed).length, [weekDays]);
  const weekMissed = useMemo(() => weekDays.filter(d => d.missed).length, [weekDays]);

  const {
    completedDays,
    missedDays,
    totalTrainMin,
    totalReadPages,
    totalBreathMin,
    trainedDaysCount,
    latestWeight,
  } = useMemo(() => {
    let completed = 0;
    let missed = 0;
    let trainMin = 0;
    let readPages = 0;
    let breathMin = 0;
    let trainedDays = 0;
    let latestKnownWeight: number | undefined;

    for (const day of days) {
      if (day.completed) completed++;
      if (day.missed) missed++;

      const trainingMinutes = day.metrics?.trainingMinutes ?? 0;
      if (trainingMinutes > 0) trainedDays++;

      trainMin += trainingMinutes;
      readPages += day.metrics?.readingPages ?? 0;
      breathMin += day.metrics?.breathingMinutes ?? 0;

      if (typeof day.metrics?.weight === 'number') latestKnownWeight = day.metrics.weight;
    }

    return {
      completedDays: completed,
      missedDays: missed,
      totalTrainMin: trainMin,
      totalReadPages: readPages,
      totalBreathMin: breathMin,
      trainedDaysCount: trainedDays,
      latestWeight: latestKnownWeight,
    };
  }, [days]);

  const completionRate = useMemo(
    () => (user.currentDay > 1 ? Math.round((completedDays / (user.currentDay - 1)) * 100) : 0),
    [completedDays, user.currentDay],
  );

  const weightData = useMemo(() => {
    if (remoteWeightData.length >= 2) return remoteWeightData;
    return days
      .filter(d => typeof d.metrics?.weight === 'number')
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .map(d => ({ x: d.dayNumber, y: d.metrics!.weight! }));
  }, [days, remoteWeightData]);

  const sleepData = useMemo(
    () => days
      .filter(d => typeof d.metrics?.sleepHours === 'number')
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .map(d => ({ x: d.dayNumber, y: d.metrics!.sleepHours! })),
    [days],
  );

  const energyData = useMemo(
    () => days
      .filter(d => typeof d.metrics?.energyLevel === 'number')
      .sort((a, b) => a.dayNumber - b.dayNumber)
      .map(d => ({ dayNumber: d.dayNumber, level: d.metrics!.energyLevel! })),
    [days],
  );

  const avgSleep = useMemo(
    () => (sleepData.length > 0 ? sleepData.reduce((s, d) => s + d.y, 0) / sleepData.length : 0),
    [sleepData],
  );

  const hasAnyGoals = useMemo(
    () => !!user.goals && Object.keys(user.goals).some(k => (user.goals as any)[k] != null),
    [user.goals],
  );

  const weightGoalProgress = useMemo(() => {
    if (
      typeof user.goals?.targetWeight !== 'number' ||
      typeof user.initialWeight !== 'number'
    ) {
      return null;
    }

    const latest = latestWeight ?? user.initialWeight;
    const totalDelta = user.goals.targetWeight - user.initialWeight;
    const doneDelta = latest - user.initialWeight;
    const pct = Math.abs(totalDelta) < 0.1 ? 1 : Math.max(0, Math.min(1, doneDelta / totalDelta));

    return { latest, pct };
  }, [user.goals?.targetWeight, user.initialWeight, latestWeight]);

  const coachId = user.preferredCoachId ?? 'arise';

  return (
    <LinearGradient colors={stageTheme.background} style={styles.container}>
      <CoachParticles coachId={coachId} screen="progreso" reducedMotion={reducedMotion} />
      <Animated.View style={[styles.motionLayer, screenAnimStyle]}>
        <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Progreso</Text>
                <Text style={styles.subtitle}>Día {user.currentDay} de 90</Text>
              </View>
              <XPRing xp={user.xp} level={user.level} xpForLevel={xpForLevel} />
            </View>

            {/* Stats row */}
            <StaggerIn index={0} reducedMotion={reducedMotion}>
            <View style={styles.statsRow}>
              <StatChip icon="flame" value={`${user.streak}`} label="Racha" color={COLORS.streak} />
              <StatChip icon="checkmark-circle" value={`${completedDays}`} label="Días OK" color={COLORS.success} />
              <StatChip icon="trending-up" value={`${completionRate}%`} label="Efectividad" color={COLORS.accent} />
              <StatChip icon="close-circle" value={`${missedDays}`} label="Fallados" color={COLORS.danger} />
            </View>
            </StaggerIn>

            {newBadges.length > 0 && (
              <View style={styles.newBadgeBanner}>
                <Text style={styles.newBadgeTitle}>Nuevos logros desbloqueados</Text>
                <Text style={styles.newBadgeText}>
                  {newBadges.map(id => BADGE_DEFINITIONS[id]?.name ?? id).join(' · ')}
                </Text>
                <Pressable onPress={clearNewBadges}>
                  <Text style={styles.newBadgeAction}>Ocultar</Text>
                </Pressable>
              </View>
            )}

            <Text style={styles.sectionTitle}>Etapa actual</Text>
            <StaggerIn index={1} reducedMotion={reducedMotion}>
            <View style={styles.card}>
              <LinearGradient colors={powerStage.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.powerPill}>
                <Text style={styles.powerPillText}>{powerStage.auraLabel}</Text>
              </LinearGradient>
              <Text style={styles.powerTitle}>{powerStage.title}</Text>
              <Text style={styles.powerSubtitle}>{nextStageHint}</Text>
            </View>
            </StaggerIn>

            <StaggerIn index={2} reducedMotion={reducedMotion}>
            <MetricsForm
              dayNumber={user.currentDay}
              weight={weight}
              setWeight={setWeight}
              trainMin={trainMin}
              setTrainMin={setTrainMin}
              readPages={readPages}
              setReadPages={setReadPages}
              breathMin={breathMin}
              setBreathMin={setBreathMin}
              sleepHours={sleepHours}
              setSleepHours={setSleepHours}
              energyLevel={energyLevel}
              setEnergyLevel={setEnergyLevel}
              metricNotes={metricNotes}
              setMetricNotes={setMetricNotes}
              saved={saved}
              saving={savingMetrics}
              accent={stageTheme.accent}
              onSave={handleSave}
            />
            </StaggerIn>

            <Pressable
              style={styles.moreDetailsBtn}
              onPress={() => setShowMoreDetails(v => !v)}
              accessibilityRole="button"
              accessibilityState={{ expanded: showMoreDetails }}
            >
              <Text style={styles.moreDetailsLabel}>
                {showMoreDetails ? 'Ocultar detalles' : 'Más métricas y logros'}
              </Text>
              <Ionicons
                name={showMoreDetails ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={METAL.gold}
              />
            </Pressable>

            {showMoreDetails && (
              <>
            <Text style={styles.sectionTitle}>Logros</Text>
            <StaggerIn index={3} reducedMotion={reducedMotion}>
            <View style={styles.card}>
              <Text style={styles.badgeSummary}>{earnedBadges.length} desbloqueados · {Object.keys(BADGE_DEFINITIONS).length - earnedBadges.length} pendientes</Text>
              <View style={styles.badgesGrid}>
                {recentBadges.map(b => (
                  <View key={b.id} style={[styles.badgeCard, { borderColor: `${RANK_COLORS[b.rank]}50` }]}>
                    {b.emoji ? (
                      <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                    ) : (
                      <Ionicons name="ribbon-outline" size={22} color={RANK_COLORS[b.rank]} style={{ marginBottom: 4 }} />
                    )}
                    <Text style={styles.badgeName} numberOfLines={1}>{b.name}</Text>
                    <Text style={[styles.badgeRank, { color: RANK_COLORS[b.rank] }]}>{RANK_LABELS[b.rank]}</Text>
                  </View>
                ))}
              </View>
            </View>
            </StaggerIn>

            <Text style={styles.sectionTitle}>Próximos desbloqueos</Text>
            <View style={styles.card}>
              {lockedBadges.map(b => (
                <View key={b.id} style={styles.lockedRow}>
                  <Ionicons name="lock-closed" size={14} color={SEMANTIC.onSurfaceMuted} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lockedName}>{b.name}</Text>
                    <Text style={styles.lockedDesc}>{b.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Desafíos</Text>
            <View style={styles.card}>
              {dynamicChallenges.map(ch => {
                const ratio = Math.max(0, Math.min(1, ch.current / Math.max(ch.target, 1)));
                return (
                  <View key={ch.id} style={styles.challengeRow}>
                    <Text style={styles.challengeTitle}>{ch.label}</Text>
                    <Text style={styles.challengeMeta}>{ch.current} / {ch.target} {ch.unit}</Text>
                    <View style={styles.challengeBarBg}>
                      <View style={[styles.challengeBarFill, { width: `${ratio * 100}%` as any }]} />
                    </View>
                  </View>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Coach semanal</Text>
            <View style={styles.card}>
              <Text style={styles.coachTitle}>{weeklyReport.title}</Text>
              <Text style={styles.coachSummary}>{weeklyReport.summary}</Text>

              <Text style={styles.coachLabel}>Lo mejor de tu semana</Text>
              {weeklyReport.wins.map(win => (
                <View key={win} style={styles.coachRow}>
                  <Text style={styles.coachBullet}>•</Text>
                  <Text style={styles.coachRowText}>{win}</Text>
                </View>
              ))}

              <Text style={styles.coachLabel}>Foco para la proxima</Text>
              {weeklyReport.focus.map(item => (
                <View key={item} style={styles.coachRow}>
                  <Text style={styles.coachBullet}>•</Text>
                  <Text style={styles.coachRowText}>{item}</Text>
                </View>
              ))}

              <Text style={styles.coachMessage}>{weeklyReport.message}</Text>
            </View>

            <Text style={styles.sectionTitle}>Compartir progreso</Text>
            <View style={styles.shareRow}>
              <Pressable style={styles.shareButton} onPress={() => setShowStoryModal(true)}>
                <LinearGradient colors={stageTheme.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.shareGradient}>
                  <Ionicons name="image-outline" size={18} color="#fff" />
                  <Text style={styles.shareText}>Story Card</Text>
                </LinearGradient>
              </Pressable>
              <Pressable style={styles.shareButton} onPress={handleShareProgress}>
                <LinearGradient colors={[METAL.goldDim, METAL.gold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.shareGradient}>
                  <Ionicons name="share-social-outline" size={18} color="#fff" />
                  <Text style={styles.shareText}>Texto</Text>
                </LinearGradient>
              </Pressable>
            </View>

            {/* Heatmap */}
            <Text style={styles.sectionTitle}>Mapa de 90 días</Text>
            <Text style={{ fontSize: FONT.xs, color: COLORS.textMuted, marginBottom: SPACING.sm, marginTop: -SPACING.sm }}>
              Tocá cualquier día para ver el resumen.
            </Text>
            <View style={styles.card}>
              <Heatmap
                days={days}
                currentDay={user.currentDay}
                metricDays={heatmapDayNumbers}
                onDayPress={setSelectedDay}
              />
              {metricsSyncing ? (
                <Text style={styles.chartFooterCenter}>Sincronizando en segundo plano...</Text>
              ) : null}
            </View>

            {/* Goals progress bars */}
            {hasAnyGoals && (
              <>
                <Text style={styles.sectionTitle}>Objetivos personales</Text>
                <View style={styles.card}>
                  {typeof user.goals?.targetStreak === 'number' && user.goals.targetStreak > 0 && (
                    <GoalBar
                      label="Racha objetivo"
                      current={user.streak}
                      target={user.goals.targetStreak}
                      unit="días"
                      color={COLORS.streak}
                    />
                  )}
                  {typeof user.goals?.targetReadingPages === 'number' && user.goals.targetReadingPages > 0 && (
                    <GoalBar
                      label="Páginas leídas"
                      current={totalReadPages}
                      target={user.goals.targetReadingPages}
                      unit="págs"
                      color={COLORS.mente}
                    />
                  )}
                  {typeof user.goals?.targetWeight === 'number' && weightGoalProgress && (
                    <GoalBar
                      label="Peso objetivo"
                      current={parseFloat(weightGoalProgress.latest.toFixed(1))}
                      target={user.goals.targetWeight}
                      unit="kg"
                      color={COLORS.accent}
                      forcePct={weightGoalProgress.pct}
                    />
                  )}
                  {typeof user.goals?.targetTrainingDays === 'number' && user.goals.targetTrainingDays > 0 && (
                    <GoalBar
                      label="Días entrenados"
                      current={trainedDaysCount}
                      target={user.goals.targetTrainingDays}
                      unit="días"
                      color={COLORS.cuerpo}
                    />
                  )}
                </View>
              </>
            )}

            {/* Weight chart */}
            <Text style={styles.sectionTitle}>Evolución de peso</Text>
            <View style={styles.card}>
              <WeightChart
                data={weightData}
                initialWeight={user.initialWeight}
                targetWeight={user.goals?.targetWeight}
                currentDay={user.currentDay}
                track={user.adaptiveProfile?.track}
                sourceLabel={remoteWeightData.length >= 2 ? 'Supabase user_metrics' : 'Cache local'}
              />
              {metricsError ? (
                <Text style={[styles.chartFooterCenter, { color: COLORS.warning }]}>
                  {metricsError}
                </Text>
              ) : null}
            </View>

            {/* Weekly training bars */}
            <Text style={styles.sectionTitle}>Entrenamiento semanal</Text>
            <View style={styles.card}>
              <WeeklyBars days={days} field="trainingMinutes" color={COLORS.cuerpo} unit="min" />
              <Text style={styles.chartFooterCenter}>
                Total: {Math.floor(totalTrainMin / 60)}h {totalTrainMin % 60}m entrenados
              </Text>
            </View>

            {/* Weekly reading bars */}
            <Text style={styles.sectionTitle}>Lectura semanal</Text>
            <View style={styles.card}>
              <WeeklyBars days={days} field="readingPages" color={COLORS.mente} unit="págs" />
              <Text style={styles.chartFooterCenter}>
                Total: {totalReadPages} páginas leídas
              </Text>
            </View>

            {/* Weekly breathing bars */}
            <Text style={styles.sectionTitle}>Respiración semanal</Text>
            <View style={styles.card}>
              <WeeklyBars days={days} field="breathingMinutes" color={COLORS.bienestar} unit="min" />
              <Text style={styles.chartFooterCenter}>
                Total: {Math.floor(totalBreathMin / 60)}h {totalBreathMin % 60}m de práctica
              </Text>
            </View>

            {/* Sleep chart */}
            <Text style={styles.sectionTitle}>Sueño</Text>
            <View style={styles.card}>
              <LineChart data={sleepData} color="#7B68EE" label="Sueno" />
              {sleepData.length >= 2 && (
                <Text style={styles.chartFooterCenter}>
                  Promedio: {avgSleep.toFixed(1)}h por noche
                </Text>
              )}
            </View>

            {/* Energy trend */}
            <Text style={styles.sectionTitle}>Energía diaria</Text>
            <View style={styles.card}>
              <EnergyTrendStrip data={energyData} />
            </View>

            {/* Totals */}
            <Text style={styles.sectionTitle}>Resumen acumulado</Text>
            <View style={styles.totalsGrid}>
              <TotalBox icon="barbell" color={COLORS.cuerpo} label="Entrenamiento" value={`${Math.floor(totalTrainMin / 60)}h ${totalTrainMin % 60}m`} />
              <TotalBox icon="book" color={COLORS.mente} label="Páginas leídas" value={`${totalReadPages}`} />
              <TotalBox icon="leaf" color={COLORS.bienestar} label="Respiración" value={`${Math.floor(totalBreathMin / 60)}h ${totalBreathMin % 60}m`} />
              <TotalBox icon="flash" color={COLORS.productividad} label="XP ganado" value={`${user.xp}`} />
            </View>

            {/* Weekly Review button */}
            {user.currentDay > 7 && (
              <>
                <Text style={styles.sectionTitle}>Semana {currentWeek}</Text>
                <Pressable
                  style={weekStyles.reviewBtn}
                  onPress={() => setShowWeeklyReview(true)}

                >
                  <LinearGradient
                    colors={['rgba(232,70,10,0.15)', 'rgba(212,175,55,0.12)']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={weekStyles.reviewBtnInner}
                  >
                    <Ionicons name="stats-chart-outline" size={20} color={COLORS.accent} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={weekStyles.reviewTitle}>Revisión semanal</Text>
                      <Text style={weekStyles.reviewSub}>
                        Sem. {currentWeek} · {weekCompleted}/{weekDays.length} días completados
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.accent} />
                  </LinearGradient>
                </Pressable>
              </>
            )}
              </>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>
        </SafeAreaView>
      </Animated.View>

      {/* Weekly Review Modal */}
      <WeeklyReviewModal
        visible={showWeeklyReview}
        onClose={() => setShowWeeklyReview(false)}
        stageTheme={stageTheme}
        weekNumber={currentWeek}
        weekDays={weekDays}
        weekCompleted={weekCompleted}
        weekMissed={weekMissed}
        user={user}
      />

      <DayDetailSheet
        dayNum={selectedDay}
        record={selectedDay ? days.find(d => d.dayNumber === selectedDay) ?? null : null}
        stageTheme={stageTheme}
        onClose={() => setSelectedDay(null)}
      />

      <Modal visible={showStoryModal} transparent animationType="slide" onRequestClose={() => setShowStoryModal(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setShowStoryModal(false)} />
          <View style={storyStyles.sheet}>
            <ViewShot
              ref={(ref) => { storyRef.current = ref; }}
              options={{ format: 'png', quality: 1, result: 'tmpfile' }}
              style={storyStyles.captureWrap}
            >
              <LinearGradient colors={stageTheme.background} style={storyStyles.card}>
                <Text style={storyStyles.brand}>ARISE</Text>
                <Text style={storyStyles.title}>Semana {currentWeek}</Text>
                <Text style={storyStyles.subtitle}>{powerStage.title}</Text>

                <View style={storyStyles.stats}>
                  <Text style={storyStyles.stat}>Racha: {user.streak} dias</Text>
                  <Text style={storyStyles.stat}>Cumplimiento: {completionRate}%</Text>
                  <Text style={storyStyles.stat}>Coach: Coach ARISE</Text>
                </View>

                <Text style={storyStyles.message}>{weeklyReport.message}</Text>
                <Text style={storyStyles.hash}>#Arise #90Dias</Text>
              </LinearGradient>
            </ViewShot>

            <Pressable style={storyStyles.exportBtn} onPress={handleShareStoryImage} disabled={sharingStory}>
              <LinearGradient colors={stageTheme.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={storyStyles.exportBtnInner}>
                {sharingStory ? <ActivityIndicator color="#fff" /> : <Ionicons name="share-outline" size={18} color="#fff" />}
                <Text style={storyStyles.exportText}>{sharingStory ? 'Exportando...' : 'Exportar y compartir imagen'}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// ─── Weekly Review Modal ──────────────────────────────────────────────────────

function WeeklyReviewModal({ visible, onClose, stageTheme, weekNumber, weekDays, weekCompleted, weekMissed, user }: {
  visible: boolean; onClose: () => void; weekNumber: number;
  stageTheme: StageTheme;
  weekDays: any[]; weekCompleted: number; weekMissed: number; user: any;
}) {
  const rate = weekDays.length > 0 ? Math.round((weekCompleted / weekDays.length) * 100) : 0;
  const avgEnergy = weekDays.filter(d => d.metrics?.energyLevel).length > 0
    ? (weekDays.reduce((s, d) => s + (d.metrics?.energyLevel ?? 0), 0) / weekDays.filter(d => d.metrics?.energyLevel).length).toFixed(1)
    : null;
  const avgMood = weekDays.filter(d => d.metrics?.mood).length > 0
    ? (weekDays.reduce((s, d) => s + (d.metrics?.mood ?? 0), 0) / weekDays.filter(d => d.metrics?.mood).length).toFixed(1)
    : null;
  const avgSleep = weekDays.filter(d => d.metrics?.sleepHours).length > 0
    ? (weekDays.reduce((s, d) => s + (d.metrics?.sleepHours ?? 0), 0) / weekDays.filter(d => d.metrics?.sleepHours).length).toFixed(1)
    : null;
  const totalTrain = weekDays.reduce((s, d) => s + (d.metrics?.trainingMinutes ?? 0), 0);
  const totalRead = weekDays.reduce((s, d) => s + (d.metrics?.readingPages ?? 0), 0);

  const message = rate === 100
    ? 'Semana perfecta. Estándar de élite.'
    : rate >= 71
    ? 'Semana sólida. Seguí construyendo momentum.'
    : rate >= 43
    ? 'Semana regular. La siguiente la terminás al 100%.'
    : 'Semana difícil. Aprendé de ella y volvé más fuerte.';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <LinearGradient colors={[stageTheme.background[1], stageTheme.background[2]]} style={weekStyles.sheet}>
          <ScrollView contentContainerStyle={weekStyles.content} showsVerticalScrollIndicator={false}>
            <View style={weekStyles.handle} />

            <Text style={weekStyles.modalTitle}>SEMANA {weekNumber}</Text>
            <Text style={weekStyles.modalSub}>Días {(weekNumber-1)*7+1} – {Math.min(weekNumber*7, 90)}</Text>

            {/* Rate */}
            <View style={weekStyles.rateBox}>
              <Text style={[weekStyles.rateNum, { color: rate === 100 ? COLORS.success : rate >= 71 ? COLORS.accent : rate >= 43 ? COLORS.warning : COLORS.danger }]}>
                {rate}%
              </Text>
              <Text style={weekStyles.rateLabel}>completado</Text>
            </View>

            <Text style={weekStyles.messageText}>{message}</Text>

            {/* Stats grid */}
            <View style={weekStyles.statsGrid}>
              <View style={weekStyles.statBox}>
                <Text style={[weekStyles.statNum, { color: COLORS.success }]}>{weekCompleted}</Text>
                <Text style={weekStyles.statLabel}>Días OK</Text>
              </View>
              <View style={weekStyles.statBox}>
                <Text style={[weekStyles.statNum, { color: COLORS.danger }]}>{weekMissed}</Text>
                <Text style={weekStyles.statLabel}>Fallados</Text>
              </View>
              <View style={weekStyles.statBox}>
                <Text style={[weekStyles.statNum, { color: COLORS.cuerpo }]}>
                  {totalTrain > 0 ? `${Math.floor(totalTrain/60)}h${totalTrain%60}m` : '—'}
                </Text>
                <Text style={weekStyles.statLabel}>Entrenado</Text>
              </View>
              <View style={weekStyles.statBox}>
                <Text style={[weekStyles.statNum, { color: COLORS.mente }]}>
                  {totalRead > 0 ? `${totalRead}p` : '—'}
                </Text>
                <Text style={weekStyles.statLabel}>Leído</Text>
              </View>
            </View>

            {/* Wellness stats */}
            {(avgEnergy || avgMood || avgSleep) && (
              <>
                <Text style={weekStyles.subSection}>BIENESTAR DE LA SEMANA</Text>
                <View style={weekStyles.wellnessRow}>
                  {avgSleep && (
                    <View style={weekStyles.wellnessBox}>
                      <Text style={weekStyles.wellnessEmoji}>😴</Text>
                      <Text style={weekStyles.wellnessNum}>{avgSleep}h</Text>
                      <Text style={weekStyles.wellnessLabel}>Sueño prom.</Text>
                    </View>
                  )}
                  {avgEnergy && (
                    <View style={weekStyles.wellnessBox}>
                      <Text style={weekStyles.wellnessEmoji}>⚡</Text>
                      <Text style={weekStyles.wellnessNum}>{avgEnergy}/10</Text>
                      <Text style={weekStyles.wellnessLabel}>Energía prom.</Text>
                    </View>
                  )}
                  {avgMood && (
                    <View style={weekStyles.wellnessBox}>
                      <Text style={weekStyles.wellnessEmoji}>
                        {['😞','😕','😐','🙂','😄'][Math.round(parseFloat(avgMood)) - 1]}
                      </Text>
                      <Text style={weekStyles.wellnessNum}>{avgMood}/5</Text>
                      <Text style={weekStyles.wellnessLabel}>Ánimo prom.</Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Day by day */}
            <Text style={weekStyles.subSection}>DÍA A DÍA</Text>
            <View style={weekStyles.daysRow}>
              {weekDays.map(d => (
                <View key={d.dayNumber} style={[
                  weekStyles.dayDot,
                  { backgroundColor: d.completed ? COLORS.success : d.missed ? COLORS.danger : COLORS.textMuted + '30' }
                ]}>
                  <Text style={weekStyles.dayDotText}>{d.dayNumber}</Text>
                </View>
              ))}
            </View>

            <Pressable style={weekStyles.closeBtn} onPress={onClose}>
              <LinearGradient colors={stageTheme.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={weekStyles.closeBtnInner}>
                <Text style={weekStyles.closeBtnText}>Cerrar</Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

function buildShareText(params: {
  currentWeek: number;
  weeklySummary: string;
  streak: number;
  coachName: string;
}): string {
  return [
    `ARISE · Semana ${params.currentWeek}`,
    params.weeklySummary,
    `Racha actual: ${params.streak} dias`,
    `Coach: ${params.coachName}`,
    '#Arise #90Dias',
  ].join('\n');
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatChip({ icon, value, label, color }: { icon: string; value: string; label: string; color: string }) {
  return (
    <View style={[chipStyles.box, { borderColor: color + '30' }]}>
      <Ionicons name={icon as any} size={16} color={color} />
      <Text style={[chipStyles.value, { color }]}>{value}</Text>
      <Text style={chipStyles.label}>{label}</Text>
    </View>
  );
}

function GoalBar({ label, current, target, unit, color, forcePct }: {
  label: string; current: number; target: number; unit: string; color: string; forcePct?: number;
}) {
  const pct = forcePct !== undefined ? forcePct : Math.max(0, Math.min(1, current / Math.max(target, 1)));
  const pctDisplay = Math.round(pct * 100);
  return (
    <View style={{ marginBottom: SPACING.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: COLORS.textSecondary, fontSize: FONT.sm, fontWeight: '700' }}>{label}</Text>
        <Text style={{ color, fontSize: FONT.sm, fontWeight: '800' }}>
          {current} / {target} {unit} · {pctDisplay}%
        </Text>
      </View>
      <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${pctDisplay}%` as any, backgroundColor: color, borderRadius: 4 }} />
      </View>
    </View>
  );
}

function TotalBox({ icon, color, label, value }: { icon: string; color: string; label: string; value: string }) {
  return (
    <View style={[totalStyles.box, { borderColor: color + '20' }]}>
      <Ionicons name={icon as any} size={18} color={color} style={{ marginBottom: 4 }} />
      <Text style={[totalStyles.value, { color }]}>{value}</Text>
      <Text style={totalStyles.label}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  motionLayer: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: SPACING.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md, marginTop: SPACING.sm },
  title: { fontSize: FONT.xxl, fontWeight: '800', color: SEMANTIC.onSurface },
  subtitle: { fontSize: FONT.base, color: SEMANTIC.onSurfaceVariant, marginTop: 2 },
  sectionTitle: { fontSize: FONT.xs, color: SEMANTIC.onSurfaceMuted, fontWeight: '700', letterSpacing: 2, marginBottom: SPACING.sm, marginTop: SPACING.lg },
  moreDetailsBtn: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: METAL.gold,
    backgroundColor: SURFACES.glass,
  },
  moreDetailsLabel: {
    fontSize: FONT.sm,
    fontWeight: '700',
    color: METAL.gold,
  },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  newBadgeBanner: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  newBadgeTitle: { fontSize: FONT.sm, color: COLORS.gold, fontWeight: '800' },
  newBadgeText: { fontSize: FONT.sm, color: COLORS.textPrimary, marginTop: 4, lineHeight: 18 },
  newBadgeAction: { fontSize: FONT.xs, color: COLORS.accent, fontWeight: '700', marginTop: 6 },

  card: { backgroundColor: SURFACES.glass, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: StyleSheet.hairlineWidth, borderColor: SURFACES.glassBorder, marginBottom: SPACING.sm },
  powerPill: {
    alignSelf: 'flex-start',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    marginBottom: 6,
  },
  powerPillText: { color: '#fff', fontSize: FONT.xs, fontWeight: '800', letterSpacing: 1 },
  powerTitle: { fontSize: FONT.lg, color: COLORS.textPrimary, fontWeight: '800' },
  powerSubtitle: { fontSize: FONT.sm, color: COLORS.textSecondary, marginTop: 2 },

  badgeSummary: { fontSize: FONT.sm, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  badgeCard: {
    width: '31%',
    minHeight: 84,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  badgeEmoji: { fontSize: 22, marginBottom: 4 },
  badgeName: { fontSize: 10, color: COLORS.textPrimary, fontWeight: '700', textAlign: 'center' },
  badgeRank: { fontSize: 9, marginTop: 2, fontWeight: '800' },
  lockedRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start', marginBottom: SPACING.sm },
  lockedEmoji: { fontSize: 18, marginTop: 1 },
  lockedName: { fontSize: FONT.sm, color: COLORS.textPrimary, fontWeight: '700' },
  lockedDesc: { fontSize: FONT.xs, color: COLORS.textSecondary, marginTop: 2, lineHeight: 17 },

  challengeRow: { marginBottom: SPACING.sm },
  challengeTitle: { fontSize: FONT.sm, color: COLORS.textPrimary, fontWeight: '700' },
  challengeMeta: { fontSize: FONT.xs, color: COLORS.textMuted, marginTop: 2, marginBottom: 4 },
  challengeBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: RADIUS.full, overflow: 'hidden' },
  challengeBarFill: { height: '100%', backgroundColor: COLORS.gold, borderRadius: RADIUS.full },

  coachSelectorRow: { gap: SPACING.sm, marginBottom: SPACING.sm },
  coachChip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  coachChipActive: {
    backgroundColor: 'rgba(232,70,10,0.18)',
    borderColor: 'rgba(232,70,10,0.45)',
  },
  coachChipText: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '700' },
  coachChipTextActive: { color: COLORS.textPrimary },
  coachTitle: { fontSize: FONT.base, color: COLORS.textPrimary, fontWeight: '800', marginBottom: 4 },
  coachSummary: { fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 20, marginBottom: SPACING.sm },
  coachLabel: { fontSize: FONT.xs, color: COLORS.gold, fontWeight: '800', letterSpacing: 1, marginBottom: 4, marginTop: 2 },
  coachRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 4 },
  coachBullet: { color: COLORS.gold, fontWeight: '900', marginTop: -1 },
  coachRowText: { flex: 1, fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 18 },
  coachMessage: { fontSize: FONT.sm, color: COLORS.textPrimary, fontWeight: '700', marginTop: SPACING.sm },

  shareRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  shareButton: { borderRadius: RADIUS.md, overflow: 'hidden', flex: 1 },
  shareGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: SPACING.md },
  shareText: { color: '#fff', fontSize: FONT.base, fontWeight: '800' },

  chartFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm },
  chartFooterCenter: { textAlign: 'center', color: COLORS.textMuted, fontSize: FONT.xs, marginTop: SPACING.sm },
  chartStat: { fontSize: FONT.xs, color: COLORS.textSecondary },
  totalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
});

const chipStyles = StyleSheet.create({
  box: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', borderWidth: 1, gap: 2 },
  value: { fontSize: FONT.md, fontWeight: '900' },
  label: { fontSize: 8, color: COLORS.textMuted, fontWeight: '600' },
});

const totalStyles = StyleSheet.create({
  box: { width: '48%', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.md, alignItems: 'center', borderWidth: 1 },
  value: { fontSize: FONT.lg, fontWeight: '900' },
  label: { fontSize: FONT.xs, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },
});

const chartStyles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.lg, gap: 8 },
  emptyText: { color: COLORS.textMuted, fontSize: FONT.sm, textAlign: 'center' },
});

const weekStyles = StyleSheet.create({
  reviewBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.lg, borderWidth: 1, borderColor: 'rgba(232,70,10,0.25)' },
  reviewBtnInner: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
  reviewTitle: { fontSize: FONT.base, fontWeight: '800', color: COLORS.textPrimary },
  reviewSub: { fontSize: FONT.xs, color: COLORS.textSecondary, marginTop: 2 },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { maxHeight: '88%', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  content: { padding: SPACING.lg },
  handle: { width: 36, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONT.xl, fontWeight: '900', color: COLORS.textPrimary, textAlign: 'center' },
  modalSub: { fontSize: FONT.sm, color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.lg },
  rateBox: { alignItems: 'center', marginBottom: SPACING.sm },
  rateNum: { fontSize: 64, fontWeight: '900' },
  rateLabel: { fontSize: FONT.sm, color: COLORS.textMuted },
  messageText: { fontSize: FONT.base, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: SPACING.lg },
  statsGrid: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statBox: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statNum: { fontSize: FONT.lg, fontWeight: '900' },
  statLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '600', marginTop: 2 },
  subSection: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 2, marginBottom: SPACING.sm, marginTop: SPACING.sm },
  wellnessRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  wellnessBox: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, gap: 2 },
  wellnessEmoji: { fontSize: 22 },
  wellnessNum: { fontSize: FONT.base, fontWeight: '800', color: COLORS.textPrimary },
  wellnessLabel: { fontSize: 9, color: COLORS.textMuted },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.lg },
  dayDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayDotText: { fontSize: FONT.xs, color: '#fff', fontWeight: '700' },
  closeBtn: { borderRadius: RADIUS.xl, overflow: 'hidden' },
  closeBtnInner: { paddingVertical: 14, alignItems: 'center' },
  closeBtnText: { color: '#fff', fontWeight: '800', fontSize: FONT.base, letterSpacing: 1 },
});

const storyStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: {
    backgroundColor: '#0A0A14',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.md,
  },
  captureWrap: { borderRadius: RADIUS.lg, overflow: 'hidden' },
  card: {
    minHeight: 360,
    padding: SPACING.lg,
    justifyContent: 'space-between',
  },
  brand: { color: '#fff', fontSize: FONT.sm, fontWeight: '900', letterSpacing: 3 },
  title: { color: '#fff', fontSize: FONT.xxl, fontWeight: '900' },
  subtitle: { color: COLORS.textSecondary, fontSize: FONT.base, fontWeight: '700', marginTop: 2 },
  stats: { gap: 6, marginTop: SPACING.md },
  stat: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '700' },
  message: { color: '#fff', fontSize: FONT.lg, fontWeight: '800', lineHeight: 28, marginTop: SPACING.lg },
  hash: { color: COLORS.textSecondary, fontSize: FONT.sm, marginTop: SPACING.md, fontWeight: '700' },
  exportBtn: { marginTop: SPACING.md, borderRadius: RADIUS.md, overflow: 'hidden' },
  exportBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: SPACING.md,
  },
  exportText: { color: '#fff', fontSize: FONT.base, fontWeight: '800' },
});
