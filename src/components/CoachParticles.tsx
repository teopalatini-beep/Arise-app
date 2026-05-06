import React, { useEffect, useRef, memo } from 'react';
import { View, Text, Animated, Dimensions, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CoachId } from '../types';

const { width: SW, height: SH } = Dimensions.get('window');

export type ScreenKey = 'home' | 'progreso' | 'diario' | 'discovery' | 'programa' | 'config';

// ── Default (single) images per coach — fallback for all screens ──────────────
const COACH_IMAGES: Record<CoachId, ImageSourcePropType> = {
  goku:      require('../../assets/coaches/goku.png'),
  itachi:    require('../../assets/coaches/itachi.png'),
  rengoku:   require('../../assets/coaches/rengoku.png'),
  jiraiya:   require('../../assets/coaches/jiraiya.png'),
  gojo:      require('../../assets/coaches/gojo.png'),
  all_might: require('../../assets/coaches/all_might.png'),
};

// ── Per-screen images — placeholder until per-screen art is sourced ───────────
// When per-screen images are available, add them in assets/coaches/<id>/<screen>.png
// and re-enable the per-screen mapping below.
const COACH_SCREEN_IMAGES: Partial<Record<CoachId, Partial<Record<ScreenKey, ImageSourcePropType>>>> = {};

function getCoachImage(coachId: CoachId, screen: ScreenKey): ImageSourcePropType {
  return COACH_SCREEN_IMAGES[coachId]?.[screen] ?? COACH_IMAGES[coachId];
}

// ── Screen-specific visual overrides ─────────────────────────────────────────
// Each screen can tweak opacity, size, position independently of the base theme
const SCREEN_IMAGE_OVERRIDES: Partial<Record<ScreenKey, {
  opacityMul: number;   // multiplied against base imageOpacity
  heightMul: number;    // multiplied against base imageHeight
  resizeMode?: 'contain' | 'cover';
  bottom?: number;
  right?: number;
}>> = {
  home:      { opacityMul: 1.00, heightMul: 1.00 },
  progreso:  { opacityMul: 1.05, heightMul: 1.10, resizeMode: 'contain' },
  diario:    { opacityMul: 0.65, heightMul: 0.85, resizeMode: 'contain' },
  discovery: { opacityMul: 0.75, heightMul: 0.90, resizeMode: 'contain' },
  programa:  { opacityMul: 0.90, heightMul: 1.00, resizeMode: 'contain' },
  config:    { opacityMul: 0.50, heightMul: 0.80, resizeMode: 'contain' },
};

