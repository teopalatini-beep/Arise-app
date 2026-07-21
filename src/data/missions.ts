import { MissionDef, MissionState, TaskCategory } from '../types';

// ─── Point calculation ────────────────────────────────────────────────────────
export function calcPoints(mission: MissionDef, units: number): number {
  if (units <= 0) return 0;
  if (mission.type === 'binary') {
    return units >= 1 ? mission.maxPoints : 0;
  }
  if (mission.type === 'stepped' && mission.steps) {
    // Pick the highest step whose units <= input
    let pts = 0;
    for (const step of mission.steps) {
      if (units >= step.units) pts = step.points;
    }
    return Math.min(pts, mission.maxPoints);
  }
  if (mission.type === 'proportional') {
    const perUnit = mission.pointsPerUnit ?? 1;
    const size = mission.unitSize ?? 1;
    return Math.min(Math.floor(units / size) * perUnit, mission.maxPoints);
  }
  return 0;
}

// ─── 3 Fixed missions (always shown, cannot be removed) ──────────────────────
export const FIXED_MISSIONS: MissionDef[] = [
  {
    id: 'exercise',
    name: 'Ejercicio físico',
    emoji: '🏋️',
    category: 'cuerpo',
    description: 'Cualquier actividad: pesas, correr, nadar, tenis, fútbol… moverse vale.',
    type: 'binary',
    maxPoints: 10,
    isFixed: true,
    difficulty: 'easy',
    minPhase: 1,
  },
  {
    id: 'eat_healthy',
    name: 'Comer sano',
    emoji: '🥗',
    category: 'bienestar',
    description: 'Comidas limpias, sin procesados ni azúcar agregada.',
    type: 'stepped',
    maxPoints: 10,
    isFixed: true,
    difficulty: 'easy',
    minPhase: 1,
    steps: [
      { label: '1 comida', units: 1, points: 2 },
      { label: '2 comidas', units: 2, points: 4 },
      { label: '3 comidas', units: 3, points: 7 },
      { label: '4 comidas', units: 4, points: 10 },
    ],
    unit: 'comidas',
  },
  {
    id: 'hydration',
    name: 'Hidratación',
    emoji: '💧',
    category: 'bienestar',
    description: '8 vasos de agua (2 litros aprox.) para mantener el cuerpo funcionando.',
    type: 'proportional',
    maxPoints: 5,
    pointsPerUnit: 1,
    unitSize: 1,
    unit: 'vasos',
    isFixed: true,
    difficulty: 'easy',
    minPhase: 1,
  },
];

