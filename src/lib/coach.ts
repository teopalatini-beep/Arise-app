import { AppData, CoachId, TaskCategory } from '../types';

export interface CoachProfile {
  id: CoachId;
  name: string;
  style: 'anime' | 'humano';
  opener: string;
  motivator: string;
}

export interface CoachVisualProfile {
  icon: string;
  headerLabel: string;
  homePhrases: string[];
  overlays: {
    emoji: string;
    x: number;
    y: number;
    size: number;
    opacity: number;
  }[];
  background: [string, string, string];
  accent: [string, string];
  tabActive: string;
  tabBorder: string;
  cardBackground: string;
  cardBorder: string;
  glowColor: string;
  taskIcons: Record<TaskCategory, string>;
}

export interface WeeklyCoachReport {
  title: string;
  summary: string;
  wins: string[];
  focus: string[];
  message: string;
}

export const COACHES: CoachProfile[] = [
  {
    id: 'normal',
    name: 'Coach Humano',
    style: 'humano',
    opener: 'Vamos con una mirada clara y sin humo:',
    motivator: 'Constancia simple, resultado real.',
  },
  {
    id: 'goku',
    name: 'Goku',
    style: 'anime',
    opener: 'Esta semana entrenaste como un verdadero saiyajin:',
    motivator: 'Tu proximo nivel esta en la siguiente repeticion.',
  },
  {
    id: 'kakashi',
    name: 'Kakashi',
    style: 'anime',
    opener: 'Analisis tactico semanal completado:',
    motivator: 'Sin disciplina no hay jutsu que alcance.',
  },
  {
    id: 'itachi',
    name: 'Itachi',
    style: 'anime',
    opener: 'Observacion precisa de tu progreso:',
    motivator: 'Dominarte a vos mismo es el verdadero poder.',
  },
  {
    id: 'rengoku',
    name: 'Rengoku',
    style: 'anime',
    opener: 'Tu llama esta viva, y esta semana se noto:',
    motivator: 'Pon tu corazon en llamas, otra vez.',
  },
];

export const COACH_VISUALS: Record<CoachId, CoachVisualProfile> = {
  normal: {
    icon: 'person-circle',
    headerLabel: 'Modo Coach Humano',
    homePhrases: [
      'Menos drama, mas ejecucion: prioriza lo importante hoy.',
      'La estrategia gana cuando se vuelve rutina.',
      'Disciplina simple, resultados medibles.',
    ],
    overlays: [
      { emoji: '📈', x: 24, y: 94, size: 18, opacity: 0.18 },
      { emoji: '🎯', x: 300, y: 160, size: 20, opacity: 0.16 },
      { emoji: '🧠', x: 42, y: 430, size: 22, opacity: 0.13 },
    ],
    background: ['#06060A', '#0D0D16', '#151522'],
    accent: ['#E879F9', '#7C3AED'],
    tabActive: '#E879F9',
    tabBorder: 'rgba(232,121,249,0.3)',
    cardBackground: 'rgba(232,121,249,0.08)',
    cardBorder: 'rgba(232,121,249,0.35)',
    glowColor: '#E879F9',
    taskIcons: {
      cuerpo: 'fitness',
      mente: 'analytics',
      bienestar: 'heart',
      productividad: 'checkmark-done',
      motivacion: 'sparkles',
    },
  },
  goku: {
    icon: 'flash',
    headerLabel: 'Modo Saiyan',
    homePhrases: [
      'Hoy se entrena con alegria y hambre de mejorar.',
      'Si superas tu limite de ayer, ganaste el dia.',
      'Energia alta, mente limpia, progreso real.',
    ],
    overlays: [
      { emoji: '⚡', x: 16, y: 80, size: 20, opacity: 0.22 },
      { emoji: '🔥', x: 300, y: 140, size: 24, opacity: 0.2 },
      { emoji: '🥋', x: 56, y: 410, size: 20, opacity: 0.16 },
    ],
    background: ['#130A02', '#1F1206', '#2A1606'],
    accent: ['#F59E0B', '#3B82F6'],
    tabActive: '#F59E0B',
    tabBorder: 'rgba(245,158,11,0.35)',
    cardBackground: 'rgba(245,158,11,0.12)',
    cardBorder: 'rgba(245,158,11,0.4)',
    glowColor: '#F59E0B',
    taskIcons: {
      cuerpo: 'thunderstorm',
      mente: 'flash',
      bienestar: 'sunny',
      productividad: 'rocket',
      motivacion: 'flame',
    },
  },
  kakashi: {
    icon: 'thunderstorm',
    headerLabel: 'Modo Estratega',
    homePhrases: [
      'Calma primero, precision despues.',
      'Sin metodo no hay tecnica que alcance.',
      'Equipo, foco y ejecucion: esa es la jugada.',
    ],
    overlays: [
      { emoji: '🌩️', x: 18, y: 96, size: 20, opacity: 0.2 },
      { emoji: '👁️', x: 298, y: 150, size: 22, opacity: 0.16 },
      { emoji: '📘', x: 46, y: 438, size: 20, opacity: 0.14 },
    ],
    background: ['#050912', '#0A1220', '#111C2E'],
    accent: ['#38BDF8', '#8B5CF6'],
    tabActive: '#38BDF8',
    tabBorder: 'rgba(56,189,248,0.34)',
    cardBackground: 'rgba(56,189,248,0.11)',
    cardBorder: 'rgba(56,189,248,0.35)',
    glowColor: '#38BDF8',
    taskIcons: {
      cuerpo: 'thunderstorm',
      mente: 'book',
      bienestar: 'moon',
      productividad: 'timer',
      motivacion: 'eye',
    },
  },
  itachi: {
    icon: 'eye',
    headerLabel: 'Modo Genjutsu',
    homePhrases: [
      'Control interno antes que ruido externo.',
      'La disciplina silenciosa es poder acumulado.',
      'Observa, decide, ejecuta sin desperdicio.',
    ],
    overlays: [
      { emoji: '🕊️', x: 20, y: 86, size: 20, opacity: 0.15 },
      { emoji: '👁️', x: 304, y: 146, size: 24, opacity: 0.2 },
      { emoji: '🌑', x: 56, y: 426, size: 20, opacity: 0.15 },
    ],
    background: ['#120407', '#1D070D', '#270A12'],
    accent: ['#EF4444', '#A855F7'],
    tabActive: '#EF4444',
    tabBorder: 'rgba(239,68,68,0.34)',
    cardBackground: 'rgba(239,68,68,0.1)',
    cardBorder: 'rgba(239,68,68,0.35)',
    glowColor: '#EF4444',
    taskIcons: {
      cuerpo: 'skull',
      mente: 'eye',
      bienestar: 'moon',
      productividad: 'shield',
      motivacion: 'flame',
    },
  },
  rengoku: {
    icon: 'flame',
    headerLabel: 'Modo Corazon Ardiente',
    homePhrases: [
      'Set your heart ablaze: hoy no se negocia.',
      'Avanza con firmeza incluso cuando cueste.',
      'Tu fuego protege tu proceso.',
    ],
    overlays: [
      { emoji: '🔥', x: 16, y: 84, size: 24, opacity: 0.22 },
      { emoji: '🗡️', x: 304, y: 140, size: 20, opacity: 0.16 },
      { emoji: '☀️', x: 54, y: 420, size: 22, opacity: 0.14 },
    ],
    background: ['#170801', '#261003', '#351706'],
    accent: ['#F97316', '#FACC15'],
    tabActive: '#F97316',
    tabBorder: 'rgba(249,115,22,0.36)',
    cardBackground: 'rgba(249,115,22,0.12)',
    cardBorder: 'rgba(249,115,22,0.4)',
    glowColor: '#F97316',
    taskIcons: {
      cuerpo: 'flame',
      mente: 'sunny',
      bienestar: 'heart',
      productividad: 'sparkles',
      motivacion: 'flash',
    },
  },
};

