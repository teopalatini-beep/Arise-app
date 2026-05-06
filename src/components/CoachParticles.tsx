/**
 * CoachParticles — Ambient sensei atmosphere
 *
 * Daily view: color gradient + floating signature symbols (NO static portrait)
 * On tap (tappable=true): full-screen portrait reveal with fade
 */
import React, { useEffect, useRef, useState, memo } from 'react';
import {
  View, Text, Animated, Dimensions, StyleSheet,
  Image, Modal, TouchableWithoutFeedback,
  ImageSourcePropType,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CoachId } from '../types';

const { width: SW, height: SH } = Dimensions.get('window');
export type ScreenKey = 'home' | 'progreso' | 'diario' | 'discovery' | 'programa' | 'config';

// ─── Portrait images (shown only on tap-reveal) ───────────────────────────────
const PORTRAITS: Record<CoachId, ImageSourcePropType> = {
  goku:      require('../../assets/coaches/goku.png'),
  itachi:    require('../../assets/coaches/itachi.png'),
  rengoku:   require('../../assets/coaches/rengoku.png'),
  jiraiya:   require('../../assets/coaches/jiraiya.png'),
  gojo:      require('../../assets/coaches/gojo.png'),
  all_might: require('../../assets/coaches/all_might.png'),
};

// ─── Per-sensei ambient config ────────────────────────────────────────────────
export interface SenseiAmbient {
  bg:           [string, string, string];
  glow:         string;
  accent:       string;
  sigil:        string;
  sigilRotates: boolean;
  particles:    ParticleDef[];
}

