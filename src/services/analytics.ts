/**
 * analytics.ts — Telemetría de producto (embudos de activación y retención).
 *
 * Mismo patrón desacoplado que errorTracking.ts: el código de la app llama
 * métodos tipados y estables; el envío al proveedor real (PostHog, Amplitude,
 * Segment) se enchufa una sola vez con `initAnalytics(client)` en el arranque.
 * Sin cliente, los eventos quedan en un ring-buffer + consola (nada se pierde).
 *
 * La taxonomía es estricta: cada evento tiene su forma de propiedades definida
 * en `AnalyticsEventProps`, de modo que registrar un evento con props mal
 * tipadas es un error de compilación, no un bug de datos en producción.
 */

import type { CoachId, AdaptiveTrack, OnboardingData } from '../types';

// ── Taxonomía de eventos ──────────────────────────────────────────────────────
export type AnalyticsEventName =
  | 'onboarding_step_viewed'
  | 'onboarding_completed'
  | 'first_mission_activated'
  | 'rpc_sync_execution';

/** Mapa evento → forma exacta de sus propiedades. Fuente de verdad de la taxonomía. */
export interface AnalyticsEventProps {
  onboarding_step_viewed: {
    step_index: number;
    step_name: string;
    total_steps: number;
  };
  onboarding_completed: {
    coach: CoachId;
    goal: OnboardingData['goal'];
    track: AdaptiveTrack;
    training_days_per_week?: number;
    target_weight?: number;
    target_streak?: number;
    target_reading_pages?: number;
  };
  first_mission_activated: {
    mission_id: string;
    day_number: number;
    units: number;
    points: number;
    /** Velocidad de activación: segundos desde que arrancó la sesión actual. */
    seconds_since_session_start: number;
  };
  rpc_sync_execution: {
    /** Nombre lógico del endpoint/operación sincronizada. */
    endpoint: string;
    success: boolean;
    /** Delta de tiempo de la operación, para monitorear salud/latencia. */
    duration_ms: number;
    records_synced?: number;
    error_message?: string;
  };
}

export interface TrackedEvent<E extends AnalyticsEventName = AnalyticsEventName> {
  event: E;
  properties: AnalyticsEventProps[E];
  timestamp: number;
}

/**
 * Contrato mínimo de un proveedor de analíticas. PostHog ya cumple esta forma:
 * `posthog.capture(event, properties)` / `posthog.identify(id, traits)`.
 */
export interface AnalyticsClient {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  identify?: (userId: string, traits?: Record<string, unknown>) => void;
}

// ── Estado del módulo ─────────────────────────────────────────────────────────
let _client: AnalyticsClient | null = null;

// Marca temporal del arranque de la sesión (carga del módulo ≈ inicio de la app).
// Sirve para medir velocidad de activación sin persistencia extra.
const _sessionStart = Date.now();

const RING_BUFFER_SIZE = 50;
const _recent: TrackedEvent[] = [];

// ── API pública ───────────────────────────────────────────────────────────────

/** Enchufa el proveedor real (PostHog/Amplitude). Llamar una vez en el arranque. */
export function initAnalytics(client: AnalyticsClient): void {
  _client = client;
}

/** Asocia los eventos siguientes a un usuario identificado (post-login). */
export function identifyUser(userId: string, traits?: Record<string, unknown>): void {
  _client?.identify?.(userId, traits);
}

/** Segundos transcurridos desde el arranque de la sesión actual. */
export function secondsSinceSessionStart(): number {
  return Math.round((Date.now() - _sessionStart) / 1000);
}

/**
 * Registro genérico y tipado. Los métodos con nombre de abajo son la vía
 * preferida, pero `track` queda expuesto para eventos ad-hoc tipados.
 */
export function track<E extends AnalyticsEventName>(
  event: E,
  properties: AnalyticsEventProps[E],
): void {
  const tracked: TrackedEvent<E> = { event, properties, timestamp: Date.now() };

  _recent.push(tracked);
  if (_recent.length > RING_BUFFER_SIZE) _recent.shift();

  if (__DEV__) {
    console.log(`[analytics] ${event}`, properties);
  }

  _client?.capture(event, properties as Record<string, unknown>);
}

// ── Métodos unificados por evento ─────────────────────────────────────────────

/** Embudo de onboarding: un paso se hizo visible. */
export function trackOnboardingStepViewed(
  props: AnalyticsEventProps['onboarding_step_viewed'],
): void {
  track('onboarding_step_viewed', props);
}

/** Embudo de onboarding: el usuario completó el flujo (coach + metas). */
export function trackOnboardingCompleted(
  props: AnalyticsEventProps['onboarding_completed'],
): void {
  track('onboarding_completed', props);
}

/** Activación: el usuario activó su primera misión (velocidad de activación). */
export function trackFirstMissionActivated(
  props: Omit<AnalyticsEventProps['first_mission_activated'], 'seconds_since_session_start'>,
): void {
  track('first_mission_activated', {
    ...props,
    seconds_since_session_start: secondsSinceSessionStart(),
  });
}

/** Salud de la RPC/sync: registra endpoint, éxito/falla y delta de tiempo. */
export function trackRpcSyncExecution(
  props: AnalyticsEventProps['rpc_sync_execution'],
): void {
  track('rpc_sync_execution', props);
}

/** Últimos eventos registrados en memoria — para QA y debug. */
export function getRecentEvents(): readonly TrackedEvent[] {
  return _recent;
}
