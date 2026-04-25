export type TaskCategory = 'cuerpo' | 'mente' | 'bienestar' | 'productividad';

export interface TaskDefinition {
  id: string;
  name: string;
  category: TaskCategory;
  description: string;
  target: number;
  unit: string; // "minutos", "páginas", "litros", etc.
}

export interface DayDefinition {
  dayNumber: number;
  tasks: TaskDefinition[];
  quote: string; // frase motivacional del día
}

export interface TaskState {
  taskId: string;
  completed: boolean;
  actual?: number; // valor real completado
}

export interface DayMetrics {
  weight?: number;       // kg
  trainingMinutes?: number;
  readingPages?: number;
  meditationMinutes?: number;
  notes?: string;
}

export interface DayRecord {
  dayNumber: number;
  date: string;          // ISO format
  taskStates: TaskState[];
  completed: boolean;
  missed: boolean;
  penaltyCompleted?: boolean;
  journal?: string;
  metrics?: DayMetrics;
}

export interface UserProfile {
  name: string;
  startDate: string;     // ISO format
  currentDay: number;    // 1-90
  streak: number;
  maxStreak: number;
  xp: number;
  level: number;
  graceUsedThisMonth: boolean;
  graceMonthRef: string; // "2026-04" format
  programActive: boolean;
  programCompleted: boolean;
}

export interface AppData {
  user: UserProfile;
  days: DayRecord[];
  lastOpenedDate: string;
}

// Category colors and icons
export const CATEGORY_INFO: Record<TaskCategory, { color: string; icon: string; label: string }> = {
  cuerpo:         { color: '#FF6B6B', icon: 'barbell',        label: 'Cuerpo' },
  mente:          { color: '#4FC3F7', icon: 'book',           label: 'Mente' },
  bienestar:      { color: '#A8E6CF', icon: 'leaf',           label: 'Bienestar' },
  productividad:  { color: '#FFD93D', icon: 'flash',          label: 'Productividad' },
};
