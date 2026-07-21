import { format } from 'date-fns';
import {
  CoachChatMessage,
  CoachChatRequestContext,
  CoachDailyContext,
  CoachId,
} from '../types';
import {
  buildContextualNotifBodies,
  getCoachById,
  getCoachPlaybook,
  pickMomentLens,
  type CoachMoment,
} from '../lib/coach';
import { supabase } from '../lib/supabase';
import {
  appendLocalCoachMessage,
  emptyContext,
  insertCoachMessageRemote,
  loadCoachDayState,
  loadLocalCoachContext,
  saveLocalCoachContext,
  upsertCoachContextRemote,
} from './coachMemory';

const TOPIC_KEYWORDS: Array<{ topic: string; patterns: RegExp }> = [
  { topic: 'entrenamiento', patterns: /entren|gym|pesas|correr|cardio|fuerza|workout/i },
  { topic: 'lectura', patterns: /leer|lectura|libro|paginas|páginas/i },
  { topic: 'meditacion', patterns: /medit|respir|calma|ansied|estres|estrés/i },
  { topic: 'sueno', patterns: /dorm|sueñ|sueno|insomnio|descanso/i },
  { topic: 'trabajo', patterns: /trabaj|laburo|oficina|deep work|foco|concentr/i },
  { topic: 'alimentacion', patterns: /comer|comida|dieta|proteina|hambre|comida/i },
  { topic: 'motivacion', patterns: /desmotiv|sin ganas|flojo|procrast|no quiero/i },
  { topic: 'racha', patterns: /racha|streak|constancia|habito|hábito/i },
];

function extractTopics(text: string, previous: string[]): string[] {
  const found = TOPIC_KEYWORDS
    .filter((t) => t.patterns.test(text))
    .map((t) => t.topic);
  const merged = [...previous];
  for (const t of found) {
    if (!merged.includes(t)) merged.push(t);
  }
  if (merged.length === 0 && text.trim().length > 12) {
    const snippet = text.trim().slice(0, 48).replace(/\s+/g, ' ');
    merged.push(snippet);
  }
  return merged.slice(0, 5);
}

function extractCommitments(text: string, previous: string[]): string[] {
  const commitments = [...previous];
  const patterns = [
    /voy a ([^.!?\n]{4,60})/i,
    /me propongo ([^.!?\n]{4,60})/i,
    /hoy (?:hago|termino|completo|entreno|leo) ([^.!?\n]{3,50})/i,
    /quiero ([^.!?\n]{4,60})/i,
    /compromiso[:\s]+([^.!?\n]{4,60})/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const c = m[1].trim();
      if (c && !commitments.includes(c)) commitments.push(c);
    }
  }
  return commitments.slice(0, 5);
}

function detectMood(text: string): string | undefined {
  if (/cansad|agotad|sin energia|sin energía|bajon|bajón/i.test(text)) return 'bajo';
  if (/ansios|estres|estrés|nervios/i.test(text)) return 'estresado';
  if (/motivad|con ganas|bien|feliz|energ/i.test(text)) return 'alto';
  return undefined;
}

function buildLocalReply(
  coachId: CoachId,
  userText: string,
  context: CoachDailyContext,
  appContext?: CoachChatRequestContext,
): string {
  const playbook = getCoachPlaybook(coachId);
  const coach = getCoachById(coachId);
  const lower = userText.toLowerCase();

  let moment: CoachMoment = 'morning_checkin';
  if (/cansad|sin ganas|flojo|agotad|bajon|bajón/i.test(lower)) {
    moment = 'low_energy';
  } else if (/termine|terminé|complete|completé|logue|gane|gané/i.test(lower)) {
    moment = 'celebration';
  } else if (/no hice|falle|fallé|perdi|perdí|atrasado/i.test(lower)) {
    moment = 'missed_missions';
  } else if (new Date().getHours() >= 18) {
    moment = 'night_close';
  } else if (new Date().getHours() >= 13) {
    moment = 'midday_nudge';
  }

  const momentLine = playbook.moments[moment];
  const lensKey = pickMomentLens(moment);
  const lensLine = playbook.lenses[lensKey];

  const topic = context.topics[0];
  const commitment = context.commitments[0];
  const pending = appContext?.pendingMissions?.slice(0, 2).join(', ');

  const parts: string[] = [momentLine];
  if (topic) {
    parts.push(`Sobre ${topic}: deja de negociar. Una accion concreta ahora.`);
  }
  if (commitment) {
    parts.push(`Compromiso: ${commitment}. Eso es el puente — construilo hoy.`);
  } else if (pending) {
    parts.push(`Pendientes: ${pending}. Elegi uno y cerra. Resultado > intencion.`);
  }
  if (appContext?.streak != null && appContext.streak > 0) {
    parts.push(`Racha ${appContext.streak}. No la regales por comodidad.`);
  }
  // Keep reply short: moment + one practical line + motivator
  const practical = commitment || topic || pending
    ? parts.slice(1, 3).join(' ')
    : lensLine.split('.')[0] + '.';
  return [momentLine, practical, coach.motivator].filter(Boolean).join(' ');
}

