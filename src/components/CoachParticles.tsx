/**
 * CoachParticles — Ambient sensei atmosphere
 *
 * Daily view: color gradient + SVG particle system (flames, lightning, ice, etc.)
 * On tap (tappable=true): full-screen portrait reveal with fade
 *
 * Particles are SVG-based — no emoji, no external files required.
 * react-native-svg is already a dependency (used by PomodoroTimer).
 */
import React, { useEffect, useRef, useState, memo } from 'react';
import {
  View, Text, Animated, Dimensions, StyleSheet,
  Image, Modal, TouchableWithoutFeedback, TouchableOpacity,
  ImageSourcePropType,
} from 'react-native';
import Svg, { Path, Circle, Polygon, Line, G, Ellipse } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { CoachId } from '../types';

const { width: SW, height: SH } = Dimensions.get('window');
export type ScreenKey = 'home' | 'progreso' | 'diario' | 'discovery' | 'programa' | 'config';
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

// ─── Portrait images (shown only on tap-reveal) ───────────────────────────────
const PORTRAITS: Record<CoachId, ImageSourcePropType> = {
  goku:      require('../../assets/coaches/goku.png'),
  itachi:    require('../../assets/coaches/itachi.png'),
  rengoku:   require('../../assets/coaches/rengoku.png'),
  jiraiya:   require('../../assets/coaches/jiraiya.png'),
  gojo:      require('../../assets/coaches/gojo.png'),
  all_might: require('../../assets/coaches/all_might.png'),
};

// ─── SVG Shape types ──────────────────────────────────────────────────────────
export type ShapeType =
  | 'flame'        // fire tongue — Rengoku / Goku
  | 'lightning'    // bolt — Goku / All Might
  | 'snowflake'    // 6-pointed crystal — Gojo
  | 'feather'      // curved feather — Itachi
  | 'leaf'         // teardrop leaf — Jiraiya
  | 'toad'         // simple toad silhouette — Jiraiya
  | 'tomoe'        // Sharingan comma dot — Itachi
  | 'star'         // 5-pointed star — All Might
  | 'orb'          // glowing circle — Goku / Gojo
  | 'infinity'     // ∞ path — Gojo
  | 'kunai'        // throwing blade — Itachi
  | 'fist'         // power fist — All Might
  | 'scroll'       // ninja scroll — Jiraiya
  | 'sakura';      // cherry blossom petal — generic

