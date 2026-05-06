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
    overlays: [],
    // Colors from image: dark charcoal bg, gold SSJ hair, orange-amber fire
    background: ['#0E0800', '#1C1002', '#2A1804'],
    accent: ['#F5C518', '#E84010'],
    tabActive: '#F5C518',
    tabBorder: 'rgba(245,197,24,0.38)',
    cardBackground: 'rgba(245,197,24,0.10)',
    cardBorder: 'rgba(245,197,24,0.42)',
    glowColor: '#F5C518',
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
    overlays: [],
    // Colors from image: near-black with crimson red aura, crow darkness
    background: ['#0A0004', '#160008', '#200010'],
    accent: ['#C41230', '#A855F7'],
    tabActive: '#C41230',
    tabBorder: 'rgba(196,18,48,0.38)',
    cardBackground: 'rgba(196,18,48,0.10)',
    cardBorder: 'rgba(196,18,48,0.38)',
    glowColor: '#C41230',
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
    overlays: [],
    // Colors from image: deep ember black, fire orange, amber sparks
    background: ['#150500', '#241000', '#341800'],
    accent: ['#FF5500', '#FFAA00'],
    tabActive: '#FF5500',
    tabBorder: 'rgba(255,85,0,0.38)',
    cardBackground: 'rgba(255,85,0,0.11)',
    cardBorder: 'rgba(255,85,0,0.42)',
    glowColor: '#FF5500',
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
    overlays: [],
    // Colors from image: deep forest green, mountain blue-gray, warm amber afternoon
    background: ['#060D04', '#0F1A08', '#18260E'] as [string,string,string],
    accent: ['#7AB828', '#D4A020'] as [string,string],
    tabActive: '#7AB828',
    tabBorder: 'rgba(122,184,40,0.38)',
    cardBackground: 'rgba(122,184,40,0.10)',
    cardBorder: 'rgba(122,184,40,0.40)',
    glowColor: '#7AB828',
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
    overlays: [],
    // Colors from image: overcast steel-blue sky, cool navy, pale energy white
    background: ['#040C14', '#081826', '#0C2438'] as [string,string,string],
    accent: ['#38C4F0', '#A8D8F0'] as [string,string],
    tabActive: '#38C4F0',
    tabBorder: 'rgba(56,196,240,0.40)',
    cardBackground: 'rgba(56,196,240,0.10)',
    cardBorder: 'rgba(56,196,240,0.40)',
    glowColor: '#38C4F0',
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
    overlays: [],
    // Colors from image: deep night navy, royal blue energy, smoke-white beams
    background: ['#020810', '#040E1E', '#06162E'] as [string,string,string],
    accent: ['#3B82F6', '#FBBF24'] as [string,string],
    tabActive: '#3B82F6',
    tabBorder: 'rgba(59,130,246,0.40)',
    cardBackground: 'rgba(59,130,246,0.10)',
    cardBorder: 'rgba(59,130,246,0.40)',
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
