import { AppData, CoachId, TaskCategory } from '../types';

export interface CoachProfile {
  id: CoachId;
  name: string;
  style: 'humano';
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

/** Legacy anime IDs still may exist in local storage / Supabase */
const LEGACY_COACH_IDS = new Set([
  'goku', 'itachi', 'rengoku', 'jiraiya', 'gojo', 'all_might',
]);

export function normalizeCoachId(id?: string | null): CoachId {
  if (!id || LEGACY_COACH_IDS.has(id) || id === 'arise') return 'arise';
  return 'arise';
}

/**
 * ARISE Coach — una sola voz fusionando:
 * Chris Williamson · Alex Hormozi · David Goggins · Jim Rohn · Greg Plitt
 *
 * Cómo se combina (sin imitar identidad literal):
 * - Williamson: claridad psicológica (procrastinación = miedo), cuerpo → mente, acción > consumir consejo
 * - Hormozi: ejecución, mental toughness (tolerancia/fortaleza/resiliencia/adaptabilidad), sistemas
 * - Goggins: callos mentales, regla del 40%, honestidad brutal, incomodidad programada
 * - Rohn: disciplina diaria, “volverse la persona”, filosofía → hábitos → resultados
 * - Plitt: el gym como metáfora de la vida, drive interno, el “quiero” se defiende con acción
 */
export const COACHES: CoachProfile[] = [
  {
    id: 'arise',
    name: 'Coach ARISE',
    style: 'humano',
    opener: 'Semana cerrada. Acá va la lectura sin adornos:',
    motivator: 'La disciplina pesa gramos. El arrepentimiento, toneladas. Elegí hoy.',
  },
];

/** Una sola estética — AMOLED / premium (sin skins por personaje) */
export const ARISE_VISUAL: CoachVisualProfile = {
  icon: 'flash',
  headerLabel: 'Coach ARISE',
  homePhrases: [
    'No esperes ganas. Construí el estándar y las ganas aparecen después.',
    'El cuerpo disciplinado le enseña a la mente que puede hacer cosas difíciles.',
    'Éxito = pocas disciplinas simples, todos los días. Fracaso = pocos errores, todos los días.',
    'Cuando el cerebro diga “ya está”, todavía te queda más. Empujá un poco más.',
    'Medí resultados, no solo esfuerzo. El esfuerzo sin impacto es hobby disfrazado.',
  ],
  overlays: [],
  background: ['#050505', '#0C0A08', '#14110C'],
  accent: ['#D4AF37', '#E8C547'],
  tabActive: '#D4AF37',
  tabBorder: 'rgba(212,175,55,0.28)',
  cardBackground: 'rgba(212,175,55,0.08)',
  cardBorder: 'rgba(212,175,55,0.28)',
  glowColor: '#E8C547',
  taskIcons: {
    cuerpo: 'barbell',
    mente: 'book',
    bienestar: 'leaf',
    productividad: 'flash',
    motivacion: 'flame',
  },
};

export const COACH_VISUALS: Record<CoachId, CoachVisualProfile> = {
  arise: ARISE_VISUAL,
};

export const COACH_STORAGE_KEY = 'arise_weekly_coach_v1';

export type CoachMoment =
  | 'morning_checkin'
  | 'midday_nudge'
  | 'night_close'
  | 'low_energy'
  | 'missed_missions'
  | 'celebration';

export interface CoachPlaybook {
  voice: string;
  tone: string;
  forbidden: string[];
  moments: Record<CoachMoment, string>;
  followUpAfternoon: string;
  followUpNight: string;
  systemPrompt: string;
  /** Internal lenses used to bias replies by moment */
  lenses: {
    williamson: string;
    hormozi: string;
    goggins: string;
    rohn: string;
    plitt: string;
  };
}

export const ARISE_PLAYBOOK: CoachPlaybook = {
  voice:
    'Coach único, directo, adulto. Habla como un mentor que estudió a Williamson, Hormozi, Goggins, Rohn y Plitt — sin fingir ser ellos. Español rioplatense, sin fluff.',
  tone:
    'Claro y exigente, pero útil. Combina honestidad brutal con sistemas concretos. Nunca humilla; siempre empuja a la próxima acción.',
  forbidden: [
    'rendite',
    'no podes',
    'imposible',
    'mañana arrancamos',
    'todo bien si no haces nada',
    'sos un fracaso',
    'motivacion magica sin accion',
  ],
  moments: {
    morning_checkin:
      'Hoy no se negocia con el estado de animo. Una disciplina simple, hecha ahora, vale mas que un plan perfecto. Arranca el cuerpo: la mente te sigue.',
    midday_nudge:
      'Mitad del dia. Deja de contar esfuerzo y mira el resultado. Que mision concreta cierra ahora? Ejecucion > intencion.',
    night_close:
      'Cerra el dia con honestidad: que hiciste, que evitaste, por miedo a que. Manana no arregla lo que hoy no tocaste. Descansa, pero sin mentirte.',
    low_energy:
      'Sin ganas no es senal de parar: es el momento de callosiar la mente. Baja el liston a lo minimo no negociable y hazlo igual. El drive se construye entrenando, no esperando.',
    missed_missions:
      'Todavia hay tiempo. Un fallo no te define; repetirlo, si. Elegi UNA mision y cerra. Tolerancia, fortaleza, resiliencia, adaptabilidad: vuelve al baseline mas fuerte.',
    celebration:
      'Bien. Eso es volverte la persona, no perseguir el exito. Guarda el estandar: manana se repite la disciplina, no la celebracion.',
  },
  followUpAfternoon:
    'Esta manana hablamos de {topic}. Chequa {commitment} ahora — el dia se decide en la ejecucion, no en la intencion.',
  followUpNight:
    'Hoy tocaste {topic}. Cumpliste {commitment}? Si no, nombra el miedo real y anota la accion de manana. Sin cuentos.',
  lenses: {
    williamson:
      'Procrastinacion suele ser miedo disfrazado. No consumas mas consejo: actua. Cuerpo disciplinado → mente capaz. Errores de omision cuestan caro.',
    hormozi:
      'Mental toughness = tolerancia + fortaleza + resiliencia + adaptabilidad. Sistemas y ejecucion vencen a la motivacion. Medí outcomes.',
    goggins:
      'Cuando el cerebro diga basta, a menudo estas al ~40%. Programa incomodidad. Honestidad frente al espejo. Callos mentales se ganan haciendo lo que no queres.',
    rohn:
      'Disciplina es el puente entre metas y logros. Trabaja mas en vos que en el resultado. Pocas disciplinas diarias. Dolor de disciplina vs dolor de arrepentimiento.',
    plitt:
      'El gym es metafora de la vida: lo que plantas ahi florece afuera. El “quiero” se defiende con accion. Drive interno > aplauso externo.',
  },
  systemPrompt: `Sos el Coach ARISE: UN solo coach motivacional que fusiona la filosofia de Chris Williamson, Alex Hormozi, David Goggins, Jim Rohn y Greg Plitt — sin pretender ser ninguno de ellos ni copiar frases de marca registradas como eslogans.

Habla en espanol rioplatense, breve (2-4 oraciones). Se concreto: siempre termina en una accion o pregunta util.

Como pensas:
- Williamson: claridad emocional; procrastinar = protegerse del miedo al fracaso; el cuerpo construye la mente; menos consejo, mas accion.
- Hormozi: ejecucion y sistemas; dureza mental medible (aguantar, no derrumbarse, volver rapido, salir mas fuerte); importa el resultado, no solo el esfuerzo.
- Goggins: incomodidad voluntaria; cuando queres parar todavia hay mas; honestidad brutal sin humillar; no negocias con la comodidad.
- Rohn: te volves la persona; disciplinas diarias simples; filosofia → actitud → actividad → resultados; elegis el dolor de la disciplina.
- Plitt: el entrenamiento es metafora de la vida; alimentas el “quiero” con accion; el estandar se sostiene cuando nadie mira.

Cuando esta mal el usuario: baja energia / miedo / evitar → modo Goggins+Plitt+Williamson (accion minima + nombrar el miedo).
Cuando esta bien / cumplio → modo Rohn+Hormozi (estandar + siguiente sistema).
Planificacion / laburo / habitos → Hormozi+Rohn.
Reflexion nocturna → Williamson+Rohn.

Nunca diagnostiques medicamente. No uses jerga de anime. No digas que sos Goggins/Hormozi/etc.; sos Coach ARISE.`,
};

export const COACH_PLAYBOOKS: Record<CoachId, CoachPlaybook> = {
  arise: ARISE_PLAYBOOK,
};

export function getCoachPlaybook(id?: CoachId | string): CoachPlaybook {
  return COACH_PLAYBOOKS[normalizeCoachId(id)];
}

export function fillFollowUpTemplate(
  template: string,
  topic: string,
  commitment: string,
): string {
  return template
    .replace(/\{topic\}/g, topic || 'tu foco del dia')
    .replace(/\{commitment\}/g, commitment || 'lo que te propusiste');
}

export function buildContextualNotifBodies(
  coachId: CoachId | string,
  topics: string[],
  commitments: string[],
): { afternoon: { title: string; body: string }; night: { title: string; body: string } } {
  const coach = getCoachById(coachId);
  const playbook = getCoachPlaybook(coachId);
  const topic = topics[0] ?? 'tu dia';
  const commitment = commitments[0] ?? 'tus misiones';
  return {
    afternoon: {
      title: `${coach.name} · Seguimiento`,
      body: fillFollowUpTemplate(playbook.followUpAfternoon, topic, commitment),
    },
    night: {
      title: `${coach.name} · Cierre`,
      body: fillFollowUpTemplate(playbook.followUpNight, topic, commitment),
    },
  };
}

export function getCoachById(id?: CoachId | string): CoachProfile {
  return COACHES[0];
}

export function getCoachVisualProfile(id?: CoachId | string): CoachVisualProfile {
  return ARISE_VISUAL;
}

export function getCoachTaskIcon(coachId: CoachId | undefined, category: TaskCategory): string {
  return ARISE_VISUAL.taskIcons[category];
}

/** Bias which lens dominates for local replies */
export function pickMomentLens(moment: CoachMoment): keyof CoachPlaybook['lenses'] {
  switch (moment) {
    case 'low_energy':
      return 'goggins';
    case 'missed_missions':
      return 'hormozi';
    case 'celebration':
      return 'rohn';
    case 'morning_checkin':
      return 'plitt';
    case 'midday_nudge':
      return 'hormozi';
    case 'night_close':
      return 'williamson';
    default:
      return 'rohn';
  }
}

export function buildWeeklyCoachReport(data: AppData, _coachId?: CoachId): WeeklyCoachReport {
  const coach = getCoachById('arise');
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
  if (completionRate >= 80) wins.push(`Disciplina sostenida: ${completionRate}% de dias cerrados.`);
  else wins.push(`Presencia: ${completionRate}% de cumplimiento — el puente se construye dia a dia.`);
  if (trainMin > 0) wins.push(`Cuerpo trabajado: ${trainMin} min. Eso endurece la mente.`);
  if (readPages > 0) wins.push(`Inputs de calidad: ${readPages} pags. Ahora convierte eso en outputs.`);
  if (breathMin > 0) wins.push(`Regulacion: ${breathMin} min de respiracion/foco.`);

  const focus: string[] = [];
  if (completionRate < 70) focus.push('Subir a 5/7 dias: disciplina simple > motivacion esporadica.');
  if (trainMin < 120) focus.push('3 sesiones cortas esta semana. El gym es metafora: planta ahi, cosecha afuera.');
  if (readPages < 70) focus.push('10 pags/dia minimo. Formal education pays bills; self-education builds the edge.');
  if (breathMin < 35) focus.push('5 min diarios de respiracion: baja el ruido, sube la ejecucion.');
  if (focus.length === 0) focus.push('Sostene el estandar y subi dificultad un 10%. Adaptabilidad: sali mas fuerte.');

  const summary = `${coach.opener} Semana ${currentWeek}: ${weekCompleted}/${weekTotal} dias, ${trainMin} min entrenamiento, ${readPages} pags. Resultado > intencion.`;

  return {
    title: `Coach ARISE · Semana ${currentWeek}`,
    summary,
    wins,
    focus,
    message: coach.motivator,
  };
}
