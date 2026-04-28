import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  Animated, Dimensions, ScrollView, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONT, RADIUS, SPACING } from '../src/theme';
import { OnboardingData, UserGoals, AdaptiveChallenge, AdaptiveTrack } from '../src/types';
import { scheduleAllNotifications, loadNotifSettings, saveNotifSettings } from '../src/lib/notifications';
import { deriveAdaptiveProfile } from '../src/data/program';
import { initProgram } from '../src/context/AppContext';

const { width } = Dimensions.get('window');
export const ONBOARDING_KEY = 'arise_onboarding_v1';

// ─── Step data ────────────────────────────────────────────────────────────────
const GOALS = [
  { key: 'fitness',    emoji: '💪', label: 'Transformación física',  desc: 'Músculo, resistencia y energía' },
  { key: 'mental',     emoji: '🧠', label: 'Claridad mental',        desc: 'Foco, disciplina y paz interior' },
  { key: 'discipline', emoji: '⚔️', label: 'Disciplina de élite',    desc: 'Construir hábitos irrompibles' },
  { key: 'all',        emoji: '🔥', label: 'Todo a la vez',           desc: 'Cuerpo, mente y espíritu' },
] as const;

const FITNESS_LEVELS = [
  { key: 'beginner',     emoji: '🌱', label: 'Principiante',   desc: 'Poco o nada de ejercicio regular' },
  { key: 'intermediate', emoji: '⚡', label: 'Intermedio',     desc: 'Entreno 2-3 veces por semana' },
  { key: 'advanced',     emoji: '🐉', label: 'Avanzado',       desc: 'Entreno 4+ veces por semana' },
] as const;

const WAKE_HOURS = [5, 6, 7, 8, 9, 10];

const CHALLENGE_OPTIONS: { key: AdaptiveChallenge; emoji: string; label: string }[] = [
  { key: 'consistency', emoji: '📅', label: 'Constancia' },
  { key: 'nutrition', emoji: '🥗', label: 'Nutrición' },
  { key: 'time', emoji: '⏳', label: 'Falta de tiempo' },
  { key: 'stress', emoji: '🧘', label: 'Estrés' },
  { key: 'sleep', emoji: '😴', label: 'Sueño' },
];