export const COACH_STORAGE_KEY = 'arise_weekly_coach_v1';

export function getCoachById(id: CoachId): CoachProfile {
  return COACHES.find(c => c.id === id) ?? COACHES[0];
}

export function getCoachVisualProfile(id?: CoachId): CoachVisualProfile {
  if (!id) return COACH_VISUALS.normal;
  return COACH_VISUALS[id] ?? COACH_VISUALS.normal;
}

export function getCoachTaskIcon(coachId: CoachId | undefined, category: TaskCategory): string {
  const visual = getCoachVisualProfile(coachId);
  return visual.taskIcons[category];
}

export function buildWeeklyCoachReport(data: AppData, coachId: CoachId): WeeklyCoachReport {
  const coach = getCoachById(coachId);
  const user = data.user;
  const currentWeek = Math.ceil(user.currentDay / 7);
  const weekStart = Math.max(1, (currentWeek - 1) * 7 + 1);
  const weekDays = data.days.filter(d => d.dayNumber >= weekStart && d.dayNumber <= user.currentDay);

  const weekCompleted = weekDays.filter(d => d.completed).length;
  const weekTotal = Math.max(weekDays.length, 1);
  const completionRate = Math.round((weekCompleted / weekTotal) * 100);
  const trainMin = weekDays.reduce((sum, d) => sum + (d.metrics?.trainingMinutes ?? 0), 0);
  const readPages = weekDays.reduce((sum, d) => sum + (d.metrics?.readingPages ?? 0), 0);
  const breathMin = weekDays.reduce((sum, d) => sum + (d.metrics?.breathingMinutes ?? 0), 0);

  const wins: string[] = [];
  if (completionRate >= 80) wins.push(`Consistencia alta: ${completionRate}% de dias completados.`);
  else wins.push(`Manteniendo presencia: ${completionRate}% de cumplimiento.`);
  if (trainMin > 0) wins.push(`Entrenamiento acumulado: ${trainMin} minutos.`);
  if (readPages > 0) wins.push(`Lectura acumulada: ${readPages} paginas.`);
  if (breathMin > 0) wins.push(`Respiracion y foco: ${breathMin} minutos.`);

  const focus: string[] = [];
  if (completionRate < 70) focus.push('Subir cumplimiento semanal al menos a 5/7 dias.');
  if (trainMin < 120) focus.push('Bloquear 3 sesiones cortas de entrenamiento de 40 min.');
  if (readPages < 70) focus.push('Objetivo de lectura minimo: 10 paginas por dia.');
  if (breathMin < 35) focus.push('Agregar 5 minutos diarios de respiracion guiada.');
  if (focus.length === 0) focus.push('Sostener el ritmo actual y subir dificultad un 10%.');

  const summary = `${coach.opener} Semana ${currentWeek}: ${weekCompleted}/${weekTotal} dias, ${trainMin} min de entrenamiento y ${readPages} pags leidas.`;

  return {
    title: `Coach semanal · ${coach.name}`,
    summary,
    wins,
    focus,
    message: coach.motivator,
  };
}
