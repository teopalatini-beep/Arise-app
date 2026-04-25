import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { COLORS, GRADIENTS, FONT, RADIUS, SPACING } from '../../src/theme';
import { DayMetrics } from '../../src/types';

export default function ProgresoScreen() {
  const { data, todayRecord, saveMetrics } = useApp();
  const [weight, setWeight] = useState(
    todayRecord?.metrics?.weight?.toString() ?? ''
  );
  const [trainMin, setTrainMin] = useState(
    todayRecord?.metrics?.trainingMinutes?.toString() ?? ''
  );
  const [readPages, setReadPages] = useState(
    todayRecord?.metrics?.readingPages?.toString() ?? ''
  );
  const [meditMin, setMeditMin] = useState(
    todayRecord?.metrics?.meditationMinutes?.toString() ?? ''
  );
  const [metricNotes, setMetricNotes] = useState(
    todayRecord?.metrics?.notes ?? ''
  );
  const [saved, setSaved] = useState(false);

  if (!data) return null;
  const { user, days } = data;

  function handleSave() {
    const metrics: DayMetrics = {
      weight: weight ? parseFloat(weight) : undefined,
      trainingMinutes: trainMin ? parseInt(trainMin) : undefined,
      readingPages: readPages ? parseInt(readPages) : undefined,
      meditationMinutes: meditMin ? parseInt(meditMin) : undefined,
      notes: metricNotes || undefined,
    };
    saveMetrics(metrics);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // Build weight history from days
  const weightHistory = days
    .filter(d => d.metrics?.weight)
    .sort((a, b) => a.dayNumber - b.dayNumber)
    .slice(-14); // last 14 days

  // Training total
  const totalTrainMin = days.reduce((sum, d) => sum + (d.metrics?.trainingMinutes ?? 0), 0);
  const totalReadPages = days.reduce((sum, d) => sum + (d.metrics?.readingPages ?? 0), 0);
  const totalMeditMin = days.reduce((sum, d) => sum + (d.metrics?.meditationMinutes ?? 0), 0);

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Tu Progreso</Text>
              <Text style={styles.subtitle}>Día {user.currentDay} de 90</Text>
            </View>

            {/* Top stats */}
            <View style={styles.statsGrid}>
              <StatBox
                label="RACHA"
                value={`${user.streak}`}
                icon="flame"
                color={COLORS.streak}
                sub={`Máx: ${user.maxStreak}`}
              />
              <StatBox
                label="XP TOTAL"
                value={`${user.xp}`}
                icon="flash"
                color={COLORS.accent}
                sub={`Nivel ${user.level}`}
              />
              <StatBox
                label="DÍAS OK"
                value={`${days.filter(d => d.completed).length}`}
                icon="checkmark-circle"
                color={COLORS.success}
                sub="completados"
              />
              <StatBox
                label="DIAS TOTAL"
                value={`${user.currentDay - 1}`}
                icon="calendar"
                color={COLORS.purple}
                sub="transcurridos"
              />
            </View>

            {/* Accumulated totals */}
            <Text style={styles.sectionTitle}>ACUMULADO TOTAL</Text>
            <View style={styles.totalsRow}>
              <TotalCard icon="barbell" color={COLORS.cuerpo} label="Entrenamiento" value={`${Math.round(totalTrainMin / 60)}h ${totalTrainMin % 60}m`} />
              <TotalCard icon="book" color={COLORS.mente} label="Páginas leídas" value={`${totalReadPages}`} />
            </View>
            <View style={styles.totalsRow}>
              <TotalCard icon="leaf" color={COLORS.bienestar} label="Meditación" value={`${Math.round(totalMeditMin / 60)}h ${totalMeditMin % 60}m`} />
              <TotalCard icon="trending-up" color={COLORS.productividad} label="Nivel actual" value={`${user.level}`} />
            </View>

            {/* Weight history */}
            {weightHistory.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>HISTORIAL DE PESO</Text>
                <View style={styles.weightChart}>
                  {weightHistory.map((d, i) => {
                    const allWeights = weightHistory.map(r => r.metrics!.weight!);
                    const min = Math.min(...allWeights);
                    const max = Math.max(...allWeights);
                    const range = max - min || 1;
                    const h = 60 + ((d.metrics!.weight! - min) / range) * 60;
                    return (
                      <View key={d.dayNumber} style={styles.weightBar}>
                        <Text style={styles.weightValue}>{d.metrics!.weight!.toFixed(1)}</Text>
                        <View
                          style={[styles.weightBarFill, {
                            height: h,
                            backgroundColor: i === weightHistory.length - 1
                              ? COLORS.accent : COLORS.bgCard,
                          }]}
                        />
                        <Text style={styles.weightDay}>D{d.dayNumber}</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {/* Today's metrics input */}
            <Text style={styles.sectionTitle}>MÉTRICAS DE HOY — DÍA {user.currentDay}</Text>
            <View style={styles.metricsCard}>
              <MetricInput
                icon="scale"
                label="Peso corporal"
                value={weight}
                onChangeText={setWeight}
                suffix="kg"
                placeholder="ej: 75.5"
                keyboardType="decimal-pad"
              />
              <MetricInput
                icon="barbell"
                label="Tiempo entrenado"
                value={trainMin}
                onChangeText={setTrainMin}
                suffix="min"
                placeholder="ej: 65"
                keyboardType="numeric"
              />
              <MetricInput
                icon="book"
                label="Páginas leídas"
                value={readPages}
                onChangeText={setReadPages}
                suffix="págs"
                placeholder="ej: 25"
                keyboardType="numeric"
              />
              <MetricInput
                icon="leaf"
                label="Meditación"
                value={meditMin}
                onChangeText={setMeditMin}
                suffix="min"
                placeholder="ej: 15"
                keyboardType="numeric"
              />

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
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveGradient}
                >
                  <Ionicons name={saved ? 'checkmark' : 'save'} size={16} color="#fff" />
                  <Text style={styles.saveText}>{saved ? '¡Guardado!' : 'Guardar métricas'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function StatBox({ label, value, icon, color, sub }: {
  label: string; value: string; icon: string; color: string; sub: string;
}) {
  return (
    <View style={[statStyles.box, { borderColor: color + '30' }]}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={statStyles.sub}>{sub}</Text>
    </View>
  );
}

function TotalCard({ icon, color, label, value }: {
  icon: string; color: string; label: string; value: string;
}) {
  return (
    <View style={totalStyles.card}>
      <Ionicons name={icon as any} size={20} color={color} />
      <View style={{ flex: 1, marginLeft: SPACING.sm }}>
        <Text style={totalStyles.label}>{label}</Text>
        <Text style={[totalStyles.value, { color }]}>{value}</Text>
      </View>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: SPACING.md },
  header: { marginBottom: SPACING.lg, marginTop: SPACING.sm },
  title: { fontSize: FONT.xxl, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: FONT.base, color: COLORS.textSecondary, marginTop: 2 },
  sectionTitle: {
    fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '700',
    letterSpacing: 2, marginBottom: SPACING.sm, marginTop: SPACING.lg,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  totalsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },

  weightChart: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 4,
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
    height: 140,
  },
  weightBar: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  weightValue: { fontSize: 8, color: COLORS.textMuted, marginBottom: 2 },
  weightBarFill: { width: '100%', borderRadius: 3, minHeight: 4 },
  weightDay: { fontSize: 7, color: COLORS.textMuted, marginTop: 3 },

  metricsCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  notesSection: { marginTop: SPACING.sm },
  metricLabel: { fontSize: FONT.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs, fontWeight: '600' },
  notesInput: {
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: RADIUS.md,
    padding: SPACING.sm, color: COLORS.textPrimary, fontSize: FONT.base,
    minHeight: 80, borderWidth: 1, borderColor: COLORS.border,
  },
  saveButton: { marginTop: SPACING.md, borderRadius: RADIUS.md, overflow: 'hidden' },
  saveGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.md, gap: 8,
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: FONT.base },
});

const statStyles = StyleSheet.create({
  box: {
    width: '48%', backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    padding: SPACING.md, alignItems: 'center', borderWidth: 1, gap: 2,
  },
  value: { fontSize: FONT.xl, fontWeight: '900', color: COLORS.textPrimary },
  label: { fontSize: 9, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 1 },
  sub: { fontSize: FONT.xs, color: COLORS.textSecondary },
});

const totalStyles = StyleSheet.create({
  card: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  label: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '600' },
  value: { fontSize: FONT.lg, fontWeight: '800', marginTop: 2 },
});

const inputStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    paddingVertical: SPACING.sm, gap: SPACING.xs,
  },
  icon: { marginRight: 4 },
  label: { flex: 1, fontSize: FONT.base, color: COLORS.textSecondary, fontWeight: '500' },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm, paddingVertical: 6,
    color: COLORS.textPrimary, fontSize: FONT.base, minWidth: 70, textAlign: 'right',
    borderWidth: 1, borderColor: COLORS.border,
  },
  suffix: { fontSize: FONT.sm, color: COLORS.textMuted, minWidth: 30 },
});
