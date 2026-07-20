import React from 'react';
import * as Haptics from 'expo-haptics';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SPACING } from '../../theme';
import { CATEGORY_INFO, MissionDef, TaskCategory } from '../../types';
import { calcPoints } from '../../data/missions';

const TIMER_MISSIONS = new Set(['deep_work', 'pomodoro']);

interface MissionCardProps {
  mission: MissionDef;
  currentUnits: number;
  onEarn: (missionId: string, units: number) => void;
  onOpenTimer?: (mission: MissionDef) => void;
  accentColor?: string;
}

function MissionCardImpl({
  mission,
  currentUnits,
  onEarn,
  onOpenTimer,
  accentColor,
}: MissionCardProps) {
  const catInfo = CATEGORY_INFO[mission.category as TaskCategory];
  const activeAccent = accentColor ?? catInfo.color;
  const pts = calcPoints(mission, currentUnits);
  const done = pts >= mission.maxPoints;

  function triggerHaptic(nextUnits: number) {
    const nextPts = calcPoints(mission, nextUnits);
    if (nextPts >= mission.maxPoints && pts < mission.maxPoints) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    if (nextPts > pts) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleBinary() {
    const next = currentUnits >= 1 ? 0 : 1;
    triggerHaptic(next);
    onEarn(mission.id, next);
  }

  function handleStepped(units: number) {
    const next = currentUnits === units ? 0 : units;
    triggerHaptic(next);
    onEarn(mission.id, next);
  }

  function handleProportional(delta: number) {
    const next = Math.max(0, currentUnits + delta);
    triggerHaptic(next);
    onEarn(mission.id, next);
  }

  return (
    <View style={[
      styles.card,
      {
        borderColor: done ? activeAccent + 'B3' : activeAccent + '4D',
        shadowColor: activeAccent,
      },
    ]}>
      <View style={[styles.colorBar, { backgroundColor: activeAccent }]} />
      <View style={[styles.glowLine, { backgroundColor: activeAccent + '33' }]} />

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.emoji}>{mission.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, done && { color: activeAccent }]}>{mission.name}</Text>
            <Text style={styles.desc}>{mission.description}</Text>
          </View>
          <View style={[styles.ptsBadge, done && { backgroundColor: activeAccent + '22', borderColor: activeAccent + '66' }]}>
            <Text style={[styles.ptsText, { color: done ? activeAccent : COLORS.textMuted }]}>
              {pts}/{mission.maxPoints}pt
            </Text>
          </View>
        </View>

        {mission.type === 'binary' && (
          <TouchableOpacity
            style={[styles.binaryBtn, done && { backgroundColor: activeAccent, borderColor: activeAccent }]}
            onPress={handleBinary}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`${mission.name}. ${done ? 'Completada' : 'Pendiente'}`}
            accessibilityHint="Toca para marcar o desmarcar esta mision"
          >
            <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={done ? '#fff' : COLORS.textMuted} />
            <Text style={[styles.binaryText, done && { color: '#fff' }]}>
              {done ? '¡Completado!' : 'Marcar como hecho'}
            </Text>
          </TouchableOpacity>
        )}

        {mission.type === 'stepped' && mission.steps && (
          <View style={styles.stepsRow}>
            {mission.steps.map(step => {
              const active = currentUnits >= step.units;
              return (
                <TouchableOpacity
                  key={step.units}
                  style={[styles.stepBtn, active && { backgroundColor: activeAccent, borderColor: activeAccent }]}
                  onPress={() => handleStepped(step.units)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`${mission.name}. Nivel ${step.label}`}
                  accessibilityHint={`Asigna ${step.points} puntos a esta mision`}
                >
                  <Text style={[styles.stepText, active && { color: '#fff' }]}>{step.label}</Text>
                  <Text style={[styles.stepPts, active && { color: '#fff' }]}>+{step.points}pt</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {mission.type === 'proportional' && (
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => handleProportional(-1)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={`Restar ${mission.unit ?? 'unidad'} en ${mission.name}`}
            >
              <Text style={styles.counterBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.counterDisplay}>
              <Text style={[styles.counterValue, { color: activeAccent }]}>{currentUnits}</Text>
              <Text style={styles.counterUnit}>{mission.unit}</Text>
            </View>
            <TouchableOpacity
              style={styles.counterBtn}
              onPress={() => handleProportional(1)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={`Sumar ${mission.unit ?? 'unidad'} en ${mission.name}`}
            >
              <Text style={styles.counterBtnText}>＋</Text>
            </TouchableOpacity>
          </View>
        )}

        {TIMER_MISSIONS.has(mission.id) && onOpenTimer && (
          <TouchableOpacity
            style={[styles.timerBtn, { borderColor: activeAccent + '66' }]}
            onPress={() => onOpenTimer(mission)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`${currentUnits > 0 ? 'Continuar' : 'Iniciar'} temporizador para ${mission.name}`}
          >
            <Ionicons name="timer-outline" size={15} color={activeAccent} />
            <Text style={[styles.timerBtnText, { color: activeAccent }]}>
              {currentUnits > 0 ? 'Continuar timer' : 'Iniciar timer'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const MissionCard = React.memo(MissionCardImpl);
export default MissionCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(6,10,22,0.92)',
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  colorBar: { width: 3, position: 'absolute', top: 0, bottom: 0, left: 0 },
  glowLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 0,
    height: 1,
  },
  body: { padding: SPACING.md, paddingLeft: SPACING.md + 4 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.sm },
  emoji: { fontSize: 20, marginTop: 1 },
  name: { fontSize: FONT.base, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 2 },
  desc: { fontSize: FONT.xs, color: COLORS.textSecondary, lineHeight: 18 },
  ptsBadge: {
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  ptsText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  binaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    minHeight: 44,
    paddingVertical: 11,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  binaryText: { fontSize: FONT.sm, color: COLORS.textSecondary, fontWeight: '700' },
  stepsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stepBtn: {
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 88,
    minHeight: 44,
  },
  stepText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '700' },
  stepPts: { fontSize: 10, color: COLORS.textMuted, marginTop: 2, fontWeight: '700' },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  counterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  counterBtnText: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '700', lineHeight: 24 },
  counterDisplay: { alignItems: 'center' },
  counterValue: { fontSize: FONT.lg, fontWeight: '900' },
  counterUnit: { fontSize: 10, color: COLORS.textMuted, marginTop: 1 },
  timerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    minHeight: 44,
    paddingVertical: 9,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  timerBtnText: { fontSize: FONT.sm, fontWeight: '700' },
});
