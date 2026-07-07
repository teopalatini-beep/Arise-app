export type TaskCategory = 'cuerpo' | 'mente' | 'bienestar' | 'productividad' | 'motivacion';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type CoachId = 'goku' | 'itachi' | 'rengoku' | 'jiraiya' | 'gojo' | 'all_might';

export interface TaskDefinition {
  id: string;
  name: string;
  category: TaskCategory;
  description: string;
  target: number;
  unit: string;
}

export interface DayDefinition {
  dayNumber: number;
  tasks: TaskDefinition[];
  quote: string;
  stoicQuote: string;
}

export interface TaskState {
  taskId: string;
  completed: boolean;
  actual?: number;
}

export interface DayMetrics {
  weight?: number;
  trainingMinutes?: number;
  readingPages?: number;
  breathingMinutes?: number;
  sleepHours?: number;
  energyLevel?: number;   // 1-10
  mood?: number;          // 1-5
  notes?: string;
}

export interface UserGoals {
  targetWeight?: number;       // kg objetivo
  targetReadingPages?: number; // páginas totales en 90 días
  targetStreak?: number;       // racha objetivo
  targetTrainingDays?: number; // días de entrenamiento en 90 días
  // Línea de tiempo del atleta (metas cualitativas para trazabilidad de cohortes)
  milestone3Months?: string;
  milestone6Months?: string;
  milestone12Months?: string;
  // Árbol de habilidades / enfoque elegido en el onboarding
  focusAreas?: FocusArea[];
}

// Sexo del avatar (Fase 1 del onboarding)
export type Gender = 'male' | 'female' | 'other' | 'prefer_not';

// Árbol de habilidades / enfoque (Fase 2 del onboarding, multi-selección)
export type FocusArea =
  | 'gain_mass'
  | 'lose_weight'
  | 'discipline'
  | 'mental_focus'
  | 'motivation'
  | 'relaxation';

export type AdaptiveTrack = 'fat_loss' | 'muscle_gain' | 'recomposition' | 'maintenance';
export type AdaptiveChallenge = 'consistency' | 'nutrition' | 'time' | 'stress' | 'sleep';

export interface AdaptiveProfile {
  track: AdaptiveTrack;
  currentWeight?: number;
  targetWeight?: number;
  weightDelta?: number;
  weeklyTargetKg: number;
  challenges: AdaptiveChallenge[];
  recommendations: string[];
}

export type DietStyle = 'balanced' | 'high_protein' | 'low_carb' | 'vegetarian';
export type ActivityProfile = 'sedentary' | 'moderate' | 'active';

export interface NutritionProfile {
  dietStyle: DietStyle;
  mealsPerDay: number;
  activityProfile: ActivityProfile;
}

export type BadgeId
  = 'first_day'
  | 'week1' | 'week2' | 'week4' | 'week8' | 'week12'
  | 'streak7' | 'streak14' | 'streak30' | 'streak60' | 'streak90'
  | 'phase1' | 'phase2' | 'phase3'
  | 'perfect_week'
  | 'early_riser'
  | 'bookworm'
  | 'iron_body'
  | 'no_miss'
  | 'arise_complete';

export interface Badge {
  id: BadgeId;
  name: string;
  emoji: string;
  description: string;
  rank: 'genin' | 'chunin' | 'jonin' | 'kage';
  unlockedAt?: string; // ISO date
}

export interface OnboardingData {
  completed: boolean;
  goal: 'fitness' | 'mental' | 'discipline' | 'all';
  fitnessLevel: FitnessLevel;
  wakeUpHour: number;
  // Fase 1 — Estadísticas del personaje
  name?: string;
  gender?: Gender;
  age?: number;
  initialWeight?: number;
  height?: number;
  trainingDaysPerWeek?: number;
  // Fase 2 — Árbol de habilidades / enfoque
  focusAreas?: FocusArea[];
  goals?: UserGoals;
  adaptiveProfile?: AdaptiveProfile;
  nutritionProfile?: NutritionProfile;
  preferredCoachId?: CoachId;
}

// ── Mission system ────────────────────────────────────────────────────────────
export type MissionType = 'binary' | 'stepped' | 'proportional';

export interface MissionStep {
  label: string;   // e.g. "3 comidas"
  units: number;   // the stepper value
  points: number;  // pts awarded at this step
}

