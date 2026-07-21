export type TaskCategory = 'cuerpo' | 'mente' | 'bienestar' | 'productividad' | 'motivacion';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type CoachId = 'arise';
export type OnboardingFocus = 'cuerpo' | 'mente' | 'productividad' | 'espiritu';

export type CoachMessageRole = 'user' | 'assistant' | 'system';

export interface CoachChatMessage {
  id: string;
  role: CoachMessageRole;
  content: string;
  coachId?: CoachId;
  createdAt: string;
}

export interface CoachDailyContext {
  date: string; // yyyy-MM-dd
  topics: string[];
  commitments: string[];
  mood?: string;
  summary?: string;
  notifAfternoonTitle?: string;
  notifAfternoonBody?: string;
  notifNightTitle?: string;
  notifNightBody?: string;
  notifMorningTitle?: string;
  notifMorningBody?: string;
  lastMessageAt?: string;
}

export interface CoachChatRequestContext {
  currentDay: number;
  streak: number;
  pendingMissions?: string[];
  journalSnippet?: string;
  userName?: string;
}

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

export interface UserMetricRecord {
  id: string;
  userId: string;
  date: string; // yyyy-MM-dd
  currentWeight?: number;
  waterLiters?: number;
  meditationMinutes?: number;
  readingPages?: number;
  trainingMinutes?: number;
  breathingMinutes?: number;
  sleepHours?: number;
  energyLevel?: number;
  mood?: number;
  notes?: string;
  createdAt: string;
}

export interface SaveDailyMetricsInput {
  date?: string; // yyyy-MM-dd (defaults to today)
  currentWeight?: number;
  waterLiters?: number;
  meditationMinutes?: number;
  readingPages?: number;
  trainingMinutes?: number;
  breathingMinutes?: number;
  sleepHours?: number;
  energyLevel?: number;
  mood?: number;
  notes?: string;
}

export interface JournalEntryRecord {
  id: string;
  userId: string;
  date: string; // yyyy-MM-dd
  mood?: string;
  reflection: string;
  tags: string[];
  createdAt: string;
}

export interface SaveJournalEntryInput {
  date?: string; // yyyy-MM-dd (defaults to today)
  mood?: string;
  reflection: string;
  tags?: string[];
}

export interface UserGoals {
  targetWeight?: number;       // kg objetivo
  targetReadingPages?: number; // páginas totales en 90 días
  targetStreak?: number;       // racha objetivo
  targetTrainingDays?: number; // días de entrenamiento en 90 días
  targetReadingPagesPerDay?: number;
  targetMeditationMinutesPerDay?: number;
  targetWaterLitersPerDay?: number;
}

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
  name?: string;
  goal: 'fitness' | 'mental' | 'discipline' | 'all';
  fitnessLevel: FitnessLevel;
  wakeUpHour: number;
  focusAreas?: OnboardingFocus[];
  age?: number;
  initialWeight?: number;
  height?: number;
  trainingDaysPerWeek?: number;
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
  fitnessLevel?: FitnessLevel;
  age?: number;
  initialWeight?: number;
  height?: number;
  trainingDaysPerWeek?: number;
  goals?: UserGoals;
  adaptiveProfile?: AdaptiveProfile;
  nutritionProfile?: NutritionProfile;
  preferredCoachId?: CoachId;
  focusAreas?: OnboardingFocus[];
  hasCompletedOnboarding?: boolean;
  badges?: BadgeId[];
}

export interface AppData {
  user: UserProfile;
  days: DayRecord[];
  lastOpenedDate: string;
}

export const CATEGORY_INFO: Record<TaskCategory, { color: string; icon: string; label: string }> = {
  cuerpo:        { color: '#F87171', icon: 'barbell',        label: 'Cuerpo' },
  mente:         { color: '#94A3B8', icon: 'book',           label: 'Mente' },
  bienestar:     { color: '#34D399', icon: 'leaf',           label: 'Bienestar' },
  productividad: { color: '#A8A29E', icon: 'flash',          label: 'Productividad' },
  motivacion:    { color: '#D4AF37', icon: 'star',           label: 'Motivación' },
};

export const BADGE_DEFINITIONS: Record<BadgeId, Omit<Badge, 'id' | 'unlockedAt'>> = {
  first_day:       { name: 'Primer Paso',           emoji: '', rank: 'genin',  description: 'Completaste tu primer día' },
  week1:           { name: 'Primera Semana',        emoji: '', rank: 'genin',  description: '7 días completados' },
  week2:           { name: 'Dos Semanas',           emoji: '', rank: 'genin',  description: '14 días completados' },
  week4:           { name: 'Fase 1 Completa',       emoji: '', rank: 'chunin', description: 'Fase 1 completada — 30 días' },
  week8:           { name: 'Fase 2 Completa',       emoji: '', rank: 'jonin',  description: 'Fase 2 completada — 60 días' },
  week12:          { name: 'Programa Completo',     emoji: '', rank: 'kage',   description: '90 días completados' },
  streak7:         { name: 'Racha de 7',            emoji: '', rank: 'genin',  description: '7 días consecutivos' },
  streak14:        { name: 'Racha de 14',           emoji: '', rank: 'chunin', description: '14 días consecutivos' },
  streak30:        { name: 'Racha de 30',           emoji: '', rank: 'chunin', description: '30 días consecutivos' },
  streak60:        { name: 'Racha de 60',           emoji: '', rank: 'jonin',  description: '60 días consecutivos' },
  streak90:        { name: 'Racha Perfecta',        emoji: '', rank: 'kage',   description: '90 días consecutivos' },
  phase1:          { name: 'Fase 1',                emoji: '', rank: 'genin',  description: 'Completaste los primeros 30 días' },
  phase2:          { name: 'Fase 2',                emoji: '', rank: 'chunin', description: 'Completaste 60 días' },
  phase3:          { name: 'Fase 3',                emoji: '', rank: 'kage',   description: 'Completaste los 90 días' },
  perfect_week:    { name: 'Semana Perfecta',       emoji: '', rank: 'chunin', description: '7 días seguidos sin fallar' },
  early_riser:     { name: 'Madrugador',            emoji: '', rank: 'genin',  description: 'Completaste 10 días antes de las 9am' },
  bookworm:        { name: 'Lector Constante',      emoji: '', rank: 'chunin', description: '500 páginas leídas en total' },
  iron_body:       { name: 'Cuerpo Firme',          emoji: '', rank: 'jonin',  description: '50 horas de entrenamiento acumuladas' },
  no_miss:         { name: 'Sin Faltas',            emoji: '', rank: 'jonin',  description: '30 días sin perder ninguno' },
  arise_complete:  { name: 'ARISE Completo',        emoji: '', rank: 'kage',   description: 'Terminaste los 90 días.' },
};

/** Etiquetas visibles de rango (keys internas sin cambio por compatibilidad DB) */
export const RANK_LABELS: Record<Badge['rank'], string> = {
  genin:  'Guerrero',
  chunin: 'Disciplinado',
  jonin:  'Elite',
  kage:   'Legendario',
};

export const RANK_COLORS: Record<Badge['rank'], string> = {
  genin:  '#68D391',
  chunin: '#D4AF37',
  jonin:  '#E8C547',
  kage:   '#F5E6A3',
};
