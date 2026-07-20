import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT, RADIUS, SPACING } from '@/theme';

interface ScreenLoadingStateProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  hints?: string[];
  reducedMotion?: boolean;
}

const DEFAULT_HINTS = [
  'Sincronizando datos',
  'Aplicando estilo del coach',
  'Preparando tu siguiente accion',
];

export default function ScreenLoadingState({
  title,
  subtitle,
  icon,
  accent,
  hints = DEFAULT_HINTS,
  reducedMotion = false,
}: ScreenLoadingStateProps) {
  const rotate = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      rotate.setValue(0);
      pulse.setValue(0);
      return;
    }

    const spinLoop = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 4200,
        useNativeDriver: true,
      }),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 780,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 780,
          useNativeDriver: true,
        }),
      ]),
    );
    spinLoop.start();
    pulseLoop.start();
    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [pulse, reducedMotion, rotate]);

  const rotateZ = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.04],
  });
  const ringOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.5],
  });

  return (
    <View style={styles.wrap}>
      <View style={styles.emblemWrap}>
        <Animated.View
          style={[
            styles.outerRing,
            {
              borderColor: `${accent}66`,
              opacity: ringOpacity,
              transform: [{ rotate: rotateZ }, { scale: ringScale }],
            },
          ]}
        />
        <LinearGradient
          colors={[`${accent}33`, 'rgba(255,255,255,0.03)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.innerEmblem, { borderColor: `${accent}55` }]}
        >
          <Ionicons name={icon} size={30} color={accent} />
        </LinearGradient>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.hintsBox}>
        {hints.slice(0, 3).map((hint) => (
          <View key={hint} style={styles.hintRow}>
            <View style={[styles.hintDot, { backgroundColor: accent }]} />
            <Text style={styles.hintText}>{hint}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emblemWrap: {
    width: 112,
    height: 112,
    marginBottom: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1.5,
  },
  innerEmblem: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT.xl,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    marginTop: 6,
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  hintsBox: {
    marginTop: SPACING.lg,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: SPACING.md,
    gap: 8,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  hintText: {
    color: COLORS.textMuted,
    fontSize: FONT.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