export const AMBIENTS: Record<CoachId, SenseiAmbient> = {
  // ── ITACHI ── crows, Sharingan tomoe, darkness & red moons
  itachi: {
    bg:           ['#030003', '#0D0008', '#180010'],
    glow:         '#C41030',
    accent:       '#A855F7',
    sigil:        '👁️',
    sigilRotates: false,
    particles: [
      { symbol: '🪶', x: SW*0.08, y:  80, size: 18, opacity: 0.55, floatY: 28, floatDur: 4500, pulseDur: 3500, phase: 0.0, drift: 12 },
      { symbol: '🪶', x: SW*0.72, y: 200, size: 14, opacity: 0.42, floatY: 32, floatDur: 5200, pulseDur: 4000, phase: 0.6, drift: -8 },
      { symbol: '🪶', x: SW*0.38, y: 420, size: 16, opacity: 0.35, floatY: 24, floatDur: 4800, pulseDur: 3200, phase: 0.3, drift: 10 },
      { symbol: '🪶', x: SW*0.85, y: 340, size: 13, opacity: 0.30, floatY: 20, floatDur: 5600, pulseDur: 4200, phase: 0.8, drift: -6 },
      { symbol: '●',  x: SW*0.50, y: 160, size: 10, opacity: 0.55, floatY:  8, floatDur: 2800, pulseDur: 1800, phase: 0.00, glow: '#C41030', glowR: 20 },
      { symbol: '●',  x: SW*0.58, y: 178, size: 10, opacity: 0.50, floatY:  8, floatDur: 2800, pulseDur: 1800, phase: 0.33, glow: '#C41030', glowR: 20 },
      { symbol: '●',  x: SW*0.42, y: 178, size: 10, opacity: 0.50, floatY:  8, floatDur: 2800, pulseDur: 1800, phase: 0.66, glow: '#C41030', glowR: 20 },
      { symbol: '🌑', x: SW*0.60, y: 120, size: 28, opacity: 0.22, floatY: 12, floatDur: 6000, pulseDur: 5000, phase: 0.5, glow: '#A855F7', glowR: 50 },
      { symbol: '✦',  x: SW*0.22, y: 580, size: 11, opacity: 0.40, floatY: 10, floatDur: 2600, pulseDur: 2000, phase: 0.9 },
      { symbol: '✦',  x: SW*0.78, y: 500, size:  9, opacity: 0.35, floatY:  8, floatDur: 3100, pulseDur: 2200, phase: 0.2 },
    ],
  },

  // ── GOKU ── lightning, ki orbs, rising fire
  goku: {
    bg:           ['#06040E', '#120800', '#1E1000'],
    glow:         '#F5C518',
    accent:       '#3B82F6',
    sigil:        '☯',
    sigilRotates: true,
    particles: [
      { symbol: '⚡', x: SW*0.08, y:  90, size: 22, opacity: 0.60, floatY: 18, floatDur: 2400, pulseDur: 1800, phase: 0.0, glow: '#F5C518', glowR: 32 },
      { symbol: '⚡', x: SW*0.80, y: 170, size: 18, opacity: 0.50, floatY: 22, floatDur: 2900, pulseDur: 2200, phase: 0.4 },
      { symbol: '⚡', x: SW*0.40, y: 460, size: 16, opacity: 0.42, floatY: 16, floatDur: 3200, pulseDur: 2400, phase: 0.7 },
      { symbol: '🔥', x: SW*0.15, y: 490, size: 22, opacity: 0.38, floatY:  0, floatDur: 2000, pulseDur: 1400, phase: 0.2, rise: true },
      { symbol: '🔥', x: SW*0.68, y: 510, size: 18, opacity: 0.30, floatY:  0, floatDur: 2300, pulseDur: 1700, phase: 0.5, rise: true },
      { symbol: '💥', x: SW*0.50, y: 260, size: 26, opacity: 0.15, floatY: 10, floatDur: 4200, pulseDur: 3200, phase: 0.5, glow: '#F5C518', glowR: 56 },
      { symbol: '●',  x: SW*0.25, y: 360, size: 14, opacity: 0.30, floatY: 14, floatDur: 3400, pulseDur: 2400, phase: 0.3, glow: '#3B82F6', glowR: 28 },
      { symbol: '✦',  x: SW*0.34, y: 140, size: 13, opacity: 0.50, floatY: 10, floatDur: 2000, pulseDur: 1600, phase: 0.1, glow: '#F5C518', glowR: 22 },
      { symbol: '✦',  x: SW*0.62, y: 540, size: 11, opacity: 0.45, floatY: 12, floatDur: 2400, pulseDur: 2000, phase: 0.8 },
    ],
  },

  // ── RENGOKU ── rising flames, sun, flame blade
  rengoku: {
    bg:           ['#0E0200', '#200700', '#320E00'],
    glow:         '#FF5500',
    accent:       '#FACC15',
    sigil:        '炎',
    sigilRotates: false,
    particles: [
      { symbol: '🔥', x: SW*0.10, y: 600, size: 30, opacity: 0.70, floatY: 0, floatDur: 2000, pulseDur: 1500, phase: 0.0, rise: true },
      { symbol: '🔥', x: SW*0.30, y: 620, size: 24, opacity: 0.60, floatY: 0, floatDur: 2400, pulseDur: 1800, phase: 0.3, rise: true },
      { symbol: '🔥', x: SW*0.55, y: 608, size: 26, opacity: 0.65, floatY: 0, floatDur: 2200, pulseDur: 1600, phase: 0.6, rise: true },
      { symbol: '🔥', x: SW*0.78, y: 615, size: 22, opacity: 0.55, floatY: 0, floatDur: 2600, pulseDur: 2000, phase: 0.2, rise: true },
      { symbol: '🔥', x: SW*0.92, y: 600, size: 18, opacity: 0.45, floatY: 0, floatDur: 2800, pulseDur: 2100, phase: 0.8, rise: true },
      { symbol: '✸',  x: SW*0.22, y: 300, size: 16, opacity: 0.45, floatY: 16, floatDur: 2800, pulseDur: 2000, phase: 0.4 },
      { symbol: '✸',  x: SW*0.70, y: 380, size: 14, opacity: 0.38, floatY: 12, floatDur: 3200, pulseDur: 2400, phase: 0.7 },
      { symbol: '🗡️', x: SW*0.14, y: 160, size: 24, opacity: 0.32, floatY: 14, floatDur: 3400, pulseDur: 2600, phase: 0.5 },
      { symbol: '☀️', x: SW*0.44, y: 110, size: 32, opacity: 0.25, floatY:  8, floatDur: 5000, pulseDur: 4000, phase: 0.7, glow: '#FF5500', glowR: 60 },
    ],
  },

  // ── JIRAIYA ── toads, leaves, scrolls, water
  jiraiya: {
    bg:           ['#030802', '#0A1606', '#12220A'],
    glow:         '#82C820',
    accent:       '#F59E0B',
    sigil:        '卍',
    sigilRotates: false,
    particles: [
      { symbol: '🍃', x: SW*0.08, y: 120, size: 20, opacity: 0.55, floatY: 22, floatDur: 4500, pulseDur: 3500, phase: 0.0, drift: 14 },
      { symbol: '🍃', x: SW*0.72, y: 240, size: 16, opacity: 0.48, floatY: 26, floatDur: 5200, pulseDur: 4000, phase: 0.5, drift: -10 },
      { symbol: '🍃', x: SW*0.40, y: 360, size: 14, opacity: 0.38, floatY: 18, floatDur: 5800, pulseDur: 4500, phase: 0.8, drift: 8 },
      { symbol: '🐸', x: SW*0.16, y: 420, size: 24, opacity: 0.45, floatY: 10, floatDur: 3600, pulseDur: 2800, phase: 0.3, glow: '#82C820', glowR: 38 },
      { symbol: '🐸', x: SW*0.78, y: 500, size: 18, opacity: 0.32, floatY:  8, floatDur: 4200, pulseDur: 3400, phase: 0.7 },
      { symbol: '📜', x: SW*0.55, y: 175, size: 20, opacity: 0.38, floatY: 12, floatDur: 3900, pulseDur: 2800, phase: 0.2 },
      { symbol: '💧', x: SW*0.85, y: 360, size: 16, opacity: 0.42, floatY: 22, floatDur: 3200, pulseDur: 2300, phase: 0.4 },
      { symbol: '💧', x: SW*0.30, y: 280, size: 13, opacity: 0.35, floatY: 18, floatDur: 3800, pulseDur: 2900, phase: 0.6 },
      { symbol: '🌿', x: SW*0.28, y: 480, size: 26, opacity: 0.22, floatY: 16, floatDur: 5600, pulseDur: 4600, phase: 0.6, glow: '#82C820', glowR: 52 },
    ],
  },

  // ── GOJO ── infinity, ice shards, void spirals, six eyes
  gojo: {
    bg:           ['#02040E', '#06091C', '#0A102A'],
    glow:         '#38C4F0',
    accent:       '#A855F7',
    sigil:        '∞',
    sigilRotates: true,
    particles: [
      { symbol: '♾️', x: SW*0.36, y: 140, size: 32, opacity: 0.48, floatY: 8, floatDur: 3000, pulseDur: 2000, phase: 0.0, rotate: true, glow: '#38C4F0', glowR: 64 },
      { symbol: '❄️', x: SW*0.06, y: 250, size: 20, opacity: 0.58, floatY: 16, floatDur: 2600, pulseDur: 2000, phase: 0.3 },
      { symbol: '❄️', x: SW*0.78, y: 400, size: 18, opacity: 0.48, floatY: 20, floatDur: 3200, pulseDur: 2600, phase: 0.7 },
      { symbol: '❄️', x: SW*0.50, y: 500, size: 14, opacity: 0.38, floatY: 14, floatDur: 3800, pulseDur: 3000, phase: 0.5 },
      { symbol: '👁️', x: SW*0.14, y: 500, size: 26, opacity: 0.48, floatY: 6, floatDur: 2400, pulseDur: 1800, phase: 0.2, glow: '#38C4F0', glowR: 44 },
      { symbol: '🌀', x: SW*0.62, y: 320, size: 22, opacity: 0.28, floatY: 16, floatDur: 4200, pulseDur: 3200, phase: 0.6, rotate: true },
      { symbol: '✦',  x: SW*0.70, y: 160, size: 16, opacity: 0.60, floatY: 10, floatDur: 2000, pulseDur: 1600, phase: 0.1 },
      { symbol: '✦',  x: SW*0.26, y: 380, size: 12, opacity: 0.50, floatY:  8, floatDur: 2400, pulseDur: 1900, phase: 0.8 },
      { symbol: '●',  x: SW*0.84, y: 280, size: 16, opacity: 0.25, floatY: 12, floatDur: 4000, pulseDur: 3000, phase: 0.4, glow: '#A855F7', glowR: 36 },
    ],
  },

  // ── ALL MIGHT ── stars, fists, gold lightning, blue energy
  all_might: {
    bg:           ['#020610', '#031018', '#051828'],
    glow:         '#FBBF24',
    accent:       '#3B82F6',
    sigil:        '★',
    sigilRotates: false,
    particles: [
      { symbol: '⭐', x: SW*0.10, y: 140, size: 26, opacity: 0.62, floatY: 14, floatDur: 2200, pulseDur: 1700, phase: 0.0, glow: '#FBBF24', glowR: 42 },
      { symbol: '⭐', x: SW*0.76, y: 280, size: 20, opacity: 0.52, floatY: 18, floatDur: 2700, pulseDur: 2100, phase: 0.5 },
      { symbol: '⭐', x: SW*0.44, y: 480, size: 16, opacity: 0.40, floatY: 12, floatDur: 3100, pulseDur: 2500, phase: 0.7 },
      { symbol: '💪', x: SW*0.20, y: 340, size: 28, opacity: 0.42, floatY: 10, floatDur: 3000, pulseDur: 2400, phase: 0.3 },
      { symbol: '🔵', x: SW*0.34, y: 180, size: 20, opacity: 0.28, floatY: 16, floatDur: 4200, pulseDur: 3200, phase: 0.4, glow: '#3B82F6', glowR: 48 },
      { symbol: '🔵', x: SW*0.70, y: 440, size: 16, opacity: 0.22, floatY: 14, floatDur: 4800, pulseDur: 3800, phase: 0.6, glow: '#3B82F6', glowR: 36 },
      { symbol: '⚡', x: SW*0.60, y: 120, size: 20, opacity: 0.50, floatY: 18, floatDur: 2400, pulseDur: 1900, phase: 0.2 },
      { symbol: '⚡', x: SW*0.88, y: 380, size: 16, opacity: 0.42, floatY: 16, floatDur: 2800, pulseDur: 2200, phase: 0.8 },
      { symbol: '✦',  x: SW*0.56, y: 540, size: 14, opacity: 0.55, floatY: 10, floatDur: 2000, pulseDur: 1600, phase: 0.1 },
    ],
  },
};

