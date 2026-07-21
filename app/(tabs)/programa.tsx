import React, { useState, useRef, useEffect, memo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Modal, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { COLORS, FONT, RADIUS, SPACING } from '@/theme';
import { getStageTheme } from '@/lib/progression';
import { getMissionById } from '@/data/missions';
import CoachParticles from '@components/CoachParticles';
import ScreenLoadingState from '@components/ui/ScreenLoadingState';
import StaggerIn from '@components/ui/StaggerIn';
import type { DayRecord } from '@/types';
import { useTabScreenMotion } from '@/hooks/useTabScreenMotion';

const COLS = 7; // celdas más grandes para touch ≈44pt en muchos dispositivos
const SCREEN_W = Dimensions.get('window').width;
const CELL = Math.max(40, Math.floor((SCREEN_W - SPACING.md * 2 - (COLS - 1) * 4) / COLS));

// ─── Day Detail Sheet ─────────────────────────────────────────────────────────
function DayDetailSheet({ dayNumber, record, status, onClose }: {
  dayNumber: number;
  record: DayRecord | undefined;
  status: 'completed' | 'current' | 'missed' | 'future';
  onClose: () => void;
}) {
  const statusColor = status === 'completed' ? COLORS.success : status === 'missed' ? COLORS.danger : status === 'current' ? COLORS.accent : COLORS.textMuted;
  const statusLabel = status === 'completed' ? 'Completado' : status === 'missed' ? 'Fallado' : status === 'current' ? 'Hoy' : 'Pendiente';
  const statusIcon = status === 'completed' ? 'checkmark-circle' : status === 'missed' ? 'close-circle' : status === 'current' ? 'radio-button-on' : 'time-outline';

  const earnedMissions = (record?.missionStates ?? []).filter(s => s.points > 0);
  const metrics = record?.metrics;
  const journal = record?.journal;

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={sheetStyles.backdrop} onPress={onClose} />
      <View style={sheetStyles.sheet}>
        <LinearGradient colors={['#111E35', '#0D1628']} style={sheetStyles.content}>
          <View style={sheetStyles.handle} />

          {/* Header */}
          <View style={sheetStyles.header}>
            <View>
              <Text style={sheetStyles.dayTitle}>Día {dayNumber}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Ionicons name={statusIcon as any} size={14} color={statusColor} />
                <Text style={[sheetStyles.statusLabel, { color: statusColor }]}>{statusLabel}</Text>
                {record && <Text style={sheetStyles.pts}>{record.totalPoints}/{record.pointsTarget} pts</Text>}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={sheetStyles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Future day */}
            {status === 'future' && (
              <View style={sheetStyles.emptyState}>
                <Ionicons name="lock-closed-outline" size={36} color={COLORS.textMuted} />
                <Text style={sheetStyles.emptyTitle}>Día pendiente</Text>
                <Text style={sheetStyles.emptyText}>Todavía no llegaste a este día. Seguí construyendo tu racha.</Text>
              </View>
            )}

            {/* Missions */}
            {(status === 'completed' || status === 'missed' || status === 'current') && (
              <>
                <Text style={sheetStyles.sectionLabel}>MISIONES</Text>
                {earnedMissions.length === 0 ? (
                  <Text style={sheetStyles.emptyText}>Sin misiones registradas.</Text>
                ) : (
                  earnedMissions.map(s => {
                    const def = getMissionById(s.missionId);
                    if (!def) return null;
                    return (
                      <View key={s.missionId} style={sheetStyles.missionRow}>
                        <Text style={sheetStyles.missionEmoji}>{def.emoji}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={sheetStyles.missionName}>{def.name}</Text>
                          <Text style={sheetStyles.missionMeta}>{def.category}</Text>
                        </View>
                        <Text style={sheetStyles.missionPts}>+{s.points} pts</Text>
                      </View>
                    );
                  })
                )}
              </>
            )}

            {/* Metrics */}
            {metrics && (
              <>
                <Text style={sheetStyles.sectionLabel}>MÉTRICAS</Text>
                <View style={sheetStyles.metricsGrid}>
                  {metrics.weight != null && <MetricChip icon="scale" label="Peso" value={`${metrics.weight} kg`} />}
                  {metrics.trainingMinutes != null && <MetricChip icon="barbell" label="Entreno" value={`${metrics.trainingMinutes} min`} />}
                  {metrics.readingPages != null && <MetricChip icon="book" label="Lectura" value={`${metrics.readingPages} págs`} />}
                  {metrics.breathingMinutes != null && <MetricChip icon="leaf" label="Resp." value={`${metrics.breathingMinutes} min`} />}
                  {metrics.sleepHours != null && <MetricChip icon="moon" label="Sueño" value={`${metrics.sleepHours} hs`} />}
                  {metrics.energyLevel != null && <MetricChip icon="flash" label="Energía" value={`${metrics.energyLevel}/10`} />}
                </View>
              </>
            )}

            {/* Journal */}
            {journal && journal.trim().length > 0 && (
              <>
                <Text style={sheetStyles.sectionLabel}>DIARIO</Text>
                <View style={sheetStyles.journalBox}>
                  <Text style={sheetStyles.journalText} numberOfLines={5}>
                    {journal.trim()}
                  </Text>
                </View>
              </>
            )}

            {/* Phase milestone hint */}
            {(dayNumber === 30 || dayNumber === 60 || dayNumber === 90) && status !== 'future' && (
              <View style={[sheetStyles.milestoneHint, { borderColor: COLORS.accent + '40' }]}>
                <Text style={{ fontSize: 24 }}>{dayNumber === 90 ? '🏆' : '⚡'}</Text>
                <Text style={sheetStyles.milestoneHintText}>
                  {dayNumber === 30 && 'Cruzaste la Fase 1 → Construcción. La mayoría se rindió aquí.'}
                  {dayNumber === 60 && 'Cruzaste la Fase 2 → Elite. 30 días para la transformación completa.'}
                  {dayNumber === 90 && '¡ARISE! Completaste los 90 días. Sos irreconocible para quien eras.'}
                </Text>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

function MetricChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={sheetStyles.metricChip}>
      <Ionicons name={icon as any} size={14} color={COLORS.accent} />
      <Text style={sheetStyles.metricLabel}>{label}</Text>
      <Text style={sheetStyles.metricValue}>{value}</Text>
    </View>
  );
}

// ─── Phase Celebration Modal ──────────────────────────────────────────────────
function PhaseCelebrationModal({ day, onClose }: { day: 30 | 60; onClose: () => void }) {
  const isPhase2 = day === 30;
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={sheetStyles.backdrop} onPress={onClose} />
      <View style={celebStyles.container}>
        <LinearGradient
          colors={isPhase2 ? ['#1A2744', '#0D1628'] : ['#2A1A44', '#1A0D28']}
          style={celebStyles.card}
        >
          <Ionicons name={isPhase2 ? 'flash' : 'star'} size={48} color={COLORS.gold} />
          <Text style={celebStyles.title}>{isPhase2 ? 'FASE 2 DESBLOQUEADA' : 'FASE 3 DESBLOQUEADA'}</Text>
          <Text style={celebStyles.subtitle}>{isPhase2 ? 'CONSTRUCCIÓN · Días 31-60' : 'ELITE · Días 61-90'}</Text>
          <Text style={celebStyles.message}>
            {isPhase2
              ? 'Pasaste la prueba inicial. La mayoría abandona en este punto — vos seguís. Ahora el trabajo se vuelve real.'
              : 'Dos meses de entrenamiento constante. Lo que construiste no se puede destruir. Los últimos 30 días son tu legado.'}
          </Text>
          <TouchableOpacity style={[celebStyles.btn, { backgroundColor: COLORS.accent }]} onPress={onClose}>
            <Text style={celebStyles.btnText}>SEGUIR ADELANTE</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
}

// ─── Phase definitions ────────────────────────────────────────────────────────
const PHASES = [
  { id: 1, label: 'Fase 1 — Despertar',   range: [1,  10], subtitle: 'Los primeros 10 días. El hábito empieza aquí.',      accent: '#10B981', boss: 10 },
  { id: 2, label: 'Fase 2 — Construcción', range: [11, 30], subtitle: 'Días 11–30. El ciclo se asienta y el cuerpo cambia.',  accent: '#D4AF37', boss: 30 },
  { id: 3, label: 'Fase 3 — Momentum',     range: [31, 60], subtitle: 'Días 31–60. Se agrega ducha fría y trabajo profundo.', accent: '#E8C547', boss: 60 },
  { id: 4, label: 'Fase 4 — Elite',        range: [61, 90], subtitle: 'Días 61–90. La etapa final del programa.',    accent: '#F5E6A3', boss: 90 },
] as const;

const MILESTONE_LABELS: Record<number, { title: string }> = {
  10:  { title: 'Hito día 10' },
  30:  { title: 'Hito día 30' },
  60:  { title: 'Hito día 60' },
  90:  { title: 'Día 90' },
};

type DayStatus = 'completed' | 'current' | 'missed' | 'future';

// ─── Memoized day node ────────────────────────────────────────────────────────
const DayNode = memo(function DayNode({
  day, status, isBoss, phaseAccent, onPress,
}: {
  day: number;
  status: DayStatus;
  isBoss: boolean;
  phaseAccent: string;
  onPress: (day: number) => void;
}) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status !== 'current') return;
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.18, duration: 700, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1.00, duration: 700, useNativeDriver: true }),
    ])).start();
  }, [status]);

  if (isBoss) {
    const milestone = MILESTONE_LABELS[day];
    const bossComplete = status === 'completed';
    const bossCurrent = status === 'current';
    const statusIcon =
      bossComplete ? 'checkmark-circle' :
      status === 'missed' ? 'close-circle' :
      bossCurrent ? 'flag' : 'lock-closed';
    return (
      <TouchableOpacity
        style={[
          bossStyles.node,
          bossComplete && { backgroundColor: phaseAccent + '30', borderColor: phaseAccent },
          bossCurrent  && { backgroundColor: phaseAccent + '20', borderColor: phaseAccent + 'CC' },
          !bossComplete && !bossCurrent && bossStyles.nodeLocked,
        ]}
        onPress={() => onPress(day)}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={`${milestone.title}. ${bossComplete ? 'Completado' : status === 'missed' ? 'Fallado' : bossCurrent ? 'Actual' : 'Bloqueado'}`}
      >
        <Ionicons
          name={statusIcon}
          size={22}
          color={bossComplete || bossCurrent ? phaseAccent : COLORS.textMuted}
        />
        <Text style={[bossStyles.title, bossComplete && { color: phaseAccent }]}>{milestone.title}</Text>
        <Text style={[bossStyles.day, bossComplete && { color: phaseAccent }]}>Día {day}</Text>
        {bossComplete && (
          <View style={[bossStyles.clearedBadge, { backgroundColor: phaseAccent + '20', borderColor: phaseAccent + '60' }]}>
            <Text style={[bossStyles.clearedText, { color: phaseAccent }]}>Completado</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  const bg =
    status === 'completed' ? COLORS.success + 'CC' :
    status === 'current'   ? COLORS.accent :
    status === 'missed'    ? 'rgba(248,113,113,0.18)' :
    'rgba(255,255,255,0.05)';

  const borderColor =
    status === 'completed' ? COLORS.success + '80' :
    status === 'current'   ? COLORS.accent :
    status === 'missed'    ? COLORS.danger + '50' :
    'rgba(255,255,255,0.07)';

  return (
    <Animated.View style={status === 'current' ? { transform: [{ scale: pulse }] } : undefined}>
      <TouchableOpacity
        style={[nodeStyles.cell, { backgroundColor: bg, borderColor, borderWidth: 1 }]}
        onPress={() => onPress(day)}
        activeOpacity={0.7}
      >
        {status === 'completed' && <Ionicons name="checkmark" size={10} color="#fff" />}
        {status === 'current'   && <Text style={nodeStyles.currentNum}>{day}</Text>}
        {status === 'missed'    && <Ionicons name="close" size={10} color={COLORS.danger} />}
        {status === 'future'    && <Text style={nodeStyles.futureNum}>{day}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─── Phase section ────────────────────────────────────────────────────────────
function PhaseSection({
  phase, days, getDayStatus, onDayPress,
}: {
  phase: typeof PHASES[number];
  days: number[];
  getDayStatus: (d: number) => DayStatus;
  onDayPress: (d: number) => void;
}) {
  const [from, to] = phase.range;
  const total    = to - from + 1;
  const done     = days.filter(d => getDayStatus(d) === 'completed').length;
  const pct      = Math.round((done / total) * 100);
  const isActive = days.some(d => getDayStatus(d) === 'current');

  const regularDays = days.filter(d => d !== phase.boss);
  const bossDay     = phase.boss;
  const bossStatus  = getDayStatus(bossDay);

  return (
    <View style={[phaseStyles.section, isActive && { borderColor: phase.accent + '40' }]}>
      {/* Phase header */}
      <View style={phaseStyles.header}>
        <View style={[phaseStyles.dot, { backgroundColor: phase.accent }]} />
        <View style={{ flex: 1 }}>
          <Text style={[phaseStyles.label, { color: phase.accent }]}>{phase.label}</Text>
          <Text style={phaseStyles.subtitle}>{phase.subtitle}</Text>
        </View>
        <Text style={[phaseStyles.pct, { color: pct === 100 ? phase.accent : COLORS.textMuted }]}>
          {pct}%
        </Text>
      </View>

      {/* Mini progress */}
      <View style={phaseStyles.progressBg}>
        <View style={[phaseStyles.progressFill, { width: `${pct}%` as any, backgroundColor: phase.accent }]} />
      </View>

      {/* Regular day nodes */}
      <View style={phaseStyles.grid}>
        {regularDays.map(d => (
          <DayNode
            key={d}
            day={d}
            status={getDayStatus(d)}
            isBoss={false}
            phaseAccent={phase.accent}
            onPress={onDayPress}
          />
        ))}
      </View>

      {/* Boss node — full width at the bottom */}
      <DayNode
        key={bossDay}
        day={bossDay}
        status={bossStatus}
        isBoss
        phaseAccent={phase.accent}
        onPress={onDayPress}
      />
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ProgramaScreen() {
  const { reducedMotion, screenAnimStyle } = useTabScreenMotion('programa');
  const { data, getDayRecord, loading } = useApp();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState<30 | 60 | null>(null);

  const currentDay = data?.user.currentDay ?? 0;
  const isMilestoneDay = currentDay === 30 || currentDay === 60;

  if (!data) {
    const fallbackTheme = getStageTheme();
    return (
      <LinearGradient colors={fallbackTheme.background} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          {loading ? (
            <ScreenLoadingState
              title="Programa 90 días"
              subtitle="Cargando fases e hitos..."
              icon="calendar-outline"
              accent={fallbackTheme.tabActive}
              reducedMotion={reducedMotion}
              hints={[
                'Leyendo progreso de 90 dias',
                'Marcando hitos y fases',
                'Preparando detalle por dia',
              ]}
            />
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No pudimos cargar tu programa</Text>
              <Text style={styles.emptyText}>
                Verifica conexión e inicia sesión nuevamente desde Config si es necesario.
              </Text>
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const { user } = data;
  const stageTheme = getStageTheme(user);
  const coachId = user.preferredCoachId ?? 'arise';

  function getDayStatus(day: number): DayStatus {
    if (day > currentDay) return 'future';
    if (day === currentDay) return 'current';
    const record = getDayRecord(day);
    if (record?.completed) return 'completed';
    if (record?.missed) return 'missed';
    return 'future';
  }

  const completedDays = Array.from({ length: 90 }, (_, i) => i + 1)
    .filter(d => getDayRecord(d)?.completed).length;
  const progressPercent = Math.round((completedDays / 90) * 100);

  return (
    <LinearGradient colors={stageTheme.background} style={styles.container}>
      <CoachParticles coachId={coachId} screen="programa" reducedMotion={reducedMotion} />
      <Animated.View style={[styles.motionLayer, screenAnimStyle]}>
        <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Programa 90 días</Text>
            <Text style={styles.subtitle}>Tocá cualquier día para ver el detalle</Text>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{completedDays}</Text>
              <Text style={styles.statLabel}>Completados</Text>
            </View>
            <View style={[styles.statCard, styles.statCardCenter]}>
              <Text style={[styles.statNumber, { color: COLORS.accent }]}>{progressPercent}%</Text>
              <Text style={styles.statLabel}>Progreso</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: COLORS.streak }]}>{90 - completedDays}</Text>
              <Text style={styles.statLabel}>Restantes</Text>
            </View>
          </View>

          {/* Master progress bar */}
          <View style={styles.bigProgressBg}>
            <LinearGradient
              colors={stageTheme.accent}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.bigProgressFill, { width: `${progressPercent}%` as any }]}
            />
          </View>

          {/* Phase unlock banner */}
          {isMilestoneDay && (
            <TouchableOpacity
              style={styles.milestoneBanner}
              onPress={() => setShowCelebration(currentDay as 30 | 60)}
              activeOpacity={0.85}
            >
              <Ionicons name={currentDay === 30 ? 'flash' : 'star'} size={22} color={COLORS.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.milestoneBannerTitle}>
                  {currentDay === 30 ? 'Fase 3 desbloqueada' : 'Fase 4 desbloqueada'}
                </Text>
                <Text style={styles.milestoneBannerSub}>Tocá para ver el mensaje del coach</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.accent} />
            </TouchableOpacity>
          )}

          {/* Legend */}
          <View style={styles.legend}>
            <LegendItem color={COLORS.success}   label="Completado" />
            <LegendItem color={COLORS.accent}    label="Hoy" />
            <LegendItem color={COLORS.danger}    label="Fallado" />
            <LegendItem color="rgba(255,255,255,0.07)" label="Futuro" />
          </View>

          {/* ── RPG Phase Sections ── */}
          {PHASES.map((phase, index) => {
            const days = Array.from(
              { length: phase.range[1] - phase.range[0] + 1 },
              (_, i) => phase.range[0] + i,
            );
            return (
              <StaggerIn key={phase.id} index={index} reducedMotion={reducedMotion}>
                <PhaseSection
                  phase={phase}
                  days={days}
                  getDayStatus={getDayStatus}
                  onDayPress={setSelectedDay}
                />
              </StaggerIn>
            );
          })}

          <View style={{ height: 100 }} />
        </ScrollView>
        </SafeAreaView>
      </Animated.View>

      {/* Day detail sheet */}
      {selectedDay !== null && (
        <DayDetailSheet
          dayNumber={selectedDay}
          record={getDayRecord(selectedDay)}
          status={getDayStatus(selectedDay)}
          onClose={() => setSelectedDay(null)}
        />
      )}

      {/* Phase celebration modal */}
      {showCelebration !== null && (
        <PhaseCelebrationModal
          day={showCelebration}
          onClose={() => setShowCelebration(null)}
        />
      )}
    </LinearGradient>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const MILESTONES = [
  { day: 1,  name: 'El inicio',     description: 'El primer paso es el más importante.', nextDay: 8 },
  { day: 10, name: 'Primera semana y media', description: 'El cuerpo empieza a adaptarse.', nextDay: 21 },
  { day: 21, name: '3 semanas',      description: 'Los primeros hábitos se instalan.', nextDay: 30 },
  { day: 30, name: 'Un mes',         description: 'La mayoría se rinde aquí. Vos no.', nextDay: 45 },
  { day: 45, name: 'Mitad del camino', description: 'Cada día que queda vale doble.', nextDay: 60 },
  { day: 60, name: 'Dos meses',      description: 'Sos irreconocible para quien eras al empezar.', nextDay: 75 },
  { day: 75, name: 'Últimos 15',     description: 'El final define el legado.', nextDay: 85 },
  { day: 85, name: 'Última semana',  description: 'Todo lo que tenés.', nextDay: 91 },
  { day: 90, name: '¡ARISE!',        description: 'Lo lograste. 90 días de fuego.', nextDay: 91 },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  motionLayer: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: SPACING.md },

  header: { marginBottom: SPACING.lg, marginTop: SPACING.sm },
  title: { fontSize: FONT.xxl, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: FONT.base, color: COLORS.textSecondary, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statCardCenter: { borderColor: COLORS.accent + '40' },
  statNumber: { fontSize: FONT.xl, fontWeight: '900', color: COLORS.textPrimary },
  statLabel: { fontSize: FONT.xs, color: COLORS.textMuted, marginTop: 2, fontWeight: '600' },

  bigProgressBg: {
    height: 8,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.xl,
  },
  bigProgressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
    minWidth: 8,
  },


  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendLabel: { fontSize: FONT.xs, color: COLORS.textSecondary },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  emptyTitle: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  emptyText: { color: COLORS.textSecondary, fontSize: FONT.sm, textAlign: 'center', lineHeight: 20 },

  milestoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.accent + '15',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.accent + '40',
  },
  milestoneBannerEmoji: { fontSize: 24 },
  milestoneBannerTitle: { fontSize: FONT.base, fontWeight: '800', color: COLORS.textPrimary },
  milestoneBannerSub: { fontSize: FONT.xs, color: COLORS.accent, marginTop: 2 },
});

// ─── Sheet styles ─────────────────────────────────────────────────────────────
const sheetStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { maxHeight: '80%' },
  content: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, paddingTop: SPACING.sm, flex: 1 },
  handle: { width: 36, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: SPACING.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: SPACING.lg },
  dayTitle: { fontSize: FONT.xl, fontWeight: '900', color: COLORS.textPrimary },
  statusLabel: { fontSize: FONT.sm, fontWeight: '700' },
  pts: { fontSize: FONT.xs, color: COLORS.textMuted, marginLeft: 4 },
  closeBtn: { padding: 4 },

  sectionLabel: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 2, marginBottom: SPACING.sm, marginTop: SPACING.md },

  missionRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: 6, borderWidth: 1, borderColor: COLORS.border },
  missionEmoji: { fontSize: 20, width: 32, textAlign: 'center' },
  missionName: { fontSize: FONT.sm, fontWeight: '700', color: COLORS.textPrimary },
  missionMeta: { fontSize: FONT.xs, color: COLORS.textMuted, marginTop: 1 },
  missionPts: { fontSize: FONT.sm, fontWeight: '800', color: COLORS.accent },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, paddingHorizontal: SPACING.sm, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border },
  metricLabel: { fontSize: FONT.xs, color: COLORS.textMuted },
  metricValue: { fontSize: FONT.xs, fontWeight: '700', color: COLORS.textPrimary },

  journalBox: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.md, padding: SPACING.md, borderLeftWidth: 3, borderLeftColor: COLORS.accent + '60' },
  journalText: { fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 22, fontStyle: 'italic' },

  milestoneHint: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, marginTop: SPACING.md },
  milestoneHintText: { flex: 1, fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 20 },

  emptyState: { alignItems: 'center', gap: 8, paddingVertical: SPACING.xl },
  emptyTitle: { fontSize: FONT.base, fontWeight: '700', color: COLORS.textPrimary },
  emptyText: { fontSize: FONT.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
});

