import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ImageSourcePropType,
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
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { COLORS, FONT, RADIUS, SPACING } from '@/theme';
import { CoachId, OnboardingData, OnboardingFocus, UserGoals } from '@/types';
import { useApp } from '@/context/AppContext';
import { deriveAdaptiveProfile } from '@/data/program';
import { trackOnboardingStepCompleted, trackOnboardingStepViewed } from '@/services/analytics';
import { useReducedMotionSetting } from '@/hooks/useReducedMotionSetting';

type CoachPreset = {
  id: CoachId;
  name: string;
  emoji: string;
  accent: string;
  quote: string;
  gameplay: string;
  image: ImageSourcePropType;
};

const COACHES: CoachPreset[] = [
  {
    id: 'goku',
    name: 'Goku',
    emoji: '🐉',
    accent: '#F59E0B',
    quote: 'No importa cuantas veces caigas. Siempre levantate con mas hambre.',
    gameplay: 'Hardcore energia',
    image: require('../assets/coaches/goku/home.png'),
  },
  {
    id: 'itachi',
    name: 'Itachi',
    emoji: '👁️',
    accent: '#EF4444',
    quote: 'Disciplina silenciosa. El control interno vence al caos externo.',
    gameplay: 'Disciplina estoica fria',
    image: require('../assets/coaches/itachi/home.png'),
  },
  {
    id: 'gojo',
    name: 'Gojo',
    emoji: '♾️',
    accent: '#38BDF8',
    quote: 'Tu foco define tu limite. Expandilo.',
    gameplay: 'Enfoque absoluto',
    image: require('../assets/coaches/gojo/home.png'),
  },
  {
    id: 'rengoku',
    name: 'Rengoku',
    emoji: '🔥',
    accent: '#F97316',
    quote: 'Prende fuego tu voluntad y empuja hasta el final.',
    gameplay: 'Intensidad constante',
    image: require('../assets/coaches/rengoku/home.png'),
  },
  {
    id: 'jiraiya',
    name: 'Jiraiya',
    emoji: '📜',
    accent: '#84CC16',
    quote: 'El progreso real viene de entrenar, observar y ajustar.',
    gameplay: 'Sabiduria tactica',
    image: require('../assets/coaches/jiraiya/home.png'),
  },
  {
    id: 'all_might',
    name: 'All Might',
    emoji: '💪',
    accent: '#3B82F6',
    quote: 'Cuando no puedas mas, da un paso extra. Plus Ultra.',
    gameplay: 'Voluntad heroica',
    image: require('../assets/coaches/all_might/home.png'),
  },
];

const FOCUS_OPTIONS: Array<{ id: OnboardingFocus; label: string; emoji: string }> = [
  { id: 'cuerpo', label: 'Cuerpo', emoji: '💪' },
  { id: 'mente', label: 'Mente', emoji: '🧠' },
  { id: 'productividad', label: 'Productividad', emoji: '⚡' },
  { id: 'espiritu', label: 'Espiritu', emoji: '🧘' },
];

const TOTAL_STEPS = 3;
const STEP_NAMES = ['pacto', 'objetivos', 'coach'] as const;