// ─── Particle definition ──────────────────────────────────────────────────────
interface ParticleDef {
  symbol:   string;
  x:        number;
  y:        number;
  size:     number;
  opacity:  number;
  floatY:   number;
  floatDur: number;
  pulseDur: number;
  phase:    number;
  glow?:    string;
  glowR?:   number;
  rise?:    boolean;
  drift?:   number;
  rotate?:  boolean;
}

// ─── Single animated particle ─────────────────────────────────────────────────
function Particle({ def }: { def: ParticleDef }) {
  const translateY = useRef(new Animated.Value(
    def.rise ? 0 : def.floatY * Math.sin(def.phase * Math.PI * 2)
  )).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(
    def.opacity * (0.5 + 0.5 * Math.cos(def.phase * Math.PI * 2))
  )).current;
  const rotation   = useRef(new Animated.Value(def.phase)).current;

  useEffect(() => {
    if (def.rise) {
      Animated.loop(
        Animated.timing(translateY, { toValue: -280, duration: def.floatDur * 3, useNativeDriver: true })
      ).start();
      Animated.loop(Animated.sequence([
        Animated.timing(opacity, { toValue: def.opacity, duration: def.pulseDur * 0.3, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0,           duration: def.pulseDur * 1.7, useNativeDriver: true }),
      ])).start();
      return;
    }

    Animated.loop(Animated.sequence([
      Animated.timing(translateY, { toValue:  def.floatY,  duration: def.floatDur / 2, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -def.floatY,  duration: def.floatDur,     useNativeDriver: true }),
      Animated.timing(translateY, { toValue:  0,           duration: def.floatDur / 2, useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: def.opacity * 0.20, duration: def.pulseDur / 2, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: def.opacity,        duration: def.pulseDur / 2, useNativeDriver: true }),
    ])).start();

    if (def.drift) {
      Animated.loop(Animated.sequence([
        Animated.timing(translateX, { toValue:  def.drift,  duration: def.floatDur * 0.7, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: -def.drift,  duration: def.floatDur * 1.3, useNativeDriver: true }),
      ])).start();
    }

    if (def.rotate) {
      Animated.loop(
        Animated.timing(rotation, { toValue: def.phase + 1, duration: 9000, useNativeDriver: true })
      ).start();
    }
  }, []);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const transforms: any[] = [{ translateY }, { translateX }];
  if (def.rotate) transforms.push({ rotate: spin });

  return (
    <Animated.View style={[styles.particle, { left: def.x, top: def.y, opacity, transform: transforms }]}>
      {def.glow && (
        <View style={[styles.glow, {
          width:        def.glowR! * 2,
          height:       def.glowR! * 2,
          borderRadius: def.glowR,
          backgroundColor: def.glow,
          left: -(def.glowR! - def.size / 2),
          top:  -(def.glowR! - def.size / 2),
        }]} />
      )}
      <Text style={{ fontSize: def.size, lineHeight: def.size * 1.3 }}>{def.symbol}</Text>
    </Animated.View>
  );
}

