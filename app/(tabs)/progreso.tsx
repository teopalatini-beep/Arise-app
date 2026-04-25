import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop, Rect, G, Text as SvgText } from 'react-native-svg';
import { useApp } from '../../src/context/AppContext';
import { COLORS, GRADIENTS, FONT, RADIUS, SPACING } from '../../src/theme';
import { DayMetrics } from '../../src/types';

const SCREEN_W = Dimensions.get('window').width - SPACING.md * 2;

// ─── Heatmap de 90 días ───────────────────────────────────────────────────────
function Heatmap({ days, currentDay }: { days: any[]; currentDay: number }) {
  const cols = 10;
  const rows = 9;
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

          return (
            <View
              key={dayNum}
              style={[
                heatStyles.cell,
                { width: cellSize - gap, height: cellSize - gap, backgroundColor: bg },
                isToday && heatStyles.cellToday,
              ]}
            >
              {isToday && (
                <Text style={heatStyles.cellText}>{dayNum}</Text>
              )}
            </View>
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
  const { data, todayRecord, saveMetrics } = useApp();
  const [weight, setWeight] = useState(todayRecord?.metrics?.weight?.toString() ?? '');
  const [trainMin, setTrainMin] = useState(todayRecord?.metrics?.trainingMinutes?.toString() ?? '');
  const [readPages, setReadPages] = useState(todayRecord?.metrics?.readingPages?.toString() ?? '');
  const [breathMin, setBreathMin] = useState(todayRecord?.metrics?.breathingMinutes?.toString() ?? '');
  const [metricNotes, setMetricNotes] = useState(todayRecord?.metrics?.notes ?? '');
  const [saved, setSaved] = useState(false);

  if (!data) return null;
  const { user, days } = data;

  function xpForLevel(level: number) { return level * level * 100; }

  function handleSave() {
    const metrics: DayMetrics = {
      weight: weight ? parseFloat(weight) : undefined,
      trainingMinutes: trainMin ? parseInt(trainMin) : undefined,
      readingPages: readPages ? parseInt(readPages) : undefined,
      breathingMinutes: breathMin ? parseInt(breathMin) : undefined,
      notes: metricNotes || undefined,
    };
    saveMetrics(metrics);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

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

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
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

            {/* Heatmap */}
            <Text style={styles.sectionTitle}>MAPA DE 90 DÍAS</Text>
            <View style={styles.card}>
              <Heatmap days={days} currentDay={user.currentDay} />
            </View>

            {/* Weight chart */}
            <Text style={styles.sectionTitle}>EVOLUCIÓN DE PESO</Text>
            <View style={styles.card}>
              {weightData.length >= 2
                ? <LineChart data={weightData} color={COLORS.accent} label="kg" />
                : <View style={chartStyles.empty}>
                    <Ionicons name="scale-outline" size={28} color={COLORS.textMuted} />
                    <Text style={chartStyles.emptyText}>Cargá tu peso diariamente para ver la evolución</Text>
                  </View>
              }
              {weightData.length > 0 && (
                <View style={styles.chartFooter}>
                  <Text style={styles.chartStat}>Inicio: {weightData[0].y.toFixed(1)} kg</Text>
                  {weightData.length > 1 && (
                    <Text style={[styles.chartStat, {
                      color: weightData[weightData.length - 1].y < weightData[0].y ? COLORS.success : COLORS.danger
                    }]}>
                      Actual: {weightData[weightData.length - 1].y.toFixed(1)} kg
                      {' '}({(weightData[weightData.length - 1].y - weightData[0].y > 0 ? '+' : '')}
                      {(weightData[weightData.length - 1].y - weightData[0].y).toFixed(1)} kg)
                    </Text>
                  )}
                </View>
              )}
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

            {/* Metrics input */}
            <Text style={styles.sectionTitle}>MÉTRICAS DE HOY — DÍA {user.currentDay}</Text>
            <View style={styles.metricsCard}>
              <MetricInput icon="scale" label="Peso corporal" value={weight} onChangeText={setWeight} suffix="kg" placeholder="ej: 75.5" keyboardType="decimal-pad" />
              <MetricInput icon="barbell" label="Entrenamiento" value={trainMin} onChangeText={setTrainMin} suffix="min" placeholder="ej: 65" keyboardType="numeric" />
              <MetricInput icon="book" label="Páginas leídas" value={readPages} onChangeText={setReadPages} suffix="págs" placeholder="ej: 25" keyboardType="numeric" />
              <MetricInput icon="leaf" label="Respiración" value={breathMin} onChangeText={setBreathMin} suffix="min" placeholder="ej: 10" keyboardType="numeric" />

              <View style={styles.notesSection}>
                <Text style={styles.metricLabel}>Notas del día</Text>
                <TextInput
                  style={styles.notesInput}
                  value={metricNotes}
                  onChangeText={setMetricNotes}
                  multiline
                  placeholder="Cómo te sentiste, PR, observaciones..."
                  placeholderTextColor={COLORS.textMuted}
                  textAlignVertical="top"
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <LinearGradient
                  colors={saved ? [COLORS.success, '#059669'] : GRADIENTS.accent}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.saveGradient}
                >
                  <Ionicons name={saved ? 'checkmark' : 'save'} size={16} color="#fff" />
                  <Text style={styles.saveText}>{saved ? '¡Guardado!' : 'Guardar métricas'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
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
  card: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  chartFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.sm },
  chartFooterCenter: { textAlign: 'center', color: COLORS.textMuted, fontSize: FONT.xs, marginTop: SPACING.sm },
  chartStat: { fontSize: FONT.xs, color: COLORS.textSecondary },
  totalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  metricsCard: { backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  notesSection: { marginTop: SPACING.sm },
  metricLabel: { fontSize: FONT.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs, fontWeight: '600' },
  notesInput: { backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: RADIUS.md, padding: SPACING.sm, color: COLORS.textPrimary, fontSize: FONT.base, minHeight: 80, borderWidth: 1, borderColor: COLORS.border },
  saveButton: { marginTop: SPACING.md, borderRadius: RADIUS.md, overflow: 'hidden' },
  saveGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, gap: 8 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: FONT.base },
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
