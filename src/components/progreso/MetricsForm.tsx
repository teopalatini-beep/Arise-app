import React from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT, RADIUS, SPACING } from '../../theme';

interface MetricsFormProps {
  dayNumber: number;
  weight: string;
  setWeight: (value: string) => void;
  trainMin: string;
  setTrainMin: (value: string) => void;
  readPages: string;
  setReadPages: (value: string) => void;
  breathMin: string;
  setBreathMin: (value: string) => void;
  sleepHours: string;
  setSleepHours: (value: string) => void;
  energyLevel: number;
  setEnergyLevel: (value: number) => void;
  metricNotes: string;
  setMetricNotes: (value: string) => void;
  saved: boolean;
  accent: readonly string[];
  onSave: () => Promise<void> | void;
  saving?: boolean;
}

interface MetricInputProps {
  icon: string;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  suffix: string;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'decimal-pad';
}

function MetricInput({ icon, label, value, onChangeText, suffix, placeholder, keyboardType }: MetricInputProps) {
  return (
    <View style={styles.inputRow}>
      <Ionicons name={icon as any} size={16} color={COLORS.textSecondary} style={styles.inputIcon} />
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType ?? 'default'}
        returnKeyType="done"
      />
      <Text style={styles.inputSuffix}>{suffix}</Text>
    </View>
  );
}

export default function MetricsForm({
  dayNumber,
  weight,
  setWeight,
  trainMin,
  setTrainMin,
  readPages,
  setReadPages,
  breathMin,
  setBreathMin,
  sleepHours,
  setSleepHours,
  energyLevel,
  setEnergyLevel,
  metricNotes,
  setMetricNotes,
  saved,
  accent,
  onSave,
  saving = false,
}: MetricsFormProps) {
  const accentColors =
    accent.length >= 2
      ? (accent as readonly [string, string, ...string[]])
      : (['#E8460A', '#7C3AED'] as const);

  return (
    <>
      <Text style={styles.sectionTitle}>MÉTRICAS DE HOY — DÍA {dayNumber}</Text>
      <View style={styles.metricsCard}>
        <MetricInput icon="scale" label="Peso corporal" value={weight} onChangeText={setWeight} suffix="kg" placeholder="ej: 75.5" keyboardType="decimal-pad" />
        <MetricInput icon="barbell" label="Entrenamiento" value={trainMin} onChangeText={setTrainMin} suffix="min" placeholder="ej: 65" keyboardType="numeric" />
        <MetricInput icon="book" label="Páginas leídas" value={readPages} onChangeText={setReadPages} suffix="págs" placeholder="ej: 25" keyboardType="numeric" />
        <MetricInput icon="leaf" label="Respiración" value={breathMin} onChangeText={setBreathMin} suffix="min" placeholder="ej: 10" keyboardType="numeric" />
        <MetricInput icon="moon" label="Horas de sueño" value={sleepHours} onChangeText={setSleepHours} suffix="hs" placeholder="ej: 7.5" keyboardType="decimal-pad" />

        <View style={styles.ratingSection}>
          <Text style={styles.metricLabel}>⚡ Nivel de energía</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
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

        <TouchableOpacity style={styles.saveButton} onPress={onSave} disabled={saving}>
          <LinearGradient
            colors={saved ? [COLORS.success, '#059669'] : accentColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.saveGradient, saving && { opacity: 0.75 }]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name={saved ? 'checkmark' : 'save'} size={16} color="#fff" />
            )}
            <Text style={styles.saveText}>
              {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar métricas'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: SPACING.sm,
    marginTop: SPACING.lg,
  },
  metricsCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricLabel: { fontSize: FONT.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  inputIcon: { marginRight: 4 },
  inputLabel: { flex: 1, fontSize: FONT.base, color: COLORS.textSecondary, fontWeight: '500' },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    color: COLORS.textPrimary,
    fontSize: FONT.base,
    minWidth: 70,
    textAlign: 'right',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputSuffix: { fontSize: FONT.sm, color: COLORS.textMuted, minWidth: 30 },
  notesSection: { marginTop: SPACING.sm },
  notesInput: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: FONT.base,
    minHeight: 80,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearNotesBtn: { alignSelf: 'flex-end', marginTop: 6 },
  clearNotesText: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '700' },
  saveButton: { marginTop: SPACING.md, borderRadius: RADIUS.md, overflow: 'hidden' },
  saveGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, gap: 8 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: FONT.base },
  ratingSection: { marginTop: SPACING.sm, marginBottom: SPACING.sm },
  ratingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  ratingChip: {
    minHeight: 44,
    flex: 1,
    paddingHorizontal: 4,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bgCard,
  },
  ratingText: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '700' },
});