// ─── Day node styles ─────────────────────────────────────────────────────────
const nodeStyles = StyleSheet.create({
  cell: {
    width: CELL, height: CELL,
    borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  currentNum: { fontSize: 9, fontWeight: '900', color: '#fff' },
  futureNum:  { fontSize: 8, color: COLORS.textMuted },
});

// ─── Boss node styles ─────────────────────────────────────────────────────────
const bossStyles = StyleSheet.create({
  node: {
    width: '100%', borderRadius: RADIUS.lg,
    padding: SPACING.md, marginTop: SPACING.sm,
    alignItems: 'center', gap: 4,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  nodeLocked: { opacity: 0.45 },
  emoji:  { fontSize: 28 },
  title:  { fontSize: 10, fontWeight: '900', letterSpacing: 2, color: COLORS.textMuted },
  day:    { fontSize: FONT.sm, fontWeight: '900', color: COLORS.textPrimary },
  clearedBadge: {
    marginTop: 4, paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  clearedText: { fontSize: 9, fontWeight: '900', letterSpacing: 2 },
});

// ─── Phase section styles ─────────────────────────────────────────────────────
const phaseStyles = StyleSheet.create({
  section: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.sm },
  dot:    { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  label:  { fontSize: FONT.xs, fontWeight: '900', letterSpacing: 1.5 },
  subtitle: { fontSize: 10, color: COLORS.textMuted, marginTop: 2, lineHeight: 15 },
  pct:    { fontSize: FONT.xs, fontWeight: '900', letterSpacing: 0.5, marginTop: 2 },
  progressBg: {
    height: 3, backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: SPACING.sm,
  },
  progressFill: { height: '100%', borderRadius: RADIUS.full, minWidth: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
});

// ─── Celebration styles ───────────────────────────────────────────────────────
const celebStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  card: { borderRadius: RADIUS.xl, padding: SPACING.xl, alignItems: 'center', width: '100%', gap: SPACING.md, borderWidth: 1, borderColor: COLORS.accent + '30' },
  emoji: { fontSize: 56 },
  title: { fontSize: FONT.xl, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: 1, textAlign: 'center' },
  subtitle: { fontSize: FONT.sm, color: COLORS.accent, fontWeight: '700', letterSpacing: 0.5 },
  message: { fontSize: FONT.base, color: COLORS.textSecondary, lineHeight: 24, textAlign: 'center' },
  btn: { borderRadius: RADIUS.lg, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xl, marginTop: SPACING.sm },
  btnText: { color: '#fff', fontWeight: '900', fontSize: FONT.base, letterSpacing: 1 },
});
