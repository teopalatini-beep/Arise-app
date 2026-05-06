import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  AppState, AppStateStatus, Vibration,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT, RADIUS, SPACING } from '../theme';
import { MissionDef } from '../types';

// ── Constants ─────────────────────────────────────────────────────────────────
const WORK_SECS  = 25 * 60;
const BREAK_SECS = 5 * 60;
const RING_R     = 90;
const RING_STROKE = 8;
const CIRCUMFERENCE = 2 * Math.PI * RING_R;

type Phase = 'idle' | 'work' | 'break';

interface Props {
  visible: boolean;
  mission: MissionDef;        // 'deep_work' or 'pomodoro'
  currentUnits: number;       // already-logged units from today
  onEarn: (missionId: string, units: number) => void;
  onClose: () => void;
}

// ── Ring progress ─────────────────────────────────────────────────────────────
function RingTimer({
  secondsLeft,
  totalSeconds,
  phase,
  color,
}: {
  secondsLeft: number;
  totalSeconds: number;
  phase: Phase;
  color: string;
}) {
  const progress = secondsLeft / totalSeconds;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);
  const size = (RING_R + RING_STROKE) * 2 + 4;
  const cx = size / 2;

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <View style={timerStyles.ringContainer}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={cx} cy={cx}
          r={RING_R}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={RING_STROKE}
          fill="none"
        />
        {/* Progress */}
        <Circle
          cx={cx} cy={cx}
          r={RING_R}
          stroke={color}
          strokeWidth={RING_STROKE}
          fill="none"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${cx}, ${cx}`}
        />
      </Svg>
      {/* Time overlay */}
      <View style={timerStyles.ringOverlay}>
        <Text style={[timerStyles.time, { color }]}>{mm}:{ss}</Text>
        <Text style={timerStyles.phaseLabel}>
          {phase === 'work' ? 'TRABAJO' : phase === 'break' ? 'DESCANSO' : 'LISTO'}
        </Text>
      </View>
    </View>
  );
}

// ── Pomodoro dots ─────────────────────────────────────────────────────────────
function PomodoroDots({ completed, color }: { completed: number; color: string }) {
  return (
    <View style={timerStyles.dotsRow}>
      {Array.from({ length: Math.max(4, completed + 1) }).map((_, i) => (
        <View
          key={i}
          style={[
            timerStyles.dot,
            i < completed
              ? { backgroundColor: color }
              : { backgroundColor: 'rgba(255,255,255,0.10)' },
          ]}
        />
      ))}
    </View>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function PomodoroTimer({ visible, mission, currentUnits, onEarn, onClose }: Props) {
  const isDeepWork = mission.id === 'deep_work';

  // For deep_work: units = accumulated minutes. For pomodoro: units = count.
  const initCompleted = isDeepWork
    ? Math.floor(currentUnits / 25)   // how many 25-min blocks already logged
    : currentUnits;                    // already-logged pomodoros

  const [phase, setPhase]               = useState<Phase>('idle');
  const [secondsLeft, setSecondsLeft]   = useState(WORK_SECS);
  const [running, setRunning]           = useState(false);
  const [completed, setCompleted]       = useState(initCompleted);

  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef   = useRef(AppState.currentState);
  const pausedAtRef   = useRef<number | null>(null);

  // Reset state when modal opens fresh
  useEffect(() => {
    if (visible) {
      const init = isDeepWork ? Math.floor(currentUnits / 25) : currentUnits;
      setCompleted(init);
      setPhase('idle');
      setSecondsLeft(WORK_SECS);
      setRunning(false);
    }
  }, [visible]);

  const totalSecs = phase === 'break' ? BREAK_SECS : WORK_SECS;
  const accentColor = isDeepWork ? COLORS.productividad : COLORS.accent;

  // ── Earn logic ──────────────────────────────────────────────────────────────
  const earnForCompleted = useCallback((count: number) => {
    const units = isDeepWork ? count * 25 : count;
    onEarn(mission.id, units);
  }, [isDeepWork, mission.id, onEarn]);

  // ── Tick ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            // Phase done
            clearInterval(intervalRef.current!);
            setRunning(false);

            if (phase === 'work') {
              // Completed a pomodoro
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Vibration.vibrate([0, 400, 200, 400]);

              setCompleted(prevCount => {
                const next = prevCount + 1;
                earnForCompleted(next);
                return next;
              });
              setPhase('break');
              return BREAK_SECS;
            } else {
              // Break done
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              setPhase('idle');
              return WORK_SECS;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, phase, earnForCompleted]);

  // ── Handle app going to background (pause) ───────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appStateRef.current === 'active' && next !== 'active' && running) {
        pausedAtRef.current = Date.now();
        setRunning(false);
      }
      if (appStateRef.current !== 'active' && next === 'active' && pausedAtRef.current) {
        const elapsed = Math.floor((Date.now() - pausedAtRef.current) / 1000);
        setSecondsLeft(prev => Math.max(0, prev - elapsed));
        pausedAtRef.current = null;
        setRunning(true);
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [running]);

  // ── Controls ─────────────────────────────────────────────────────────────
  function handleStartPause() {
    if (phase === 'idle') {
      setPhase('work');
      setSecondsLeft(WORK_SECS);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRunning(r => !r);
  }

  function handleReset() {
    setRunning(false);
    setPhase('idle');
    setSecondsLeft(WORK_SECS);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleSkipBreak() {
    if (phase !== 'break') return;
    setRunning(false);
    setPhase('idle');
    setSecondsLeft(WORK_SECS);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleClose() {
    setRunning(false);
    onClose();
  }

  // ── Mission progress hint ────────────────────────────────────────────────
  function getMissionHint() {
    if (isDeepWork) {
      const mins = completed * 25;
      if (mins === 0) return 'Completa 2 pomodoros para 30 min (+3pt)';
      if (mins < 30)  return `${mins} min acumulados — faltan ${30 - mins} min para +3pt`;
      if (mins < 60)  return `${mins} min — faltan ${60 - mins} min para +6pt`;
      if (mins < 120) return `${mins} min — faltan ${120 - mins} min para +10pt`;
      return '2 horas completadas — maximo de puntos alcanzado';
    } else {
      if (completed === 0) return 'Completa 2 pomodoros para +4pt';
      if (completed < 2)   return `${completed}/2 pomodoros — falta 1 para +4pt`;
      if (completed < 4)   return `${completed}/4 pomodoros — faltan ${4 - completed} para +8pt`;
      return '4+ pomodoros — maximo de puntos alcanzado';
    }
  }

  const startPauseLabel = phase === 'idle' ? 'Iniciar' : running ? 'Pausar' : 'Continuar';
  const startPauseIcon  = phase === 'idle' || !running ? 'play' : 'pause';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={timerStyles.overlay}>
        <LinearGradient colors={['#0A0A14', '#0F0F1E']} style={timerStyles.sheet}>

          {/* Header */}
          <View style={timerStyles.header}>
            <View>
              <Text style={timerStyles.missionEmoji}>{mission.emoji}</Text>
              <Text style={timerStyles.missionName}>{mission.name}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={timerStyles.closeBtn}>
              <Ionicons name="close-circle" size={28} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Ring */}
          <RingTimer
            secondsLeft={secondsLeft}
            totalSeconds={totalSecs}
            phase={phase}
            color={phase === 'break' ? COLORS.success : accentColor}
          />

          {/* Pomodoro dots */}
          <PomodoroDots completed={completed} color={accentColor} />

          {/* Mission hint */}
          <Text style={timerStyles.hint}>{getMissionHint()}</Text>

          {/* Controls */}
          <View style={timerStyles.controlsRow}>
            {/* Reset */}
            <TouchableOpacity style={timerStyles.secondaryBtn} onPress={handleReset}>
              <Ionicons name="refresh" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>

            {/* Start / Pause */}
            <TouchableOpacity
              style={[timerStyles.primaryBtn, { backgroundColor: accentColor }]}
              onPress={handleStartPause}
              activeOpacity={0.85}
            >
              <Ionicons name={startPauseIcon} size={26} color="#fff" />
              <Text style={timerStyles.primaryBtnText}>{startPauseLabel}</Text>
            </TouchableOpacity>

            {/* Skip break */}
            <TouchableOpacity
              style={[timerStyles.secondaryBtn, phase !== 'break' && { opacity: 0.3 }]}
              onPress={handleSkipBreak}
              disabled={phase !== 'break'}
            >
              <Ionicons name="play-skip-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Break label */}
          {phase === 'break' && (
            <Text style={timerStyles.breakLabel}>Descansa — el siguiente empieza cuando quieras</Text>
          )}

          {/* Completed counter */}
          {completed > 0 && (
            <View style={[timerStyles.completedBadge, { borderColor: accentColor + '50' }]}>
              <Text style={[timerStyles.completedText, { color: accentColor }]}>
                {completed} {completed === 1 ? 'pomodoro' : 'pomodoros'} hoy
                {isDeepWork ? ` · ${completed * 25} min` : ''}
              </Text>
            </View>
          )}

        </LinearGradient>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const timerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  sheet: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING.sm,
  },
  missionEmoji: { fontSize: 28, marginBottom: 2 },
  missionName:  { fontSize: FONT.md, fontWeight: '800', color: COLORS.textPrimary },
  closeBtn:     { padding: 4 },

  // Ring
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.sm,
  },
  ringOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  time:        { fontSize: 46, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -1 },
  phaseLabel:  { fontSize: FONT.xs, fontWeight: '800', color: COLORS.textMuted, letterSpacing: 3 },

  // Dots
  dotsRow: { flexDirection: 'row', gap: 10, marginTop: SPACING.xs },
  dot:     { width: 10, height: 10, borderRadius: 5 },

  // Hint
  hint: {
    fontSize: FONT.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginHorizontal: SPACING.lg,
  },

  // Controls
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 16,
    borderRadius: RADIUS.full,
  },
  primaryBtnText: {
    fontSize: FONT.md,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Break / badge
  breakLabel: {
    fontSize: FONT.xs,
    color: COLORS.success,
    textAlign: 'center',
  },
  completedBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  completedText: {
    fontSize: FONT.sm,
    fontWeight: '800',
  },
});
