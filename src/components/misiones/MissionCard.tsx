import React from 'react';
import * as Haptics from 'expo-haptics';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, SEMANTIC, SPACING, SURFACES, TOUCH } from '../../theme';
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
          <View style={[styles.iconOrb, { backgroundColor: `${activeAccent}18` }]}>
            <Ionicons
              name={(catInfo.icon as any) ?? 'flash-outline'}
              size={20}
              color={activeAccent}
              accessibilityElementsHidden
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, done && { color: activeAccent }]}>{mission.name}</Text>
            <Text style={styles.desc}>{mission.description}</Text>
          </View>
          <View style={[styles.ptsBadge, done && { backgroundColor: activeAccent + '22', borderColor: activeAccent + '66' }]}>
            <Text style={[styles.ptsText, { color: done ? activeAccent : SEMANTIC.onSurfaceMuted }]}>
              {pts}/{mission.maxPoints}pt
            </Text>
          </View>
        </View>

        {mission.type === 'binary' && (
          <Pressable
            style={({ pressed }) => [
              styles.binaryBtn,
              done && { backgroundColor: activeAccent, borderColor: activeAccent },
              pressed && { opacity: 0.88 },
            ]}
            onPress={handleBinary}
            hitSlop={TOUCH.hitSlop}
            accessibilityRole="button"
            accessibilityLabel={`${mission.name}. ${done ? 'Completada' : 'Pendiente'}`}
            accessibilityHint="Toca para marcar o desmarcar esta mision"
          >
            <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={done ? SEMANTIC.onPrimary : SEMANTIC.onSurfaceMuted} />
            <Text style={[styles.binaryText, done && { color: SEMANTIC.onPrimary }]}>
              {done ? '¡Completado!' : 'Marcar como hecho'}
            </Text>
          </Pressable>
        )}

        {mission.type === 'stepped' && mission.steps && (
          <View style={styles.stepsRow}>
            {mission.steps.map(step => {
              const active = currentUnits >= step.units;
              return (
                <Pressable
                  key={step.units}
                  style={({ pressed }) => [
                    styles.stepBtn,
                    active && { backgroundColor: activeAccent, borderColor: activeAccent },
                    pressed && { opacity: 0.88 },
                  ]}
                  onPress={() => handleStepped(step.units)}
                  hitSlop={TOUCH.hitSlop}
                  accessibilityRole="button"
                  accessibilityLabel={`${mission.name}. Nivel ${step.label}`}
                  accessibilityHint={`Asigna ${step.points} puntos a esta mision`}
                >
                  <Text style={[styles.stepText, active && { color: SEMANTIC.onPrimary }]}>{step.label}</Text>
                  <Text style={[styles.stepPts, active && { color: SEMANTIC.onPrimary }]}>+{step.points}pt</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {mission.type === 'proportional' && (
          <View style={styles.counterRow}>
            <Pressable
              style={({ pressed }) => [styles.counterBtn, pressed && { opacity: 0.8 }]}
              onPress={() => handleProportional(-1)}
              hitSlop={TOUCH.hitSlop}
              accessibilityRole="button"
              accessibilityLabel={`Restar ${mission.unit ?? 'unidad'} en ${mission.name}`}
            >
              <Text style={styles.counterBtnText}>−</Text>
            </Pressable>
            <View style={styles.counterDisplay}>
              <Text style={[styles.counterValue, { color: activeAccent }]}>{currentUnits}</Text>
              <Text style={styles.counterUnit}>{mission.unit}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.counterBtn, pressed && { opacity: 0.8 }]}
              onPress={() => handleProportional(1)}
              hitSlop={TOUCH.hitSlop}
              accessibilityRole="button"
              accessibilityLabel={`Sumar ${mission.unit ?? 'unidad'} en ${mission.name}`}
            >
              <Text style={styles.counterBtnText}>＋</Text>
            </Pressable>
          </View>
        )}

        {TIMER_MISSIONS.has(mission.id) && onOpenTimer && (
          <Pressable
            style={({ pressed }) => [
              styles.timerBtn,
              { borderColor: activeAccent + '66' },
              pressed && { opacity: 0.88 },
            ]}
            onPress={() => onOpenTimer(mission)}
            hitSlop={TOUCH.hitSlop}
            accessibilityRole="button"
            accessibilityLabel={`${currentUnits > 0 ? 'Continuar' : 'Iniciar'} temporizador para ${mission.name}`}
          >
            <Ionicons name="timer-outline" size={15} color={activeAccent} />
            <Text style={[styles.timerBtnText, { color: activeAccent }]}>
              {currentUnits > 0 ? 'Continuar timer' : 'Iniciar timer'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const MissionCard = React.memo(MissionCardImpl);
export default MissionCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xxl,
    backgroundColor: SURFACES.elevated,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACES.glassBorder,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  colorBar: { width: 3, position: 'absolute', top: 14, bottom: 14, left: 0, borderRadius: 2 },
  glowLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 0,
    height: StyleSheet.hairlineWidth,
  },
  body: { padding: SPACING.md, paddingLeft: SPACING.md + 6 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.sm },
  iconOrb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACES.glassBorder,
    marginTop: 1,
  },
  name: { fontSize: FONT.base, fontWeight: '800', color: SEMANTIC.onSurface, marginBottom: 2, letterSpacing: -0.2 },
  desc: { fontSize: FONT.xs, color: SEMANTIC.onSurfaceVariant, lineHeight: 18 },
  ptsBadge: {
    borderRadius: RADIUS.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SEMANTIC.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: SURFACES.glassHover,
  },
  ptsText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  binaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADIUS.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACES.glassHighlight,
    minHeight: TOUCH.minTarget,
    paddingVertical: 11,
    backgroundColor: SURFACES.glassHover,
  },
  binaryText: { fontSize: FONT.sm, color: SEMANTIC.onSurfaceVariant, fontWeight: '700' },
  stepsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: TOUCH.minGap },
  stepBtn: {
    borderRadius: RADIUS.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACES.glassHighlight,
    backgroundColor: SURFACES.glassHover,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 88,
    minHeight: TOUCH.minTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 11, color: SEMANTIC.onSurfaceVariant, fontWeight: '700' },
  stepPts: { fontSize: 10, color: SEMANTIC.onSurfaceMuted, marginTop: 2, fontWeight: '700' },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACES.glassHighlight,
    padding: 6,
    backgroundColor: SURFACES.glassHover,
  },
  counterBtn: {
    width: TOUCH.minTarget,
    height: TOUCH.minTarget,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SURFACES.glassHighlight,
  },
  counterBtnText: { color: SEMANTIC.onSurface, fontSize: 22, fontWeight: '700', lineHeight: 24 },
  counterDisplay: { alignItems: 'center' },
  counterValue: { fontSize: FONT.lg, fontWeight: '900' },
  counterUnit: { fontSize: 10, color: SEMANTIC.onSurfaceMuted, marginTop: 1 },
  timerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    minHeight: TOUCH.minTarget,
    paddingVertical: 9,
    backgroundColor: SURFACES.glassHover,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  timerBtnText: { fontSize: FONT.sm, fontWeight: '700' },
});