// ─── Rotating daily pool (~37 missions) ──────────────────────────────────────
export const MISSION_POOL: MissionDef[] = [
  // ── Cuerpo ────────────────────────────────────────────────────────────────
  {
    id: 'walk',
    name: 'Caminata',
    emoji: '🚶',
    category: 'cuerpo',
    description: 'Salir a caminar, aunque sea 20 minutos.',
    type: 'stepped',
    maxPoints: 8,
    difficulty: 'easy',
    minPhase: 1,
    steps: [
      { label: '20 min', units: 1, points: 3 },
      { label: '40 min', units: 2, points: 5 },
      { label: '60 min', units: 3, points: 8 },
    ],
    unit: 'bloques de 20 min',
  },
  {
    id: 'stretch',
    name: 'Flexibilidad',
    emoji: '🧘',
    category: 'cuerpo',
    description: 'Stretching, yoga o movilidad articular. Mínimo 10 minutos.',
    type: 'binary',
    maxPoints: 5,
    difficulty: 'easy',
    minPhase: 1,
  },
  {
    id: 'steps_10k',
    name: '10.000 pasos',
    emoji: '👟',
    category: 'cuerpo',
    description: 'Meta clásica: 10.000 pasos en el día.',
    type: 'stepped',
    maxPoints: 10,
    difficulty: 'medium',
    minPhase: 1,
    steps: [
      { label: '5.000 pasos', units: 5000, points: 5 },
      { label: '7.500 pasos', units: 7500, points: 8 },
      { label: '10.000 pasos', units: 10000, points: 10 },
    ],
    unit: 'pasos',
  },
  {
    id: 'double_workout',
    name: 'Doble sesión',
    emoji: '⚡',
    category: 'cuerpo',
    description: 'Dos sesiones de ejercicio en el mismo día.',
    type: 'binary',
    maxPoints: 10,
    difficulty: 'hard',
    minPhase: 2,
  },
  {
    id: 'cold_shower',
    name: 'Ducha fría',
    emoji: '🧊',
    category: 'cuerpo',
    description: 'Terminar la ducha con al menos 2 minutos de agua fría.',
    type: 'binary',
    maxPoints: 6,
    difficulty: 'medium',
    minPhase: 1,
  },
  {
    id: 'no_elevator',
    name: 'Escaleras siempre',
    emoji: '🪜',
    category: 'cuerpo',
    description: 'Todo el día sin usar el ascensor.',
    type: 'binary',
    maxPoints: 4,
    difficulty: 'easy',
    minPhase: 1,
  },

  // ── Mente ─────────────────────────────────────────────────────────────────
  {
    id: 'read',
    name: 'Leer',
    emoji: '📖',
    category: 'mente',
    description: 'Lectura real: libros, artículos largos. Sin redes sociales.',
    type: 'proportional',
    maxPoints: 10,
    pointsPerUnit: 2,
    unitSize: 10,
    unit: 'páginas',
    difficulty: 'easy',
    minPhase: 1,
  },
  {
    id: 'meditate',
    name: 'Meditación',
    emoji: '🧠',
    category: 'mente',
    description: 'Silencio, respiración o meditación guiada.',
    type: 'stepped',
    maxPoints: 10,
    difficulty: 'easy',
    minPhase: 1,
    steps: [
      { label: '5 min', units: 5, points: 3 },
      { label: '10 min', units: 10, points: 6 },
      { label: '20 min', units: 20, points: 10 },
    ],
    unit: 'minutos',
  },
  {
    id: 'journal',
    name: 'Journaling',
    emoji: '✍️',
    category: 'mente',
    description: 'Escribir sobre el día, tus emociones o metas. Mínimo 5 minutos.',
    type: 'binary',
    maxPoints: 5,
    difficulty: 'easy',
    minPhase: 1,
  },
  {
    id: 'learn_skill',
    name: 'Aprender algo nuevo',
    emoji: '🎓',
    category: 'mente',
    description: 'Podcast educativo, curso online, o 30 min de estudio intencional.',
    type: 'binary',
    maxPoints: 7,
    difficulty: 'medium',
    minPhase: 1,
  },
  {
    id: 'deep_read',
    name: 'Lectura profunda',
    emoji: '📚',
    category: 'mente',
    description: '30+ páginas sin distracciones.',
    type: 'stepped',
    maxPoints: 10,
    difficulty: 'medium',
    minPhase: 2,
    steps: [
      { label: '20 págs', units: 20, points: 4 },
      { label: '30 págs', units: 30, points: 7 },
      { label: '50 págs', units: 50, points: 10 },
    ],
    unit: 'páginas',
  },
  {
    id: 'no_music_focus',
    name: 'Trabajo en silencio',
    emoji: '🔇',
    category: 'mente',
    description: 'Al menos 1 hora de trabajo sin música ni ruido.',
    type: 'binary',
    maxPoints: 5,
    difficulty: 'medium',
    minPhase: 2,
  },

  // ── Bienestar ─────────────────────────────────────────────────────────────
  {
    id: 'sleep_quality',
    name: 'Dormir bien',
    emoji: '😴',
    category: 'bienestar',
    description: 'Horas de sueño de calidad, sin pantallas antes de dormir.',
    type: 'stepped',
    maxPoints: 10,
    difficulty: 'easy',
    minPhase: 1,
    steps: [
      { label: '6 horas', units: 6, points: 4 },
      { label: '7 horas', units: 7, points: 7 },
      { label: '8+ horas', units: 8, points: 10 },
    ],
    unit: 'horas',
  },
  {
    id: 'no_sugar',
    name: 'Sin azúcar',
    emoji: '🚫🍬',
    category: 'bienestar',
    description: 'Cero azúcar agregada, gaseosas ni ultraprocesados.',
    type: 'binary',
    maxPoints: 8,
    difficulty: 'medium',
    minPhase: 1,
  },
  {
    id: 'cook_meal',
    name: 'Cocinar en casa',
    emoji: '👨‍🍳',
    category: 'bienestar',
    description: 'Preparar al menos una comida desde cero.',
    type: 'binary',
    maxPoints: 6,
    difficulty: 'easy',
    minPhase: 1,
  },
  {
    id: 'no_alcohol',
    name: 'Sin alcohol',
    emoji: '🚫🍺',
    category: 'bienestar',
    description: 'Día libre de alcohol.',
    type: 'binary',
    maxPoints: 8,
    difficulty: 'easy',
    minPhase: 1,
  },
  {
    id: 'outdoor_time',
    name: 'Tiempo al aire libre',
    emoji: '🌳',
    category: 'bienestar',
    description: 'Estar afuera, tomar sol, respirar aire fresco.',
    type: 'stepped',
    maxPoints: 8,
    difficulty: 'easy',
    minPhase: 1,
    steps: [
      { label: '15 min', units: 15, points: 3 },
      { label: '30 min', units: 30, points: 5 },
      { label: '60 min', units: 60, points: 8 },
    ],
    unit: 'minutos',
  },
  {
    id: 'intermittent_fast',
    name: 'Ayuno intermitente',
    emoji: '⏱️',
    category: 'bienestar',
    description: 'Ventana de alimentación de 8 horas (16:8).',
    type: 'binary',
    maxPoints: 10,
    difficulty: 'hard',
    minPhase: 2,
  },
  {
    id: 'protein_goal',
    name: 'Meta de proteína',
    emoji: '🥩',
    category: 'bienestar',
    description: 'Alcanzar tu objetivo diario de proteína (0.8-1g por kg de peso).',
    type: 'binary',
    maxPoints: 8,
    difficulty: 'medium',
    minPhase: 1,
  },
  {
    id: 'no_phone_morning',
    name: 'Sin teléfono al despertar',
    emoji: '📵',
    category: 'bienestar',
    description: 'Primera hora del día sin revisar el celular.',
    type: 'binary',
    maxPoints: 7,
    difficulty: 'medium',
    minPhase: 1,
  },

  // ── Productividad ─────────────────────────────────────────────────────────
  {
    id: 'deep_work',
    name: 'Trabajo profundo',
    emoji: '🎯',
    category: 'productividad',
    description: 'Bloques de trabajo sin distracciones (sin notificaciones, sin redes).',
    type: 'stepped',
    maxPoints: 10,
    difficulty: 'medium',
    minPhase: 1,
    steps: [
      { label: '30 min', units: 30, points: 3 },
      { label: '1 hora', units: 60, points: 6 },
      { label: '2 horas', units: 120, points: 10 },
    ],
    unit: 'minutos',
  },
  {
    id: 'plan_day',
    name: 'Planificar el día',
    emoji: '📋',
    category: 'productividad',
    description: 'Escribir 3 prioridades del día antes de empezar.',
    type: 'binary',
    maxPoints: 5,
    difficulty: 'easy',
    minPhase: 1,
  },
  {
    id: 'no_social_media',
    name: 'Sin redes sociales',
    emoji: '🚫📱',
    category: 'productividad',
    description: 'Todo el día sin Instagram, TikTok, Twitter ni similares.',
    type: 'binary',
    maxPoints: 10,
    difficulty: 'hard',
    minPhase: 2,
  },
  {
    id: 'inbox_zero',
    name: 'Bandeja de entrada vacía',
    emoji: '📬',
    category: 'productividad',
    description: 'Procesar y limpiar todos los emails pendientes.',
    type: 'binary',
    maxPoints: 5,
    difficulty: 'easy',
    minPhase: 1,
  },
  {
    id: 'pomodoro',
    name: 'Técnica Pomodoro',
    emoji: '🍅',
    category: 'productividad',
    description: '4 bloques de 25 min de trabajo + descansos.',
    type: 'stepped',
    maxPoints: 8,
    difficulty: 'medium',
    minPhase: 1,
    steps: [
      { label: '2 pomodoros', units: 2, points: 4 },
      { label: '4 pomodoros', units: 4, points: 8 },
    ],
    unit: 'pomodoros',
  },
  {
    id: 'learn_something',
    name: 'Micro-aprendizaje',
    emoji: '💡',
    category: 'productividad',
    description: '15 minutos de aprender algo concreto y aplicable.',
    type: 'binary',
    maxPoints: 5,
    difficulty: 'easy',
    minPhase: 1,
  },
  {
    id: 'review_goals',
    name: 'Revisar metas',
    emoji: '🏁',
    category: 'productividad',
    description: 'Leer tus metas de los 90 días y visualizarte lográndolas.',
    type: 'binary',
    maxPoints: 4,
    difficulty: 'easy',
    minPhase: 1,
  },
  {
    id: 'two_hour_focus',
    name: '2 horas de foco total',
    emoji: '⚡',
    category: 'productividad',
    description: 'Dos horas continuas sin ninguna distracción.',
    type: 'binary',
    maxPoints: 10,
    difficulty: 'hard',
    minPhase: 3,
  },

  // ── Motivación ────────────────────────────────────────────────────────────
  {
    id: 'gratitude',
    name: 'Gratitud',
    emoji: '🙏',
    category: 'motivacion',
    description: 'Escribir o decir 3 cosas por las que estás agradecido hoy.',
    type: 'binary',
    maxPoints: 4,
    difficulty: 'easy',
    minPhase: 1,
  },
  {
    id: 'visualize',
    name: 'Visualización',
    emoji: '🌟',
    category: 'motivacion',
    description: '5 minutos imaginando con claridad tu mejor versión futura.',
    type: 'binary',
    maxPoints: 5,
    difficulty: 'easy',
    minPhase: 1,
  },
  {
    id: 'call_someone',
    name: 'Conectar con alguien',
    emoji: '📞',
    category: 'motivacion',
    description: 'Llamar o ver en persona a alguien que importa.',
    type: 'binary',
    maxPoints: 5,
    difficulty: 'easy',
    minPhase: 1,
  },
  {
    id: 'affirmations',
    name: 'Afirmaciones',
    emoji: '💬',
    category: 'motivacion',
    description: 'Repetir en voz alta tus 5 afirmaciones personales.',
    type: 'binary',
    maxPoints: 3,
    difficulty: 'easy',
    minPhase: 1,
  },
  {
    id: 'help_someone',
    name: 'Ayudar a alguien',
    emoji: '🤝',
    category: 'motivacion',
    description: 'Hacer algo genuino por otra persona sin esperar nada a cambio.',
    type: 'binary',
    maxPoints: 6,
    difficulty: 'easy',
    minPhase: 1,
  },
  {
    id: 'random_act_kindness',
    name: 'Acto de bondad',
    emoji: '💛',
    category: 'motivacion',
    description: 'Un gesto amable e inesperado hacia alguien.',
    type: 'binary',
    maxPoints: 5,
    difficulty: 'easy',
    minPhase: 1,
  },
  {
    id: 'no_complaint',
    name: 'Sin quejas en todo el día',
    emoji: '🤐',
    category: 'motivacion',
    description: 'Pasar el día sin quejarte de nada. Solo soluciones.',
    type: 'binary',
    maxPoints: 8,
    difficulty: 'hard',
    minPhase: 2,
  },
  {
    id: 'mentor_content',
    name: 'Consumir contenido de calidad',
    emoji: '🎙️',
    category: 'motivacion',
    description: 'Podcast, charla TED, o video educativo de alguien que admirás.',
    type: 'binary',
    maxPoints: 4,
    difficulty: 'easy',
    minPhase: 1,
  },
  {
    id: 'reflect_evening',
    name: 'Reflexión nocturna',
    emoji: '🌙',
    category: 'motivacion',
    description: '¿Qué hice bien hoy? ¿Qué mejoraría mañana? 5 minutos.',
    type: 'binary',
    maxPoints: 5,
    difficulty: 'easy',
    minPhase: 1,
  },
];

