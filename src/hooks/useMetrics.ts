import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SaveDailyMetricsInput, UserMetricRecord } from '@/types';
import { dayNumberFromDate } from '@/lib/dates';
import { getHeatmapData, getMetricsHistory, saveDailyMetrics } from '@/services/metricsService';

interface UseMetricsOptions {
  startDate?: string;
}

function upsertByDate(list: UserMetricRecord[], next: UserMetricRecord): UserMetricRecord[] {
  const idx = list.findIndex((row) => row.date === next.date);
  if (idx === -1) {
    return [...list, next].sort((a, b) => b.date.localeCompare(a.date));
  }
  const copy = [...list];
  copy[idx] = { ...copy[idx], ...next };
  return copy;
}

export function useMetrics(options: UseMetricsOptions = {}) {
  const [metricsHistory, setMetricsHistory] = useState<UserMetricRecord[]>([]);
  const [heatmapRaw, setHeatmapRaw] = useState<UserMetricRecord[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const pendingRef = useRef<Map<string, UserMetricRecord>>(new Map());

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? hasLoadedRef.current;
    try {
      if (!silent) setInitialLoading(true);
      else setSyncing(true);
      setError(null);

      const [history, heatmap] = await Promise.all([
        getMetricsHistory(120),
        getHeatmapData(120),
      ]);

      let mergedHistory = history;
      let mergedHeatmap = heatmap;
      pendingRef.current.forEach((optimistic) => {
        mergedHistory = upsertByDate(mergedHistory, optimistic);
        mergedHeatmap = upsertByDate(mergedHeatmap, optimistic);
      });

      setMetricsHistory(mergedHistory);
      setHeatmapRaw(mergedHeatmap);
      hasLoadedRef.current = true;
    } catch (e) {
      setError((e as Error).message ?? 'No se pudieron cargar las metricas.');
    } finally {
      setInitialLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    void refresh({ silent: false });
  }, [refresh]);

  const saveDailyMetricsOptimistic = useCallback(async (input: SaveDailyMetricsInput) => {
    const date = input.date ?? new Date().toISOString().slice(0, 10);
    const optimistic: UserMetricRecord = {
      id: `optimistic-${date}`,
      userId: 'local',
      date,
      currentWeight: input.currentWeight,
      waterLiters: input.waterLiters,
      meditationMinutes: input.meditationMinutes,
      readingPages: input.readingPages,
      trainingMinutes: input.trainingMinutes,
      breathingMinutes: input.breathingMinutes,
      sleepHours: input.sleepHours,
      energyLevel: input.energyLevel,
      mood: input.mood,
      notes: input.notes,
      createdAt: new Date().toISOString(),
    };

    pendingRef.current.set(date, optimistic);
    setMetricsHistory((prev) => upsertByDate(prev, optimistic));
    setHeatmapRaw((prev) => upsertByDate(prev, optimistic));

    try {
      const saved = await saveDailyMetrics(input);
      pendingRef.current.delete(date);
      setMetricsHistory((prev) => upsertByDate(prev, saved));
      setHeatmapRaw((prev) => upsertByDate(prev, saved));
      return saved;
    } catch (e) {
      pendingRef.current.delete(date);
      setError((e as Error).message ?? 'No se pudieron guardar las metricas.');
      void refresh({ silent: true });
      throw e;
    }
  }, [refresh]);

  const chartData = useMemo(() => {
    return [...metricsHistory]
      .filter((m) => typeof m.currentWeight === 'number')
      .map((m) => ({
        x: dayNumberFromDate(options.startDate ?? '', m.date),
        y: m.currentWeight as number,
      }))
      .filter((m): m is { x: number; y: number } => typeof m.x === 'number')
      .sort((a, b) => a.x - b.x);
  }, [metricsHistory, options.startDate]);

  const heatmapDayNumbers = useMemo(() => {
    return heatmapRaw
      .map((row) => dayNumberFromDate(options.startDate ?? '', row.date))
      .filter((day): day is number => typeof day === 'number')
      .sort((a, b) => a - b);
  }, [heatmapRaw, options.startDate]);

  return {
    loading: initialLoading,
    syncing,
    error,
    metricsHistory,
    chartData,
    heatmapDayNumbers,
    refresh,
    saveDailyMetrics: saveDailyMetricsOptimistic,
  };
}