// ─── Particle definition ──────────────────────────────────────────────────────
export interface ParticleDef {
  shape:    ShapeType;
  color:    string;
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

// ─── SVG shape renderers ──────────────────────────────────────────────────────
function ShapeSvg({ shape, color, size }: { shape: ShapeType; color: string; size: number }) {
  const s = size;
  switch (shape) {

    case 'flame':
      return (
        <Svg width={s} height={s * 1.5} viewBox="0 0 40 60">
          <Path
            d="M20 58 C8 50 4 40 8 30 C10 24 14 20 12 12 C18 18 16 24 20 28 C22 20 24 12 20 2 C32 12 36 28 32 40 C30 46 28 50 20 58 Z"
            fill={color}
            opacity={0.9}
          />
          <Path
            d="M20 54 C12 46 12 36 16 28 C18 34 18 38 22 40 C20 34 22 26 20 18 C28 26 28 38 24 46 C22 50 21 52 20 54 Z"
            fill="#FFF9C4"
            opacity={0.7}
          />
        </Svg>
      );

    case 'lightning':
      return (
        <Svg width={s * 0.65} height={s} viewBox="0 0 26 40">
          <Path
            d="M18 2 L6 22 L13 22 L8 38 L22 16 L15 16 Z"
            fill={color}
            opacity={0.95}
          />
          <Path
            d="M17 4 L8 20 L13.5 20 L9 34 L20 18 L15 18 Z"
            fill="#FFFDE7"
            opacity={0.6}
          />
        </Svg>
      );

    case 'snowflake':
      return (
        <Svg width={s} height={s} viewBox="0 0 40 40">
          <G stroke={color} strokeWidth="2.2" strokeLinecap="round">
            <Line x1="20" y1="4"  x2="20" y2="36" />
            <Line x1="4"  y1="20" x2="36" y2="20" />
            <Line x1="8"  y1="8"  x2="32" y2="32" />
            <Line x1="32" y1="8"  x2="8"  y2="32" />
            {/* branch ticks */}
            <Line x1="20" y1="10" x2="15" y2="6" />
            <Line x1="20" y1="10" x2="25" y2="6" />
            <Line x1="20" y1="30" x2="15" y2="34" />
            <Line x1="20" y1="30" x2="25" y2="34" />
            <Line x1="10" y1="20" x2="6"  y2="15" />
            <Line x1="10" y1="20" x2="6"  y2="25" />
            <Line x1="30" y1="20" x2="34" y2="15" />
            <Line x1="30" y1="20" x2="34" y2="25" />
          </G>
          <Circle cx="20" cy="20" r="3" fill={color} opacity={0.9} />
        </Svg>
      );

    case 'feather':
      return (
        <Svg width={s * 0.5} height={s} viewBox="0 0 20 40">
          <Path
            d="M10 38 C10 38 2 28 3 18 C4 10 8 4 10 2 C12 4 16 10 17 18 C18 28 10 38 10 38 Z"
            fill={color}
            opacity={0.75}
          />
          <Path
            d="M10 38 L10 8"
            stroke="#ECEFF1"
            strokeWidth="0.8"
            opacity={0.5}
          />
          {[8, 14, 20, 26, 32].map(y => (
            <React.Fragment key={y}>
              <Line x1="10" y1={y} x2={5 + (40-y)*0.15} y2={y-3} stroke={color} strokeWidth="0.6" opacity={0.5} />
              <Line x1="10" y1={y} x2={15 - (40-y)*0.15} y2={y-3} stroke={color} strokeWidth="0.6" opacity={0.5} />
            </React.Fragment>
          ))}
        </Svg>
      );

    case 'leaf':
      return (
        <Svg width={s * 0.75} height={s} viewBox="0 0 30 40">
          <Path
            d="M15 38 C4 28 2 16 6 8 C8 4 12 2 15 2 C18 2 22 4 24 8 C28 16 26 28 15 38 Z"
            fill={color}
            opacity={0.80}
          />
          <Path
            d="M15 36 L15 8"
            stroke="#C8E6C9"
            strokeWidth="0.9"
            opacity={0.55}
          />
          {[10, 16, 22, 28].map(y => (
            <React.Fragment key={y}>
              <Line x1="15" y1={y} x2={8}  y2={y+3} stroke="#C8E6C9" strokeWidth="0.6" opacity={0.45} />
              <Line x1="15" y1={y} x2={22} y2={y+3} stroke="#C8E6C9" strokeWidth="0.6" opacity={0.45} />
            </React.Fragment>
          ))}
        </Svg>
      );

    case 'toad':
      return (
        <Svg width={s} height={s * 0.75} viewBox="0 0 40 30">
          <Ellipse cx="20" cy="18" rx="16" ry="10" fill={color} opacity={0.80} />
          {/* eyes */}
          <Circle cx="11" cy="10" r="5" fill={color} opacity={0.9} />
          <Circle cx="29" cy="10" r="5" fill={color} opacity={0.9} />
          <Circle cx="12" cy="9"  r="2.5" fill="#1B5E20" />
          <Circle cx="30" cy="9"  r="2.5" fill="#1B5E20" />
          <Circle cx="13" cy="8"  r="1"   fill="#FFFFFF" opacity={0.6} />
          <Circle cx="31" cy="8"  r="1"   fill="#FFFFFF" opacity={0.6} />
          {/* mouth */}
          <Path d="M14 22 Q20 26 26 22" stroke="#1B5E20" strokeWidth="1.2" fill="none" opacity={0.7} />
        </Svg>
      );

    case 'tomoe':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24">
          <Path
            d="M12 4 A8 8 0 1 1 4 12 A4 4 0 1 0 12 4 Z"
            fill={color}
            opacity={0.90}
          />
          <Circle cx="12" cy="4" r="2.5" fill={color} opacity={0.9} />
        </Svg>
      );

    case 'star':
      return (
        <Svg width={s} height={s} viewBox="0 0 40 40">
          <Polygon
            points="20,3 24,14 36,14 26,22 30,33 20,26 10,33 14,22 4,14 16,14"
            fill={color}
            opacity={0.95}
          />
          <Polygon
            points="20,8 23,15 31,15 25,20 27,28 20,23 13,28 15,20 9,15 17,15"
            fill="#FFF9C4"
            opacity={0.5}
          />
        </Svg>
      );

    case 'orb':
      return (
        <Svg width={s} height={s} viewBox="0 0 40 40">
          <Circle cx="20" cy="20" r="14" fill={color} opacity={0.25} />
          <Circle cx="20" cy="20" r="9"  fill={color} opacity={0.55} />
          <Circle cx="20" cy="20" r="5"  fill={color} opacity={0.90} />
          <Circle cx="15" cy="15" r="2.5" fill="#FFFFFF" opacity={0.45} />
        </Svg>
      );

    case 'infinity': {
      // Lemniscate of Bernoulli approximated with bezier
      return (
        <Svg width={s * 1.8} height={s} viewBox="0 0 72 40">
          <Path
            d="M36 20 C36 10 48 4 56 10 C64 16 64 24 56 30 C48 36 36 30 36 20 C36 10 24 4 16 10 C8 16 8 24 16 30 C24 36 36 30 36 20 Z"
            stroke={color}
            strokeWidth="3.5"
            fill="none"
            opacity={0.85}
            strokeLinecap="round"
          />
        </Svg>
      );
    }

    case 'kunai':
      return (
        <Svg width={s * 0.45} height={s} viewBox="0 0 18 40">
          {/* blade */}
          <Path d="M9 2 L14 20 L9 22 L4 20 Z" fill={color} opacity={0.85} />
          {/* handle */}
          <Path d="M8 22 L8 34 L10 34 L10 22 Z" fill={color} opacity={0.6} />
          {/* ring */}
          <Circle cx="9" cy="37" r="2.5" stroke={color} strokeWidth="1.5" fill="none" opacity={0.7} />
        </Svg>
      );

    case 'fist':
      return (
        <Svg width={s} height={s} viewBox="0 0 40 40">
          {/* simplified fist silhouette */}
          <Path
            d="M10 26 C8 22 8 16 12 12 L14 10 L18 10 L18 8 L22 8 L22 10 L26 10 L26 12 L30 12 L30 18 C30 22 28 26 24 28 L24 32 C24 34 22 36 20 36 L16 36 C14 36 12 34 12 32 L12 28 Z"
            fill={color}
            opacity={0.85}
          />
          {/* knuckle highlights */}
          {[16, 20, 24].map(x => (
            <Circle key={x} cx={x} cy="12" r="1.8" fill="#FFFFFF" opacity={0.35} />
          ))}
        </Svg>
      );

    case 'scroll':
      return (
        <Svg width={s} height={s * 0.75} viewBox="0 0 40 30">
          {/* scroll body */}
          <Path d="M6 6 L34 6 L34 24 L6 24 Z" fill={color} opacity={0.55} />
          {/* end rolls */}
          <Ellipse cx="6"  cy="15" rx="3.5" ry="9" fill={color} opacity={0.8} />
          <Ellipse cx="34" cy="15" rx="3.5" ry="9" fill={color} opacity={0.8} />
          {/* lines on scroll */}
          {[10, 14, 18, 22].map(y => (
            <Line key={y} x1="11" y1={y} x2="29" y2={y} stroke="#FFFFFF" strokeWidth="0.8" opacity={0.30} />
          ))}
        </Svg>
      );

    case 'sakura':
      return (
        <Svg width={s} height={s} viewBox="0 0 40 40">
          {[0, 72, 144, 216, 288].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const cx = 20 + 10 * Math.cos(rad);
            const cy = 20 + 10 * Math.sin(rad);
            return (
              <Ellipse
                key={i}
                cx={cx} cy={cy}
                rx="7" ry="4.5"
                fill={color}
                opacity={0.80}
                transform={`rotate(${angle} ${cx} ${cy})`}
              />
            );
          })}
          <Circle cx="20" cy="20" r="3.5" fill="#FFF9C4" opacity={0.90} />
        </Svg>
      );

    default:
      return null;
  }
}

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

  // ── ITACHI ── crows, Sharingan tomoe, feathers, darkness & red moon
  itachi: {
    bg:           ['#030003', '#0D0008', '#180010'],
    glow:         '#C41030',
    accent:       '#A855F7',
    sigil:        '👁️',
    sigilRotates: false,
    particles: [
      { shape: 'feather', color: '#9C1E2E', x: SW*0.08, y:  80, size: 36, opacity: 0.55, floatY: 28, floatDur: 4500, pulseDur: 3500, phase: 0.0, drift: 12 },
      { shape: 'feather', color: '#6B0F1A', x: SW*0.72, y: 200, size: 28, opacity: 0.42, floatY: 32, floatDur: 5200, pulseDur: 4000, phase: 0.6, drift: -8 },
      { shape: 'feather', color: '#7B2D3A', x: SW*0.38, y: 420, size: 32, opacity: 0.38, floatY: 24, floatDur: 4800, pulseDur: 3200, phase: 0.3, drift: 10 },
      { shape: 'feather', color: '#5C0814', x: SW*0.85, y: 340, size: 24, opacity: 0.30, floatY: 20, floatDur: 5600, pulseDur: 4200, phase: 0.8, drift: -6 },
      { shape: 'tomoe',   color: '#C41030', x: SW*0.47, y: 158, size: 16, opacity: 0.65, floatY:  8, floatDur: 2800, pulseDur: 1800, phase: 0.00, glow: '#C41030', glowR: 20 },
      { shape: 'tomoe',   color: '#C41030', x: SW*0.56, y: 175, size: 16, opacity: 0.58, floatY:  8, floatDur: 2800, pulseDur: 1800, phase: 0.33, glow: '#C41030', glowR: 20 },
      { shape: 'tomoe',   color: '#C41030', x: SW*0.39, y: 175, size: 16, opacity: 0.58, floatY:  8, floatDur: 2800, pulseDur: 1800, phase: 0.66, glow: '#C41030', glowR: 20 },
      { shape: 'kunai',   color: '#C0C0C0', x: SW*0.82, y: 480, size: 28, opacity: 0.30, floatY: 14, floatDur: 4200, pulseDur: 3200, phase: 0.5 },
      { shape: 'orb',     color: '#A855F7', x: SW*0.22, y: 580, size: 18, opacity: 0.28, floatY: 10, floatDur: 3100, pulseDur: 2200, phase: 0.2 },
    ],
  },

  // ── GOKU ── lightning, ki orbs, rising fire, power aura
  goku: {
    bg:           ['#06040E', '#120800', '#1E1000'],
    glow:         '#F5C518',
    accent:       '#3B82F6',
    sigil:        '☯',
    sigilRotates: true,
    particles: [
      { shape: 'lightning', color: '#F5C518', x: SW*0.06, y:  90, size: 36, opacity: 0.65, floatY: 18, floatDur: 2400, pulseDur: 1800, phase: 0.0, glow: '#F5C518', glowR: 32 },
      { shape: 'lightning', color: '#FFF176', x: SW*0.78, y: 170, size: 28, opacity: 0.50, floatY: 22, floatDur: 2900, pulseDur: 2200, phase: 0.4 },
      { shape: 'lightning', color: '#F5C518', x: SW*0.40, y: 460, size: 22, opacity: 0.42, floatY: 16, floatDur: 3200, pulseDur: 2400, phase: 0.7 },
      { shape: 'flame',     color: '#FF6F00', x: SW*0.12, y: 490, size: 36, opacity: 0.45, floatY:  0, floatDur: 2000, pulseDur: 1400, phase: 0.2, rise: true },
      { shape: 'flame',     color: '#FF8F00', x: SW*0.66, y: 510, size: 30, opacity: 0.38, floatY:  0, floatDur: 2300, pulseDur: 1700, phase: 0.5, rise: true },
      { shape: 'orb',       color: '#F5C518', x: SW*0.50, y: 260, size: 32, opacity: 0.18, floatY: 10, floatDur: 4200, pulseDur: 3200, phase: 0.5, glow: '#F5C518', glowR: 56 },
      { shape: 'orb',       color: '#3B82F6', x: SW*0.25, y: 360, size: 24, opacity: 0.32, floatY: 14, floatDur: 3400, pulseDur: 2400, phase: 0.3, glow: '#3B82F6', glowR: 28 },
      { shape: 'star',      color: '#F5C518', x: SW*0.34, y: 140, size: 20, opacity: 0.50, floatY: 10, floatDur: 2000, pulseDur: 1600, phase: 0.1, glow: '#F5C518', glowR: 22 },
    ],
  },

  // ── RENGOKU ── rising flames, sun, flame blade, sparks
  rengoku: {
    bg:           ['#0E0200', '#200700', '#320E00'],
    glow:         '#FF5500',
    accent:       '#FACC15',
    sigil:        '炎',
    sigilRotates: false,
    particles: [
      { shape: 'flame', color: '#FF5500', x: SW*0.08, y: 600, size: 44, opacity: 0.80, floatY: 0, floatDur: 1800, pulseDur: 1300, phase: 0.0, rise: true },
      { shape: 'flame', color: '#FF6D00', x: SW*0.28, y: 620, size: 36, opacity: 0.70, floatY: 0, floatDur: 2200, pulseDur: 1600, phase: 0.3, rise: true },
      { shape: 'flame', color: '#FF4500', x: SW*0.52, y: 608, size: 40, opacity: 0.75, floatY: 0, floatDur: 2000, pulseDur: 1500, phase: 0.6, rise: true },
      { shape: 'flame', color: '#FF6D00', x: SW*0.76, y: 615, size: 34, opacity: 0.65, floatY: 0, floatDur: 2400, pulseDur: 1800, phase: 0.2, rise: true },
      { shape: 'flame', color: '#FF5500', x: SW*0.94, y: 600, size: 28, opacity: 0.55, floatY: 0, floatDur: 2600, pulseDur: 2000, phase: 0.8, rise: true },
      { shape: 'star',  color: '#FACC15', x: SW*0.22, y: 300, size: 24, opacity: 0.55, floatY: 16, floatDur: 2800, pulseDur: 2000, phase: 0.4, glow: '#FACC15', glowR: 32 },
      { shape: 'star',  color: '#FF8F00', x: SW*0.70, y: 380, size: 18, opacity: 0.42, floatY: 12, floatDur: 3200, pulseDur: 2400, phase: 0.7 },
      { shape: 'orb',   color: '#FACC15', x: SW*0.44, y: 110, size: 36, opacity: 0.22, floatY:  8, floatDur: 5000, pulseDur: 4000, phase: 0.7, glow: '#FF5500', glowR: 60 },
      { shape: 'sakura', color: '#FF8A65', x: SW*0.14, y: 160, size: 22, opacity: 0.35, floatY: 14, floatDur: 3400, pulseDur: 2600, phase: 0.5, drift: 8 },
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
      { shape: 'leaf',   color: '#2E7D32', x: SW*0.08, y: 120, size: 34, opacity: 0.60, floatY: 22, floatDur: 4500, pulseDur: 3500, phase: 0.0, drift: 14 },
      { shape: 'leaf',   color: '#388E3C', x: SW*0.72, y: 240, size: 26, opacity: 0.52, floatY: 26, floatDur: 5200, pulseDur: 4000, phase: 0.5, drift: -10 },
      { shape: 'leaf',   color: '#1B5E20', x: SW*0.40, y: 360, size: 22, opacity: 0.40, floatY: 18, floatDur: 5800, pulseDur: 4500, phase: 0.8, drift: 8 },
      { shape: 'toad',   color: '#558B2F', x: SW*0.12, y: 420, size: 40, opacity: 0.55, floatY: 10, floatDur: 3600, pulseDur: 2800, phase: 0.3, glow: '#82C820', glowR: 38 },
      { shape: 'toad',   color: '#33691E', x: SW*0.74, y: 500, size: 30, opacity: 0.38, floatY:  8, floatDur: 4200, pulseDur: 3400, phase: 0.7 },
      { shape: 'scroll', color: '#F59E0B', x: SW*0.52, y: 175, size: 34, opacity: 0.42, floatY: 12, floatDur: 3900, pulseDur: 2800, phase: 0.2 },
      { shape: 'orb',    color: '#29B6F6', x: SW*0.82, y: 360, size: 20, opacity: 0.42, floatY: 22, floatDur: 3200, pulseDur: 2300, phase: 0.4 },
      { shape: 'orb',    color: '#4FC3F7', x: SW*0.28, y: 280, size: 16, opacity: 0.35, floatY: 18, floatDur: 3800, pulseDur: 2900, phase: 0.6 },
      { shape: 'sakura', color: '#A5D6A7', x: SW*0.26, y: 480, size: 30, opacity: 0.22, floatY: 16, floatDur: 5600, pulseDur: 4600, phase: 0.6, glow: '#82C820', glowR: 52 },
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
      { shape: 'infinity',  color: '#38C4F0', x: SW*0.20, y: 130, size: 38, opacity: 0.52, floatY: 8, floatDur: 3000, pulseDur: 2000, phase: 0.0, rotate: true, glow: '#38C4F0', glowR: 64 },
      { shape: 'snowflake', color: '#81D4FA', x: SW*0.06, y: 250, size: 28, opacity: 0.62, floatY: 16, floatDur: 2600, pulseDur: 2000, phase: 0.3 },
      { shape: 'snowflake', color: '#4FC3F7', x: SW*0.78, y: 400, size: 24, opacity: 0.52, floatY: 20, floatDur: 3200, pulseDur: 2600, phase: 0.7 },
      { shape: 'snowflake', color: '#B3E5FC', x: SW*0.50, y: 500, size: 18, opacity: 0.40, floatY: 14, floatDur: 3800, pulseDur: 3000, phase: 0.5 },
      { shape: 'orb',       color: '#38C4F0', x: SW*0.14, y: 500, size: 32, opacity: 0.52, floatY: 6, floatDur: 2400, pulseDur: 1800, phase: 0.2, glow: '#38C4F0', glowR: 44 },
      { shape: 'infinity',  color: '#A855F7', x: SW*0.48, y: 330, size: 26, opacity: 0.28, floatY: 16, floatDur: 4200, pulseDur: 3200, phase: 0.6, rotate: true },
      { shape: 'star',      color: '#E0F7FA', x: SW*0.70, y: 160, size: 22, opacity: 0.65, floatY: 10, floatDur: 2000, pulseDur: 1600, phase: 0.1 },
      { shape: 'orb',       color: '#A855F7', x: SW*0.82, y: 280, size: 20, opacity: 0.25, floatY: 12, floatDur: 4000, pulseDur: 3000, phase: 0.4, glow: '#A855F7', glowR: 36 },
      { shape: 'orb',       color: '#38C4F0', x: SW*0.26, y: 380, size: 14, opacity: 0.40, floatY: 8,  floatDur: 2400, pulseDur: 1900, phase: 0.8 },
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
      { shape: 'star',      color: '#FBBF24', x: SW*0.10, y: 140, size: 34, opacity: 0.68, floatY: 14, floatDur: 2200, pulseDur: 1700, phase: 0.0, glow: '#FBBF24', glowR: 42 },
      { shape: 'star',      color: '#FDE68A', x: SW*0.76, y: 280, size: 26, opacity: 0.56, floatY: 18, floatDur: 2700, pulseDur: 2100, phase: 0.5 },
      { shape: 'star',      color: '#FBBF24', x: SW*0.44, y: 480, size: 20, opacity: 0.44, floatY: 12, floatDur: 3100, pulseDur: 2500, phase: 0.7 },
      { shape: 'fist',      color: '#FBBF24', x: SW*0.18, y: 340, size: 38, opacity: 0.45, floatY: 10, floatDur: 3000, pulseDur: 2400, phase: 0.3, glow: '#FBBF24', glowR: 44 },
      { shape: 'orb',       color: '#3B82F6', x: SW*0.34, y: 180, size: 28, opacity: 0.30, floatY: 16, floatDur: 4200, pulseDur: 3200, phase: 0.4, glow: '#3B82F6', glowR: 48 },
      { shape: 'orb',       color: '#60A5FA', x: SW*0.70, y: 440, size: 22, opacity: 0.24, floatY: 14, floatDur: 4800, pulseDur: 3800, phase: 0.6, glow: '#3B82F6', glowR: 36 },
      { shape: 'lightning', color: '#FBBF24', x: SW*0.60, y: 120, size: 30, opacity: 0.55, floatY: 18, floatDur: 2400, pulseDur: 1900, phase: 0.2 },
      { shape: 'lightning', color: '#FDE68A', x: SW*0.88, y: 380, size: 24, opacity: 0.44, floatY: 16, floatDur: 2800, pulseDur: 2200, phase: 0.8 },
      { shape: 'star',      color: '#FBBF24', x: SW*0.56, y: 540, size: 18, opacity: 0.58, floatY: 10, floatDur: 2000, pulseDur: 1600, phase: 0.1 },
    ],
  },
};

