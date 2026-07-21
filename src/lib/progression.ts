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
    title: 'En construccion',
    auraLabel: 'Base',
    colors: ['#9A7B2F', '#D4AF37'],
    difficultyMultiplier: 1,
  },
  {
    id: 'awakened',
    title: 'Disciplinado',
    auraLabel: 'Estandar',
    colors: ['#D4AF37', '#E8C547'],
    difficultyMultiplier: 1.12,
  },
  {
    id: 'elite',
    title: 'Estandar alto',
    auraLabel: 'Elite',
    colors: ['#E8C547', '#F5E6A3'],
    difficultyMultiplier: 1.25,
  },
  {
    id: 'mythic',
    title: 'Inquebrantable',
    auraLabel: 'Legend',
    colors: ['#E8C547', '#D4AF37'],
    difficultyMultiplier: 1.4,
  },
];

const STAGE_THEMES: Record<PowerStage['id'], StageTheme> = {
  rookie: {
    background: ['#050505', '#0A0908', '#12100C'],
    accent: ['#9A7B2F', '#D4AF37'],
    tabBackground: '#050505',
    tabBorder: 'rgba(212,175,55,0.18)',
    tabActive: '#D4AF37',
    tabInactive: '#57534E',
  },
  awakened: {
    background: ['#050505', '#0C0A08', '#14110C'],
    accent: ['#D4AF37', '#E8C547'],
    tabBackground: '#050505',
    tabBorder: 'rgba(212,175,55,0.22)',
    tabActive: '#E8C547',
    tabInactive: '#57534E',
  },
  elite: {
    background: ['#050505', '#0E0B08', '#16120C'],
    accent: ['#E8C547', '#F5E6A3'],
    tabBackground: '#050505',
    tabBorder: 'rgba(232,197,71,0.24)',
    tabActive: '#E8C547',
    tabInactive: '#57534E',
  },
  mythic: {
    background: ['#050505', '#100C08', '#18140E'],
    accent: ['#E8C547', '#D4AF37'],
    tabBackground: '#050505',
    tabBorder: 'rgba(232,197,71,0.28)',
    tabActive: '#F5E6A3',
    tabInactive: '#57534E',
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