function mergeContextFromTurn(
  previous: CoachDailyContext | null,
  userText: string,
  coachId: CoachId,
  date: string,
): CoachDailyContext {
  const base = previous ?? emptyContext(date);
  const topics = extractTopics(userText, base.topics);
  const commitments = extractCommitments(userText, base.commitments);
  const mood = detectMood(userText) ?? base.mood;
  const notifs = buildContextualNotifBodies(coachId, topics, commitments);
  const summaryParts = [
    topics.length ? `Temas: ${topics.join(', ')}.` : null,
    commitments.length ? `Compromisos: ${commitments.join('; ')}.` : null,
    mood ? `Animo: ${mood}.` : null,
  ].filter(Boolean);

  return {
    ...base,
    date,
    topics,
    commitments,
    mood,
    summary: summaryParts.join(' ') || base.summary,
    notifAfternoonTitle: notifs.afternoon.title,
    notifAfternoonBody: notifs.afternoon.body,
    notifNightTitle: notifs.night.title,
    notifNightBody: notifs.night.body,
    lastMessageAt: new Date().toISOString(),
  };
}

export interface SendCoachMessageResult {
  reply: string;
  messages: CoachChatMessage[];
  context: CoachDailyContext;
  source: 'edge' | 'local';
}

export async function sendCoachMessage(params: {
  text: string;
  coachId: CoachId;
  appContext?: CoachChatRequestContext;
}): Promise<SendCoachMessageResult> {
  const date = format(new Date(), 'yyyy-MM-dd');
  const { messages: existing } = await loadCoachDayState(date);
  const previousContext = (await loadLocalCoachContext(date)) ?? emptyContext(date);

  const userMsg = await appendLocalCoachMessage('user', params.text, params.coachId, date);
  void insertCoachMessageRemote(userMsg, date);

  let reply: string | null = null;
  let source: 'edge' | 'local' = 'local';
  let context = mergeContextFromTurn(previousContext, params.text, params.coachId, date);

  try {
    const history = [...existing, userMsg]
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content }));

    const { data, error } = await supabase.functions.invoke('coach-chat', {
      body: {
        message: params.text,
        coachId: params.coachId,
        history,
        dailyContext: previousContext,
        appContext: params.appContext,
      },
    });

    if (!error && data?.reply) {
      reply = String(data.reply);
      source = 'edge';
      if (data.context) {
        const remoteCtx = data.context as Partial<CoachDailyContext>;
        const notifs = buildContextualNotifBodies(
          params.coachId,
          remoteCtx.topics ?? context.topics,
          remoteCtx.commitments ?? context.commitments,
        );
        context = {
          ...context,
          topics: remoteCtx.topics ?? context.topics,
          commitments: remoteCtx.commitments ?? context.commitments,
          mood: remoteCtx.mood ?? context.mood,
          summary: remoteCtx.summary ?? context.summary,
          notifAfternoonTitle: notifs.afternoon.title,
          notifAfternoonBody: notifs.afternoon.body,
          notifNightTitle: notifs.night.title,
          notifNightBody: notifs.night.body,
          lastMessageAt: new Date().toISOString(),
        };
      }
    }
  } catch {
    // Fall through to local reply.
  }

  if (!reply) {
    reply = buildLocalReply(params.coachId, params.text, context, params.appContext);
  }

  const assistantMsg = await appendLocalCoachMessage(
    'assistant',
    reply,
    params.coachId,
    date,
  );
  void insertCoachMessageRemote(assistantMsg, date);

  await saveLocalCoachContext(context);
  void upsertCoachContextRemote(context);

  const { messages } = await loadCoachDayState(date);
  return { reply, messages, context, source };
}

export async function getOpeningMessage(coachId: CoachId): Promise<string> {
  const playbook = getCoachPlaybook(coachId);
  const coach = getCoachById(coachId);
  const hour = new Date().getHours();
  if (hour < 12) return `${playbook.moments.morning_checkin} Soy ${coach.name}. Contame en que estas.`;
  if (hour < 18) return `${playbook.moments.midday_nudge} Soy ${coach.name}. ¿Que necesitas?`;
  return `${playbook.moments.night_close} Soy ${coach.name}. Contame como fue el dia.`;
}