// Colors extracted from actual images + blend gradients
export const COACH_IMAGE_THEME: Record<CoachId, {
  background: [string, string, string];
  glow: string;
  imageOpacity: number;
  imageWidth: number;
  imageHeight: number;
  imageBottom: number;
  imageRight: number;
  resizeMode: 'contain' | 'cover';
  fadeTopColors: [string, string];
  fadeBottomColors: [string, string];
  fadeLeftColors: [string, string];
}> = {
  goku: {
    // SSJ lightning blue / Ultra Instinct purple / calm orange
    background:       ['#08060E', '#140C02', '#1E1204'],
    glow:             '#F5C518',
    imageOpacity:     0.78,
    imageWidth:       SW * 0.90,
    imageHeight:      SH * 0.65,
    imageBottom:      0,
    imageRight:       -10,
    resizeMode:       'contain',
    fadeTopColors:    ['#08060E', 'transparent'],
    fadeBottomColors: ['transparent', '#1E1204'],
    fadeLeftColors:   ['#08060E', 'transparent'],
  },
  itachi: {
    // Rain / crows / Susanoo — deep crimson & black
    background:       ['#060004', '#100008', '#1A000E'],
    glow:             '#CC1020',
    imageOpacity:     0.72,
    imageWidth:       SW * 0.95,
    imageHeight:      SH * 0.68,
    imageBottom:      0,
    imageRight:       -8,
    resizeMode:       'contain',
    fadeTopColors:    ['#060004', 'transparent'],
    fadeBottomColors: ['transparent', '#1A000E'],
    fadeLeftColors:   ['#060004', 'transparent'],
  },
  rengoku: {
    // Flames, fire orange — character portrait / silhouette
    background:       ['#0E0300', '#1E0800', '#2E1000'],
    glow:             '#FF6600',
    imageOpacity:     0.78,
    imageWidth:       SW * 0.92,
    imageHeight:      SH * 0.68,
    imageBottom:      0,
    imageRight:       -10,
    resizeMode:       'contain',
    fadeTopColors:    ['#0E0300', 'transparent'],
    fadeBottomColors: ['transparent', '#2E1000'],
    fadeLeftColors:   ['#0E0300', 'transparent'],
  },
  jiraiya: {
    // Writing at desk, toads, green meditation — earthy & wise
    background:       ['#040A02', '#0C1806', '#16240C'],
    glow:             '#82C820',
    imageOpacity:     0.72,
    imageWidth:       SW * 0.90,
    imageHeight:      SH * 0.66,
    imageBottom:      0,
    imageRight:       -10,
    resizeMode:       'contain',
    fadeTopColors:    ['#040A02', 'transparent'],
    fadeBottomColors: ['transparent', '#16240C'],
    fadeLeftColors:   ['#040A02', 'transparent'],
  },
  gojo: {
    // Purple technique / vortex / blue energy — icy + violet
    background:       ['#04060E', '#080C1C', '#0C122A'],
    glow:             '#7B61FF',
    imageOpacity:     0.78,
    imageWidth:       SW * 0.90,
    imageHeight:      SH * 0.68,
    imageBottom:      0,
    imageRight:       -8,
    resizeMode:       'contain',
    fadeTopColors:    ['#04060E', 'transparent'],
    fadeBottomColors: ['transparent', '#0C122A'],
    fadeLeftColors:   ['#04060E', 'transparent'],
  },
  all_might: {
    // Punch lightning / golden backlit / suit calm — navy + gold
    background:       ['#020608', '#04101A', '#061828'],
    glow:             '#F0C040',
    imageOpacity:     0.78,
    imageWidth:       SW * 0.88,
    imageHeight:      SH * 0.70,
    imageBottom:      0,
    imageRight:       -8,
    resizeMode:       'contain',
    fadeTopColors:    ['#020608', 'transparent'],
    fadeBottomColors: ['transparent', '#061828'],
    fadeLeftColors:   ['#020608', 'transparent'],
  },
};

// ── Particle definition ───────────────────────────────────────────────────────
interface ParticleDef {
  emoji: string;
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  floatAmplitude: number;
  floatDuration: number;
  pulseDuration: number;
  phaseOffset: number;
  riseUp?: boolean;
  rotate?: boolean;
  glowColor?: string;
  glowRadius?: number;
}

