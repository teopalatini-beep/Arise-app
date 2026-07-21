import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import {
  CoachChatMessage,
  CoachDailyContext,
  CoachId,
  CoachMessageRole,
} from '../types';
import { supabase } from '../lib/supabase';
import {
  PERSONAL_COACH_ENABLED_KEY,
  coachContextKey,
  coachMessagesKey,
} from '../lib/storageKeys';

function todayKey(date?: string): string {
  return date ?? format(new Date(), 'yyyy-MM-dd');
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function loadPersonalCoachEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(PERSONAL_COACH_ENABLED_KEY);
    if (raw === null) return true; // default on for personal build
    return raw === '1' || raw === 'true';
  } catch {
    return true;
  }
}

export async function savePersonalCoachEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(PERSONAL_COACH_ENABLED_KEY, enabled ? '1' : '0');
}

export async function loadLocalCoachMessages(date?: string): Promise<CoachChatMessage[]> {
  const key = coachMessagesKey(todayKey(date));
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CoachChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveLocalCoachMessages(
  messages: CoachChatMessage[],
  date?: string,
): Promise<void> {
  await AsyncStorage.setItem(coachMessagesKey(todayKey(date)), JSON.stringify(messages));
}

export async function appendLocalCoachMessage(
  role: CoachMessageRole,
  content: string,
  coachId?: CoachId,
  date?: string,
): Promise<CoachChatMessage> {
  const day = todayKey(date);
  const messages = await loadLocalCoachMessages(day);
  const message: CoachChatMessage = {
    id: newId(),
    role,
    content,
    coachId,
    createdAt: new Date().toISOString(),
  };
  messages.push(message);
  await saveLocalCoachMessages(messages, day);
  return message;
}

export async function loadLocalCoachContext(date?: string): Promise<CoachDailyContext | null> {
  const key = coachContextKey(todayKey(date));
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as CoachDailyContext;
  } catch {
    return null;
  }
}

export async function saveLocalCoachContext(context: CoachDailyContext): Promise<void> {
  await AsyncStorage.setItem(coachContextKey(context.date), JSON.stringify(context));
}

export async function upsertCoachContextRemote(
  context: CoachDailyContext,
): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  await supabase.from('coach_daily_context').upsert(
    {
      user_id: userId,
      date: context.date,
      topics: context.topics,
      commitments: context.commitments,
      mood: context.mood ?? null,
      summary: context.summary ?? null,
      notif_afternoon_title: context.notifAfternoonTitle ?? null,
      notif_afternoon_body: context.notifAfternoonBody ?? null,
      notif_night_title: context.notifNightTitle ?? null,
      notif_night_body: context.notifNightBody ?? null,
      notif_morning_title: context.notifMorningTitle ?? null,
      notif_morning_body: context.notifMorningBody ?? null,
      last_message_at: context.lastMessageAt ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,date' },
  );
}

export async function insertCoachMessageRemote(
  message: CoachChatMessage,
  date: string,
): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  await supabase.from('coach_messages').insert({
    user_id: userId,
    date,
    role: message.role,
    content: message.content,
    coach_id: message.coachId ?? null,
    created_at: message.createdAt,
  });
}

export async function fetchRemoteCoachContext(
  date?: string,
): Promise<CoachDailyContext | null> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return null;

  const day = todayKey(date);
  const { data, error } = await supabase
    .from('coach_daily_context')
    .select('*')
    .eq('user_id', userId)
    .eq('date', day)
    .maybeSingle();

  if (error || !data) return null;

  return {
    date: data.date,
    topics: data.topics ?? [],
    commitments: data.commitments ?? [],
    mood: data.mood ?? undefined,
    summary: data.summary ?? undefined,
    notifAfternoonTitle: data.notif_afternoon_title ?? undefined,
    notifAfternoonBody: data.notif_afternoon_body ?? undefined,
    notifNightTitle: data.notif_night_title ?? undefined,
    notifNightBody: data.notif_night_body ?? undefined,
    notifMorningTitle: data.notif_morning_title ?? undefined,
    notifMorningBody: data.notif_morning_body ?? undefined,
    lastMessageAt: data.last_message_at ?? undefined,
  };
}

export async function fetchRemoteCoachMessages(
  date?: string,
): Promise<CoachChatMessage[]> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return [];

  const day = todayKey(date);
  const { data, error } = await supabase
    .from('coach_messages')
    .select('*')
    .eq('user_id', userId)
    .eq('date', day)
    .order('created_at', { ascending: true });

  if (error || !data) return [];

  return data.map((row: {
    id: string;
    role: string;
    content: string;
    coach_id: string | null;
    created_at: string;
  }) => ({
    id: row.id,
    role: row.role as CoachMessageRole,
    content: row.content,
    coachId: (row.coach_id as CoachId | null) ?? undefined,
    createdAt: row.created_at,
  }));
}

/** Prefer remote if available, else local. Merge by preferring longer history. */
export async function loadCoachDayState(date?: string): Promise<{
  messages: CoachChatMessage[];
  context: CoachDailyContext | null;
}> {
  const day = todayKey(date);
  const [localMessages, localContext, remoteMessages, remoteContext] = await Promise.all([
    loadLocalCoachMessages(day),
    loadLocalCoachContext(day),
    fetchRemoteCoachMessages(day),
    fetchRemoteCoachContext(day),
  ]);

  const messages =
    remoteMessages.length >= localMessages.length ? remoteMessages : localMessages;
  const context = remoteContext ?? localContext;

  if (messages.length && messages !== localMessages) {
    await saveLocalCoachMessages(messages, day);
  }
  if (context) {
    await saveLocalCoachContext(context);
  }

  return { messages, context };
}

export function emptyContext(date?: string): CoachDailyContext {
  return {
    date: todayKey(date),
    topics: [],
    commitments: [],
  };
}
