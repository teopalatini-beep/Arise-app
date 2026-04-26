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
  const [sleepHours, setSleepHours] = useState(todayRecord?.metrics?.sleepHours?.toString() ?? '');
  const [energyLevel, setEnergyLevel] = useState(todayRecord?.metrics?.energyLevel ?? 0);
  const [mood, setMood] = useState(todayRecord?.metrics?.mood ?? 0);
  const [metricNotes, setMetricNotes] = useState(todayRecord?.metrics?.notes ?? '');
  const [saved, setSaved] = useState(false);
  const [showWeeklyReview, setShowWeeklyReview] = useState(false);

  if (!data) return null;
  const { user, days } = data;

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

      {/* Weekly Review Modal */}
      <WeeklyReviewModal
        visible={showWeeklyReview}
        onClose={() => setShowWeeklyReview(false)}
        weekNumber={currentWeek}
        weekDays={weekDays}
        weekCompleted={weekCompleted}
        weekMissed={weekMissed}
        user={user}
      />
    </LinearGradient>
  );
}

// ─── Weekly Review Modal ──────────────────────────────────────────────────────
import { Modal, Pressable } from 'react-native';

function WeeklyReviewModal({ visible, onClose, weekNumber, weekDays, weekCompleted, weekMissed, user }: {
  visible: boolean; onClose: () => void; weekNumber: number;
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
      <Pressable style={weekStyles.backdrop} onPress={onClose}>
        <View style={{ flex: 1 }} />
        <LinearGradient colors={['#0A0A14', '#0F0F1E']} style={weekStyles.sheet}>
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
              <LinearGradient colors={['#E8460A', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={weekStyles.closeBtnInner}>
                <Text style={weekStyles.closeBtnText}>Cerrar</Text>
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </LinearGradient>
      </Pressable>
    </Modal>
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
  ratingSection: { marginTop: SPACING.sm, marginBottom: SPACING.sm },
  ratingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  ratingChip: { width: 30, height: 30, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bgCard },
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