// ── Per-coach particle sets ───────────────────────────────────────────────────
const PARTICLES: Record<CoachId, ParticleDef[]> = {
  goku: [
    { emoji: '⚡', x: SW*0.08, y: 90,  size: 22, baseOpacity: 0.55, floatAmplitude: 18, floatDuration: 2800, pulseDuration: 2000, phaseOffset: 0.0, glowColor: '#F5C518', glowRadius: 30 },
    { emoji: '⚡', x: SW*0.82, y: 170, size: 18, baseOpacity: 0.45, floatAmplitude: 22, floatDuration: 3200, pulseDuration: 2400, phaseOffset: 0.4 },
    { emoji: '🔥', x: SW*0.18, y: 490, size: 20, baseOpacity: 0.38, floatAmplitude: 16, floatDuration: 3500, pulseDuration: 2200, phaseOffset: 0.2 },
    { emoji: '✦',  x: SW*0.35, y: 140, size: 14, baseOpacity: 0.50, floatAmplitude: 10, floatDuration: 2200, pulseDuration: 1600, phaseOffset: 0.1, glowColor: '#F5C518', glowRadius: 22 },
    { emoji: '✦',  x: SW*0.65, y: 540, size: 12, baseOpacity: 0.45, floatAmplitude: 12, floatDuration: 2600, pulseDuration: 2000, phaseOffset: 0.8 },
    { emoji: '💥', x: SW*0.55, y: 260, size: 24, baseOpacity: 0.18, floatAmplitude: 10, floatDuration: 4000, pulseDuration: 3000, phaseOffset: 0.5, glowColor: '#F5C518', glowRadius: 52 },
  ],
  itachi: [
    { emoji: '🪶', x: SW*0.12, y: 100, size: 18, baseOpacity: 0.55, floatAmplitude: 28, floatDuration: 4500, pulseDuration: 3500, phaseOffset: 0.0 },
    { emoji: '🪶', x: SW*0.76, y: 210, size: 14, baseOpacity: 0.45, floatAmplitude: 32, floatDuration: 5200, pulseDuration: 4000, phaseOffset: 0.6 },
    { emoji: '🪶', x: SW*0.40, y: 430, size: 16, baseOpacity: 0.38, floatAmplitude: 24, floatDuration: 4800, pulseDuration: 3200, phaseOffset: 0.3 },
    { emoji: '👁️', x: SW*0.80, y: 380, size: 26, baseOpacity: 0.50, floatAmplitude:  8, floatDuration: 3000, pulseDuration: 1800, phaseOffset: 0.2, glowColor: '#C41230', glowRadius: 48 },
    { emoji: '🌑', x: SW*0.52, y: 160, size: 22, baseOpacity: 0.28, floatAmplitude: 14, floatDuration: 5500, pulseDuration: 4200, phaseOffset: 0.5, glowColor: '#A855F7', glowRadius: 42 },
    { emoji: '✦',  x: SW*0.25, y: 580, size: 12, baseOpacity: 0.45, floatAmplitude: 10, floatDuration: 2800, pulseDuration: 2000, phaseOffset: 0.9 },
  ],
  rengoku: [
    { emoji: '🔥', x: SW*0.10, y: 600, size: 28, baseOpacity: 0.65, floatAmplitude: 0, floatDuration: 2200, pulseDuration: 1600, phaseOffset: 0.0, riseUp: true },
    { emoji: '🔥', x: SW*0.30, y: 620, size: 22, baseOpacity: 0.55, floatAmplitude: 0, floatDuration: 2600, pulseDuration: 1900, phaseOffset: 0.3, riseUp: true },
    { emoji: '🔥', x: SW*0.68, y: 605, size: 24, baseOpacity: 0.60, floatAmplitude: 0, floatDuration: 2400, pulseDuration: 1700, phaseOffset: 0.6, riseUp: true },
    { emoji: '🔥', x: SW*0.86, y: 615, size: 20, baseOpacity: 0.50, floatAmplitude: 0, floatDuration: 2800, pulseDuration: 2100, phaseOffset: 0.2, riseUp: true },
    { emoji: '🗡️', x: SW*0.14, y: 160, size: 24, baseOpacity: 0.35, floatAmplitude: 14, floatDuration: 3200, pulseDuration: 2600, phaseOffset: 0.5 },
    { emoji: '☀️', x: SW*0.46, y: 110, size: 30, baseOpacity: 0.28, floatAmplitude:  8, floatDuration: 4000, pulseDuration: 3000, phaseOffset: 0.7, glowColor: '#FF5500', glowRadius: 58 },
  ],
  jiraiya: [
    { emoji: '🍃', x: SW*0.08, y: 120, size: 20, baseOpacity: 0.55, floatAmplitude: 22, floatDuration: 4500, pulseDuration: 3500, phaseOffset: 0.0 },
    { emoji: '🍃', x: SW*0.74, y: 240, size: 16, baseOpacity: 0.45, floatAmplitude: 26, floatDuration: 5200, pulseDuration: 4000, phaseOffset: 0.5 },
    { emoji: '🐸', x: SW*0.16, y: 410, size: 22, baseOpacity: 0.42, floatAmplitude: 10, floatDuration: 3600, pulseDuration: 2600, phaseOffset: 0.3, glowColor: '#7AB828', glowRadius: 36 },
    { emoji: '📜', x: SW*0.58, y: 175, size: 20, baseOpacity: 0.36, floatAmplitude: 12, floatDuration: 3900, pulseDuration: 2800, phaseOffset: 0.2 },
    { emoji: '🌿', x: SW*0.30, y: 290, size: 24, baseOpacity: 0.28, floatAmplitude: 16, floatDuration: 5600, pulseDuration: 4600, phaseOffset: 0.6, glowColor: '#7AB828', glowRadius: 50 },
    { emoji: '💧', x: SW*0.85, y: 360, size: 16, baseOpacity: 0.42, floatAmplitude: 22, floatDuration: 3200, pulseDuration: 2300, phaseOffset: 0.4 },
  ],
  gojo: [
    { emoji: '♾️', x: SW*0.40, y: 140, size: 30, baseOpacity: 0.46, floatAmplitude: 8, floatDuration: 3000, pulseDuration: 2000, phaseOffset: 0.0, rotate: true, glowColor: '#38C4F0', glowRadius: 62 },
    { emoji: '❄️', x: SW*0.06, y: 250, size: 20, baseOpacity: 0.55, floatAmplitude: 16, floatDuration: 2800, pulseDuration: 2200, phaseOffset: 0.3 },
    { emoji: '❄️', x: SW*0.80, y: 400, size: 18, baseOpacity: 0.45, floatAmplitude: 20, floatDuration: 3400, pulseDuration: 2700, phaseOffset: 0.7 },
    { emoji: '👁️', x: SW*0.14, y: 500, size: 24, baseOpacity: 0.46, floatAmplitude:  6, floatDuration: 2600, pulseDuration: 1900, phaseOffset: 0.2, glowColor: '#38C4F0', glowRadius: 42 },
    { emoji: '🌀', x: SW*0.64, y: 320, size: 22, baseOpacity: 0.30, floatAmplitude: 16, floatDuration: 4200, pulseDuration: 3100, phaseOffset: 0.6, rotate: true },
    { emoji: '✦',  x: SW*0.72, y: 160, size: 16, baseOpacity: 0.58, floatAmplitude: 10, floatDuration: 2200, pulseDuration: 1600, phaseOffset: 0.1 },
  ],
  all_might: [
    { emoji: '⭐', x: SW*0.10, y: 140, size: 24, baseOpacity: 0.58, floatAmplitude: 14, floatDuration: 2400, pulseDuration: 1800, phaseOffset: 0.0, glowColor: '#FBBF24', glowRadius: 40 },
    { emoji: '⭐', x: SW*0.76, y: 280, size: 20, baseOpacity: 0.50, floatAmplitude: 18, floatDuration: 2900, pulseDuration: 2200, phaseOffset: 0.5 },
    { emoji: '💪', x: SW*0.20, y: 340, size: 26, baseOpacity: 0.40, floatAmplitude: 10, floatDuration: 3100, pulseDuration: 2400, phaseOffset: 0.3 },
    { emoji: '🔵', x: SW*0.34, y: 180, size: 20, baseOpacity: 0.30, floatAmplitude: 16, floatDuration: 4100, pulseDuration: 3200, phaseOffset: 0.4, glowColor: '#3B82F6', glowRadius: 46 },
    { emoji: '✦',  x: SW*0.60, y: 120, size: 16, baseOpacity: 0.56, floatAmplitude: 12, floatDuration: 2600, pulseDuration: 2000, phaseOffset: 0.1 },
    { emoji: '✦',  x: SW*0.87, y: 560, size: 14, baseOpacity: 0.50, floatAmplitude: 10, floatDuration: 2200, pulseDuration: 1700, phaseOffset: 0.6 },
  ],
};