// ─── All missions combined ────────────────────────────────────────────────────
export const ALL_MISSIONS: MissionDef[] = [...FIXED_MISSIONS, ...MISSION_POOL];

export function getMissionById(id: string): MissionDef | undefined {
  return ALL_MISSIONS.find(m => m.id === id);
}

// ─── Seeded daily rotation ────────────────────────────────────────────────────
// Deterministic Fisher-Yates using a simple integer seed
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getDailyMissions(
  dayNumber: number,
  phase: 1 | 2 | 3,
  pinnedIds: string[] = [],
): MissionDef[] {
  const fixed = FIXED_MISSIONS;

  // Build pool: exclude fixed, filter by phase, exclude already pinned
  const pool = MISSION_POOL.filter(m =>
    (m.minPhase ?? 1) <= phase &&
    !pinnedIds.includes(m.id)
  );

  // Pinned missions the user chose
  const pinned = pinnedIds
    .map(id => getMissionById(id))
    .filter((m): m is MissionDef => !!m && !m.isFixed);

  // Fill remaining slots up to 10 from random pool
  const slotsLeft = Math.max(0, 10 - pinned.length);
  const shuffled = seededShuffle(pool, dayNumber * 31 + phase * 7);
  const daily = shuffled.slice(0, slotsLeft);

  return [...fixed, ...pinned, ...daily];
}

// ─── Points summary helpers ───────────────────────────────────────────────────
export const POINTS_TARGET_NORMAL = 30;
export const POINTS_TARGET_HARD   = 40;

export function sumPoints(states: MissionState[]): number {
  return states.reduce((acc, s) => acc + s.points, 0);
}

export function pointsByCategory(
  states: MissionState[],
  missions: MissionDef[],
): Partial<Record<string, number>> {
  const map: Record<string, number> = {};
  for (const s of states) {
    const m = missions.find(x => x.id === s.missionId);
    if (!m) continue;
    map[m.category] = (map[m.category] ?? 0) + s.points;
  }
  return map;
}
