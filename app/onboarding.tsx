import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  Animated, Dimensions, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONT, RADIUS, SPACING } from '../src/theme';
import { OnboardingData } from '../src/types';
import { scheduleAllNotifications, loadNotifSettings, saveNotifSettings } from '../src/lib/notifications';

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

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<OnboardingData['goal']>('all');
  const [fitnessLevel, setFitnessLevel] = useState<OnboardingData['fitnessLevel']>('beginner');
  const [wakeUpHour, setWakeUpHour] = useState(7);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const totalSteps = 4;

  function nextStep() {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -width, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setStep(s => s + 1);
      slideAnim.setValue(width);
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }).start();
    });
  }

  async function finish() {
    const onboarding: OnboardingData = { completed: true, goal, fitnessLevel, wakeUpHour };
    await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(onboarding));

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

          {/* STEP 3 — Hora de despertar */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepLabel}>PASO 3 DE 3</Text>
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

  footer: { padding: SPACING.lg },
  btn: { borderRadius: RADIUS.xl, paddingVertical: 16, alignItems: 'center',
    shadowColor: '#E8460A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10 },
  btnText: { color: '#fff', fontSize: FONT.base, fontWeight: '900', letterSpacing: 2 },
});
