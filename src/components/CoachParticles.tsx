import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { CoachId } from '../types';
import { getCoachVisualProfile } from '../lib/coach';

const PARTICLE_COUNT = 14;

function Particle({
  x,
  size,
  delay,
  duration,
  glow,
  reducedMotion,
}: {
  x: number;
  size: number;
  delay: number;
  duration: number;
  glow: string;
  reducedMotion: boolean;
}) {
  const { height } = useWindowDimensions();
  const progress = useSharedValue(0);
  const opacity = useSharedValue(reducedMotion ? 0.2 : 0);

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 0.15;
      return;
    }
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.linear }),
        -1,
        false,
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.55, { duration: duration / 2, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      ),
    );
  }, [delay, duration, opacity, progress, reducedMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: progress.value * (height * 0.55) },
      { translateX: Math.sin(progress.value * Math.PI * 2) * 12 },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          left: x,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: glow,
          shadowColor: glow,
        },
        style,
      ]}
    />
  );
}

interface Props {
  coachId?: CoachId | string;
  reducedMotion?: boolean;
  /** @deprecated unused — kept for call-site compat */
  screen?: string;
}

export default function CoachParticles({
  coachId = 'arise',
  reducedMotion = false,
}: Props) {
  const { width } = useWindowDimensions();
  const glow = getCoachVisualProfile(coachId).glowColor;

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        x: ((i * 97) % Math.max(width - 24, 1)) + 8,
        size: 2 + (i % 4),
        delay: (i * 180) % 2400,
        duration: 5200 + (i % 5) * 700,
      })),
    [width],
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((p) => (
        <Particle
          key={p.id}
          x={p.x}
          size={p.size}
          delay={p.delay}
          duration={p.duration}
          glow={glow}
          reducedMotion={reducedMotion}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: -8,
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
