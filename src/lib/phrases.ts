import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export interface Phrase {
  title: string;
  body: string;
}

export type PhraseTurn = 'morning' | 'afternoon' | 'night' | 'streak';

const CACHE_KEY = 'arise_phrases_cache';
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6 hours

interface PhraseCache {
  ts: number;
  data: Record<PhraseTurn, Phrase[]>;
}

// ─── Fetch from Supabase ─────────────────────────────────────────────────────
async function fetchRemotePhrases(): Promise<Record<PhraseTurn, Phrase[]> | null> {
  try {
    const { data, error } = await supabase
      .from('phrases')
      .select('title, body, turn')
      .eq('active', true);

    if (error || !data || data.length === 0) return null;

    const grouped: Record<PhraseTurn, Phrase[]> = {
      morning: [],
      afternoon: [],
      night: [],
      streak: [],
    };

    for (const row of data) {
      const turn = row.turn as PhraseTurn;
      if (grouped[turn]) {
        grouped[turn].push({ title: row.title, body: row.body });
      }
    }

    // Only return if we got at least some phrases per turn
    const hasEnough = Object.values(grouped).every((arr) => arr.length >= 3);
    return hasEnough ? grouped : null;
  } catch {
    return null;
  }
}

// ─── Cache management ────────────────────────────────────────────────────────
async function loadCache(): Promise<PhraseCache | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: PhraseCache = JSON.parse(raw);
    if (Date.now() - cache.ts > CACHE_TTL) return null;
    return cache;
  } catch {
    return null;
  }
}

async function saveCache(data: Record<PhraseTurn, Phrase[]>): Promise<void> {
  try {
    const cache: PhraseCache = { ts: Date.now(), data };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

// ─── Public API ──────────────────────────────────────────────────────────────

let _cached: Record<PhraseTurn, Phrase[]> | null = null;

export async function loadPhrases(): Promise<void> {
  // 1. Try memory cache
  if (_cached) return;

  // 2. Try disk cache
  const diskCache = await loadCache();
  if (diskCache) {
    _cached = diskCache.data;
    return;
  }

  // 3. Try Supabase
  const remote = await fetchRemotePhrases();
  if (remote) {
    _cached = remote;
    await saveCache(remote);
  }
  // 4. If all fail, getPhrasesForTurn falls back to hardcoded
}

export function getPhrasesForTurn(
  turn: PhraseTurn,
  fallback: Phrase[],
): Phrase[] {
  if (_cached && _cached[turn] && _cached[turn].length > 0) {
    return _cached[turn];
  }
  return fallback;
}

export function randomPhrase(phrases: Phrase[]): Phrase {
  return phrases[Math.floor(Math.random() * phrases.length)];
}