const TRACK_COPY: Record<AdaptiveTrack, { title: string; desc: string; emoji: string }> = {
  fat_loss: {
    title: 'Pérdida de grasa',
    desc: 'Enfoque en déficit inteligente + actividad sostenida.',
    emoji: '🔥',
  },
  muscle_gain: {
    title: 'Ganancia muscular',
    desc: 'Prioridad en fuerza progresiva + recuperación.',
    emoji: '💪',
  },
  recomposition: {
    title: 'Recomposición corporal',
    desc: 'Bajar grasa y subir músculo de forma equilibrada.',
    emoji: '⚔️',
  },
  maintenance: {
    title: 'Mantenimiento',
    desc: 'Sostener resultados y energía sin rebotes.',
    emoji: '🛡️',
  },
};

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<OnboardingData['goal']>('all');
  const [fitnessLevel, setFitnessLevel] = useState<OnboardingData['fitnessLevel']>('beginner');
  const [wakeUpHour, setWakeUpHour] = useState(7);
  // Step 4 — datos físicos
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [trainingDays, setTrainingDays] = useState(3);
  // Step 5 — objetivos
  const [targetWeight, setTargetWeight] = useState('');
  const [targetPages, setTargetPages] = useState('');
  const [targetStreak, setTargetStreak] = useState('');
  const [challenges, setChallenges] = useState<AdaptiveChallenge[]>([]);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const totalSteps = 6;

  function nextStep() {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -width, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setStep(s => s + 1);
      slideAnim.setValue(width);
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }).start();
    });
  }

  function parseNumber(value: string): number | undefined {
    if (!value.trim()) return undefined;
    const parsed = parseFloat(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  function toggleChallenge(challenge: AdaptiveChallenge) {
    setChallenges(prev =>
      prev.includes(challenge)
        ? prev.filter(item => item !== challenge)
        : [...prev, challenge]
    );
  }

  const adaptivePreview = deriveAdaptiveProfile({
    goal,
    currentWeight: parseNumber(weight),
    targetWeight: parseNumber(targetWeight),
    challenges,
  });

  async function finish() {
    const parsedWeight = parseNumber(weight);
    const parsedTargetWeight = parseNumber(targetWeight);
    const adaptiveProfile = deriveAdaptiveProfile({
      goal,
      currentWeight: parsedWeight,
      targetWeight: parsedTargetWeight,
      challenges,
    });

    const goals: UserGoals = {
      targetWeight: parsedTargetWeight,
      targetReadingPages: targetPages ? parseInt(targetPages) : undefined,
      targetStreak: targetStreak ? parseInt(targetStreak) : undefined,
    };
    const onboarding: OnboardingData = {
      completed: true, goal, fitnessLevel, wakeUpHour,
      age: age ? parseInt(age) : undefined,
      initialWeight: parsedWeight,
      height: height ? parseFloat(height) : undefined,
      trainingDaysPerWeek: trainingDays,
      goals,
      adaptiveProfile,
    };
    await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(onboarding));
    await initProgram();

    // Ajustar hora de notificación mañanera al horario de despertar + 30 min
    const notifSettings = await loadNotifSettings();
    const morningHour = Math.min(wakeUpHour + 1, 10);
    await saveNotifSettings({ ...notifSettings, morningHour });
    await scheduleAllNotifications({ ...notifSettings, morningHour });

    router.replace('/welcome');
  }

  return (
    <LinearGradient colors={['#05050A', '#0A0A14', '#0F0F1E']} style={styles.container}>
      <SafeAreaView style={styles.safe}>

        {/* Progress dots */}
        <View style={styles.dotsRow}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View key={i} style={[styles.dot, i <= step && styles.dotActive, i === step && styles.dotCurrent]} />
          ))}
        </View>

        <Animated.View style={[styles.content, { transform: [{ translateX: slideAnim }] }]}>

          {/* STEP 0 — Bienvenida */}
          {step === 0 && (
            <View style={styles.stepContainer}>
              <Text style={styles.bigEmoji}>炎</Text>
              <Text style={styles.stepTitle}>Bienvenido a{'\n'}ARISE</Text>
              <Text style={styles.stepSubtitle}>
                90 días para convertirte en la mejor versión de vos mismo.{'\n\n'}
                Sin excusas. Sin negociaciones.{'\n'}
                Solo vos contra quien solías ser.
              </Text>
              <View style={styles.featureList}>
                {[
                  { emoji: '🔥', text: 'Tareas diarias progresivas' },
                  { emoji: '⚡', text: 'Sistema de XP y niveles' },
                  { emoji: '📜', text: 'Diario de transformación' },
                  { emoji: '🎯', text: 'Contenido desbloqueado por fase' },
                ].map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Text style={styles.featureEmoji}>{f.emoji}</Text>
                    <Text style={styles.featureText}>{f.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* STEP 1 — Objetivo */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>PASO 1 DE 3</Text>
              <Text style={styles.stepTitle}>¿Cuál es tu{'\n'}objetivo principal?</Text>
              <Text style={styles.stepSubtitle}>Esto personaliza el enfoque de tu programa.</Text>
              <View style={styles.optionsGrid}>
                {GOALS.map(g => (
                  <TouchableOpacity
                    key={g.key}
                    style={[styles.optionCard, goal === g.key && styles.optionCardActive]}
                    onPress={() => setGoal(g.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.optionEmoji}>{g.emoji}</Text>
                    <Text style={[styles.optionLabel, goal === g.key && { color: COLORS.accent }]}>{g.label}</Text>
                    <Text style={styles.optionDesc}>{g.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* STEP 2 — Nivel fitness */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>PASO 2 DE 3</Text>
              <Text style={styles.stepTitle}>¿Cuál es tu nivel{'\n'}de fitness actual?</Text>
              <Text style={styles.stepSubtitle}>Sé honesto — el programa se adapta a vos.</Text>
              <View style={styles.optionsList}>
                {FITNESS_LEVELS.map(f => (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.listOption, fitnessLevel === f.key && styles.listOptionActive]}
                    onPress={() => setFitnessLevel(f.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.listEmoji}>{f.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.listLabel, fitnessLevel === f.key && { color: COLORS.accent }]}>{f.label}</Text>
                      <Text style={styles.listDesc}>{f.desc}</Text>
                    </View>
                    {fitnessLevel === f.key && (
                      <Text style={{ color: COLORS.accent, fontSize: 18 }}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* STEP 3 — Datos físicos */}
          {step === 3 && (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={styles.stepContainer} showsVerticalScrollIndicator={false}>
                <Text style={styles.stepLabel}>PASO 3 DE 5</Text>
                <Text style={styles.stepTitle}>Tu punto{'\n'}de partida</Text>
                <Text style={styles.stepSubtitle}>Datos opcionales para medir tu evolución real a lo largo de 90 días.</Text>

                <View style={styles.inputGroup}>
                  {[
                    { label: '🎂 Edad', value: age, setter: setAge, placeholder: 'ej: 25', keyboard: 'numeric' as const },
                    { label: '⚖️ Peso actual (kg)', value: weight, setter: setWeight, placeholder: 'ej: 78.5', keyboard: 'decimal-pad' as const },
                    { label: '📏 Altura (cm)', value: height, setter: setHeight, placeholder: 'ej: 178', keyboard: 'numeric' as const },
                  ].map(f => (
                    <View key={f.label} style={styles.inputRow}>
                      <Text style={styles.inputLabel}>{f.label}</Text>
                      <TextInput
                        style={styles.inputField}
                        value={f.value}
                        onChangeText={f.setter}
                        placeholder={f.placeholder}
                        placeholderTextColor={COLORS.textMuted}
                        keyboardType={f.keyboard}
                        returnKeyType="next"
                      />
                    </View>
                  ))}
                </View>

                <Text style={styles.inputLabel}>🏋️ Días de entrenamiento por semana</Text>
                <View style={styles.hoursGrid}>
                  {[2, 3, 4, 5, 6, 7].map(n => (
                    <TouchableOpacity
                      key={n}
                      style={[styles.hourChip, trainingDays === n && styles.hourChipActive]}
                      onPress={() => setTrainingDays(n)}
                    >
                      <Text style={[styles.hourText, trainingDays === n && { color: '#fff' }]}>{n}d</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          )}

          {/* STEP 4 — Objetivos medibles */}
          {step === 4 && (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={styles.stepContainer} showsVerticalScrollIndicator={false}>
                <Text style={styles.stepLabel}>PASO 4 DE 5</Text>
                <Text style={styles.stepTitle}>Tus objetivos{'\n'}en 90 días</Text>
                <Text style={styles.stepSubtitle}>La app va a trackear tu progreso hacia estas metas. Podés saltear cualquiera.</Text>

                <View style={styles.inputGroup}>
                  <View style={styles.goalCard}>
                    <Text style={styles.goalEmoji}>⚖️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.goalLabel}>Peso objetivo (kg)</Text>
                      <Text style={styles.goalHint}>¿Cuánto querés pesar al final?</Text>
                    </View>
                    <TextInput
                      style={styles.goalInput}
                      value={targetWeight}
                      onChangeText={setTargetWeight}
                      placeholder={weight || '70'}
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="decimal-pad"
                    />
                  </View>

                  <View style={styles.goalCard}>
                    <Text style={styles.goalEmoji}>📚</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.goalLabel}>Páginas a leer en total</Text>
                      <Text style={styles.goalHint}>En 90 días, ¿cuántas páginas?</Text>
                    </View>
                    <TextInput
                      style={styles.goalInput}
                      value={targetPages}
                      onChangeText={setTargetPages}
                      placeholder="1800"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.goalCard}>
                    <Text style={styles.goalEmoji}>🔥</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.goalLabel}>Racha máxima objetivo</Text>
                      <Text style={styles.goalHint}>Días consecutivos sin fallar</Text>
                    </View>
                    <TextInput
                      style={styles.goalInput}
                      value={targetStreak}
                      onChangeText={setTargetStreak}
                      placeholder="90"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.adaptiveCard}>
                  <Text style={styles.adaptiveTitle}>
                    {TRACK_COPY[adaptivePreview.track].emoji} Ruta sugerida: {TRACK_COPY[adaptivePreview.track].title}
                  </Text>
                  <Text style={styles.adaptiveDesc}>{TRACK_COPY[adaptivePreview.track].desc}</Text>
                  {typeof adaptivePreview.weightDelta === 'number' && (
                    <Text style={styles.adaptiveMeta}>
                      Cambio objetivo: {adaptivePreview.weightDelta > 0 ? '+' : ''}{adaptivePreview.weightDelta} kg
                      · ritmo recomendado {adaptivePreview.weeklyTargetKg} kg/semana
                    </Text>
                  )}
                </View>

                <Text style={styles.inputLabel}>🧩 ¿Qué te cuesta más hoy?</Text>
                <Text style={styles.stepSubtitle}>
                  Elegí tus principales bloqueos y te vamos a priorizar actividades concretas.
                </Text>
                <View style={styles.challengeGrid}>
                  {CHALLENGE_OPTIONS.map((item) => {
                    const active = challenges.includes(item.key);
                    return (
                      <TouchableOpacity
                        key={item.key}
                        style={[styles.challengeChip, active && styles.challengeChipActive]}
                        onPress={() => toggleChallenge(item.key)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.challengeEmoji}>{item.emoji}</Text>
                        <Text style={[styles.challengeText, active && { color: '#fff' }]}>{item.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.inputLabel}>✅ Actividades recomendadas para empezar</Text>
                <View style={styles.recommendationsBox}>
                  {adaptivePreview.recommendations.map((rec) => (
                    <View key={rec} style={styles.recommendationRow}>
                      <Text style={styles.recommendationBullet}>•</Text>
                      <Text style={styles.recommendationText}>{rec}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          )}

          {/* STEP 5 — Hora de despertar */}
          {step === 5 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>PASO 5 DE 5</Text>
              <Text style={styles.stepTitle}>¿A qué hora{'\n'}te despertás?</Text>
              <Text style={styles.stepSubtitle}>
                Ajustamos tu notificación de mañana para que llegue justo cuando estás listo para arrancar.
              </Text>
              <View style={styles.hoursGrid}>
                {WAKE_HOURS.map(h => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.hourChip, wakeUpHour === h && styles.hourChipActive]}
                    onPress={() => setWakeUpHour(h)}
                  >
                    <Text style={[styles.hourText, wakeUpHour === h && { color: '#fff' }]}>{h}:00 hs</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Tu programa personalizado:</Text>
                <Text style={styles.summaryItem}>🎯 Objetivo: {GOALS.find(g => g.key === goal)?.label}</Text>
                <Text style={styles.summaryItem}>💪 Nivel: {FITNESS_LEVELS.find(f => f.key === fitnessLevel)?.label}</Text>
                <Text style={styles.summaryItem}>⏰ Notificación mañana: {Math.min(wakeUpHour + 1, 10)}:00 hs</Text>
              </View>
            </View>
          )}

        </Animated.View>

        {/* CTA Button */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={step < totalSteps - 1 ? nextStep : finish} activeOpacity={0.85}>
            <LinearGradient
              colors={['#E8460A', '#7C3AED']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>
                {step === 0 ? 'COMENZAR ⚔️' : step < totalSteps - 1 ? 'SIGUIENTE →' : 'ARISE 🔥'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: SPACING.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.15)' },
  dotActive: { backgroundColor: 'rgba(232,70,10,0.5)' },
  dotCurrent: { width: 24, backgroundColor: '#E8460A' },

  content: { flex: 1 },
  stepContainer: { flex: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },

  bigEmoji: { fontSize: 64, color: '#E8460A', textAlign: 'center', marginBottom: SPACING.md,
    textShadowColor: '#E8460A', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },
  stepLabel: { fontSize: FONT.xs, color: '#E8460A', fontWeight: '800', letterSpacing: 2, marginBottom: SPACING.sm },
  stepTitle: { fontSize: 34, fontWeight: '900', color: '#F5F0FF', lineHeight: 40, marginBottom: SPACING.sm },
  stepSubtitle: { fontSize: FONT.base, color: COLORS.textSecondary, lineHeight: 24, marginBottom: SPACING.lg },

  featureList: { gap: SPACING.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.md, padding: SPACING.md },
  featureEmoji: { fontSize: 22 },
  featureText: { fontSize: FONT.base, color: COLORS.textPrimary, fontWeight: '600' },

  optionsGrid: { gap: SPACING.sm },
  optionCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  optionCardActive: { borderColor: '#E8460A', backgroundColor: 'rgba(232,70,10,0.1)' },
  optionEmoji: { fontSize: 28, marginBottom: 4 },
  optionLabel: { fontSize: FONT.base, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2 },
  optionDesc: { fontSize: FONT.xs, color: COLORS.textMuted },

  optionsList: { gap: SPACING.sm },
  listOption: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  listOptionActive: { borderColor: '#E8460A', backgroundColor: 'rgba(232,70,10,0.1)' },
  listEmoji: { fontSize: 28 },
  listLabel: { fontSize: FONT.base, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2 },
  listDesc: { fontSize: FONT.xs, color: COLORS.textMuted },

  inputGroup: { gap: SPACING.sm, marginBottom: SPACING.md },
  inputRow: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputLabel: { fontSize: FONT.sm, color: COLORS.textSecondary, fontWeight: '700', marginBottom: 6 },
  inputField: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: FONT.base,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },

  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.sm,
  },
  goalEmoji: { fontSize: 22 },
  goalLabel: { color: COLORS.textPrimary, fontSize: FONT.sm, fontWeight: '800' },
  goalHint: { color: COLORS.textMuted, fontSize: FONT.xs, marginTop: 2 },
  goalInput: {
    minWidth: 72,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    color: COLORS.textPrimary,
    textAlign: 'center',
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },

  hoursGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  hourChip: { paddingHorizontal: SPACING.md, paddingVertical: 10,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: 'rgba(255,255,255,0.05)' },
  hourChipActive: { backgroundColor: '#E8460A', borderColor: '#E8460A' },
  hourText: { fontSize: FONT.sm, color: COLORS.textMuted, fontWeight: '700' },

  summaryBox: { backgroundColor: 'rgba(232,70,10,0.08)', borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(232,70,10,0.25)', gap: 8 },
  summaryTitle: { fontSize: FONT.sm, color: '#E8460A', fontWeight: '800', marginBottom: 4 },
  summaryItem: { fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 22 },

  adaptiveCard: {
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.35)',
    padding: SPACING.md,
    marginBottom: SPACING.md,
    gap: 6,
  },
  adaptiveTitle: { color: '#D8B4FE', fontSize: FONT.base, fontWeight: '800' },
  adaptiveDesc: { color: COLORS.textSecondary, fontSize: FONT.sm, lineHeight: 20 },
  adaptiveMeta: { color: COLORS.textMuted, fontSize: FONT.xs, fontWeight: '700' },

  challengeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  challengeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  challengeChipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  challengeEmoji: { fontSize: 14 },
  challengeText: { color: COLORS.textMuted, fontSize: FONT.xs, fontWeight: '700' },

  recommendationsBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: 8,
    marginBottom: SPACING.md,
  },
  recommendationRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  recommendationBullet: { color: '#E8460A', fontWeight: '900', marginTop: -1 },
  recommendationText: { flex: 1, color: COLORS.textSecondary, fontSize: FONT.sm, lineHeight: 20 },

  footer: { padding: SPACING.lg },
  btn: { borderRadius: RADIUS.xl, paddingVertical: 16, alignItems: 'center',
    shadowColor: '#E8460A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  btnText: { color: '#fff', fontSize: FONT.base, fontWeight: '900', letterSpacing: 2 },
});