function parseNumber(input: string): number | undefined {
  if (!input.trim()) return undefined;
  const parsed = Number(input.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function inferGoal(focus: OnboardingFocus[]): OnboardingData['goal'] {
  const hasBody = focus.includes('cuerpo');
  const hasMind = focus.includes('mente');
  const hasProductivity = focus.includes('productividad');
  if (focus.length >= 3) return 'all';
  if (hasBody && !hasMind) return 'fitness';
  if (hasMind || hasProductivity) return 'mental';
  return 'discipline';
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { completeOnboarding } = useApp();
  const { reducedMotion } = useReducedMotionSetting();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [focusAreas, setFocusAreas] = useState<OnboardingFocus[]>(['cuerpo', 'mente']);
  const [readingPagesPerDay, setReadingPagesPerDay] = useState('12');
  const [meditationMinutesPerDay, setMeditationMinutesPerDay] = useState('10');
  const [waterLitersPerDay, setWaterLitersPerDay] = useState('2.5');
  const [targetWeight, setTargetWeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [selectedCoachId, setSelectedCoachId] = useState<CoachId>('goku');

  const transition = useRef(new Animated.Value(0)).current;

  const currentCoach = useMemo(
    () => COACHES.find((coach) => coach.id === selectedCoachId) ?? COACHES[0],
    [selectedCoachId],
  );
  const showBodyMetrics = focusAreas.includes('cuerpo');
  const showMindMetrics = focusAreas.includes('mente');
  const showSpiritMetrics = focusAreas.includes('espiritu');
  const showProductivityMetrics = focusAreas.includes('productividad');
  const shouldTrackReading = showMindMetrics || showProductivityMetrics;
  const shouldTrackMeditation = showMindMetrics || showSpiritMetrics;
  const shouldTrackWater = showBodyMetrics || showSpiritMetrics;
  const shouldTrackWeight = showBodyMetrics;

  function animateStep(nextStep: number) {
    if (reducedMotion) {
      setStep(nextStep);
      return;
    }
    Animated.sequence([
      Animated.timing(transition, {
        toValue: 1,
        duration: 170,
        useNativeDriver: true,
      }),
      Animated.timing(transition, {
        toValue: 0,
        duration: 170,
        useNativeDriver: true,
      }),
    ]).start();
    setStep(nextStep);
  }

  function goNext() {
    if (step === 0 && name.trim().length < 2) {
      Alert.alert('Nombre incompleto', 'Escribe al menos 2 caracteres para firmar el pacto.');
      return;
    }
    if (step === 1 && focusAreas.length === 0) {
      Alert.alert('Define tu enfoque', 'Selecciona al menos un foco principal de transformacion.');
      return;
    }
    void trackOnboardingStepCompleted(step + 1, STEP_NAMES[step]);
    animateStep(Math.min(step + 1, TOTAL_STEPS - 1));
  }

  function goBack() {
    animateStep(Math.max(step - 1, 0));
  }

  function toggleFocus(focus: OnboardingFocus) {
    setFocusAreas((prev) => (
      prev.includes(focus)
        ? prev.filter((item) => item !== focus)
        : [...prev, focus]
    ));
  }

  async function finishOnboarding() {
    if (submitting) return;
    setSubmitting(true);
    void trackOnboardingStepCompleted(step + 1, STEP_NAMES[step]);

    const goals: UserGoals = {
      targetWeight: shouldTrackWeight ? parseNumber(targetWeight) : undefined,
      targetReadingPagesPerDay: shouldTrackReading ? parseNumber(readingPagesPerDay) : undefined,
      targetMeditationMinutesPerDay: shouldTrackMeditation ? parseNumber(meditationMinutesPerDay) : undefined,
      targetWaterLitersPerDay: shouldTrackWater ? parseNumber(waterLitersPerDay) : undefined,
      targetReadingPages: (() => {
        if (!shouldTrackReading) return undefined;
        const perDay = parseNumber(readingPagesPerDay);
        return typeof perDay === 'number' ? Math.round(perDay * 90) : undefined;
      })(),
    };

    const onboardingData: OnboardingData = {
      completed: true,
      name: name.trim(),
      goal: inferGoal(focusAreas),
      fitnessLevel: 'intermediate',
      wakeUpHour: 7,
      focusAreas,
      initialWeight: parseNumber(currentWeight),
      goals,
      adaptiveProfile: deriveAdaptiveProfile({
        goal: inferGoal(focusAreas),
        currentWeight: parseNumber(currentWeight),
        targetWeight: parseNumber(targetWeight),
      }),
      preferredCoachId: selectedCoachId,
    };

    const result = await completeOnboarding(onboardingData);

    if (!result.synced && result.warning) {
      Alert.alert('Guardado local activo', result.warning);
    }

    setSubmitting(false);
    router.replace('/(tabs)');
  }

  const animatedStyle = {
    opacity: transition.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.35],
    }),
    transform: [
      {
        translateY: transition.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 14],
        }),
      },
    ],
  };

  useEffect(() => {
    void trackOnboardingStepViewed(step + 1, STEP_NAMES[step]);
  }, [step]);

  return (
    <LinearGradient colors={['#05050A', '#0A0A14', '#0F0F1E']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.progressDot,
                idx <= step && styles.progressDotActive,
                idx === step && { width: 26 },
              ]}
            />
          ))}
        </View>

        <Animated.View style={[styles.body, animatedStyle]}>
          {step === 0 && (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <Text style={styles.stepLabel}>PASO 1 · EL PACTO</Text>
                <Text style={styles.title}>Firma tu contrato de 90 dias</Text>
                <Text style={styles.subtitle}>
                  Ha llegado el momento de quemar las naves y no mirar atras. No es motivacion pasajera:
                  es identidad. Definis quien sos con lo que ejecutas cada dia.
                </Text>

                <View style={styles.inputCard}>
                  <Text style={styles.inputLabel}>Nombre del guerrero</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Ej: Teo"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="words"
                  />
                </View>

                <View style={[styles.pactCard, { borderColor: `${currentCoach.accent}88` }]}>
                  <Text style={styles.pactTitle}>Pacto Inmutable</Text>
                  <Text style={styles.pactBody}>
                    {name.trim() || 'Tu nombre'}, hoy quemas las naves: no hay retirada, solo avance.
                    {'\n'}
                    Cada dia que cumples fortalece tu identidad.
                  </Text>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          )}

          {step === 1 && (
            <ScrollView contentContainerStyle={styles.scroll}>
              <Text style={styles.stepLabel}>PASO 2 · OBJETIVOS</Text>
              <Text style={styles.title}>Define tu build inicial</Text>
              <Text style={styles.subtitle}>
                Elegi focos concretos y calibramos metas numericas para personalizar las misiones desde el dia 1.
              </Text>

              <View style={styles.focusWrap}>
                {FOCUS_OPTIONS.map((focus) => {
                  const active = focusAreas.includes(focus.id);
                  return (
                    <TouchableOpacity
                      key={focus.id}
                      activeOpacity={0.85}
                      onPress={() => toggleFocus(focus.id)}
                      style={[
                        styles.focusChip,
                        active && { borderColor: currentCoach.accent, backgroundColor: `${currentCoach.accent}22` },
                      ]}
                    >
                      <Text style={styles.focusEmoji}>{focus.emoji}</Text>
                      <Text style={[styles.focusText, active && { color: '#FFFFFF' }]}>{focus.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.metricsCard}>
                {shouldTrackReading && (
                  <MetricInput label="Paginas por dia" value={readingPagesPerDay} onChange={setReadingPagesPerDay} />
                )}
                {shouldTrackMeditation && (
                  <MetricInput label="Meditacion (min/dia)" value={meditationMinutesPerDay} onChange={setMeditationMinutesPerDay} />
                )}
                {shouldTrackWater && (
                  <MetricInput label="Agua (litros/dia)" value={waterLitersPerDay} onChange={setWaterLitersPerDay} />
                )}
                {shouldTrackWeight && (
                  <>
                    <MetricInput label="Peso actual (kg)" value={currentWeight} onChange={setCurrentWeight} />
                    <MetricInput label="Peso objetivo (kg)" value={targetWeight} onChange={setTargetWeight} />
                  </>
                )}
                {!shouldTrackReading && !shouldTrackMeditation && !shouldTrackWater && !shouldTrackWeight && (
                  <Text style={styles.metricHint}>
                    Selecciona al menos un foco para recomendarte metas personalizadas.
                  </Text>
                )}
              </View>
            </ScrollView>
          )}

          {step === 2 && (
            <ScrollView contentContainerStyle={styles.scroll}>
              <Text style={styles.stepLabel}>PASO 3 · ARQUETIPO</Text>
              <Text style={styles.title}>Selecciona tu mentor activo</Text>
              <Text style={styles.subtitle}>
                El coach define tono visual, energia y estilo de empuje durante todo el programa.
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselRow}>
                {COACHES.map((coach) => {
                  const active = selectedCoachId === coach.id;
                  return (
                    <CoachOptionCard
                      key={coach.id}
                      coach={coach}
                      active={active}
                      reducedMotion={reducedMotion}
                      onPress={() => setSelectedCoachId(coach.id)}
                    />
                  );
                })}
              </ScrollView>
              <Text style={styles.carouselHint}>Desliza para ver mas coaches</Text>

              <View style={[styles.selectionRecap, { borderColor: `${currentCoach.accent}55` }]}>
                <Text style={[styles.selectionTitle, { color: currentCoach.accent }]}>
                  Mentor seleccionado: {currentCoach.name}
                </Text>
                <Text style={styles.selectionText}>
                  Focos: {focusAreas.length > 0 ? focusAreas.join(' · ') : 'sin definir'}
                </Text>
                <Text style={styles.selectionText}>
                  Targets: {[
                    shouldTrackReading ? `${readingPagesPerDay} pags/dia` : null,
                    shouldTrackMeditation ? `${meditationMinutesPerDay} min/dia` : null,
                    shouldTrackWater ? `${waterLitersPerDay} L/dia` : null,
                    shouldTrackWeight && targetWeight.trim() ? `peso objetivo ${targetWeight} kg` : null,
                  ].filter(Boolean).join(' · ') || 'sin metas numericas por ahora'}
                </Text>
              </View>
            </ScrollView>
          )}
        </Animated.View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.secondaryBtn} disabled={step === 0 || submitting} onPress={goBack}>
            <Text style={[styles.secondaryText, (step === 0 || submitting) && { opacity: 0.35 }]}>Atras</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: currentCoach.accent }]}
            disabled={submitting}
            onPress={step === TOTAL_STEPS - 1 ? finishOnboarding : goNext}
          >
            <View style={styles.primaryContent}>
              {submitting && <ActivityIndicator size="small" color="#FFFFFF" />}
              <Text style={styles.primaryText}>
                {submitting ? 'Guardando...' : step === TOTAL_STEPS - 1 ? 'Activar ARISE' : 'Siguiente'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function MetricInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.metricRow}>
      <Text style={styles.metricLabel}>{label}</Text>
      <TextInput
        style={styles.metricInput}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={COLORS.textMuted}
      />
    </View>
  );
}