// ── Single animated particle ──────────────────────────────────────────────────
// NOTE: cleanup does NOT call .stop() — calling stop() on a Fabric-frozen
// Animated.Value throws "_tracking/null immutable" errors in dev mode.
// All animations use useNativeDriver:true so the native side cleans up safely.
function AnimatedParticle({ def }: { def: ParticleDef }) {
  const translateY = useRef(new Animated.Value(
    def.riseUp ? 0 : def.floatAmplitude * Math.sin(def.phaseOffset * Math.PI * 2)
  )).current;
  const opacity = useRef(new Animated.Value(
    def.baseOpacity * (0.5 + 0.5 * Math.cos(def.phaseOffset * Math.PI * 2))
  )).current;
  const rotation = useRef(new Animated.Value(def.phaseOffset)).current;

  useEffect(() => {
    if (def.riseUp) {
      Animated.loop(
        Animated.timing(translateY, { toValue: -220, duration: def.floatDuration * 3, useNativeDriver: true })
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: def.baseOpacity, duration: def.pulseDuration * 0.4, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: def.pulseDuration * 1.6, useNativeDriver: true }),
        ])
      ).start();
      return;
    }

    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: def.floatAmplitude, duration: def.floatDuration / 2, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -def.floatAmplitude, duration: def.floatDuration, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: def.floatDuration / 2, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: def.baseOpacity * 0.25, duration: def.pulseDuration / 2, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: def.baseOpacity, duration: def.pulseDuration / 2, useNativeDriver: true }),
      ])
    ).start();

    if (def.rotate) {
      Animated.loop(
        Animated.timing(rotation, { toValue: def.phaseOffset + 1, duration: 9000, useNativeDriver: true })
      ).start();
    }
  }, []);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[styles.particle, {
      left: def.x, top: def.y, opacity,
      transform: [{ translateY }, ...(def.rotate ? [{ rotate: spin }] : [])],
    }]}>
      {def.glowColor && (
        <View style={[styles.glow, {
          width: def.glowRadius! * 2, height: def.glowRadius! * 2,
          borderRadius: def.glowRadius, backgroundColor: def.glowColor,
          left: -(def.glowRadius! - def.size / 2), top: -(def.glowRadius! - def.size / 2),
        }]} />
      )}
      <Text style={{ fontSize: def.size, lineHeight: def.size * 1.3 }}>{def.emoji}</Text>
    </Animated.View>
  );
}