export interface MissionDef {
  id: string;
  name: string;
  emoji: string;
  category: TaskCategory;
  description: string;
  type: MissionType;
  maxPoints: number;        // cap per day for this mission
  // proportional only
  pointsPerUnit?: number;
  unitSize?: number;        // how many real-units per 1 step
  unit?: string;
  // stepped only
  steps?: MissionStep[];
  // flags
  isFixed?: boolean;        // always shown (can't be removed)
  minPhase?: 1 | 2 | 3;    // earliest phase it appears in random pool
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface MissionState {
  missionId: string;
  units: number;    // raw input (glasses, pages, minutes, steps index…)
  points: number;   // computed pts
}

// ── Day record (migrated to mission-based, keeps taskStates for compat) ───────
export interface DayRecord {
  dayNumber: number;
  date: string;
  taskStates: TaskState[];          // legacy — kept for backward compat
  missionStates: MissionState[];    // new points system
  totalPoints: number;
  pointsTarget: number;             // 30 normal / 40 hard mode
  completed: boolean;
  missed: boolean;
  penaltyCompleted?: boolean;
  journal?: string;
  metrics?: DayMetrics;
}

export interface UserProfile {
  name: string;
  startDate: string;
  currentDay: number;
  streak: number;
  maxStreak: number;
  xp: number;
  level: number;
  graceUsedThisMonth: boolean;
  graceMonthRef: string;
  programActive: boolean;
  programCompleted: boolean;
  // Extended profile
  gender?: Gender;
  fitnessLevel?: FitnessLevel;
  age?: number;
  initialWeight?: number;
  height?: number;
  trainingDaysPerWeek?: number;
  goals?: UserGoals;
  adaptiveProfile?: AdaptiveProfile;
  nutritionProfile?: NutritionProfile;
  preferredCoachId?: CoachId;
  badges?: BadgeId[];
}

export interface AppData {
  user: UserProfile;
  days: DayRecord[];
  lastOpenedDate: string;
}

export const CATEGORY_INFO: Record<TaskCategory, { color: string; icon: string; label: string }> = {
  cuerpo:        { color: '#FF6B6B', icon: 'barbell',        label: 'Cuerpo' },
  mente:         { color: '#4FC3F7', icon: 'book',           label: 'Mente' },
  bienestar:     { color: '#68D391', icon: 'leaf',           label: 'Bienestar' },
  productividad: { color: '#FFD93D', icon: 'flash',          label: 'Productividad' },
  motivacion:    { color: '#C084FC', icon: 'star',           label: 'Motivación' },
};

export const BADGE_DEFINITIONS: Record<BadgeId, Omit<Badge, 'id' | 'unlockedAt'>> = {
  first_day:       { name: 'Primer Paso',        emoji: '🌱', rank: 'genin',  description: 'Completaste tu primer día' },
  week1:           { name: 'Semana Genin',        emoji: '⚡', rank: 'genin',  description: '7 días completados' },
  week2:           { name: 'Doble Semana',        emoji: '🔥', rank: 'genin',  description: '14 días completados' },
  week4:           { name: 'Chunin Iniciado',     emoji: '⚔️', rank: 'chunin', description: 'Fase 1 completada — 30 días' },
  week8:           { name: 'Jonin en Ascenso',    emoji: '🐉', rank: 'jonin',  description: 'Fase 2 completada — 60 días' },
  week12:          { name: 'Kage Supremo',        emoji: '👁️', rank: 'kage',   description: '90 días completados' },
  streak7:         { name: 'Racha Ninja',         emoji: '🔥', rank: 'genin',  description: '7 días consecutivos' },
  streak14:        { name: 'Racha de Fuego',      emoji: '💥', rank: 'chunin', description: '14 días consecutivos' },
  streak30:        { name: 'Modo Saiyan',         emoji: '⚡', rank: 'chunin', description: '30 días consecutivos' },
  streak60:        { name: 'Super Saiyan',        emoji: '🌟', rank: 'jonin',  description: '60 días consecutivos' },
  streak90:        { name: 'Legendario',          emoji: '🏆', rank: 'kage',   description: '90 días consecutivos — perfecto' },
  phase1:          { name: 'Fase 1: Genin',       emoji: '🌿', rank: 'genin',  description: 'Completaste los primeros 30 días' },
  phase2:          { name: 'Fase 2: Chunin',      emoji: '⚔️', rank: 'chunin', description: 'Completaste 60 días' },
  phase3:          { name: 'Fase 3: Kage',        emoji: '👑', rank: 'kage',   description: 'Completaste los 90 días' },
  perfect_week:    { name: 'Semana Perfecta',     emoji: '💎', rank: 'chunin', description: '7 días seguidos sin fallar' },
  early_riser:     { name: 'Madrugador',          emoji: '🌅', rank: 'genin',  description: 'Completaste 10 días antes de las 9am' },
  bookworm:        { name: 'Devorador de Libros', emoji: '📚', rank: 'chunin', description: '500 páginas leídas en total' },
  iron_body:       { name: 'Cuerpo de Hierro',    emoji: '🦾', rank: 'jonin',  description: '50 horas de entrenamiento acumuladas' },
  no_miss:         { name: 'Sin Faltas',          emoji: '🎯', rank: 'jonin',  description: '30 días sin perder ninguno' },
  arise_complete:  { name: 'ARISE COMPLETE',      emoji: '炎', rank: 'kage',   description: 'Terminaste los 90 días. Leyenda.' },
};

export const RANK_COLORS: Record<Badge['rank'], string> = {
  genin:  '#68D391',
  chunin: '#4FC3F7',
  jonin:  '#C084FC',
  kage:   '#F59E0B',
};
