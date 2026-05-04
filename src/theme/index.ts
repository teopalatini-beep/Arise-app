export const COLORS = {
  // Fondos — negro absoluto con toque carmesí/índigo (estilo anime)
  bg0:        '#05050A',   // negro absoluto
  bg1:        '#0A0A14',   // negro profundo azulado
  bg2:        '#0F0F1E',   // índigo oscuro
  bgCard:     'rgba(255,255,255,0.05)',
  bgCardHover:'rgba(255,255,255,0.09)',

  // Acentos principales — naranja fuego (chakra) + rojo carmesí
  accent:     '#E8460A',   // naranja fuego — chakra naruto
  accentDark: '#B53508',
  accentGlow: 'rgba(232,70,10,0.35)',
  purple:     '#7C3AED',   // índigo oscuro
  purpleLight:'#A855F7',
  gold:       '#F59E0B',   // dorado super saiyan
  goldLight:  '#FCD34D',

  // Colores de estado
  success:    '#10B981',   // verde esmeralda
  warning:    '#F59E0B',   // ámbar
  danger:     '#EF4444',   // rojo sangre
  streak:     '#F97316',   // naranja llama

  // Textos
  textPrimary:   '#F5F0FF',
  textSecondary: '#9490A8',
  textMuted:     '#6B6880',

  // Separadores
  border:     'rgba(255,255,255,0.07)',
  borderFocus:'rgba(232,70,10,0.6)',
  borderGold: 'rgba(245,158,11,0.4)',

  // Categorías — temática anime
  cuerpo:        '#EF4444',   // rojo — taijutsu / fuerza
  mente:         '#3B82F6',   // azul — ninjutsu / mente
  bienestar:     '#10B981',   // verde — naturaleza / respiración
  productividad: '#F59E0B',   // dorado — super saiyan / enfoque
  motivacion:    '#A855F7',   // púrpura — sharingan / espíritu
};

export const GRADIENTS = {
  background:  ['#05050A', '#0A0A14', '#0F0F1E'] as const,
  accent:      ['#E8460A', '#7C3AED'] as const,
  fire:        ['#F97316', '#E8460A', '#B53508'] as const,
  gold:        ['#FCD34D', '#F59E0B'] as const,
  card:        ['rgba(232,70,10,0.12)', 'rgba(124,58,237,0.06)'] as const,
  streak:      ['#F97316', '#EF4444'] as const,
  success:     ['#10B981', '#059669'] as const,
  header:      ['rgba(5,5,10,0)', 'rgba(5,5,10,0.97)'] as const,
  sharingan:   ['#EF4444', '#7C3AED'] as const,
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
