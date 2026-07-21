/**
 * ARISE design tokens — Dark Luxury Performance.
 * Refs: charcoal + gold accents, glass cards, cinematic dark (no purple anime).
 * Architecture: Primitive → Semantic → Component.
 */

/** Primitive surfaces — warm near-black (less smear than pure void alone on cards) */
export const SURFACES = {
  base: '#050505',
  raised: '#0A0A0A',
  elevated: '#121212',
  overlay: '#1A1A1A',
  glass: 'rgba(255,255,255,0.045)',
  glassHover: 'rgba(255,255,255,0.07)',
  glassBorder: 'rgba(255,255,255,0.10)',
  glassHighlight: 'rgba(212,175,55,0.14)',
} as const;

/** Primitive ink */
export const INK = {
  primary: '#F5F5F5',
  secondary: '#A8A29E',
  muted: '#78716C',
  inverse: '#0A0A0A',
} as const;

/** Brand metals — gold / amber (luxury refs) + intensity red (performance) */
export const METAL = {
  gold: '#D4AF37',
  goldSoft: '#E8C547',
  goldDim: '#9A7B2F',
  goldWash: 'rgba(212,175,55,0.12)',
  goldBorder: 'rgba(212,175,55,0.28)',
  goldGlow: 'rgba(212,175,55,0.22)',
  intensity: '#E11D48',
  intensityDim: '#9F1239',
} as const;

/** Domain accents (missions) — desaturated to fit luxury dark */
export const DOMAIN = {
  cuerpo: '#F87171',
  mente: '#94A3B8',
  bienestar: '#34D399',
  productividad: '#A8A29E',
  motivacion: '#D4AF37',
} as const;

export const OPACITY = {
  blurBackdrop: 0.72,
  sheetScrim: 0.5,
  accentWash: 0.1,
  accentBorder: 0.22,
  disabled: 0.4,
} as const;

/** Semantic roles — prefer these in screens */
export const SEMANTIC = {
  background: SURFACES.base,
  surface: SURFACES.raised,
  surfaceElevated: SURFACES.elevated,
  surfaceOverlay: SURFACES.overlay,
  onBackground: INK.primary,
  onSurface: INK.primary,
  onSurfaceVariant: INK.secondary,
  onSurfaceMuted: INK.muted,
  primary: METAL.gold,
  onPrimary: INK.inverse,
  primaryPressed: METAL.goldSoft,
  primaryGlow: METAL.goldGlow,
  brand: METAL.gold,
  brandLight: METAL.goldSoft,
  success: '#10B981',
  warning: '#F59E0B',
  destructive: METAL.intensity,
  border: SURFACES.glassBorder,
  borderFocus: METAL.goldBorder,
  borderSubtle: 'rgba(255,255,255,0.14)',
  glass: SURFACES.glass,
  glassHover: SURFACES.glassHover,
  scrim: `rgba(0,0,0,${OPACITY.sheetScrim})`,
} as const;

/** Component display type roles */
export const DISPLAY = {
  hero: {
    line1: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.8, lineHeight: 38 },
    line2: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.8, lineHeight: 38 },
  },
  trustBadge: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.8,
    lineHeight: 16,
    textTransform: 'uppercase' as const,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 23,
    letterSpacing: 0.15,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.8,
    lineHeight: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  cardBody: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 19,
    letterSpacing: 0.1,
  },
} as const;

/** Legacy COLORS — mapped to Dark Luxury */
export const COLORS = {
  bg0: SURFACES.base,
  bg1: SURFACES.raised,
  bg2: SURFACES.elevated,
  bgCard: SURFACES.glass,
  bgCardHover: SURFACES.glassHover,

  accent: SEMANTIC.primary,
  accentDark: SEMANTIC.primaryPressed,
  accentGlow: SEMANTIC.primaryGlow,
  purple: METAL.gold,
  purpleLight: METAL.goldSoft,
  gold: METAL.gold,
  goldLight: METAL.goldSoft,

  success: SEMANTIC.success,
  warning: SEMANTIC.warning,
  danger: SEMANTIC.destructive,
  streak: METAL.gold,

  textPrimary: INK.primary,
  textSecondary: INK.secondary,
  textMuted: INK.muted,

  border: SURFACES.glassBorder,
  borderFocus: SEMANTIC.borderFocus,
  borderGold: METAL.goldBorder,

  cuerpo: DOMAIN.cuerpo,
  mente: DOMAIN.mente,
  bienestar: DOMAIN.bienestar,
  productividad: DOMAIN.productividad,
  motivacion: DOMAIN.motivacion,
};

export const GRADIENTS = {
  background: [SURFACES.base, '#0C0A08', SURFACES.elevated] as const,
  heroMesh: ['rgba(212,175,55,0.14)', 'rgba(212,175,55,0.02)', SURFACES.base] as const,
  accent: [METAL.goldSoft, METAL.gold] as const,
  fire: [METAL.goldSoft, METAL.gold, METAL.goldDim] as const,
  gold: [METAL.goldSoft, METAL.goldDim] as const,
  card: [SURFACES.glass, 'rgba(255,255,255,0.02)'] as const,
  streak: [METAL.goldSoft, METAL.gold] as const,
  success: ['#10B981', '#059669'] as const,
  header: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.97)'] as const,
  intensity: [METAL.intensity, METAL.intensityDim] as const,
  ambient: ['#0A0908', '#12100C', '#0A0A0A'] as const,
};

export const FONT = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  xxl: 30,
  xxxl: 38,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 28,
  xxxl: 32,
  full: 999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const TOUCH = {
  minTarget: 44,
  minGap: 8,
  pressScale: 0.97,
  hitSlop: { top: 10, right: 10, bottom: 10, left: 10 },
} as const;

export const MOTION = {
  microMs: 180,
  enterMs: 260,
  exitMs: 180,
  routeMs: 380,
  staggerMs: 40,
  pressScale: TOUCH.pressScale,
  spring: { damping: 20, stiffness: 90 },
  easeOutBezier: [0.16, 1, 0.3, 1] as const,
} as const;

export const BLUR = {
  header: 20,
  card: 32,
  sheet: 40,
} as const;

export const Z_INDEX = {
  base: 0,
  sticky: 10,
  overlay: 20,
  sheet: 40,
  toast: 100,
  max: 1000,
} as const;

export const ELEVATION = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 10,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.65,
    shadowRadius: 40,
    elevation: 16,
  },
};

export const SHADOW = {
  card: ELEVATION.md,
  glow: {
    shadowColor: METAL.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
};
