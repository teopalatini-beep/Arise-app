import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { COLORS, FONT, RADIUS, SPACING } from '../../src/theme';
import { getStageTheme } from '../../src/lib/progression';

const COLS = 9; // 9 columnas × 10 filas = 90 días

export default function ProgramaScreen() {
  const { data, getDayRecord, loading } = useApp();
  if (!data) {
    return (
      <LinearGradient colors={getStageTheme().background} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>{loading ? 'Cargando programa...' : 'No pudimos cargar tu programa'}</Text>
            <Text style={styles.emptyText}>
              Verifica conexión e inicia sesión nuevamente desde Config si es necesario.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const { user } = data;
  const stageTheme = getStageTheme(user);
  const currentDay = user.currentDay;

  function getDayStatus(day: number): 'completed' | 'current' | 'missed' | 'future' {
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
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Tu Programa</Text>
            <Text style={styles.subtitle}>90 días para transformarte</Text>
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
              <Text style={[styles.statNumber, { color: COLORS.streak }]}>
                {90 - completedDays}
              </Text>
              <Text style={styles.statLabel}>Restantes</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.bigProgressBg}>
            <LinearGradient
              colors={stageTheme.accent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.bigProgressFill, { width: `${progressPercent}%` as any }]}
            />
          </View>

          {/* Grid */}
          <Text style={styles.gridTitle}>MAPA DE 90 DÍAS</Text>
          <View style={styles.grid}>
            {Array.from({ length: 90 }, (_, i) => {
              const day = i + 1;
              const status = getDayStatus(day);
              return (
                <View key={day} style={[styles.dayCell, styles[`cell_${status}`]]}>
                  {status === 'completed' && (
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  )}
                  {status === 'current' && (
                    <Text style={styles.dayCellTextCurrent}>{day}</Text>
                  )}
                  {status === 'missed' && (
                    <Ionicons name="close" size={10} color={COLORS.danger} />
                  )}
                  {status === 'future' && (
                    <Text style={styles.dayCellTextFuture}>{day}</Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <LegendItem color={COLORS.success} label="Completado" />
            <LegendItem color={COLORS.accent} label="Hoy" />
            <LegendItem color={COLORS.danger} label="Fallado" />
            <LegendItem color={COLORS.bgCard} label="Futuro" />
          </View>

          {/* Milestones */}
          <Text style={[styles.gridTitle, { marginTop: SPACING.xl }]}>HITOS</Text>
          {MILESTONES.map(m => {
            const reached = currentDay > m.day;
            const isCurrent = currentDay >= m.day && currentDay < (m.nextDay ?? 91);
            return (
              <View key={m.day} style={[styles.milestone, isCurrent && styles.milestoneCurrent]}>
                <View style={[styles.milestoneDot, reached && styles.milestoneDotDone]} />
                <View style={styles.milestoneInfo}>
                  <Text style={[styles.milestoneName, reached && styles.milestoneNameDone]}>
                    Día {m.day} — {m.name}
                  </Text>
                  <Text style={styles.milestoneDesc}>{m.description}</Text>
                </View>
                {reached && <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />}
              </View>
            );
          })}

          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
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

  gridTitle: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: SPACING.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: SPACING.md,
  },
  dayCell: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cell_completed: { backgroundColor: COLORS.success },
  cell_current: {
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  cell_missed: { backgroundColor: 'rgba(248,113,113,0.2)', borderWidth: 1, borderColor: COLORS.danger + '50' },
  cell_future: { backgroundColor: COLORS.bgCard, borderWidth: 1, borderColor: COLORS.border },

  dayCellTextCurrent: { fontSize: 10, fontWeight: '900', color: '#fff' },
  dayCellTextFuture: { fontSize: 9, color: COLORS.textMuted },

  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendLabel: { fontSize: FONT.xs, color: COLORS.textSecondary },

  milestone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  milestoneCurrent: {
    borderColor: COLORS.accent + '50',
    backgroundColor: 'rgba(72,149,239,0.08)',
  },
  milestoneDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.textMuted,
  },
  milestoneDotDone: { backgroundColor: COLORS.success },
  milestoneInfo: { flex: 1 },
  milestoneName: { fontSize: FONT.base, fontWeight: '700', color: COLORS.textPrimary },
  milestoneNameDone: { color: COLORS.success },
  milestoneDesc: { fontSize: FONT.sm, color: COLORS.textSecondary, marginTop: 2 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  emptyTitle: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  emptyText: { color: COLORS.textSecondary, fontSize: FONT.sm, textAlign: 'center', lineHeight: 20 },
});
