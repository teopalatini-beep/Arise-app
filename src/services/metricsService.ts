import { supabase } from '@/lib/supabase';
import { SaveDailyMetricsInput, UserMetricRecord } from '@/types';

let cachedUserId: string | null = null;

function mapMetricRow(row: any): UserMetricRecord {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    currentWeight: row.current_weight ?? undefined,
    waterLiters: row.water_liters ?? undefined,
    meditationMinutes: row.meditation_minutes ?? undefined,
    readingPages: row.reading_pages ?? undefined,
    trainingMinutes: row.training_minutes ?? undefined,
    breathingMinutes: row.breathing_minutes ?? undefined,
    sleepHours: row.sleep_hours ?? undefined,
    energyLevel: row.energy_level ?? undefined,
    mood: row.mood ?? undefined,
    notes: row.notes ?? undefined,
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

export function clearMetricsAuthCache(): void {
  cachedUserId = null;
}

export async function saveDailyMetrics(metrics: SaveDailyMetricsInput): Promise<UserMetricRecord> {
  const userId = await getAuthUserId();
  const date = metrics.date ?? new Date().toISOString().slice(0, 10);

  const payload = {
    user_id: userId,
    date,
    current_weight: metrics.currentWeight ?? null,
    water_liters: metrics.waterLiters ?? null,
    meditation_minutes: metrics.meditationMinutes ?? null,
    reading_pages: metrics.readingPages ?? null,
    training_minutes: metrics.trainingMinutes ?? null,
    breathing_minutes: metrics.breathingMinutes ?? null,
    sleep_hours: metrics.sleepHours ?? null,
    energy_level: metrics.energyLevel ?? null,
    mood: metrics.mood ?? null,
    notes: metrics.notes ?? null,
  };

  const { data, error } = await supabase
    .from('user_metrics')
    .upsert(payload, { onConflict: 'user_id,date' })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudieron guardar las metricas.');
  }

  return mapMetricRow(data);
}

export async function getMetricsHistory(limit = 90): Promise<UserMetricRecord[]> {
  const userId = await getAuthUserId();
  const { data, error } = await supabase
    .from('user_metrics')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo cargar el historial de metricas.');
  }

  return data.map(mapMetricRow);
}

export async function getHeatmapData(limit = 120): Promise<UserMetricRecord[]> {
  const userId = await getAuthUserId();
  const { data, error } = await supabase
    .from('user_metrics')
    .select('id,user_id,date,current_weight,created_at')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo cargar la data de heatmap.');
  }

  return data.map(mapMetricRow);
}
