import { AppData } from '../types';

export type CoachId = 'normal' | 'goku' | 'kakashi' | 'itachi' | 'rengoku';

export interface CoachProfile {
  id: CoachId;
  name: string;
  style: 'anime' | 'humano';
  opener: string;
  motivator: string;
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
    id: 'normal',
    name: 'Coach Humano',
    style: 'humano',
    opener: 'Vamos con una mirada clara y sin humo:',
    motivator: 'Constancia simple, resultado real.',
  },
  {
    id: 'goku',
    name: 'Goku',
    style: 'anime',
    opener: 'Esta semana entrenaste como un verdadero saiyajin:',
    motivator: 'Tu proximo nivel esta en la siguiente repeticion.',
  },
  {
    id: 'kakashi',
    name: 'Kakashi',
    style: 'anime',
    opener: 'Analisis tactico semanal completado:',
    motivator: 'Sin disciplina no hay jutsu que alcance.',
  },
  {
    id: 'itachi',
    name: 'Itachi',
    style: 'anime',
    opener: 'Observacion precisa de tu progreso:',
    motivator: 'Dominarte a vos mismo es el verdadero poder.',
  },
  {
    id: 'rengoku',
    name: 'Rengoku',
    style: 'anime',
    opener: 'Tu llama esta viva, y esta semana se noto:',
    motivator: 'Pon tu corazon en llamas, otra vez.',
  },
];

export const COACH_STORAGE_KEY = 'arise_weekly_coach_v1';

export function getCoachById(id: CoachId): CoachProfile {
  return COACHES.find(c => c.id === id) ?? COACHES[0];
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
