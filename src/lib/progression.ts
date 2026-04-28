import { BadgeId, DayRecord, UserProfile } from '../types';

export interface PowerStage {
  id: 'rookie' | 'awakened' | 'elite' | 'mythic';
  title: string;
  auraLabel: string;
  colors: [string, string];
  difficultyMultiplier: number;
}

export interface DynamicChallenge {
  id: string;
  label: string;
  current: number;
  target: number;
  unit: string;
}

export interface StageTheme {
  background: [string, string, string];
  accent: [string, string];
  tabBackground: string;
  tabBorder: string;
  tabActive: string;
  tabInactive: string;
}

const STAGES: PowerStage[] = [
  {
    id: 'rookie',
    title: 'Genin Inicial',
    auraLabel: 'Base Form',
    colors: ['#E8460A', '#7C3AED'],
    difficultyMultiplier: 1,
  },
  {
    id: 'awakened',
    title: 'Sharingan 2 Tomoe',
    auraLabel: 'Awakened',
    colors: ['#EF4444', '#A855F7'],
    difficultyMultiplier: 1.12,
  },
  {
    id: 'elite',
    title: 'Super Saiyan Fase 2',
    auraLabel: 'Elite Form',
    colors: ['#F59E0B', '#EF4444'],
    difficultyMultiplier: 1.25,
  },
  {
    id: 'mythic',
    title: 'Legendario Supremo',
    auraLabel: 'Mythic Form',
    colors: ['#38BDF8', '#7C3AED'],
    difficultyMultiplier: 1.4,
  },
];

const STAGE_THEMES: Record<PowerStage['id'], StageTheme> = {
  rookie: {
    background: ['#05050A', '#0A0A14', '#0F0F1E'],
    accent: ['#E8460A', '#7C3AED'],
    tabBackground: '#05050A',
    tabBorder: 'rgba(232,70,10,0.2)',
    tabActive: '#E8460A',
    tabInactive: '#3D3A50',
  },
  awakened: {
    background: ['#09040B', '#140812', '#1B0A1A'],
    accent: ['#EF4444', '#A855F7'],
    tabBackground: '#09040B',
    tabBorder: 'rgba(239,68,68,0.25)',
    tabActive: '#EF4444',
    tabInactive: '#5B4462',
  },
  elite: {
    background: ['#0B0702', '#1A1105', '#231507'],
    accent: ['#F59E0B', '#EF4444'],
    tabBackground: '#0B0702',
    tabBorder: 'rgba(245,158,11,0.3)',
    tabActive: '#F59E0B',
    tabInactive: '#6A583A',
  },
  mythic: {
    background: ['#04080E', '#07111D', '#0D1830'],
    accent: ['#38BDF8', '#7C3AED'],
    tabBackground: '#04080E',
    tabBorder: 'rgba(56,189,248,0.28)',
    tabActive: '#38BDF8',
    tabInactive: '#4D5D7A',
  },
};

function hasAnyBadge(owned: BadgeId[], needed: BadgeId[]): boolean {
  return needed.some(id => owned.includes(id));
}

export function getPowerStage(user: UserProfile): PowerStage {
  const badges = user.badges ?? [];

  if (hasAnyBadge(badges, ['streak90', 'week12', 'arise_complete']) || user.level >= 18) {
    return STAGES[3];
  }
  if (hasAnyBadge(badges, ['streak60', 'week8', 'phase2']) || user.level >= 11) {
    return STAGES[2];
  }
  if (hasAnyBadge(badges, ['streak14', 'week2', 'phase1']) || user.level >= 6) {
    return STAGES[1];
  }
  return STAGES[0];
}

export function getNextStageHint(user: UserProfile): string {
  const stage = getPowerStage(user);
  if (stage.id === 'mythic') return 'Maximo rango desbloqueado. Ahora mantenelo.';
  if (stage.id === 'elite') return 'Siguiente evolucion: racha 90 o completar 90 dias.';
  if (stage.id === 'awakened') return 'Siguiente evolucion: racha 60 o completar 60 dias.';
  return 'Siguiente evolucion: racha 14 o completar 14 dias.';
}

export function getStageTheme(user?: UserProfile): StageTheme {
  if (!user) return STAGE_THEMES.rookie;
  const stage = getPowerStage(user);
  return STAGE_THEMES[stage.id];
}

export function buildDynamicChallenges(user: UserProfile, days: DayRecord[]): DynamicChallenge[] {
  const stage = getPowerStage(user);
  const completedDays = days.filter(d => d.completed).length;
  const readingDone = days.reduce((sum, d) => sum + (d.metrics?.readingPages ?? 0), 0);
  const trainingDone = days.reduce((sum, d) => sum + (d.metrics?.trainingMinutes ?? 0), 0);

  const weeklyTrainBase = (user.trainingDaysPerWeek ?? 4) * 45;
  const readingBase = Math.max(Math.round((user.goals?.targetReadingPages ?? 1200) / 13), 60);
  const streakBase = Math.max(7, user.streak + 3);

  return [
    {
      id: 'training',
      label: 'Desafio semanal de entrenamiento',
      current: trainingDone,
      target: Math.round(weeklyTrainBase * stage.difficultyMultiplier),
      unit: 'min',
    },
    {
      id: 'reading',
      label: 'Desafio semanal de lectura',
      current: readingDone,
      target: Math.round(readingBase * stage.difficultyMultiplier),
      unit: 'pags',
    },
    {
      id: 'consistency',
      label: 'Desafio de consistencia',
      current: user.streak,
      target: Math.round(streakBase * stage.difficultyMultiplier),
      unit: 'dias',
    },
    {
      id: 'program',
      label: 'Avance de programa',
      current: completedDays,
      target: 90,
      unit: 'dias',
    },
  ];
}
