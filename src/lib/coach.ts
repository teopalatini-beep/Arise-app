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
    id: 'goku',
    name: 'Goku',
    style: 'anime',
    opener: 'Esta semana entrenaste como un verdadero saiyajin:',
    motivator: 'Tu próximo nivel está en la siguiente repetición.',
  },
  {
    id: 'itachi',
    name: 'Itachi',
    style: 'anime',
    opener: 'Observación precisa de tu progreso:',
    motivator: 'Dominarte a vos mismo es el verdadero poder.',
  },
  {
    id: 'rengoku',
    name: 'Rengoku',
    style: 'anime',
    opener: 'Tu llama está viva, y esta semana se notó:',
    motivator: 'Pon tu corazón en llamas, otra vez.',
  },
  {
    id: 'jiraiya',
    name: 'Jiraiya',
    style: 'anime',
    opener: 'El verdadero ninja aprende de cada caída:',
    motivator: 'El camino del sabio es largo pero no tiene límite.',
  },
  {
    id: 'gojo',
    name: 'Gojo',
    style: 'anime',
    opener: 'Con los ojos abiertos todo se ve claro:',
    motivator: 'El más fuerte no nació así — se construyó.',
  },
  {
    id: 'all_might',
    name: 'All Might',
    style: 'anime',
    opener: 'Con una sonrisa siempre adelante:',
    motivator: 'GO BEYOND — PLUS ULTRA.',
  },
];

export const COACH_VISUALS: Record<CoachId, CoachVisualProfile> = {
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
  jiraiya: {
    icon: 'leaf',
    headerLabel: 'Modo Sabio de las Ranas',
    homePhrases: [
      'El sabio aprende hasta del error más tonto.',
      'La naturaleza no apura — pero siempre llega.',
      'Cada caída es datos para el próximo intento.',
    ],
    overlays: [
      { emoji: '🐸', x: 18, y: 90, size: 22, opacity: 0.18 },
      { emoji: '📜', x: 298, y: 148, size: 20, opacity: 0.15 },
      { emoji: '🌿', x: 52, y: 430, size: 22, opacity: 0.14 },
    ],
    background: ['#060C05', '#0E1A08', '#16260C'] as [string,string,string],
    accent: ['#84CC16', '#F59E0B'] as [string,string],
    tabActive: '#84CC16',
    tabBorder: 'rgba(132,204,22,0.35)',
    cardBackground: 'rgba(132,204,22,0.1)',
    cardBorder: 'rgba(132,204,22,0.38)',
    glowColor: '#84CC16',
    taskIcons: {
      cuerpo: 'leaf',
      mente: 'book',
      bienestar: 'water',
      productividad: 'pencil',
      motivacion: 'sparkles',
    },
  },
  gojo: {
    icon: 'infinite',
    headerLabel: 'Modo Infinito',
    homePhrases: [
      'El infinito no es una distancia — es una actitud.',
      'Ves todo cuando no te aferrás a nada.',
      'La técnica más fuerte es la que dominás sin pensar.',
    ],
    overlays: [
      { emoji: '♾️', x: 16, y: 86, size: 22, opacity: 0.2 },
      { emoji: '👁️', x: 302, y: 144, size: 24, opacity: 0.18 },
      { emoji: '❄️', x: 54, y: 424, size: 20, opacity: 0.15 },
    ],
    background: ['#02080F', '#04111E', '#071A2E'] as [string,string,string],
    accent: ['#38BDF8', '#E0F2FE'] as [string,string],
    tabActive: '#38BDF8',
    tabBorder: 'rgba(56,189,248,0.38)',
    cardBackground: 'rgba(56,189,248,0.1)',
    cardBorder: 'rgba(56,189,248,0.38)',
    glowColor: '#38BDF8',
    taskIcons: {
      cuerpo: 'pulse',
      mente: 'infinite',
      bienestar: 'snow',
      productividad: 'flash',
      motivacion: 'eye',
    },
  },
  all_might: {
    icon: 'shield',
    headerLabel: 'Modo Plus Ultra',
    homePhrases: [
      'Los símbolos no nacen — se forjan con acción.',
      'Sonreí y empujá más allá del límite.',
      'Ser el Nº 1 empieza siendo mejor que ayer.',
    ],
    overlays: [
      { emoji: '💪', x: 20, y: 88, size: 22, opacity: 0.2 },
      { emoji: '⭐', x: 300, y: 142, size: 24, opacity: 0.18 },
      { emoji: '🔵', x: 50, y: 422, size: 20, opacity: 0.12 },
    ],
    background: ['#020814', '#031020', '#041830'] as [string,string,string],
    accent: ['#3B82F6', '#FBBF24'] as [string,string],
    tabActive: '#3B82F6',
    tabBorder: 'rgba(59,130,246,0.38)',
    cardBackground: 'rgba(59,130,246,0.1)',
    cardBorder: 'rgba(59,130,246,0.38)',
    glowColor: '#3B82F6',
    taskIcons: {
      cuerpo: 'barbell',
      mente: 'shield',
      bienestar: 'heart',
      productividad: 'star',
      motivacion: 'flash',
    },
  },
};

export const COACH_STORAGE_KEY = 'arise_weekly_coach_v1';

export function getCoachById(id: CoachId): CoachProfile {
  return COACHES.find(c => c.id === id) ?? COACHES[0];
}

export function getCoachVisualProfile(id?: CoachId): CoachVisualProfile {
  if (!id) return COACH_VISUALS.goku;
  return COACH_VISUALS[id] ?? COACH_VISUALS.goku;
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
