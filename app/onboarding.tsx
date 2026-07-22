import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  Animated, Dimensions, ScrollView, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONT, RADIUS, SPACING } from '../src/theme';
import { getCoachTheme } from '../src/theme/coachThemes';
import {
  OnboardingData, UserGoals, AdaptiveProfile, CoachId,
  Gender, FocusArea, NutritionProfile,
} from '../src/types';
import { scheduleAllNotifications, loadNotifSettings, saveNotifSettings } from '../src/lib/notifications';
import { deriveAdaptiveProfile } from '../src/data/program';
import { initProgram, useApp } from '../src/context/AppContext';
import { trackOnboardingStepViewed, trackOnboardingCompleted } from '../src/services/analytics';

const { width } = Dimensions.get('window');

// Fases del onboarding "Solo Leveling Core" (índice = step; 0 = intro).
const STEP_NAMES = [
  'intro',
  'character_stats',   // Fase 1
  'skill_tree',        // Fase 2
  'athlete_timeline',  // Fase 3
  'guild_master',      // Fase 4
] as const;
export const ONBOARDING_KEY = 'arise_onboarding_v1';

// ─── Data de fases ────────────────────────────────────────────────────────────
const GENDERS: { key: Gender; emoji: string; label: string }[] = [
  { key: 'male', emoji: '♂️', label: 'Masculino' },
  { key: 'female', emoji: '♀️', label: 'Femenino' },
  { key: 'other', emoji: '⚧', label: 'Otro' },
  { key: 'prefer_not', emoji: '🤐', label: 'Prefiero no decir' },
];

const FOCUS_OPTIONS: { key: FocusArea; emoji: string; label: string; desc: string }[] = [
  { key: 'gain_mass',    emoji: '💪', label: 'Ganar masa',     desc: 'Fuerza y volumen muscular' },
  { key: 'lose_weight',  emoji: '🔥', label: 'Perder peso',    desc: 'Déficit inteligente + actividad' },
  { key: 'discipline',   emoji: '⚔️', label: 'Disciplina',     desc: 'Hábitos irrompibles' },
  { key: 'mental_focus', emoji: '🧠', label: 'Enfoque mental', desc: 'Foco y claridad' },
  { key: 'motivation',   emoji: '⚡', label: 'Motivación',     desc: 'Encender el impulso diario' },
  { key: 'relaxation',   emoji: '🧘', label: 'Relajación',     desc: 'Calma y recuperación' },
];

const SENSEIS = [
  { id: 'goku' as CoachId,      emoji: '🐉', name: 'Goku',      ranks: 'Guerrero → Ultra Instinto',       desc: 'Superación sin límites' },
  { id: 'gojo' as CoachId,      emoji: '♾️', name: 'Gojo',      ranks: 'Grado 2 → El Más Fuerte',        desc: 'Infinito dominio' },
  { id: 'itachi' as CoachId,    emoji: '👁️', name: 'Itachi',    ranks: 'Genin → Mangekyo Sharingan',      desc: 'Poder en silencio' },
  { id: 'rengoku' as CoachId,   emoji: '🔥', name: 'Rengoku',   ranks: 'Aprendiz → Más Allá del Humano', desc: 'Corazón en llamas' },
  { id: 'jiraiya' as CoachId,   emoji: '📜', name: 'Jiraiya',   ranks: 'Aprendiz → Sannin Legendario',   desc: 'Sabiduría del camino' },
  { id: 'all_might' as CoachId, emoji: '💪', name: 'All Might', ranks: 'Estudiante → Símbolo de la Paz', desc: 'Plus Ultra siempre' },
];

