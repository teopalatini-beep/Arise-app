import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, TextInput, Modal,
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
    return (
      <LinearGradient colors={['#1A0505', '#2D0A0A', '#0D0000']} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <View style={styles.penaltyHeader}>
              <Ionicons name="warning" size={48} color={COLORS.danger} />
              <Text style={styles.penaltyTitle}>MISIÓN DE PENITENCIA</Text>
              <Text style={styles.penaltySubtitle}>
                Fallaste ayer. Esto es el precio.{'\n'}Completala o perdés tu progreso.
              </Text>
            </View>

            <View style={[styles.card, { borderColor: COLORS.danger + '40' }]}>
              <Text style={[styles.cardLabel, { color: COLORS.danger }]}>
                Completá las 3 tareas de penitencia
              </Text>
              <Text style={styles.penaltyTask}>💥 60 min entrenamiento intenso</Text>
              <Text style={styles.penaltyTask}>🧘 20 min meditación profunda</Text>
              <Text style={styles.penaltyTask}>✍️ Carta de compromiso (200 palabras)</Text>
            </View>

            <TouchableOpacity
              style={[styles.ctaButton, { backgroundColor: COLORS.danger }]}
              onPress={completePenalty}
            >
              <Text style={styles.ctaButtonText}>✅ Completé la penitencia</Text>
            </TouchableOpacity>

            {canUseGrace && (
              <TouchableOpacity style={styles.graceButton} onPress={handleGrace}>
                <Ionicons name="shield" size={16} color={COLORS.warning} />
                <Text style={styles.graceButtonText}>Usar día de gracia (1 disponible este mes)</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
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
