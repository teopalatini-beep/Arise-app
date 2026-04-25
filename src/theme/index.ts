export const COLORS = {
  // Fondos — gradiente oscuro azul/índigo
  bg0:        '#080C14',   // negro azulado profundo
  bg1:        '#0D1628',   // azul muy oscuro
  bg2:        '#111E35',   // azul oscuro
  bgCard:     'rgba(255,255,255,0.06)',
  bgCardHover:'rgba(255,255,255,0.10)',

  // Acentos principales
  accent:     '#4895EF',   // azul brillante
  accentDark: '#2563EB',
  purple:     '#9B59B6',
  purpleLight:'#C084FC',

  // Colores de estado
  success:    '#34D399',   // verde turquesa
  warning:    '#FBBF24',   // amarillo
  danger:     '#F87171',   // rojo suave
  streak:     '#FB923C',   // naranja (racha)

  // Textos
  textPrimary:   '#F0F4FF',
  textSecondary: '#8899BB',
  textMuted:     '#4A5568',

  // Separadores
  border:     'rgba(255,255,255,0.08)',
  borderFocus:'rgba(72,149,239,0.5)',

  // Categorías de tareas
  cuerpo:        '#FF6B6B',
  mente:         '#4FC3F7',
  bienestar:     '#68D391',
  productividad: '#F6E05E',
};

export const GRADIENTS = {
  background:  ['#080C14', '#0D1628', '#111E35'] as string[],
  accent:      ['#4895EF', '#9B59B6'] as string[],
  card:        ['rgba(72,149,239,0.15)', 'rgba(155,89,182,0.08)'] as string[],
  streak:      ['#FB923C', '#EF4444'] as string[],
  success:     ['#34D399', '#059669'] as string[],
  header:      ['rgba(8,12,20,0)', 'rgba(8,12,20,0.95)'] as string[],
};

export const FONT = {
  xs:    11,
  sm:    13,
  base:  15,
  md:    17,
  lg:    20,
  xl:    24,
  xxl:   30,
  xxxl:  38,
};

export const RADIUS = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  full: 999,
};

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const SHADOW = {
  card: {
    shadowColor: '#4895EF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  glow: {
    shadowColor: '#4895EF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
};
