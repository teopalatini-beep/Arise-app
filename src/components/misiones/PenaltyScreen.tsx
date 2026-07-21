import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT, RADIUS, SPACING } from '../../theme';

const PENALTY_TASKS = [
  { icon: 'barbell-outline' as const, text: '100 sentadillas + 50 flexiones + 30 burpees (sin descanso)' },
  { icon: 'water-outline' as const, text: '5 minutos de ducha fría — sin negociar' },
  { icon: 'flash-outline' as const, text: '30 minutos de cardio intenso (carrera, HIIT o saltar la soga)' },
  { icon: 'create-outline' as const, text: 'Carta de compromiso: escribí 200 palabras sobre por qué vas a terminar estos 90 días' },
];

interface PenaltyScreenProps {
  dayNumber: number;
  onComplete: () => void;
  onGrace?: () => void;
}

export default function PenaltyScreen({ dayNumber, onComplete, onGrace }: PenaltyScreenProps) {
  const [letter, setLetter] = useState('');
  const [checked, setChecked] = useState<boolean[]>([false, false, false, false]);
  const allChecked = checked.every(Boolean) && letter.trim().split(/\s+/).length >= 50;

  function toggleCheck(i: number) {
    setChecked(prev => prev.map((v, idx) => (idx === i ? !v : v)));
  }

  function handleComplete() {
    if (!allChecked) {
      Alert.alert(
        'Recuperación incompleta',
        'Completá todas las tareas y escribí al menos 50 palabras en la carta de compromiso.',
        [{ text: 'OK' }],
      );
      return;
    }

    Alert.alert(
      '¿Confirmás que completaste todo?',
      'Tu palabra es tu estándar. Solo marcá como completo si realmente lo hiciste.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, lo hice', onPress: onComplete },
      ],
    );
  }

  const wordCount = letter.trim() === '' ? 0 : letter.trim().split(/\s+/).length;

  return (
    <LinearGradient colors={['#0A0005', '#1A0008', '#0D0000']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Ionicons name="alert-circle" size={52} color="#EF4444" style={styles.alertIcon} />
              <Text style={styles.title}>DÍA DE{'\n'}RECUPERACIÓN</Text>
              <Text style={styles.subtitle}>
                Día {dayNumber} — ayer no cumpliste. Hoy se corrige, sin negociar.{'\n'}
                Completá todo antes de seguir.
              </Text>
            </View>

            <Text style={styles.sectionLabel}>LAS 4 TAREAS</Text>
            {PENALTY_TASKS.map((task, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.taskCard, checked[i] && styles.taskCardDone]}
                onPress={() => toggleCheck(i)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, checked[i] && styles.checkboxDone]}>
                  {checked[i] && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>✓</Text>}
                </View>
                <Ionicons
                  name={task.icon}
                  size={20}
                  color={checked[i] ? COLORS.success : '#EF4444'}
                  style={styles.taskIcon}
                />
                <Text style={[styles.taskText, checked[i] && styles.taskTextDone]}>{task.text}</Text>
              </TouchableOpacity>
            ))}

            <Text style={[styles.sectionLabel, { marginTop: SPACING.lg }]}>CARTA DE COMPROMISO</Text>
            <Text style={styles.letterHint}>
              ¿Por qué empezaste esto? ¿Quién querés ser en 90 días? ¿Qué cambiaría si terminás?
            </Text>
            <TextInput
              style={styles.letterInput}
              value={letter}
              onChangeText={setLetter}
              multiline
              placeholder="Escribí con claridad. Mínimo 50 palabras..."
              placeholderTextColor={COLORS.textMuted}
              textAlignVertical="top"
            />
            <Text style={[styles.wordCount, wordCount >= 50 && { color: COLORS.success }]}>
              {wordCount} palabras {wordCount >= 50 ? '✓' : '(mínimo 50)'}
            </Text>

            <TouchableOpacity
              style={[styles.completeBtn, !allChecked && { opacity: 0.5 }]}
              onPress={handleComplete}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={allChecked ? ['#EF4444', '#D4AF37'] : ['#333', '#222']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.completeBtnInner}
              >
                <Text style={styles.completeBtnText}>
                  {allChecked ? 'COMPLETÉ LA RECUPERACIÓN' : `Faltan ${checked.filter(Boolean).length}/4 tareas`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {onGrace && (
              <TouchableOpacity style={styles.graceBtn} onPress={onGrace}>
                <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.warning} />
                <Text style={styles.graceBtnText}>Usar día de gracia (1 disponible este mes)</Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: SPACING.md },
  header: { alignItems: 'center', paddingVertical: SPACING.lg },
  alertIcon: { marginBottom: SPACING.sm },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#F5F0FF',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: SPACING.sm,
    textShadowColor: '#EF4444',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  subtitle: { fontSize: FONT.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  sectionLabel: { fontSize: FONT.xs, color: '#EF4444', fontWeight: '800', letterSpacing: 2, marginBottom: SPACING.sm },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  taskCardDone: { backgroundColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  checkboxDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  taskIcon: { flexShrink: 0, marginTop: 2 },
  taskText: { flex: 1, fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 20 },
  taskTextDone: { color: COLORS.textMuted, textDecorationLine: 'line-through' },
  letterHint: { fontSize: FONT.xs, color: COLORS.textMuted, marginBottom: SPACING.sm, lineHeight: 18 },
  letterInput: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    color: COLORS.textPrimary,
    fontSize: FONT.base,
    padding: SPACING.md,
    minHeight: 160,
    lineHeight: 24,
  },
  wordCount: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: SPACING.lg,
  },
  completeBtn: { borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: SPACING.md },
  completeBtnInner: { paddingVertical: 16, alignItems: 'center' },
  completeBtnText: { color: '#fff', fontSize: FONT.base, fontWeight: '900', letterSpacing: 1.5 },
  graceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    backgroundColor: 'rgba(245,158,11,0.08)',
  },
  graceBtnText: { fontSize: FONT.sm, color: COLORS.warning, fontWeight: '600' },
});
