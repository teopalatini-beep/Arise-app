import { BadgeId, CoachId, DayRecord, UserProfile } from '../types';
import { getCoachVisualProfile } from './coach';

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
    title: 'Guerrero Base',
    auraLabel: 'Forma base',
    colors: ['#6366F1', '#38BDF8'],
    difficultyMultiplier: 1,
  },
  {
    id: 'awakened',
    title: 'Super Saiyan',
    auraLabel: 'Ki despertado',
    colors: ['#60A5FA', '#A855F7'],
    difficultyMultiplier: 1.12,
  },
  {
    id: 'elite',
    title: 'Super Saiyan 2',
    auraLabel: 'Forma elite',
    colors: ['#818CF8', '#C084FC'],
    difficultyMultiplier: 1.25,
  },
  {
    id: 'mythic',
    title: 'Ultra Instinto',
    auraLabel: 'Forma mítica',
    colors: ['#38BDF8', '#7C3AED'],
    difficultyMultiplier: 1.4,
  },
];

const STAGE_THEMES: Record<PowerStage['id'], StageTheme> = {
  rookie: {
    background: ['#05050A', '#0A0A14', '#0F0F1E'],
    accent: ['#6366F1', '#38BDF8'],
    tabBackground: '#05050A',
    tabBorder: 'rgba(99,102,241,0.22)',
    tabActive: '#6366F1',
    tabInactive: '#3D3A50',
  },
  awakened: {
    background: ['#060812', '#0C1020', '#121828'],
    accent: ['#60A5FA', '#A855F7'],
    tabBackground: '#060812',
    tabBorder: 'rgba(96,165,250,0.25)',
    tabActive: '#60A5FA',
    tabInactive: '#4A5568',
  },
  elite: {
    background: ['#080818', '#101028', '#181838'],
    accent: ['#818CF8', '#C084FC'],
    tabBackground: '#080818',
    tabBorder: 'rgba(129,140,248,0.28)',
    tabActive: '#818CF8',
    tabInactive: '#5B5B7A',
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

const ARISE_RANKS: [string, string, string, string] = [
  'En construccion',
  'Disciplinado',
  'Estandar alto',
  'Inquebrantable',
];

// Single coach ranks (legacy multi-coach map collapsed)
export const SENSEI_RANKS: Record<CoachId, [string, string, string, string]> = {
  arise: ARISE_RANKS,
};

const STAGE_INDEX: Record<PowerStage['id'], number> = {
  rookie: 0, awakened: 1, elite: 2, mythic: 3,
};

function hasAnyBadge(owned: BadgeId[], needed: BadgeId[]): boolean {
  return needed.some(id => owned.includes(id));
}

export function getPowerStage(user: UserProfile, coachId?: CoachId): PowerStage {
  const badges = user.badges ?? [];
  const resolvedCoachId = coachId ?? user.preferredCoachId;

  let baseStage: PowerStage;
  if (hasAnyBadge(badges, ['streak90', 'week12', 'arise_complete']) || user.level >= 18) {
    baseStage = STAGES[3];
  } else if (hasAnyBadge(badges, ['streak60', 'week8', 'phase2']) || user.level >= 11) {
    baseStage = STAGES[2];
  } else if (hasAnyBadge(badges, ['streak14', 'week2', 'phase1']) || user.level >= 6) {
    baseStage = STAGES[1];
  } else {
    baseStage = STAGES[0];
  }

  if (resolvedCoachId && SENSEI_RANKS[resolvedCoachId]) {
    const idx = STAGE_INDEX[baseStage.id];
    return { ...baseStage, title: SENSEI_RANKS[resolvedCoachId][idx] };
  }
  return baseStage;
}

export function getNextStageHint(user: UserProfile, coachId?: CoachId): string {
  const resolvedCoachId = coachId ?? user.preferredCoachId;
  const stage = getPowerStage(user, resolvedCoachId);

  if (stage.id === 'mythic') return 'Máximo rango desbloqueado. Ahora mantenelo.';

  const nextIdx = STAGE_INDEX[stage.id] + 1;
  const nextTitle = resolvedCoachId && SENSEI_RANKS[resolvedCoachId]
    ? SENSEI_RANKS[resolvedCoachId][nextIdx]
    : ARISE_RANKS[nextIdx];

  if (stage.id === 'elite') return `Siguiente rango: ${nextTitle} — racha 90 o completar 90 días.`;
  if (stage.id === 'awakened') return `Siguiente rango: ${nextTitle} — racha 60 o completar 60 días.`;
  return `Siguiente rango: ${nextTitle} — racha 14 o completar 14 días.`;
}

export function getStageTheme(user?: UserProfile, coachId?: CoachId): StageTheme {
  if (!user) return STAGE_THEMES.rookie;
  const stage = getPowerStage(user, coachId);
  const base = STAGE_THEMES[stage.id];
  const coach = coachId ?? user.preferredCoachId;
  if (!coach) return base;
  const visual = getCoachVisualProfile(coach);
  return {
    ...base,
    background: visual.background,
    accent: visual.accent,
    tabActive: visual.tabActive,
    tabBorder: visual.tabBorder,
  };
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