function CoachOptionCard({
  coach,
  active,
  reducedMotion = false,
  onPress,
}: {
  coach: CoachPreset;
  active: boolean;
  reducedMotion?: boolean;
  onPress: () => void;
}) {
  const aura = useRef(new Animated.Value(active ? 1 : 0)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reducedMotion) {
      aura.setValue(active ? 1 : 0);
      return;
    }
    Animated.timing(aura, {
      toValue: active ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [active, aura, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || !active) {
      lift.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(lift, { toValue: -4, duration: 900, useNativeDriver: true }),
        Animated.timing(lift, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, lift, reducedMotion]);

  function handlePressIn() {
    if (reducedMotion) return;
    Animated.timing(pressScale, {
      toValue: 0.975,
      duration: 110,
      useNativeDriver: true,
    }).start();
  }

  function handlePressOut() {
    if (reducedMotion) return;
    Animated.timing(pressScale, {
      toValue: 1,
      duration: 140,
      useNativeDriver: true,
    }).start();
  }

  const auraScale = aura.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.08],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`Seleccionar coach ${coach.name}`}
    >
      <Animated.View
        style={[
          styles.coachCard,
          active && { borderColor: coach.accent, shadowColor: coach.accent, shadowOpacity: 0.5 },
          { transform: [{ translateY: lift }, { scale: pressScale }] },
        ]}
      >
        <Animated.View
          style={[
            styles.coachActiveAura,
            {
              backgroundColor: `${coach.accent}26`,
              opacity: aura,
              transform: [{ scale: auraScale }],
            },
          ]}
        />
        <View style={[styles.coachGlow, { backgroundColor: `${coach.accent}22` }]} />
        <View style={[styles.coachPortraitFrame, { borderColor: `${coach.accent}88` }]}>
          <Image source={coach.image} style={styles.coachPortrait} resizeMode="cover" />
          <View style={styles.coachPortraitOverlay} />
          <Text style={styles.coachEmoji}>{coach.emoji}</Text>
        </View>
        <Text style={[styles.coachName, active && { color: coach.accent }]}>{coach.name}</Text>
        <Text style={styles.coachMode}>{coach.gameplay}</Text>
        <Text style={styles.coachQuote}>“{coach.quote}”</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: SPACING.md,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  progressDotActive: {
    backgroundColor: '#E8460A',
  },
  body: { flex: 1 },
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  stepLabel: {
    fontSize: FONT.xs,
    color: '#E8460A',
    letterSpacing: 2,
    fontWeight: '800',
  },
  title: {
    color: '#F5F0FF',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT.base,
    lineHeight: 23,
  },
  inputCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: FONT.base,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  pactCard: {
    borderWidth: 1,
    backgroundColor: 'rgba(232,70,10,0.09)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 10,
  },
  pactTitle: {
    color: '#E8460A',
    fontSize: FONT.sm,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  pactBody: {
    color: COLORS.textPrimary,
    fontSize: FONT.base,
    lineHeight: 24,
    fontWeight: '600',
  },
  focusWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  focusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  focusEmoji: { fontSize: 14 },
  focusText: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
    fontWeight: '700',
  },
  metricsCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  metricLabel: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    fontWeight: '600',
  },
  metricInput: {
    width: 98,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: 9,
    paddingHorizontal: 12,
    color: COLORS.textPrimary,
    textAlign: 'center',
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  metricHint: {
    color: COLORS.textMuted,
    fontSize: FONT.sm,
    lineHeight: 20,
  },
  carouselRow: {
    gap: SPACING.sm,
    paddingVertical: 4,
  },
  carouselHint: {
    color: COLORS.textMuted,
    fontSize: FONT.xs,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  coachCard: {
    width: 250,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: SPACING.md,
    gap: 8,
    overflow: 'hidden',
  },
  coachActiveAura: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADIUS.lg,
  },
  coachGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  coachPortraitFrame: {
    width: '100%',
    height: 120,
    borderRadius: RADIUS.md,
    borderWidth: 1.2,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  coachPortrait: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  coachPortraitOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,5,10,0.35)',
  },
  coachEmoji: {
    fontSize: 28,
    margin: SPACING.sm,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  coachName: {
    color: COLORS.textPrimary,
    fontSize: FONT.lg,
    fontWeight: '900',
  },
  coachMode: {
    color: COLORS.textMuted,
    fontSize: FONT.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  coachQuote: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    lineHeight: 20,
    fontWeight: '600',
  },
  selectionRecap: {
    marginTop: SPACING.md,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: SPACING.md,
    gap: 6,
  },
  selectionTitle: {
    fontSize: FONT.base,
    fontWeight: '900',
  },
  selectionText: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  secondaryText: {
    color: COLORS.textSecondary,
    fontSize: FONT.base,
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 1.8,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    shadowColor: '#E8460A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: FONT.base,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  primaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