// Deriva el objetivo clásico (para el motor adaptativo) desde el árbol de enfoque.
function deriveGoal(focus: FocusArea[]): OnboardingData['goal'] {
  const hasPhysical = focus.includes('gain_mass') || focus.includes('lose_weight');
  const hasMental = focus.includes('mental_focus') || focus.includes('relaxation') || focus.includes('motivation');
  const hasDiscipline = focus.includes('discipline');
  if (hasPhysical && (hasMental || hasDiscipline)) return 'all';
  if (hasPhysical) return 'fitness';
  if (hasDiscipline) return 'discipline';
  if (hasMental) return 'mental';
  return 'all';
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { applyOnboardingProfile } = useApp();
  const [step, setStep] = useState(0);

  // Fase 1 — Estadísticas del personaje
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | undefined>(undefined);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  // Fase 2 — Árbol de habilidades
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);

  // Fase 3 — Línea de tiempo
  const [milestone3, setMilestone3] = useState('');
  const [milestone6, setMilestone6] = useState('');
  const [milestone12, setMilestone12] = useState('');

  // Fase 4 — Guild Master
  const [selectedCoachId, setSelectedCoachId] = useState<CoachId>('goku');

  const slideAnim = useRef(new Animated.Value(0)).current;
  const totalSteps = STEP_NAMES.length; // intro + 4 fases

  useEffect(() => {
    trackOnboardingStepViewed({
      step_index: step,
      step_name: STEP_NAMES[step] ?? `step_${step}`,
      total_steps: totalSteps,
    });
  }, [step]);

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

  function toggleFocus(area: FocusArea) {
    setFocusAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  }

  const activeTheme = getCoachTheme(selectedCoachId);

  async function finish() {
    const parsedWeight = parseNumber(weight);
    const goal = deriveGoal(focusAreas);
    const adaptiveProfile: AdaptiveProfile = deriveAdaptiveProfile({
      goal,
      currentWeight: parsedWeight,
      targetWeight: undefined,
      challenges: [],
    });

    const goals: UserGoals = {
      milestone3Months: milestone3.trim() || undefined,
      milestone6Months: milestone6.trim() || undefined,
      milestone12Months: milestone12.trim() || undefined,
      focusAreas: focusAreas.length ? focusAreas : undefined,
    };
    const nutritionProfile: NutritionProfile = {
      dietStyle: 'balanced',
      mealsPerDay: 3,
      activityProfile: 'moderate',
    };

    const wakeUpHour = 7;
    const onboarding: OnboardingData = {
      completed: true,
      goal,
      fitnessLevel: 'intermediate',
      wakeUpHour,
      name: name.trim() || undefined,
      gender,
      age: age ? parseInt(age) : undefined,
      initialWeight: parsedWeight,
      height: height ? parseFloat(height) : undefined,
      trainingDaysPerWeek: 4,
      focusAreas: focusAreas.length ? focusAreas : undefined,
      goals,
      adaptiveProfile,
      nutritionProfile,
      preferredCoachId: selectedCoachId,
    };
    await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(onboarding));

    trackOnboardingCompleted({
      coach: selectedCoachId,
      goal,
      track: adaptiveProfile.track,
      training_days_per_week: 4,
    });

    applyOnboardingProfile(onboarding);
    await initProgram();

    const notifSettings = await loadNotifSettings();
    const morningHour = Math.min(wakeUpHour + 1, 10);
    const today = new Date().toISOString().slice(0, 10);
    await saveNotifSettings({ ...notifSettings, morningHour });
    await scheduleAllNotifications({ ...notifSettings, morningHour }, today);

    router.replace('/welcome');
  }

  const scrollProps = {
    contentContainerStyle: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: 120 },
    showsVerticalScrollIndicator: false,
    keyboardShouldPersistTaps: 'handled' as const,
  };

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

          {/* STEP 0 — Intro */}
          {step === 0 && (
            <ScrollView {...scrollProps}>
              <Text style={styles.bigEmoji}>炎</Text>
              <Text style={styles.stepTitle}>Creá tu{'\n'}personaje</Text>
              <Text style={styles.stepSubtitle}>
                90 días para subir de nivel en la vida real.{'\n\n'}
                Sos el héroe de esta historia. Vamos a definir tus estadísticas,
                tu enfoque, tu línea de tiempo y tu Guild Master.
              </Text>
              <View style={styles.featureList}>
                {[
                  { emoji: '📊', text: 'Fase 1 · Estadísticas del personaje' },
                  { emoji: '🌳', text: 'Fase 2 · Árbol de habilidades' },
                  { emoji: '🗺️', text: 'Fase 3 · Línea de tiempo del atleta' },
                  { emoji: '⚔️', text: 'Fase 4 · Elegí tu Guild Master' },
                ].map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Text style={styles.featureEmoji}>{f.emoji}</Text>
                    <Text style={styles.featureText}>{f.text}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          {/* STEP 1 — Fase 1: Estadísticas del personaje */}
          {step === 1 && (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <ScrollView {...scrollProps}>
                <Text style={styles.stepLabel}>FASE 1 DE 4</Text>
                <Text style={styles.stepTitle}>Estadísticas{'\n'}del personaje</Text>
                <Text style={styles.stepSubtitle}>Definí quién es tu avatar. Estos datos miden tu evolución real.</Text>

                <View style={styles.inputRow}>
                  <Text style={styles.inputLabel}>🪪 Nombre del héroe</Text>
                  <TextInput
                    style={styles.inputField}
                    value={name}
                    onChangeText={setName}
                    placeholder="ej: Teo"
                    placeholderTextColor={COLORS.textMuted}
                    returnKeyType="next"
                  />
                </View>

                <Text style={styles.inputLabel}>⚧ Sexo</Text>
                <View style={styles.chipGrid}>
                  {GENDERS.map(g => {
                    const active = gender === g.key;
                    return (
                      <TouchableOpacity
                        key={g.key}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setGender(g.key)}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.chipEmoji}>{g.emoji}</Text>
                        <Text style={[styles.chipText, active && { color: '#fff' }]}>{g.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

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
              </ScrollView>
            </KeyboardAvoidingView>
          )}

          {/* STEP 2 — Fase 2: Árbol de habilidades */}
          {step === 2 && (
            <ScrollView {...scrollProps}>
              <Text style={styles.stepLabel}>FASE 2 DE 4</Text>
              <Text style={styles.stepTitle}>Árbol de{'\n'}habilidades</Text>
              <Text style={styles.stepSubtitle}>
                Elegí en qué querés subir de nivel. Podés combinar varias — tu programa se adapta.
              </Text>
              <View style={styles.optionsGrid}>
                {FOCUS_OPTIONS.map(f => {
                  const active = focusAreas.includes(f.key);
                  return (
                    <TouchableOpacity
                      key={f.key}
                      style={[styles.optionCard, active && styles.optionCardActive]}
                      onPress={() => toggleFocus(f.key)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.optionHeaderRow}>
                        <Text style={styles.optionEmoji}>{f.emoji}</Text>
                        {active && <Text style={{ color: COLORS.accent, fontSize: 18 }}>✓</Text>}
                      </View>
                      <Text style={[styles.optionLabel, active && { color: COLORS.accent }]}>{f.label}</Text>
                      <Text style={styles.optionDesc}>{f.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* STEP 3 — Fase 3: Línea de tiempo del atleta */}
          {step === 3 && (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <ScrollView {...scrollProps}>
                <Text style={styles.stepLabel}>FASE 3 DE 4</Text>
                <Text style={styles.stepTitle}>Línea de tiempo{'\n'}del atleta</Text>
                <Text style={styles.stepSubtitle}>
                  ¿En quién te querés convertir? Escribí tu meta para cada horizonte. Podés saltear cualquiera.
                </Text>

                {[
                  { emoji: '🌱', label: 'En 3 meses', value: milestone3, setter: setMilestone3, ph: 'ej: entrenar 4x por semana sin fallar' },
                  { emoji: '⚡', label: 'En 6 meses', value: milestone6, setter: setMilestone6, ph: 'ej: -6 kg y correr 10 km' },
                  { emoji: '👑', label: 'En 12 meses', value: milestone12, setter: setMilestone12, ph: 'ej: la mejor versión de mí mismo' },
                ].map(m => (
                  <View key={m.label} style={styles.milestoneCard}>
                    <Text style={styles.milestoneLabel}>{m.emoji} {m.label}</Text>
                    <TextInput
                      style={styles.milestoneInput}
                      value={m.value}
                      onChangeText={m.setter}
                      placeholder={m.ph}
                      placeholderTextColor={COLORS.textMuted}
                      multiline
                      returnKeyType="done"
                    />
                  </View>
                ))}
              </ScrollView>
            </KeyboardAvoidingView>
          )}

          {/* STEP 4 — Fase 4: Guild Master */}
          {step === 4 && (
            <ScrollView {...scrollProps}>
              <Text style={styles.stepLabel}>FASE 4 DE 4</Text>
              <Text style={styles.stepTitle}>Elegí tu{'\n'}Guild Master</Text>
              <Text style={styles.stepSubtitle}>
                Tu sensei transforma los colores, los rangos y la voz de toda la app. Entrenás con él.
              </Text>

              {/* Panel de inmersión del coach activo */}
              <LinearGradient
                colors={[`${activeTheme.accentPrimary}22`, 'transparent']}
                style={[styles.immersionPanel, { borderColor: activeTheme.surfaceBorder }]}
              >
                <Text style={[styles.immersionAura, { textShadowColor: activeTheme.glow.color }]}>
                  {activeTheme.auraEmoji}
                </Text>
                <Text style={[styles.immersionTitle, { color: activeTheme.accentPrimary, letterSpacing: activeTheme.letterSpacing }]}>
                  {activeTheme.title.toUpperCase()}
                </Text>
                <Text style={styles.immersionMantra}>“{activeTheme.mantra}”</Text>
              </LinearGradient>

              <View style={styles.senseiGrid}>
                {SENSEIS.map((s) => {
                  const active = selectedCoachId === s.id;
                  const theme = getCoachTheme(s.id);
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[
                        styles.senseiCard,
                        { borderColor: active ? theme.accentPrimary : 'rgba(255,255,255,0.1)' },
                        active && { backgroundColor: `${theme.accentPrimary}18` },
                      ]}
                      onPress={() => setSelectedCoachId(s.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.senseiEmoji}>{s.emoji}</Text>
                      <Text style={[styles.senseiName, active && { color: theme.accentPrimary }]}>{s.name}</Text>
                      <Text style={styles.senseiRanks}>{s.ranks}</Text>
                      <Text style={styles.senseiDesc}>{s.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
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
                {step === 0 ? 'CREAR PERSONAJE ⚔️' : step < totalSteps - 1 ? 'SIGUIENTE →' : 'ARISE 🔥'}
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
  optionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  optionEmoji: { fontSize: 28, marginBottom: 4 },
  optionLabel: { fontSize: FONT.base, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2 },
  optionDesc: { fontSize: FONT.xs, color: COLORS.textMuted },

  inputGroup: { gap: SPACING.sm, marginTop: SPACING.sm },
  inputRow: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
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

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: SPACING.md, paddingVertical: 12,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  chipEmoji: { fontSize: 16 },
  chipText: { color: COLORS.textMuted, fontSize: FONT.sm, fontWeight: '700' },

  milestoneCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  milestoneLabel: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '800', marginBottom: 8 },
  milestoneInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: FONT.base,
    backgroundColor: 'rgba(0,0,0,0.2)',
    minHeight: 52,
    textAlignVertical: 'top',
  },

  immersionPanel: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: 4,
  },
  immersionAura: { fontSize: 40, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 24 },
  immersionTitle: { fontSize: FONT.sm, fontWeight: '900' },
  immersionMantra: { color: COLORS.textSecondary, fontSize: FONT.sm, fontStyle: 'italic', textAlign: 'center' },

  senseiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    justifyContent: 'space-between',
  },
  senseiCard: {
    width: '48%',
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: SPACING.md,
    alignItems: 'center',
    gap: 4,
  },
  senseiEmoji: { fontSize: 36, marginBottom: 4 },
  senseiName: { color: COLORS.textPrimary, fontSize: FONT.base, fontWeight: '900', textAlign: 'center' },
  senseiRanks: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700', textAlign: 'center' },
  senseiDesc: { color: COLORS.textSecondary, fontSize: FONT.xs, textAlign: 'center', lineHeight: 16 },

  footer: { padding: SPACING.lg },
  btn: { borderRadius: RADIUS.xl, paddingVertical: 16, alignItems: 'center',
    shadowColor: '#E8460A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  btnText: { color: '#fff', fontSize: FONT.base, fontWeight: '900', letterSpacing: 2 },
});
