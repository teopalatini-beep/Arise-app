// Supabase Edge Function: coach-chat
// Deploy: supabase functions deploy coach-chat
// Secrets: OPENAI_API_KEY (or ANTHROPIC_API_KEY)

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Sos el Coach ARISE: UN solo coach motivacional que fusiona la filosofia de Chris Williamson, Alex Hormozi, David Goggins, Jim Rohn y Greg Plitt — sin pretender ser ninguno de ellos ni copiar eslogans de marca.

Habla en espanol rioplatense, breve (2-4 oraciones). Se concreto: siempre termina en una accion o pregunta util.

Como pensas:
- Williamson: claridad emocional; procrastinar = protegerse del miedo al fracaso; el cuerpo construye la mente; menos consejo, mas accion.
- Hormozi: ejecucion y sistemas; dureza mental (aguantar, no derrumbarse, volver rapido, salir mas fuerte); importa el resultado, no solo el esfuerzo.
- Goggins: incomodidad voluntaria; cuando queres parar todavia hay mas; honestidad brutal sin humillar.
- Rohn: te volves la persona; disciplinas diarias simples; elegis el dolor de la disciplina vs el del arrepentimiento.
- Plitt: el entrenamiento es metafora de la vida; alimentas el “quiero” con accion.

Cuando esta mal: accion minima + nombrar el miedo.
Cuando esta bien: sostener estandar + siguiente sistema.
Nunca diagnostiques medicamente. No uses jerga de anime.`;

type HistoryItem = { role: string; content: string };

interface Body {
  message: string;
  coachId?: string;
  history?: HistoryItem[];
  dailyContext?: {
    topics?: string[];
    commitments?: string[];
    mood?: string;
    summary?: string;
  };
  appContext?: {
    currentDay?: number;
    streak?: number;
    pendingMissions?: string[];
    journalSnippet?: string;
    userName?: string;
  };
}

function extractTopics(text: string, previous: string[]): string[] {
  const map: Array<[string, RegExp]> = [
    ['entrenamiento', /entren|gym|pesas|correr|cardio|fuerza/i],
    ['lectura', /leer|lectura|libro|paginas|páginas/i],
    ['meditacion', /medit|respir|calma|ansied|estres|estrés/i],
    ['sueno', /dorm|sueñ|sueno|insomnio|descanso/i],
    ['trabajo', /trabaj|laburo|foco|concentr|deep work/i],
    ['alimentacion', /comer|comida|dieta|proteina/i],
    ['motivacion', /desmotiv|sin ganas|flojo|procrast/i],
    ['racha', /racha|streak|constancia|habito|hábito/i],
  ];
  const found = map.filter(([, re]) => re.test(text)).map(([t]) => t);
  const merged = [...previous];
  for (const t of found) {
    if (!merged.includes(t)) merged.push(t);
  }
  if (!merged.length && text.trim().length > 12) {
    merged.push(text.trim().slice(0, 48));
  }
  return merged.slice(0, 5);
}

function extractCommitments(text: string, previous: string[]): string[] {
  const out = [...previous];
  const patterns = [
    /voy a ([^.!?\n]{4,60})/i,
    /me propongo ([^.!?\n]{4,60})/i,
    /hoy (?:hago|termino|completo|entreno|leo) ([^.!?\n]{3,50})/i,
    /quiero ([^.!?\n]{4,60})/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1] && !out.includes(m[1].trim())) out.push(m[1].trim());
  }
  return out.slice(0, 5);
}

async function callOpenAI(system: string, history: HistoryItem[], message: string): Promise<string> {
  const key = Deno.env.get('OPENAI_API_KEY');
  if (!key) throw new Error('OPENAI_API_KEY missing');

  const messages = [
    { role: 'system', content: system },
    ...history
      .filter((h) => h.role === 'user' || h.role === 'assistant')
      .slice(-10)
      .map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 280,
      messages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${errText}`);
  }

  const json = await res.json();
  return String(json.choices?.[0]?.message?.content ?? '').trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as Body;
    const message = (body.message ?? '').trim();
    if (!message) {
      return new Response(JSON.stringify({ error: 'message required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prevTopics = body.dailyContext?.topics ?? [];
    const prevCommitments = body.dailyContext?.commitments ?? [];
    const topics = extractTopics(message, prevTopics);
    const commitments = extractCommitments(message, prevCommitments);

    const contextBlock = [
      body.appContext?.userName ? `Usuario: ${body.appContext.userName}` : null,
      body.appContext?.currentDay != null ? `Dia del programa: ${body.appContext.currentDay}` : null,
      body.appContext?.streak != null ? `Racha: ${body.appContext.streak}` : null,
      body.appContext?.pendingMissions?.length
        ? `Misiones pendientes: ${body.appContext.pendingMissions.join(', ')}`
        : null,
      body.appContext?.journalSnippet
        ? `Diario reciente: ${body.appContext.journalSnippet.slice(0, 200)}`
        : null,
      topics.length ? `Temas del dia: ${topics.join(', ')}` : null,
      commitments.length ? `Compromisos: ${commitments.join('; ')}` : null,
      body.dailyContext?.mood ? `Animo: ${body.dailyContext.mood}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const system = `${SYSTEM_PROMPT}\n\nContexto ARISE:\n${contextBlock || 'Sin contexto extra.'}`;

    let reply: string;
    try {
      reply = await callOpenAI(system, body.history ?? [], message);
    } catch {
      reply = `Escuche lo de ${topics[0] ?? 'hoy'}. ${
        commitments[0]
          ? `Tu compromiso: ${commitments[0]}. Ejecutalo ahora — el resultado importa mas que la intencion.`
          : 'Elegi una accion minima no negociable y hacela ahora. El drive se construye entrenando.'
      }`;
    }

    const summaryParts = [
      topics.length ? `Temas: ${topics.join(', ')}.` : null,
      commitments.length ? `Compromisos: ${commitments.join('; ')}.` : null,
    ].filter(Boolean);

    return new Response(
      JSON.stringify({
        reply,
        context: {
          topics,
          commitments,
          mood: body.dailyContext?.mood,
          summary: summaryParts.join(' ') || body.dailyContext?.summary,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