// ─── Single animated particle ─────────────────────────────────────────────────
function Particle({ def, reducedMotion }: { def: ParticleDef; reducedMotion: boolean }) {
  const translateY = useRef(new Animated.Value(
    def.rise ? 0 : def.floatY * Math.sin(def.phase * Math.PI * 2)
  )).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(
    def.opacity * (0.5 + 0.5 * Math.cos(def.phase * Math.PI * 2))
  )).current;
  const rotation   = useRef(new Animated.Value(def.phase)).current;

  useEffect(() => {
    if (reducedMotion) {
      translateY.setValue(0);
      translateX.setValue(0);
      opacity.setValue(Math.max(0.2, def.opacity * 0.75));
      return;
    }

    if (def.rise) {
      Animated.loop(
        Animated.timing(translateY, { toValue: -300, duration: def.floatDur * 3, useNativeDriver: true })
      ).start();
      Animated.loop(Animated.sequence([
        Animated.timing(opacity, { toValue: def.opacity,        duration: def.pulseDur * 0.3, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: def.opacity * 0.05, duration: def.pulseDur * 1.7, useNativeDriver: true }),
      ])).start();
      return;
    }

    Animated.loop(Animated.sequence([
      Animated.timing(translateY, { toValue:  def.floatY,  duration: def.floatDur / 2, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -def.floatY,  duration: def.floatDur,     useNativeDriver: true }),
      Animated.timing(translateY, { toValue:  0,           duration: def.floatDur / 2, useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: def.opacity * 0.18, duration: def.pulseDur / 2, useNativeDriver: true }),
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
  }, [def.opacity, def.pulseDur, def.rise, def.drift, def.floatDur, def.floatY, def.phase, def.rotate, opacity, reducedMotion, rotation, translateX, translateY]);

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
      <ShapeSvg shape={def.shape} color={def.color} size={def.size} />
    </Animated.View>
  );
}

// ─── Background aura pulse ────────────────────────────────────────────────────
function Aura({ color, reducedMotion }: { color: string; reducedMotion: boolean }) {
  const scale = useRef(new Animated.Value(0.88)).current;
  const opac  = useRef(new Animated.Value(0.06)).current;

  useEffect(() => {
    if (reducedMotion) {
      scale.setValue(1);
      opac.setValue(0.08);
      return;
    }
    Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: 1.10, duration: 3600, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.88, duration: 3600, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(opac, { toValue: 0.22, duration: 3600, useNativeDriver: true }),
      Animated.timing(opac, { toValue: 0.04, duration: 3600, useNativeDriver: true }),
    ])).start();
  }, [opac, reducedMotion, scale]);

  return (
    <Animated.View style={[styles.aura, {
      backgroundColor: color,
      opacity: opac,
      transform: [{ scale }],
    }]} />
  );
}

