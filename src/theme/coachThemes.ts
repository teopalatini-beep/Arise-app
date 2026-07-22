/**
 * coachThemes.ts — Mapa de diseño centralizado "Solo Leveling Core".
 *
 * Cada Guild Master (coach) expone un set completo de tokens visuales para que la
 * UI mute por completo según el sensei elegido: paleta, tipografía, glow tipo Ki,
 * estilo de borde y descriptores de inmersión. Reutiliza los colores base de
 * COACH_VISUALS (fuente única de color) y agrega la capa RPG por encima.
 *
 * Consumo: useCoachTheme() (hook) → tokens del coach activo del usuario.
 */

import { CoachId } from '../types';
import { COACH_VISUALS, getCoachById } from '../lib/coach';

// ── Vocabulario de estilo (tokens de alto nivel) ──────────────────────────────
export type CoachTypography =
  | 'aggressive'  // Goku — pesada, gritada
  | 'precise'     // Itachi — filosa, controlada
  | 'minimal'     // Gojo — limpia, espaciada, premium
  | 'ember'       // Rengoku — cálida, ardiente
  | 'sage'        // Jiraiya — orgánica, serena
  | 'heroic';     // All Might — monumental, brillante

export type CoachBorderStyle =
  | 'ember-frame'   // borde cálido con brillo
  | 'deep-shadow'   // borde oscuro con sombra profunda
  | 'thin-glow'     // hiper-fino brillante (premium)
  | 'natural'       // suave, terroso
  | 'bold-frame';   // marco grueso heroico

export interface CoachGlow {
  /** Color del glow (halo tipo Ki / aura). */
  color: string;
  /** Opacidad del glow, 0–1. */
  intensity: number;
  /** Radio del glow en px (shadowRadius). */
  radius: number;
}

/**
 * Contrato completo de un tema de coach. Es la fuente de verdad del theming
 * dinámico: cualquier pantalla que consuma useCoachTheme() recibe este objeto.
 */
export interface CoachTheme {
  id: CoachId;
  name: string;
  /** Rango/título inmersivo mostrado en headers ("Modo Infinito"). */
  title: string;
  /** Mantra corto del coach para momentos de inmersión. */
  mantra: string;

  // ── Paleta ──────────────────────────────────────────────────────────────
  background: [string, string, string];
  accentPrimary: string;
  accentSecondary: string;
  gradientAccent: [string, string];
  surface: string;
  surfaceBorder: string;
  tabActive: string;
  tabBorder: string;
  textOnAccent: string;

  // ── Tokens de inmersión RPG ───────────────────────────────────────────────
  typography: CoachTypography;
  fontWeightHeavy: '700' | '800' | '900';
  letterSpacing: number;
  borderStyle: CoachBorderStyle;
  borderWidth: number;
  glow: CoachGlow;

  // ── Aura / partículas ─────────────────────────────────────────────────────
  auraEmoji: string;
  particleColor: string;
}

// Helper: deriva la base de color desde COACH_VISUALS para no duplicar paletas.
function baseOf(id: CoachId) {
  const v = COACH_VISUALS[id];
  return {
    background: v.background,
    accentPrimary: v.accent[0],
    accentSecondary: v.accent[1],
    gradientAccent: v.accent,
    surface: v.cardBackground,
    surfaceBorder: v.cardBorder,
    tabActive: v.tabActive,
    tabBorder: v.tabBorder,
    title: v.headerLabel,
    particleColor: v.glowColor,
  };
}

// ── Mapa central de temas ─────────────────────────────────────────────────────
export const COACH_THEMES: Record<CoachId, CoachTheme> = {
  // Goku — naranja/dorado energético, tipografía agresiva, glow tipo Ki.
  goku: {
    id: 'goku',
    name: getCoachById('goku').name,
    ...baseOf('goku'),
    mantra: 'Supera tu límite de ayer. Otra vez.',
    typography: 'aggressive',
    fontWeightHeavy: '900',
    letterSpacing: 1.5,
    borderStyle: 'ember-frame',
    borderWidth: 1.5,
    glow: { color: '#F5C518', intensity: 0.5, radius: 18 },
    textOnAccent: '#1A0E00',
    auraEmoji: '⚡',
  },

  // Gojo — morado/azul infinito, negro premium, minimalista, bordes hiper-finos.
  gojo: {
    id: 'gojo',
    name: getCoachById('gojo').name,
    ...baseOf('gojo'),
    mantra: 'Domina tu espacio. Nada te alcanza.',
    typography: 'minimal',
    fontWeightHeavy: '800',
    letterSpacing: 3,
    borderStyle: 'thin-glow',
    borderWidth: 1,
    glow: { color: '#38C4F0', intensity: 0.35, radius: 26 },
    textOnAccent: '#00121C',
    auraEmoji: '♾️',
  },

  // Itachi — carmesí/cuervo, sombras profundas, mística.
  itachi: {
    id: 'itachi',
    name: getCoachById('itachi').name,
    ...baseOf('itachi'),
    mantra: 'El verdadero poder es dominarte a vos mismo.',
    typography: 'precise',
    fontWeightHeavy: '800',
    letterSpacing: 2,
    borderStyle: 'deep-shadow',
    borderWidth: 1,
    glow: { color: '#C41230', intensity: 0.45, radius: 16 },
    textOnAccent: '#160006',
    auraEmoji: '🩸',
  },

  // Rengoku — fuego ámbar, corazón ardiente.
  rengoku: {
    id: 'rengoku',
    name: getCoachById('rengoku').name,
    ...baseOf('rengoku'),
    mantra: 'Pon tu corazón en llamas. Hoy no se negocia.',
    typography: 'ember',
    fontWeightHeavy: '900',
    letterSpacing: 1.5,
    borderStyle: 'ember-frame',
    borderWidth: 1.5,
    glow: { color: '#FF5500', intensity: 0.5, radius: 20 },
    textOnAccent: '#1A0800',
    auraEmoji: '🔥',
  },

  // Jiraiya — verde bosque, sabio, orgánico.
  jiraiya: {
    id: 'jiraiya',
    name: getCoachById('jiraiya').name,
    ...baseOf('jiraiya'),
    mantra: 'El camino del sabio es largo, pero no tiene límite.',
    typography: 'sage',
    fontWeightHeavy: '700',
    letterSpacing: 1,
    borderStyle: 'natural',
    borderWidth: 1,
    glow: { color: '#7AB828', intensity: 0.4, radius: 18 },
    textOnAccent: '#0A1400',
    auraEmoji: '🍃',
  },

  // All Might — azul/dorado heroico, monumental.
  all_might: {
    id: 'all_might',
    name: getCoachById('all_might').name,
    ...baseOf('all_might'),
    mantra: 'GO BEYOND. PLUS ULTRA.',
    typography: 'heroic',
    fontWeightHeavy: '900',
    letterSpacing: 2,
    borderStyle: 'bold-frame',
    borderWidth: 2,
    glow: { color: '#3B82F6', intensity: 0.45, radius: 20 },
    textOnAccent: '#00081A',
    auraEmoji: '💪',
  },
};

/** Devuelve el tema del coach indicado (default: Goku). */
export function getCoachTheme(coachId?: CoachId): CoachTheme {
  if (!coachId) return COACH_THEMES.goku;
  return COACH_THEMES[coachId] ?? COACH_THEMES.goku;
}
