import { useCallback, useEffect, useRef, useState } from 'react';
import { JournalEntryRecord, SaveJournalEntryInput } from '@/types';
import { getRecentEntries, saveJournalEntry } from '@/services/journalService';

function upsertJournalEntry(list: JournalEntryRecord[], next: JournalEntryRecord): JournalEntryRecord[] {
  const idx = list.findIndex((row) => row.date === next.date);
  if (idx === -1) {
    return [next, ...list].sort((a, b) => b.date.localeCompare(a.date));
  }
  const copy = [...list];
  copy[idx] = { ...copy[idx], ...next };
  return copy;
}

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntryRecord[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? hasLoadedRef.current;
    try {
      if (!silent) setInitialLoading(true);
      else setSyncing(true);
      setError(null);
      const list = await getRecentEntries(40);
      setEntries(list);
      hasLoadedRef.current = true;
    } catch (e) {
      setError((e as Error).message ?? 'No se pudieron cargar las entradas.');
    } finally {
      setInitialLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    void refresh({ silent: false });
  }, [refresh]);

  const saveJournalEntryOptimistic = useCallback(async (entry: SaveJournalEntryInput) => {
    const date = entry.date ?? new Date().toISOString().slice(0, 10);
    const optimistic: JournalEntryRecord = {
      id: `optimistic-${date}`,
      userId: 'local',
      date,
      mood: entry.mood,
      reflection: entry.reflection,
      tags: entry.tags ?? [],
      createdAt: new Date().toISOString(),
    };

    setEntries((prev) => upsertJournalEntry(prev, optimistic));

    try {
      const saved = await saveJournalEntry(entry);
      setEntries((prev) => upsertJournalEntry(prev, saved));
      return saved;
    } catch (e) {
      setError((e as Error).message ?? 'No se pudo guardar la entrada del diario.');
      void refresh({ silent: true });
      throw e;
    }
  }, [refresh]);

  return {
    loading: initialLoading,
    syncing,
    error,
    entries,
    refresh,
    saveJournalEntry: saveJournalEntryOptimistic,
    getRecentEntries: refresh,
  };
}