// ─── Large faint sigil in background ─────────────────────────────────────────
function Sigil({
  symbol,
  color,
  rotates,
  reducedMotion,
}: {
  symbol: string;
  color: string;
  rotates: boolean;
  reducedMotion: boolean;
}) {
  const opac     = useRef(new Animated.Value(0.04)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      opac.setValue(0.045);
      rotation.setValue(0);
      return;
    }
    Animated.loop(Animated.sequence([
      Animated.timing(opac, { toValue: 0.09, duration: 5000, useNativeDriver: true }),
      Animated.timing(opac, { toValue: 0.03, duration: 5000, useNativeDriver: true }),
    ])).start();
    if (rotates) {
      Animated.loop(
        Animated.timing(rotation, { toValue: 1, duration: 20000, useNativeDriver: true })
      ).start();
    }
  }, [opac, reducedMotion, rotates, rotation]);

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
  reducedMotion = false,
}: {
  coachId:   CoachId;
  screen?:   ScreenKey;
  tappable?: boolean;
  reducedMotion?: boolean;
}) {
  const ambient = AMBIENTS[coachId] ?? AMBIENTS.goku;
  const [showPortrait, setShowPortrait] = useState(false);
  const ctaPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      ctaPulse.setValue(0);
      return;
    }
    if (!tappable) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ctaPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(ctaPulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [ctaPulse, reducedMotion, tappable]);

  const ctaScale = ctaPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });
  const ctaOpacity = ctaPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.78, 1],
  });
  const isTopPlacement = screen === 'diario' || screen === 'config';

  return (
    <>
      <View
        style={styles.container}
        pointerEvents="none"
      >
        <Aura color={ambient.glow} reducedMotion={reducedMotion} />
        <Sigil
          symbol={ambient.sigil}
          color={ambient.glow}
          rotates={ambient.sigilRotates}
          reducedMotion={reducedMotion}
        />

        {ambient.particles.map((def, i) => (
          <Particle key={i} def={def} reducedMotion={reducedMotion} />
        ))}
      </View>

      {tappable && (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
          <AnimatedTouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowPortrait(true)}
            style={[
              styles.portalBtn,
              isTopPlacement ? styles.portalBtnTop : styles.portalBtnBottom,
              {
                borderColor: ambient.glow + '66',
                transform: [{ scale: ctaScale }],
                opacity: ctaOpacity,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Invocar coach en pantalla completa"
          >
            <LinearGradient
              colors={[ambient.glow + '44', 'rgba(5,5,10,0.7)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.portalInner}
            >
              <Text style={styles.portalSymbol}>{ambient.sigil}</Text>
              <Text style={[styles.portalLabel, { color: ambient.glow }]}>Invocar</Text>
            </LinearGradient>
          </AnimatedTouchableOpacity>
        </View>
      )}

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
  portalBtn: {
    position: 'absolute',
    right: 14,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 20,
  },
  portalBtnBottom: { bottom: 112 },
  portalBtnTop: { top: 96 },
  portalInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  portalSymbol: {
    color: '#F5F0FF',
    fontSize: 14,
    fontWeight: '900',
  },
  portalLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
