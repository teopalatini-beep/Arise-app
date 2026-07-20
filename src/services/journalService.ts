import { supabase } from '@/lib/supabase';
import { JournalEntryRecord, SaveJournalEntryInput } from '@/types';

let cachedUserId: string | null = null;

function mapJournalRow(row: any): JournalEntryRecord {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    mood: row.mood ?? undefined,
    reflection: row.reflection,
    tags: row.tags ?? [],
    createdAt: row.created_at,
  };
}

async function getAuthUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) {
    throw new Error('No se pudo obtener el usuario autenticado.');
  }
  cachedUserId = data.user.id;
  return cachedUserId;
}

export async function saveJournalEntry(entry: SaveJournalEntryInput): Promise<JournalEntryRecord> {
  const userId = await getAuthUserId();
  const date = entry.date ?? new Date().toISOString().slice(0, 10);

  const payload = {
    user_id: userId,
    date,
    mood: entry.mood ?? null,
    reflection: entry.reflection,
    tags: entry.tags ?? [],
  };

  const { data, error } = await supabase
    .from('journal_entries')
    .upsert(payload, { onConflict: 'user_id,date' })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo guardar la entrada del diario.');
  }

  return mapJournalRow(data);
}

export async function getRecentEntries(limit = 30): Promise<JournalEntryRecord[]> {
  const userId = await getAuthUserId();
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudieron cargar las entradas del diario.');
  }

  return data.map(mapJournalRow);
}
