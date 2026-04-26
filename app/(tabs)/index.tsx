import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp, xpForLevel, levelFromXP } from '../../src/context/AppContext';
import { COLORS, GRADIENTS, FONT, RADIUS, SPACING, SHADOW } from '../../src/theme';
import { CATEGORY_INFO, TaskCategory } from '../../src/types';

export default function HoyScreen() {
  const {
    data, todayRecord, todayDefinition,
    completeTask, uncompleteTask, markDayComplete,
    hasPenalty, completePenalty, useGraceDay, canUseGrace,
  } = useApp();

  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  if (!data || !todayDefinition) {
    return (
      <LinearGradient colors={GRADIENTS.background} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <Text style={styles.loadingText}>Cargando…</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const { user } = data;
  const tasks = todayDefinition.tasks;
  const completedCount = todayRecord?.taskStates.filter(ts => ts.completed).length ?? 0;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;
  const allDone = progress === 1;

  const xpNeeded = xpForLevel(user.level + 1);
  const xpCurrent = xpForLevel(user.level);
  const xpProgress = (user.xp - xpCurrent) / (xpNeeded - xpCurrent);

  const isTaskDone = (taskId: string) =>
    todayRecord?.taskStates.find(ts => ts.taskId === taskId)?.completed ?? false;

  function handleTaskToggle(taskId: string) {
    if (isTaskDone(taskId)) {
      uncompleteTask(taskId);
    } else {
      completeTask(taskId);
    }
  }

  function handleGrace() {
    if (!canUseGrace) {
      Alert.alert('Sin día de gracia', 'Ya usaste tu día de gracia este mes.');
      return;
    }
    Alert.alert(
      '¿Usar día de gracia?',
      'Esto usará tu único día de gracia del mes. Tu racha se reseteará a 0 pero no perderás tu progreso.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Usar gracia', onPress: useGraceDay, style: 'destructive' },
      ]
    );
  }

  // ── Penalty screen ──────────────────────────────────────────────────────
  if (hasPenalty) {
    return <PenaltyScreen
      dayNumber={user.currentDay}
      onComplete={completePenalty}
      onGrace={canUseGrace ? handleGrace : undefined}
    />;
  }

  // ── Day complete screen ─────────────────────────────────────────────────
  if (allDone) {
    return (
      <LinearGradient colors={['#051A10', '#0A2D1A', '#0D1117']} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.completeHeader}>
              <Text style={styles.completeEmoji}>🏆</Text>
              <Text style={styles.completeTitle}>DÍA {user.currentDay - 1} COMPLETADO</Text>
              <Text style={styles.completeSubtitle}>"{todayDefinition.quote}"</Text>
            </View>

            <View style={[styles.card, { borderColor: COLORS.success + '40' }]}>
              <Text style={[styles.cardLabel, { color: COLORS.success }]}>RACHA ACTUAL</Text>
              <Text style={styles.bigNumber}>{user.streak} 🔥</Text>
            </View>

            <View style={styles.row}>
              <View style={[styles.card, styles.halfCard]}>
                <Text style={styles.cardLabel}>XP GANADO</Text>
                <Text style={[styles.bigNumber, { color: COLORS.accent }]}>
                  +{50 + Math.floor((user.currentDay - 1) / 10) * 10}
                </Text>
              </View>
              <View style={[styles.card, styles.halfCard]}>
                <Text style={styles.cardLabel}>NIVEL</Text>
                <Text style={[styles.bigNumber, { color: COLORS.purple }]}>
                  {user.level}
                </Text>
              </View>
            </View>

            <Text style={styles.nextDayText}>
              Mañana: Día {user.currentDay} de 90
            </Text>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ── Main daily screen ───────────────────────────────────────────────────
  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Arise, {user.name}.</Text>
              <Text style={styles.dayLabel}>DÍA {user.currentDay} DE 90</Text>
            </View>
            <View style={styles.streakBadge}>
              <Text style={styles.streakNumber}>{user.streak}</Text>
              <Text style={styles.streakFire}>🔥</Text>
            </View>
          </View>

          {/* Quote */}
          <View style={styles.quoteBox}>
            <Text style={styles.quoteText}>"{todayDefinition.quote}"</Text>
          </View>

          {/* Progress bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progreso del día</Text>
              <Text style={styles.progressCount}>{completedCount}/{totalCount}</Text>
            </View>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={GRADIENTS.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${progress * 100}%` as any }]}
              />
            </View>
          </View>

          {/* XP Bar */}
          <View style={styles.xpSection}>
            <Text style={styles.xpLabel}>Nivel {user.level} — {user.xp} XP</Text>
            <View style={styles.xpBarBg}>
              <View
                style={[styles.xpBarFill, { width: `${Math.min(xpProgress * 100, 100)}%` as any }]}
              />
            </View>
          </View>

          {/* Tasks */}
          <Text style={styles.sectionTitle}>TAREAS DE HOY</Text>
          {tasks.map(task => {
            const done = isTaskDone(task.id);
            const catInfo = CATEGORY_INFO[task.category as TaskCategory];
            const isExpanded = expandedTask === task.id;

            return (
              <TouchableOpacity
                key={task.id}
                onPress={() => setExpandedTask(isExpanded ? null : task.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.taskCard, done && styles.taskCardDone]}>
                  <View style={styles.taskRow}>
                    {/* Category color bar */}
                    <View style={[styles.taskColorBar, { backgroundColor: catInfo.color }]} />

                    {/* Task info */}
                    <View style={styles.taskInfo}>
                      <View style={styles.taskHeader}>
                        <Ionicons
                          name={catInfo.icon as any}
                          size={14}
                          color={catInfo.color}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.taskCategory, { color: catInfo.color }]}>
                          {catInfo.label.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.taskName, done && styles.taskNameDone]}>
                        {task.name}
                      </Text>
                      <Text style={styles.taskTarget}>
                        {task.target} {task.unit}
                      </Text>
                      {isExpanded && (
                        <Text style={styles.taskDescription}>{task.description}</Text>
                      )}
                    </View>

                    {/* Checkbox */}
                    <TouchableOpacity
                      onPress={() => handleTaskToggle(task.id)}
                      style={[styles.checkbox, done && styles.checkboxDone]}
                    >
                      {done && <Ionicons name="checkmark" size={18} color="#FFF" />}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* CTA button */}
          <TouchableOpacity
            style={[styles.ctaButton, completedCount < totalCount && styles.ctaButtonDisabled]}
            onPress={completedCount < totalCount ? undefined : markDayComplete}
            activeOpacity={completedCount < totalCount ? 1 : 0.8}
          >
            <LinearGradient
              colors={completedCount < totalCount ? ['#2a2a2a', '#1a1a1a'] : GRADIENTS.accent}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaButtonText}>
                {completedCount < totalCount
                  ? `${totalCount - completedCount} tareas restantes`
                  : '✅ Completar el día'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: SPACING.md },
  loadingText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 100 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  greeting: {
    fontSize: FONT.xxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  dayLabel: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
    letterSpacing: 2,
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251,146,60,0.15)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(251,146,60,0.3)',
  },
  streakNumber: {
    fontSize: FONT.lg,
    fontWeight: '800',
    color: COLORS.streak,
  },
  streakFire: { fontSize: FONT.lg, marginLeft: 2 },

  quoteBox: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  quoteText: {
    fontSize: FONT.base,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 22,
  },

  progressSection: { marginBottom: SPACING.md },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: FONT.sm, color: COLORS.textSecondary, fontWeight: '600' },
  progressCount: { fontSize: FONT.sm, color: COLORS.accent, fontWeight: '700' },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: RADIUS.full,
    minWidth: 6,
  },

  xpSection: { marginBottom: SPACING.lg },
  xpLabel: { fontSize: FONT.xs, color: COLORS.textMuted, marginBottom: 4, letterSpacing: 0.5 },
  xpBarBg: {
    height: 3,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: COLORS.purple,
    borderRadius: RADIUS.full,
    minWidth: 4,
  },

  sectionTitle: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: SPACING.sm,
  },

  taskCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  taskCardDone: {
    borderColor: COLORS.success + '30',
    backgroundColor: 'rgba(52,211,153,0.05)',
  },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start' },
  taskColorBar: { width: 4, alignSelf: 'stretch', borderRadius: 2, margin: 2 },
  taskInfo: { flex: 1, padding: SPACING.sm },
  taskHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  taskCategory: { fontSize: FONT.xs, fontWeight: '700', letterSpacing: 1 },
  taskName: { fontSize: FONT.base, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  taskNameDone: { color: COLORS.textMuted, textDecorationLine: 'line-through' },
  taskTarget: { fontSize: FONT.sm, color: COLORS.textSecondary },
  taskDescription: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    lineHeight: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },

  checkbox: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.border,
    margin: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },

  ctaButton: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginTop: SPACING.md,
    ...SHADOW.glow,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
  },
  ctaGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#FFF',
    fontSize: FONT.md,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  graceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    gap: 6,
  },
  graceButtonText: {
    color: COLORS.warning,
    fontSize: FONT.sm,
    fontWeight: '600',
  },

  // Penalty
  penaltyHeader: { alignItems: 'center', marginVertical: SPACING.xl },
  penaltyTitle: {
    fontSize: FONT.xl,
    fontWeight: '900',
    color: COLORS.danger,
    letterSpacing: 2,
    marginTop: SPACING.md,
  },
  penaltySubtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontSize: FONT.base,
    lineHeight: 24,
  },
  penaltyTask: {
    color: COLORS.textPrimary,
    fontSize: FONT.base,
    marginVertical: 4,
    fontWeight: '600',
  },

  // Complete
  completeHeader: { alignItems: 'center', marginVertical: SPACING.xl },
  completeEmoji: { fontSize: 64 },
  completeTitle: {
    fontSize: FONT.xl,
    fontWeight: '900',
    color: COLORS.success,
    letterSpacing: 2,
    marginTop: SPACING.md,
  },
  completeSubtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    fontSize: FONT.base,
    fontStyle: 'italic',
    paddingHorizontal: SPACING.lg,
  },
  nextDayText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: FONT.base,
    marginTop: SPACING.lg,
  },

  // Shared
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: { flexDirection: 'row', gap: SPACING.sm },
  halfCard: { flex: 1 },
  cardLabel: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: SPACING.xs,
  },
  bigNumber: {
    fontSize: FONT.xxxl,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
});