// ── Background aura pulse ─────────────────────────────────────────────────────
function CoachAura({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(0.90)).current;
  const opac  = useRef(new Animated.Value(0.07)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: 1.08, duration: 3400, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.90, duration: 3400, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(opac, { toValue: 0.20, duration: 3400, useNativeDriver: true }),
      Animated.timing(opac, { toValue: 0.05, duration: 3400, useNativeDriver: true }),
    ])).start();
  }, []);

  return (
    <Animated.View style={[styles.aura, {
      backgroundColor: color,
      opacity: opac,
      transform: [{ scale }],
    }]} />
  );
}

// ── Exported component ────────────────────────────────────────────────────────
export default memo(function CoachParticles({
  coachId,
  screen = 'home',
}: {
  coachId: CoachId;
  screen?: ScreenKey;
}) {
  const particles = PARTICLES[coachId]         ?? PARTICLES.goku;
  const theme     = COACH_IMAGE_THEME[coachId] ?? COACH_IMAGE_THEME.goku;
  const override: Partial<{ opacityMul: number; heightMul: number; resizeMode: 'contain' | 'cover'; bottom: number; right: number }> = SCREEN_IMAGE_OVERRIDES[screen] ?? {};
  const imgSource = getCoachImage(coachId, screen);

  const opacity    = Math.min(1, theme.imageOpacity * (override.opacityMul ?? 1));
  const height     = theme.imageHeight * (override.heightMul ?? 1);
  const resize     = override.resizeMode ?? theme.resizeMode;
  const bottom     = override.bottom ?? theme.imageBottom;
  const right      = override.right  ?? theme.imageRight;

  return (
    <View style={styles.container} pointerEvents="none">
      <CoachAura color={theme.glow} />

      {/* Character image */}
      <View style={[styles.imageWrapper, {
        bottom, right,
        width: theme.imageWidth,
        height,
      }]}>
        <Image
          source={imgSource}
          style={[styles.characterImage, { opacity }]}
          resizeMode={resize}
        />
        <LinearGradient colors={theme.fadeTopColors}    style={styles.fadeTop}    pointerEvents="none" />
        <LinearGradient colors={theme.fadeBottomColors} style={styles.fadeBottom} pointerEvents="none" />
        <LinearGradient colors={theme.fadeLeftColors}   start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.fadeLeft} pointerEvents="none" />
      </View>

      {particles.map((def, idx) => (
        <AnimatedParticle key={`${coachId}-${idx}`} def={def} />
      ))}
    </View>
  );
});

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:      { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  particle:       { position: 'absolute' },
  glow:           { position: 'absolute', opacity: 0.20 },
  aura: {
    position: 'absolute',
    width: SW * 1.5, height: SW * 1.5,
    borderRadius: SW * 0.75,
    left: SW * -0.25, top: -SW * 0.15,
  },
  imageWrapper:   { position: 'absolute', overflow: 'hidden' },
  characterImage: { width: '100%', height: '100%' },
  fadeTop:        { position: 'absolute', top: 0, left: 0, right: 0, height: '40%' },
  fadeBottom:     { position: 'absolute', bottom: 0, left: 0, right: 0, height: '28%' },
  fadeLeft:       { position: 'absolute', top: 0, bottom: 0, left: 0, width: '28%' },
});
