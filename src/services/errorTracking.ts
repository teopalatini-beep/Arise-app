/**
 * errorTracking.ts — Wrapper de telemetría unificado.
 *
 * Objetivo: que NINGÚN error crítico de backend (red, sync, RPC de Supabase)
 * quede "sordo" en producción. Hoy centraliza y estructura los errores; mañana,
 * cuando se integre Sentry, solo hay que llamar `initErrorTracking(Sentry)` una
 * vez en el arranque de la app y todo el código ya reporta a través de acá.
 *
 * Uso:
 *   trackError(error, 'AppContext.loadData');
 *   trackError(error, { scope: 'db.upsertProfile', severity: 'error', extra: { userId } });
 */

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'fatal';

export interface ErrorContext {
  /** Dónde ocurrió — ej. 'AppContext.syncAllToSupabase'. */
  scope: string;
  /** Gravedad. Los errores de red se degradan a 'warning' automáticamente. */
  severity?: ErrorSeverity;
  /** Metadata adicional para el diagnóstico (userId, dayNumber, etc.). */
  extra?: Record<string, unknown>;
}

export interface TrackedError {
  message: string;
  scope: string;
  severity: ErrorSeverity;
  transient: boolean;
  timestamp: number;
  extra?: Record<string, unknown>;
}

/**
 * Contrato mínimo de un cliente de telemetría remoto (Sentry-compatible).
 * Sentry ya cumple esta forma: `Sentry.captureException(err, { ...})`.
 */
export interface RemoteTelemetryClient {
  captureException: (error: unknown, hint?: Record<string, unknown>) => void;
  captureMessage?: (message: string, hint?: Record<string, unknown>) => void;
}

// ── Estado del módulo ─────────────────────────────────────────────────────────
let _remote: RemoteTelemetryClient | null = null;

// Ring buffer en memoria: los últimos N errores quedan accesibles aunque no haya
// backend remoto configurado. Así nada se pierde silenciosamente en dev/QA.
const RING_BUFFER_SIZE = 50;
const _recent: TrackedError[] = [];

// ── Detección de errores de red (transitorios) ────────────────────────────────
function isNetworkError(error: unknown): boolean {
  const msg = String((error as any)?.message ?? error ?? '').toLowerCase();
  return (
    msg.includes('network request failed') ||
    msg.includes('fetch failed') ||
    msg.includes('network error') ||
    msg.includes('timeout')
  );
}

function normalizeContext(context: string | ErrorContext): ErrorContext {
  return typeof context === 'string' ? { scope: context } : context;
}

function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

// ── API pública ───────────────────────────────────────────────────────────────

/**
 * Registra el cliente remoto (Sentry) una sola vez, típicamente en app/_layout.
 * Mientras no se llame, los errores siguen quedando registrados en memoria +
 * consola estructurada, sin perderse.
 */
export function initErrorTracking(client: RemoteTelemetryClient): void {
  _remote = client;
}

/**
 * Punto único de entrada para reportar un error. Reemplaza los console.error/log
 * silenciosos de los bloques catch.
 */
export function trackError(error: unknown, context: string | ErrorContext): void {
  const ctx = normalizeContext(context);
  const transient = isNetworkError(error);
  // Un error de red no es un bug del código: se degrada a warning para no
  // ensuciar la señal, pero igual queda registrado (no se pierde).
  const severity: ErrorSeverity = ctx.severity ?? (transient ? 'warning' : 'error');

  const tracked: TrackedError = {
    message: toMessage(error),
    scope: ctx.scope,
    severity,
    transient,
    timestamp: Date.now(),
    extra: ctx.extra,
  };

  // 1. Ring buffer en memoria — recuperable con getRecentErrors().
  _recent.push(tracked);
  if (_recent.length > RING_BUFFER_SIZE) _recent.shift();

  // 2. Consola estructurada (visible en dev y en logs nativos de release).
  const tag = `[track:${severity}] ${ctx.scope}`;
  if (severity === 'warning' || severity === 'info') {
    console.warn(tag, tracked.message, ctx.extra ?? '');
  } else {
    console.error(tag, tracked.message, ctx.extra ?? '');
  }

  // 3. Backend remoto (Sentry) si está configurado. Los transitorios de red no
  //    se envían como excepción para no gastar cuota en fallas esperadas offline.
  if (_remote && !transient) {
    _remote.captureException(error, {
      tags: { scope: ctx.scope, severity },
      extra: ctx.extra,
    });
  }
}

/** Los últimos errores registrados en memoria — útil para debug y pantallas de QA. */
export function getRecentErrors(): readonly TrackedError[] {
  return _recent;
}

/** Limpia el buffer en memoria (tests / logout). */
export function clearRecentErrors(): void {
  _recent.length = 0;
}