// ─── Penalty Screen ───────────────────────────────────────────────────────────
const PENALTY_TASKS = [
  { emoji: '💥', text: '100 sentadillas + 50 flexiones + 30 burpees (sin descanso)' },
  { emoji: '🧊', text: '5 minutos de ducha fría — sin negociar' },
  { emoji: '🏃', text: '30 minutos de cardio intenso (carrera, HIIT o saltar la soga)' },
  { emoji: '✍️', text: 'Carta de compromiso: escribí 200 palabras sobre por qué vas a terminar estos 90 días' },
];

function PenaltyScreen({
  dayNumber, onComplete, onGrace,
}: { dayNumber: number; onComplete: () => void; onGrace?: () => void }) {
  const [letter, setLetter] = useState('');
  const [checked, setChecked] = useState<boolean[]>([false, false, false, false]);
  const allChecked = checked.every(Boolean) && letter.trim().split(/\s+/).length >= 50;

  function toggleCheck(i: number) {
    setChecked(prev => prev.map((v, idx) => idx === i ? !v : v));
  }

  function handleComplete() {
    if (!allChecked) {
      Alert.alert(
        'Penitencia incompleta',
        'Completá todas las tareas y escribí al menos 50 palabras en la carta de compromiso.',
        [{ text: 'OK' }]
      );
      return;
    }
    Alert.alert(
      '¿Confirmás que completaste todo?',
      'Tu palabra es tu honor. Solo marcá como completo si realmente lo hiciste.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, lo hice', onPress: onComplete },
      ]
    );
  }

  const wordCount = letter.trim() === '' ? 0 : letter.trim().split(/\s+/).length;

  return (
    <LinearGradient colors={['#0A0005', '#1A0008', '#0D0000']} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            <View style={penaltyStyles.header}>
              <Text style={penaltyStyles.skull}>💀</Text>
              <Text style={penaltyStyles.title}>MISIÓN DE{'\n'}PENITENCIA</Text>
              <Text style={penaltyStyles.subtitle}>
                Día {dayNumber} — fallaste ayer. No se negocia, no se pospone.{'\n'}
                Completá todo antes de seguir.
              </Text>
            </View>

            <Text style={penaltyStyles.sectionLabel}>LAS 4 PRUEBAS</Text>
            {PENALTY_TASKS.map((task, i) => (
              <TouchableOpacity
                key={i}
                style={[penaltyStyles.taskCard, checked[i] && penaltyStyles.taskCardDone]}
                onPress={() => toggleCheck(i)}
                activeOpacity={0.8}
              >
                <View style={[penaltyStyles.checkbox, checked[i] && penaltyStyles.checkboxDone]}>
                  {checked[i] && <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>✓</Text>}
                </View>
                <Text style={penaltyStyles.taskEmoji}>{task.emoji}</Text>
                <Text style={[penaltyStyles.taskText, checked[i] && penaltyStyles.taskTextDone]}>
                  {task.text}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={[penaltyStyles.sectionLabel, { marginTop: SPACING.lg }]}>
              CARTA DE COMPROMISO
            </Text>
            <Text style={penaltyStyles.letterHint}>
              ¿Por qué empezaste esto? ¿Quién querés ser en 90 días? ¿Qué cambiaría si terminás?
            </Text>
            <TextInput
              style={penaltyStyles.letterInput}
              value={letter}
              onChangeText={setLetter}
              multiline
              placeholder="Escribí desde el corazón. Mínimo 50 palabras..."
              placeholderTextColor={COLORS.textMuted}
              textAlignVertical="top"
            />
            <Text style={[penaltyStyles.wordCount, wordCount >= 50 && { color: COLORS.success }]}>
              {wordCount} palabras {wordCount >= 50 ? '✓' : '(mínimo 50)'}
            </Text>

            <TouchableOpacity
              style={[penaltyStyles.completeBtn, !allChecked && { opacity: 0.5 }]}
              onPress={handleComplete}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={allChecked ? ['#EF4444', '#7C3AED'] : ['#333', '#222']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={penaltyStyles.completeBtnInner}
              >
                <Text style={penaltyStyles.completeBtnText}>
                  {allChecked ? '⚔️ COMPLETÉ LA PENITENCIA' : `Faltan ${checked.filter(Boolean).length}/4 tareas`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {onGrace && (
              <TouchableOpacity style={penaltyStyles.graceBtn} onPress={onGrace}>
                <Text style={{ fontSize: 16 }}>🛡️</Text>
                <Text style={penaltyStyles.graceBtnText}>Usar día de gracia (1 disponible este mes)</Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const penaltyStyles = StyleSheet.create({
  header: { alignItems: 'center', paddingVertical: SPACING.lg },
  skull: { fontSize: 56, marginBottom: SPACING.sm },
  title: { fontSize: 34, fontWeight: '900', color: '#F5F0FF', textAlign: 'center',
    lineHeight: 38, marginBottom: SPACING.sm,
    textShadowColor: '#EF4444', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12 },
  subtitle: { fontSize: FONT.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  sectionLabel: { fontSize: FONT.xs, color: '#EF4444', fontWeight: '800',
    letterSpacing: 2, marginBottom: SPACING.sm },
  taskCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm,
    backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' },
  taskCardDone: { backgroundColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.3)' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2,
    borderColor: '#EF4444', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  checkboxDone: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  taskEmoji: { fontSize: 20, flexShrink: 0 },
  taskText: { flex: 1, fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 20 },
  taskTextDone: { color: COLORS.textMuted, textDecorationLine: 'line-through' },
  letterHint: { fontSize: FONT.xs, color: COLORS.textMuted, marginBottom: SPACING.sm, lineHeight: 18 },
  letterInput: { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    color: COLORS.textPrimary, fontSize: FONT.base, padding: SPACING.md,
    minHeight: 160, lineHeight: 24 },
  wordCount: { fontSize: FONT.xs, color: COLORS.textMuted, textAlign: 'right',
    marginTop: 4, marginBottom: SPACING.lg },
  completeBtn: { borderRadius: RADIUS.xl, overflow: 'hidden', marginBottom: SPACING.md },
  completeBtnInner: { paddingVertical: 16, alignItems: 'center' },
  completeBtnText: { color: '#fff', fontSize: FONT.base, fontWeight: '900', letterSpacing: 1.5 },
  graceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SPACING.sm, padding: SPACING.md,
    borderRadius: RADIUS.lg, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
    backgroundColor: 'rgba(245,158,11,0.08)' },
  graceBtnText: { fontSize: FONT.sm, color: COLORS.warning, fontWeight: '600' },
});
