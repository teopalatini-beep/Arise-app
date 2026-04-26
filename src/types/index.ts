export type TaskCategory = 'cuerpo' | 'mente' | 'bienestar' | 'productividad' | 'motivacion';

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

export interface OnboardingData {
  completed: boolean;
  goal: 'fitness' | 'mental' | 'discipline' | 'all';
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  wakeUpHour: number;
}

export interface DayRecord {
  dayNumber: number;
  date: string;
  taskStates: TaskState[];
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