// ─── Background aura pulse ────────────────────────────────────────────────────
function Aura({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(0.88)).current;
  const opac  = useRef(new Animated.Value(0.06)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: 1.10, duration: 3600, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.88, duration: 3600, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(opac, { toValue: 0.22, duration: 3600, useNativeDriver: true }),
      Animated.timing(opac, { toValue: 0.04, duration: 3600, useNativeDriver: true }),
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

// ─── Large faint sigil in background ─────────────────────────────────────────
function Sigil({ symbol, color, rotates }: { symbol: string; color: string; rotates: boolean }) {
  const opac     = useRef(new Animated.Value(0.04)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(opac, { toValue: 0.09, duration: 5000, useNativeDriver: true }),
      Animated.timing(opac, { toValue: 0.03, duration: 5000, useNativeDriver: true }),
    ])).start();
    if (rotates) {
      Animated.loop(
        Animated.timing(rotation, { toValue: 1, duration: 20000, useNativeDriver: true })
      ).start();
    }
  }, []);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[styles.sigil, { opacity: opac, transform: rotates ? [{ rotate: spin }] : [] }]}>
      <Text style={[styles.sigilText, { color }]}>{symbol}</Text>
    </Animated.View>
  );
}

// ─── Portrait reveal modal ────────────────────────────────────────────────────
function PortraitModal({ visible, coachId, onClose }: {
  visible:  boolean;
  coachId:  CoachId;
  onClose:  () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const ambient  = AMBIENTS[coachId];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue:  visible ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.portraitOverlay, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={[ambient.bg[0] + 'EE', ambient.bg[1] + 'BB', 'transparent']}
            style={styles.portraitTopFade}
          />
          <Image
            source={PORTRAITS[coachId]}
            style={styles.portraitImage}
            resizeMode="contain"
          />
          <LinearGradient
            colors={['transparent', ambient.bg[2] + 'FF']}
            style={styles.portraitBottomFade}
          />
          <View style={[styles.portraitGlow, { backgroundColor: ambient.glow + '18' }]} />
          <Text style={styles.portraitHint}>Toca para cerrar</Text>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default memo(function CoachParticles({
  coachId,
  screen = 'home',
  tappable = false,
}: {
  coachId:   CoachId;
  screen?:   ScreenKey;
  tappable?: boolean;
}) {
  const ambient = AMBIENTS[coachId] ?? AMBIENTS.goku;
  const [showPortrait, setShowPortrait] = useState(false);

  return (
    <>
      <View
        style={styles.container}
        pointerEvents={tappable ? 'box-only' : 'none'}
      >
        {tappable && (
          <TouchableWithoutFeedback onPress={() => setShowPortrait(true)}>
            <View style={StyleSheet.absoluteFillObject} />
          </TouchableWithoutFeedback>
        )}

        <Aura color={ambient.glow} />
        <Sigil symbol={ambient.sigil} color={ambient.glow} rotates={ambient.sigilRotates} />

        {ambient.particles.map((def, i) => (
          <Particle key={i} def={def} />
        ))}
      </View>

      <PortraitModal
        visible={showPortrait}
        coachId={coachId}
        onClose={() => setShowPortrait(false)}
      />
    </>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex:   0,
    overflow: 'hidden',
  },
  aura: {
    position:     'absolute',
    width:        SW * 1.6,
    height:       SW * 1.6,
    borderRadius: SW * 0.8,
    left:         -SW * 0.30,
    top:          -SW * 0.20,
  },
  sigil: {
    position:   'absolute',
    left:       SW * 0.15,
    top:        SH * 0.25,
    width:      SW * 0.70,
    alignItems: 'center',
  },
  sigilText: {
    fontSize:   SW * 0.52,
    fontWeight: '900',
    textAlign:  'center',
  },
  particle: { position: 'absolute' },
  glow:     { position: 'absolute', opacity: 0.18 },

  // Portrait modal
  portraitOverlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  portraitImage: {
    width:  SW * 0.88,
    height: SH * 0.72,
  },
  portraitTopFade: {
    position: 'absolute',
    top:      0, left: 0, right: 0,
    height:   '30%',
    zIndex:   2,
  },
  portraitBottomFade: {
    position: 'absolute',
    bottom:   0, left: 0, right: 0,
    height:   '25%',
    zIndex:   2,
  },
  portraitGlow: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  portraitHint: {
    position:      'absolute',
    bottom:        48,
    fontSize:      12,
    color:         'rgba(255,255,255,0.35)',
    letterSpacing: 2,
    fontWeight:    '600',
    zIndex:        3,
  },
});
