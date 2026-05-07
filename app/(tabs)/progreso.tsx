import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, Dimensions, Share, Modal, Pressable, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop, Rect, G, Text as SvgText, Line } from 'react-native-svg';
import { useApp } from '../../src/context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONT, RADIUS, SPACING } from '../../src/theme';
import { BADGE_DEFINITIONS, DayMetrics, RANK_COLORS, BadgeId, CoachId } from '../../src/types';
import { buildDynamicChallenges, getNextStageHint, getPowerStage, getStageTheme, StageTheme } from '../../src/lib/progression';
import { buildWeeklyCoachReport, COACH_STORAGE_KEY, COACHES } from '../../src/lib/coach';
import CoachParticles from '../../src/components/CoachParticles';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const SCREEN_W = Dimensions.get('window').width - SPACING.md * 2;

// ─── Heatmap de 90 días ───────────────────────────────────────────────────────
function Heatmap({ days, currentDay, onDayPress }: {
  days: any[];
  currentDay: number;
  onDayPress: (dayNum: number) => void;
}) {
  const cols = 10;
  const cellSize = Math.floor((SCREEN_W - 16) / cols);
  const gap = 3;

  return (
    <View style={heatStyles.container}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
        {Array.from({ length: 90 }, (_, i) => {
          const dayNum = i + 1;
          const record = days.find(d => d.dayNumber === dayNum);
          const isPast = dayNum < currentDay;
          const isToday = dayNum === currentDay;
          const isFuture = dayNum > currentDay;

          let bg = 'rgba(255,255,255,0.05)';
          if (isToday) bg = COLORS.accent;
          else if (record?.completed) bg = COLORS.success;
          else if (record?.missed) bg = COLORS.danger;
          else if (isPast) bg = 'rgba(255,255,255,0.12)';

          const tappable = !isFuture;

          return (
            <TouchableOpacity
              key={dayNum}
              onPress={() => tappable && onDayPress(dayNum)}
              activeOpacity={tappable ? 0.7 : 1}
              style={[
                heatStyles.cell,
                { width: cellSize - gap, height: cellSize - gap, backgroundColor: bg },
                isToday && heatStyles.cellToday,
              ]}
            >
              {isToday && (
                <Text style={heatStyles.cellText}>{dayNum}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Legend */}
      <View style={heatStyles.legend}>
        <LegendDot color={COLORS.success} label="Completado" />
        <LegendDot color={COLORS.accent} label="Hoy" />
        <LegendDot color={COLORS.danger} label="Fallado" />
        <LegendDot color="rgba(255,255,255,0.12)" label="Pendiente" />
      </View>
    </View>
  );
}

// ─── Day Detail Sheet ─────────────────────────────────────────────────────────
const MOOD_EMOJIS = ['', '😞', '😕', '😐', '🙂', '😄'];

function DayDetailSheet({ dayNum, record, stageTheme, onClose }: {
  dayNum: number | null;
  record: any | null;
  stageTheme: ReturnType<typeof getStageTheme>;
  onClose: () => void;
}) {
  if (!dayNum) return null;

  const statusColor = record?.completed ? COLORS.success : record?.missed ? COLORS.danger : COLORS.textMuted;
  const statusLabel = record?.completed ? '✅ Completado' : record?.missed ? '❌ Fallado' : '⏳ Pendiente / sin datos';
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
              <Text style={[dayDetailStyles.status, { color: statusColor }]}>{statusLabel}</Text>
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

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: color }} />
      <Text style={{ fontSize: 9, color: COLORS.textMuted }}>{label}</Text>
    </View>
  );
}

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

  return (
    <Svg width={W} height={H + pad.top + pad.bottom}>
      <Defs>
        <SvgGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.3" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </SvgGradient>
      </Defs>
      {/* Area */}
      <Path d={areaPath} fill="url(#lineGrad)" />
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

// ─── Weight Chart ─────────────────────────────────────────────────────────────
function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0 };
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function WeightChart({
  data,
  initialWeight,
  targetWeight,
  currentDay,
  track,
}: {
  data: { x: number; y: number }[];
  initialWeight?: number;
  targetWeight?: number;
  currentDay: number;
  track?: string;
}) {
  const W = SCREEN_W - 16;
  const H = 140;
  const pad = { top: 16, bottom: 28, left: 38, right: 16 };
  const plotW = W - pad.left - pad.right;
  const plotH = H;

  const losing = track === 'fat_loss' || track === 'recomposition';

  if (data.length < 2) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: SPACING.xl, gap: 8 }}>
        <Ionicons name="scale-outline" size={32} color={COLORS.textMuted} />
        <Text style={[chartStyles.emptyText, { textAlign: 'center' }]}>
          Registrá tu peso diariamente{'\n'}para ver la evolución y proyección
        </Text>
      </View>
    );
  }

  const { slope, intercept } = linearRegression(data);
  const proj90 = slope * 90 + intercept;
  const latestWeight = data[data.length - 1].y;
  const firstWeight = data[0].y;
  const delta = latestWeight - firstWeight;
  const weeklyRate = data.length > 1 ? (delta / ((data[data.length - 1].x - data[0].x) / 7)) : 0;

  // Y-axis range: include initial, latest, target, and projected
  const allY = [firstWeight, latestWeight, proj90, targetWeight ?? latestWeight];
  const minY = Math.min(...allY) - 1.5;
  const maxY = Math.max(...allY) + 1.5;
  const rangeY = maxY - minY || 1;

  const toX = (day: number) => pad.left + ((day - 1) / 89) * plotW;
  const toY = (kg: number) => pad.top + plotH - ((kg - minY) / rangeY) * plotH;

  // Measured path
  const measuredPath = data
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.x).toFixed(1)},${toY(p.y).toFixed(1)}`)
    .join(' ');
  const areaPath = `${measuredPath} L${toX(data[data.length - 1].x).toFixed(1)},${(pad.top + plotH).toFixed(1)} L${toX(data[0].x).toFixed(1)},${(pad.top + plotH).toFixed(1)} Z`;

  // Trend line from first data point to day 90
  const trendX1 = toX(data[0].x);
  const trendY1 = toY(slope * data[0].x + intercept);
  const trendX2 = toX(90);
  const trendY2 = toY(proj90);

  // Y-axis tick values
  const yTicks = [minY + 1, (minY + maxY) / 2, maxY - 1].map(v => Math.round(v * 2) / 2);

  return (
    <View>
      <Svg width={W} height={H + pad.top + pad.bottom}>
        <Defs>
          <SvgGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={COLORS.accent} stopOpacity="0.25" />
            <Stop offset="1" stopColor={COLORS.accent} stopOpacity="0.02" />
          </SvgGradient>
        </Defs>

        {/* Grid lines */}
        {yTicks.map((v, i) => (
          <G key={i}>
            <Line
              x1={pad.left} y1={toY(v)}
              x2={W - pad.right} y2={toY(v)}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1"
            />
            <SvgText x={pad.left - 4} y={toY(v) + 3} textAnchor="end" fontSize="9" fill={COLORS.textMuted}>
              {v.toFixed(1)}
            </SvgText>
          </G>
        ))}

        {/* Target weight line */}
        {targetWeight != null && (
          <G>
            <Line
              x1={pad.left} y1={toY(targetWeight)}
              x2={W - pad.right} y2={toY(targetWeight)}
              stroke={losing ? COLORS.success : COLORS.warning}
              strokeWidth="1.5"
              strokeDasharray="5,4"
            />
            <SvgText x={W - pad.right + 2} y={toY(targetWeight) + 3} fontSize="8" fill={losing ? COLORS.success : COLORS.warning}>
              Meta
            </SvgText>
          </G>
        )}

        {/* Trend line (projection) */}
        <Line
          x1={trendX1} y1={trendY1}
          x2={trendX2} y2={trendY2}
          stroke={COLORS.accent}
          strokeWidth="1.5"
          strokeDasharray="6,4"
          opacity={0.5}
        />

        {/* Area fill */}
        <Path d={areaPath} fill="url(#wGrad)" />

        {/* Measured line */}
        <Path d={measuredPath} stroke={COLORS.accent} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        <Circle cx={toX(data[0].x)} cy={toY(data[0].y)} r={3.5} fill={COLORS.accent} opacity={0.7} />
        <Circle cx={toX(data[data.length - 1].x)} cy={toY(data[data.length - 1].y)} r={5} fill={COLORS.accent} />

        {/* Projection dot at day 90 */}
        <Circle cx={toX(90)} cy={toY(proj90)} r={4} fill={COLORS.accent} opacity={0.4} strokeDasharray="3,2" stroke={COLORS.accent} strokeWidth="1" />

        {/* X-axis labels */}
        <SvgText x={toX(data[0].x)} y={H + pad.top + pad.bottom - 2} textAnchor="middle" fontSize="9" fill={COLORS.textMuted}>D{data[0].x}</SvgText>
        <SvgText x={toX(currentDay)} y={H + pad.top + pad.bottom - 2} textAnchor="middle" fontSize="9" fill={COLORS.accent}>Hoy</SvgText>
        <SvgText x={toX(90)} y={H + pad.top + pad.bottom - 2} textAnchor="middle" fontSize="9" fill={COLORS.textMuted}>D90</SvgText>
      </Svg>

      {/* Stats row */}
      <View style={wchartStyles.statsRow}>
        <View style={wchartStyles.stat}>
          <Text style={wchartStyles.statVal}>{latestWeight.toFixed(1)} kg</Text>
          <Text style={wchartStyles.statLabel}>Actual</Text>
        </View>
        <View style={wchartStyles.divider} />
        <View style={wchartStyles.stat}>
          <Text style={[wchartStyles.statVal, { color: delta === 0 ? COLORS.textMuted : (losing ? (delta < 0 ? COLORS.success : COLORS.danger) : (delta > 0 ? COLORS.success : COLORS.danger)) }]}>
            {delta >= 0 ? '+' : ''}{delta.toFixed(1)} kg
          </Text>
          <Text style={wchartStyles.statLabel}>Vs inicio</Text>
        </View>
        <View style={wchartStyles.divider} />
        <View style={wchartStyles.stat}>
          <Text style={wchartStyles.statVal}>{weeklyRate >= 0 ? '+' : ''}{weeklyRate.toFixed(2)} kg/sem</Text>
          <Text style={wchartStyles.statLabel}>Velocidad</Text>
        </View>
        <View style={wchartStyles.divider} />
        <View style={wchartStyles.stat}>
          <Text style={[wchartStyles.statVal, { color: COLORS.accent }]}>{proj90.toFixed(1)} kg</Text>
          <Text style={wchartStyles.statLabel}>Proy. D90</Text>
        </View>
      </View>

      {/* Progress toward target */}
      {targetWeight != null && initialWeight != null && (
        (() => {
          const totalDelta = targetWeight - initialWeight;
          const done = Math.abs(totalDelta) < 0.1 ? 1 : Math.max(0, Math.min(1, (latestWeight - initialWeight) / totalDelta));
          const pct = Math.round(done * 100);
          const color = losing ? COLORS.success : COLORS.warning;
          return (
            <View style={wchartStyles.targetRow}>
              <Text style={wchartStyles.targetLabel}>Meta: {initialWeight.toFixed(1)} → {targetWeight.toFixed(1)} kg</Text>
              <Text style={[wchartStyles.targetPct, { color }]}>{pct}%</Text>
            </View>
          );
        })()
      )}
    </View>
  );
}

const wchartStyles = StyleSheet.create({
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm, paddingHorizontal: 4 },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: FONT.sm, fontWeight: '800', color: COLORS.textPrimary },
  statLabel: { fontSize: 9, color: COLORS.textMuted, marginTop: 2, fontWeight: '600' },
  divider: { width: 1, height: 28, backgroundColor: COLORS.border },
  targetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  targetLabel: { fontSize: FONT.xs, color: COLORS.textMuted },
  targetPct: { fontSize: FONT.sm, fontWeight: '900' },
});

// ─── XP Ring ─────────────────────────────────────────────────────────────────
function XPRing({ xp, level, xpForLevel }: { xp: number; level: number; xpForLevel: (l: number) => number }) {
  const size = 120;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const xpCurrent = xpForLevel(level);
  const xpNext = xpForLevel(level + 1);
  const progress = Math.min((xp - xpCurrent) / (xpNext - xpCurrent), 1);
  const dashOffset = circumference * (1 - progress);

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="xpGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={COLORS.accent} />
            <Stop offset="1" stopColor={COLORS.purple} />
          </SvgGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="url(#xpGrad)" strokeWidth={stroke} fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={ringStyles.center}>
        <Text style={ringStyles.level}>{level}</Text>
        <Text style={ringStyles.levelLabel}>NIV</Text>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ProgresoScreen() {
  const { data, todayRecord, saveMetrics, newBadges, clearNewBadges, setPreferredCoach, loading } = useApp();
  const [weight, setWeight] = useState(todayRecord?.metrics?.weight?.toString() ?? '');
  const [trainMin, setTrainMin] = useState(todayRecord?.metrics?.trainingMinutes?.toString() ?? '');
  const [readPages, setReadPages] = useState(todayRecord?.metrics?.readingPages?.toString() ?? '');
  const [breathMin, setBreathMin] = useState(todayRecord?.metrics?.breathingMinutes?.toString() ?? '');
  const [sleepHours, setSleepHours] = useState(todayRecord?.metrics?.sleepHours?.toString() ?? '');
  const [energyLevel, setEnergyLevel] = useState(todayRecord?.metrics?.energyLevel ?? 0);
  const [mood, setMood] = useState(todayRecord?.metrics?.mood ?? 0);
  const [metricNotes, setMetricNotes] = useState(todayRecord?.metrics?.notes ?? '');
  const [saved, setSaved] = useState(false);
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<CoachId>('goku');
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [sharingStory, setSharingStory] = useState(false);
  const storyRef = useRef<ViewShot | null>(null);

  if (!data) {
    const fallbackTheme = getStageTheme();
    return (
      <LinearGradient colors={fallbackTheme.background} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <View style={chartStyles.empty}>
            <Ionicons name="analytics-outline" size={40} color={COLORS.textMuted} />
            <Text style={chartStyles.emptyText}>
              {loading ? 'Cargando progreso...' : 'No pudimos cargar tu progreso.\nRevisa conexión e inicia sesión nuevamente.'}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }
  const { user, days } = data;
  const powerStage = getPowerStage(user);
  const stageTheme = getStageTheme(user);
  const nextStageHint = getNextStageHint(user);
  const earnedBadges = (user.badges ?? []).map(id => ({ id, ...BADGE_DEFINITIONS[id] }));
  const recentBadges = [...earnedBadges].reverse().slice(0, 6);
  const lockedBadges = (Object.keys(BADGE_DEFINITIONS) as BadgeId[])
    .filter(id => !(user.badges ?? []).includes(id))
    .slice(0, 3)
    .map(id => ({ id, ...BADGE_DEFINITIONS[id] }));
  const dynamicChallenges = buildDynamicChallenges(user, days).slice(0, 3);
  const weeklyReport = useMemo(() => buildWeeklyCoachReport(data, selectedCoach), [data, selectedCoach]);

  useEffect(() => {
    const fromUser = user.preferredCoachId;
    if (fromUser) {
      setSelectedCoach(fromUser);
      return;
    }
    AsyncStorage.getItem(COACH_STORAGE_KEY).then(raw => {
      if (!raw) return;
      const exists = COACHES.some(c => c.id === raw);
      if (exists) setSelectedCoach(raw as CoachId);
    });
  }, [user.preferredCoachId]);

  async function selectCoach(id: CoachId) {
    setSelectedCoach(id);
    setPreferredCoach(id);
    await AsyncStorage.setItem(COACH_STORAGE_KEY, id);
  }

  function xpForLevel(level: number) { return level * level * 100; }

  function handleSave() {
    const metrics: DayMetrics = {
      weight: weight ? parseFloat(weight) : undefined,
      trainingMinutes: trainMin ? parseInt(trainMin) : undefined,
      readingPages: readPages ? parseInt(readPages) : undefined,
      breathingMinutes: breathMin ? parseInt(breathMin) : undefined,
      sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
      energyLevel: energyLevel || undefined,
      mood: mood || undefined,
      notes: metricNotes || undefined,
    };
    saveMetrics(metrics);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleShareProgress() {
    const shareText = buildShareText({
      currentWeek,
      weeklySummary: weeklyReport.summary,
      streak: user.streak,
      coachName: COACHES.find(c => c.id === selectedCoach)?.name ?? 'Coach Humano',
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

  // Calcular semana actual para revisión
  const currentWeek = Math.ceil(user.currentDay / 7);
  const weekStart = (currentWeek - 1) * 7 + 1;
  const weekEnd = Math.min(currentWeek * 7, user.currentDay);
  const weekDays = days.filter(d => d.dayNumber >= weekStart && d.dayNumber <= weekEnd);
  const weekCompleted = weekDays.filter(d => d.completed).length;
  const weekMissed = weekDays.filter(d => d.missed).length;

  const completedDays = days.filter(d => d.completed).length;
  const missedDays = days.filter(d => d.missed).length;
  const completionRate = user.currentDay > 1 ? Math.round((completedDays / (user.currentDay - 1)) * 100) : 0;

  const totalTrainMin = days.reduce((sum, d) => sum + (d.metrics?.trainingMinutes ?? 0), 0);
  const totalReadPages = days.reduce((sum, d) => sum + (d.metrics?.readingPages ?? 0), 0);
  const totalBreathMin = days.reduce((sum, d) => sum + (d.metrics?.breathingMinutes ?? 0), 0);

  const weightData = days
    .filter(d => d.metrics?.weight)
    .sort((a, b) => a.dayNumber - b.dayNumber)
    .map(d => ({ x: d.dayNumber, y: d.metrics!.weight! }));

  const coachId = user.preferredCoachId ?? 'goku';

  return (
    <LinearGradient colors={stageTheme.background} style={styles.container}>
      <CoachParticles coachId={coachId} screen="progreso" />
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
            <View style={styles.statsRow}>
              <StatChip icon="flame" value={`${user.streak}`} label="Racha" color={COLORS.streak} />
              <StatChip icon="checkmark-circle" value={`${completedDays}`} label="Días OK" color={COLORS.success} />
              <StatChip icon="trending-up" value={`${completionRate}%`} label="Efectividad" color={COLORS.accent} />
              <StatChip icon="close-circle" value={`${missedDays}`} label="Fallados" color={COLORS.danger} />
            </View>

            {newBadges.length > 0 && (
              <View style={styles.newBadgeBanner}>
                <Text style={styles.newBadgeTitle}>✨ Nuevos logros desbloqueados</Text>
                <Text style={styles.newBadgeText}>
                  {newBadges.map(id => BADGE_DEFINITIONS[id]?.name ?? id).join(' · ')}
                </Text>
                <TouchableOpacity onPress={clearNewBadges}>
                  <Text style={styles.newBadgeAction}>Ocultar</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.sectionTitle}>MODO ANIME ACTUAL</Text>
            <View style={styles.card}>
              <LinearGradient colors={powerStage.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.powerPill}>
                <Text style={styles.powerPillText}>{powerStage.auraLabel}</Text>
              </LinearGradient>
              <Text style={styles.powerTitle}>{powerStage.title}</Text>
              <Text style={styles.powerSubtitle}>{nextStageHint}</Text>
            </View>

            <Text style={styles.sectionTitle}>LOGROS Y BADGES</Text>
            <View style={styles.card}>
              <Text style={styles.badgeSummary}>{earnedBadges.length} desbloqueados · {Object.keys(BADGE_DEFINITIONS).length - earnedBadges.length} pendientes</Text>
              <View style={styles.badgesGrid}>
                {recentBadges.map(b => (
                  <View key={b.id} style={[styles.badgeCard, { borderColor: `${RANK_COLORS[b.rank]}50` }]}>
                    <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                    <Text style={styles.badgeName} numberOfLines={1}>{b.name}</Text>
                    <Text style={[styles.badgeRank, { color: RANK_COLORS[b.rank] }]}>{b.rank.toUpperCase()}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.sectionTitle}>PRÓXIMOS DESBLOQUEOS</Text>
            <View style={styles.card}>
              {lockedBadges.map(b => (
                <View key={b.id} style={styles.lockedRow}>
                  <Text style={styles.lockedEmoji}>🔒</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lockedName}>{b.name}</Text>
                    <Text style={styles.lockedDesc}>{b.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>DESAFÍOS QUE SUBEN LA DIFICULTAD</Text>
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

            <Text style={styles.sectionTitle}>COACH IA SEMANAL</Text>
            <View style={styles.card}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.coachSelectorRow}>
                {COACHES.map(c => {
                  const active = selectedCoach === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.coachChip, active && styles.coachChipActive]}
                      onPress={() => selectCoach(c.id)}
                    >
                      <Text style={[styles.coachChipText, active && styles.coachChipTextActive]}>{c.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

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

            <Text style={styles.sectionTitle}>COMPARTIR PROGRESO</Text>
            <View style={styles.shareRow}>
              <TouchableOpacity style={styles.shareButton} onPress={() => setShowStoryModal(true)} activeOpacity={0.85}>
                <LinearGradient colors={stageTheme.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.shareGradient}>
                  <Ionicons name="image-outline" size={18} color="#fff" />
                  <Text style={styles.shareText}>Story Card</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.shareButton} onPress={handleShareProgress} activeOpacity={0.85}>
                <LinearGradient colors={['#3B82F6', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.shareGradient}>
                  <Ionicons name="share-social-outline" size={18} color="#fff" />
                  <Text style={styles.shareText}>Texto</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Heatmap */}
            <Text style={styles.sectionTitle}>MAPA DE 90 DÍAS</Text>
            <Text style={{ fontSize: FONT.xs, color: COLORS.textMuted, marginBottom: SPACING.sm, marginTop: -SPACING.sm }}>
              Tocá cualquier día para ver el resumen.
            </Text>
            <View style={styles.card}>
              <Heatmap days={days} currentDay={user.currentDay} onDayPress={setSelectedDay} />
            </View>

            {/* Goals progress bars */}
            {user.goals && (
              Object.keys(user.goals).some(k => (user.goals as any)[k] != null) && (
                <>
                  <Text style={styles.sectionTitle}>🎯 OBJETIVOS PERSONALES</Text>
                  <View style={styles.card}>
                    {typeof user.goals.targetStreak === 'number' && user.goals.targetStreak > 0 && (
                      <GoalBar
                        label="🔥 Racha objetivo"
                        current={user.streak}
                        target={user.goals.targetStreak}
                        unit="días"
                        color={COLORS.streak}
                      />
                    )}
                    {typeof user.goals.targetReadingPages === 'number' && user.goals.targetReadingPages > 0 && (
                      <GoalBar
                        label="📚 Páginas leídas"
                        current={totalReadPages}
                        target={user.goals.targetReadingPages}
                        unit="págs"
                        color={COLORS.mente}
                      />
                    )}
                    {typeof user.goals.targetWeight === 'number' && typeof user.initialWeight === 'number' && (
                      (() => {
                        const latestW = [...days].reverse().map(d => d.metrics?.weight).find((w): w is number => typeof w === 'number') ?? user.initialWeight;
                        const totalDelta = user.goals.targetWeight! - user.initialWeight!;
                        const doneDelta = latestW - user.initialWeight!;
                        const pct = Math.abs(totalDelta) < 0.1 ? 1 : Math.max(0, Math.min(1, doneDelta / totalDelta));
                        return (
                          <GoalBar
                            label="⚖️ Peso objetivo"
                            current={parseFloat(latestW.toFixed(1))}
                            target={user.goals.targetWeight!}
                            unit="kg"
                            color={COLORS.accent}
                            forcePct={pct}
                          />
                        );
                      })()
                    )}
                    {typeof user.goals.targetTrainingDays === 'number' && user.goals.targetTrainingDays > 0 && (
                      <GoalBar
                        label="🏋️ Días entrenados"
                        current={days.filter(d => (d.metrics?.trainingMinutes ?? 0) > 0).length}
                        target={user.goals.targetTrainingDays}
                        unit="días"
                        color={COLORS.cuerpo}
                      />
                    )}
                  </View>
                </>
              )
            )}

            {/* Weight chart */}
            <Text style={styles.sectionTitle}>EVOLUCIÓN DE PESO</Text>
            <View style={styles.card}>
              <WeightChart
                data={weightData}
                initialWeight={user.initialWeight}
                targetWeight={user.goals?.targetWeight}
                currentDay={user.currentDay}
                track={user.adaptiveProfile?.track}
              />
            </View>

            {/* Weekly training bars */}
            <Text style={styles.sectionTitle}>ENTRENAMIENTO SEMANAL</Text>
            <View style={styles.card}>
              <WeeklyBars days={days} field="trainingMinutes" color={COLORS.cuerpo} unit="min" />
              <Text style={styles.chartFooterCenter}>
                Total: {Math.floor(totalTrainMin / 60)}h {totalTrainMin % 60}m entrenados
              </Text>
            </View>

            {/* Weekly reading bars */}
            <Text style={styles.sectionTitle}>LECTURA SEMANAL</Text>
            <View style={styles.card}>
              <WeeklyBars days={days} field="readingPages" color={COLORS.mente} unit="págs" />
              <Text style={styles.chartFooterCenter}>
                Total: {totalReadPages} páginas leídas
              </Text>
            </View>

            {/* Weekly breathing bars */}
            <Text style={styles.sectionTitle}>RESPIRACIÓN SEMANAL</Text>
            <View style={styles.card}>
              <WeeklyBars days={days} field="breathingMinutes" color={COLORS.bienestar} unit="min" />
              <Text style={styles.chartFooterCenter}>
                Total: {Math.floor(totalBreathMin / 60)}h {totalBreathMin % 60}m de práctica
              </Text>
            </View>

            {/* Totals */}
            <Text style={styles.sectionTitle}>RESUMEN ACUMULADO</Text>
            <View style={styles.totalsGrid}>
              <TotalBox icon="barbell" color={COLORS.cuerpo} label="Entrenamiento" value={`${Math.floor(totalTrainMin / 60)}h ${totalTrainMin % 60}m`} />
              <TotalBox icon="book" color={COLORS.mente} label="Páginas leídas" value={`${totalReadPages}`} />
              <TotalBox icon="leaf" color={COLORS.bienestar} label="Respiración" value={`${Math.floor(totalBreathMin / 60)}h ${totalBreathMin % 60}m`} />
              <TotalBox icon="flash" color={COLORS.productividad} label="XP ganado" value={`${user.xp}`} />
            </View>

            {/* Weekly Review button */}
            {user.currentDay > 7 && (
              <>
                <Text style={styles.sectionTitle}>SEMANA {currentWeek}</Text>
                <TouchableOpacity
                  style={weekStyles.reviewBtn}
                  onPress={() => setShowWeeklyReview(true)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(232,70,10,0.15)', 'rgba(124,58,237,0.10)']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={weekStyles.reviewBtnInner}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={weekStyles.reviewTitle}>📊 Revisión Semanal</Text>
                      <Text style={weekStyles.reviewSub}>
                        Sem. {currentWeek} · {weekCompleted}/{weekDays.length} días completados
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.accent} />
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* Metrics input */}
            <Text style={styles.sectionTitle}>MÉTRICAS DE HOY — DÍA {user.currentDay}</Text>
            <View style={styles.metricsCard}>
              <MetricInput icon="scale" label="Peso corporal" value={weight} onChangeText={setWeight} suffix="kg" placeholder="ej: 75.5" keyboardType="decimal-pad" />
              <MetricInput icon="barbell" label="Entrenamiento" value={trainMin} onChangeText={setTrainMin} suffix="min" placeholder="ej: 65" keyboardType="numeric" />
              <MetricInput icon="book" label="Páginas leídas" value={readPages} onChangeText={setReadPages} suffix="págs" placeholder="ej: 25" keyboardType="numeric" />
              <MetricInput icon="leaf" label="Respiración" value={breathMin} onChangeText={setBreathMin} suffix="min" placeholder="ej: 10" keyboardType="numeric" />
              <MetricInput icon="moon" label="Horas de sueño" value={sleepHours} onChangeText={setSleepHours} suffix="hs" placeholder="ej: 7.5" keyboardType="decimal-pad" />

              {/* Energy level 1-10 */}
              <View style={styles.ratingSection}>
                <Text style={styles.metricLabel}>⚡ Nivel de energía</Text>
                <View style={styles.ratingRow}>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <TouchableOpacity
                      key={n}
                      style={[styles.ratingChip, energyLevel === n && { backgroundColor: COLORS.accent, borderColor: COLORS.accent }]}
                      onPress={() => setEnergyLevel(n)}
                    >
                      <Text style={[styles.ratingText, energyLevel === n && { color: '#fff' }]}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Mood 1-5 */}
              <View style={styles.ratingSection}>
                <Text style={styles.metricLabel}>😊 Estado de ánimo</Text>
                <View style={styles.ratingRow}>
                  {(['😞','😕','😐','🙂','😄'] as const).map((emoji, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.moodChip, mood === i + 1 && { backgroundColor: 'rgba(232,70,10,0.2)', borderColor: COLORS.accent }]}
                      onPress={() => setMood(i + 1)}
                    >
                      <Text style={{ fontSize: 22 }}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.notesSection}>
                <Text style={styles.metricLabel}>📝 Notas del día</Text>
                <TextInput
                  style={styles.notesInput}
                  value={metricNotes}
                  onChangeText={setMetricNotes}
                  multiline
                  placeholder="Cómo te sentiste, PR, observaciones..."
                  placeholderTextColor={COLORS.textMuted}
                  textAlignVertical="top"
                />
                <TouchableOpacity onPress={() => setMetricNotes('')} style={styles.clearNotesBtn}>
                  <Text style={styles.clearNotesText}>Borrar nota</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <LinearGradient
                  colors={saved ? [COLORS.success, '#059669'] : stageTheme.accent}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.saveGradient}
                >
                  <Ionicons name={saved ? 'checkmark' : 'save'} size={16} color="#fff" />
                  <Text style={styles.saveText}>{saved ? '¡Guardado!' : 'Guardar métricas'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

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
                  <Text style={storyStyles.stat}>Coach: {COACHES.find(c => c.id === selectedCoach)?.name ?? 'Coach Humano'}</Text>
                </View>

                <Text style={storyStyles.message}>{weeklyReport.message}</Text>
                <Text style={storyStyles.hash}>#Arise #90Dias</Text>
              </LinearGradient>
            </ViewShot>

            <TouchableOpacity style={storyStyles.exportBtn} onPress={handleShareStoryImage} activeOpacity={0.85} disabled={sharingStory}>
              <LinearGradient colors={stageTheme.accent} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={storyStyles.exportBtnInner}>
                {sharingStory ? <ActivityIndicator color="#fff" /> : <Ionicons name="share-outline" size={18} color="#fff" />}
                <Text style={storyStyles.exportText}>{sharingStory ? 'Exportando...' : 'Exportar y compartir imagen'}</Text>
              </LinearGradient>
            </TouchableOpacity>
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
    ? '🏆 Semana perfecta. Sos un guerrero de élite.'
    : rate >= 71
    ? '⚡ Semana sólida. Seguí construyendo momentum.'
    : rate >= 43
    ? '🔥 Semana regular. La siguiente la terminás al 100%.'
    : '⚔️ Semana difícil. Aprendé de ella y volvé más fuerte.';

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

function MetricInput({ icon, label, value, onChangeText, suffix, placeholder, keyboardType }: {
  icon: string; label: string; value: string;
  onChangeText: (v: string) => void; suffix: string;
  placeholder: string; keyboardType?: any;
}) {
  return (
    <View style={inputStyles.row}>
      <Ionicons name={icon as any} size={16} color={COLORS.textSecondary} style={inputStyles.icon} />
      <Text style={inputStyles.label}>{label}</Text>
      <TextInput
        style={inputStyles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType ?? 'default'}
        returnKeyType="done"
      />
      <Text style={inputStyles.suffix}>{suffix}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: SPACING.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md, marginTop: SPACING.sm },
  title: { fontSize: FONT.xxl, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: FONT.base, color: COLORS.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 2, marginBottom: SPACING.sm, marginTop: SPACING.lg },
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

  card: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
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
  metricsCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  notesSection: { marginTop: SPACING.sm },
  metricLabel: { fontSize: FONT.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs, fontWeight: '600' },
  notesInput: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: RADIUS.md, padding: SPACING.sm, color: COLORS.textPrimary, fontSize: FONT.base, minHeight: 80, borderWidth: 1, borderColor: COLORS.border },
  clearNotesBtn: { alignSelf: 'flex-end', marginTop: 6 },
  clearNotesText: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '700' },
  saveButton: { marginTop: SPACING.md, borderRadius: RADIUS.md, overflow: 'hidden' },
  saveGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, gap: 8 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: FONT.base },
  ratingSection: { marginTop: SPACING.sm, marginBottom: SPACING.sm },
  ratingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  ratingChip: { minHeight: 44, flex: 1, paddingHorizontal: 4, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCard },
  ratingText: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '700' },
  moodChip: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCard },
});

const heatStyles = StyleSheet.create({
  container: { width: '100%' },
  cell: { borderRadius: 3 },
  cellToday: { borderWidth: 1.5, borderColor: '#fff' },
  cellText: { fontSize: 7, color: '#fff', textAlign: 'center', lineHeight: 14 },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm, flexWrap: 'wrap', gap: 4 },
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

const ringStyles = StyleSheet.create({
  center: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  level: { fontSize: FONT.xxl, fontWeight: '900', color: COLORS.textPrimary },
  levelLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 1 },
});

const chartStyles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.lg, gap: 8 },
  emptyText: { color: COLORS.textMuted, fontSize: FONT.sm, textAlign: 'center' },
});

const inputStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: SPACING.sm, gap: SPACING.xs },
  icon: { marginRight: 4 },
  label: { flex: 1, fontSize: FONT.base, color: COLORS.textSecondary, fontWeight: '500' },
  input: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 6, color: COLORS.textPrimary, fontSize: FONT.base, minWidth: 70, textAlign: 'right', borderWidth: 1, borderColor: COLORS.border },
  suffix: { fontSize: FONT.sm, color: COLORS.textMuted, minWidth: 30 },
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
