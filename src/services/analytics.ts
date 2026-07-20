// ─── ARISE Analytics Service ─────────────────────────────────────────────────
//
// DEV:  All events are console.log'd with structured properties.
// PROD: Replace the `dispatch` function body with your provider SDK call:
//       Firebase → analytics().logEvent(name, props)
//       Mixpanel → Mixpanel.track(name, props)
//
// All public methods return void and are safe to call with `void analytics.X()`
// (fire-and-forget — never block the UI thread).
// ─────────────────────────────────────────────────────────────────────────────

const IS_DEV = __DEV__;

// ── Internal dispatcher ───────────────────────────────────────────────────────

function dispatch(eventName: string, properties: Record<string, unknown>): void {
  if (IS_DEV) {
    console.log('[ANALYTICS] 📊 Event:', eventName, properties);
    return;
  }
  // ── PRODUCTION HOOK ──────────────────────────────────────────────────────
  // Uncomment and adapt for your analytics provider:
  //
  // Firebase Analytics:
  //   import analytics from '@react-native-firebase/analytics';
  //   analytics().logEvent(eventName, properties);
  //
  // Mixpanel:
  //   import { Mixpanel } from 'mixpanel-react-native';
  //   mixpanelInstance.track(eventName, properties);
  // ────────────────────────────────────────────────────────────────────────
}

function daysSinceInstall(installDate?: string): number | undefined {
  if (!installDate) return undefined;
  const start = new Date(`${installDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) return undefined;
  const now = new Date();
  const nowDate = new Date(`${now.toISOString().slice(0, 10)}T00:00:00`);
  const diffMs = nowDate.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

interface CommonAnalyticsContext {
  installDate?: string;
  coachId?: string;
  hasCompletedOnboarding?: boolean;
  notificationSettingsEnabled?: boolean;
  hardMode?: boolean;
}

function withCommonContext(
  props: Record<string, unknown>,
  context?: CommonAnalyticsContext,
): Record<string, unknown> {
  if (!context) return props;
  return {
    ...props,
    installDate: context.installDate,
    daysSinceInstall: daysSinceInstall(context.installDate),
    coachId: context.coachId,
    hasCompletedOnboarding: context.hasCompletedOnboarding,
    notificationSettingsEnabled: context.notificationSettingsEnabled,
    hardMode: context.hardMode,
  };
}

// ── Public event methods ──────────────────────────────────────────────────────

/**
 * Fire once per app open, after data is fully hydrated.
 * Primary signal for D1 / D3 / D7 retention measurement.
 */
export function trackAppOpened(
  dayNumber: number,
  level: number,
  streak: number,
  context?: CommonAnalyticsContext,
): void {
  dispatch('app_opened', withCommonContext({ dayNumber, level, streak }, context));
}

/**
 * Fire every time a mission receives points (units > 0).
 * Use to identify which habit categories generate friction (never touched).
 */
export function trackMissionProgress(
  missionId: string,
  category: string,
  dayNumber: number,
  points: number,
  context?: CommonAnalyticsContext & { units?: number },
): void {
  dispatch(
    'mission_progress',
    withCommonContext({ missionId, category, dayNumber, points, units: context?.units }, context)
  );
}

/**
 * Fire when a day is fully completed (totalPoints crosses the target).
 * Highest-dopamine moment — critical for retention modelling.
 */
export function trackDayCompleted(
  dayNumber: number,
  totalPoints: number,
  streak: number,
  context?: CommonAnalyticsContext,
): void {
  dispatch('day_completed', withCommonContext({ dayNumber, totalPoints, streak }, context));
}

/**
 * Fire when the user consumes a grace-day shield.
 * Lets you monitor whether shields are being used as a crutch or a safety net.
 */
export function trackGraceDayActivated(
  dayNumber: number,
  streakBefore: number,
  context?: CommonAnalyticsContext,
): void {
  dispatch('grace_day_activated', withCommonContext({ dayNumber, streakBefore }, context));
}

/**
 * Fire when a missed day is detected on app open, triggering Purgatory mode.
 * Critical for identifying churn risk: users who hit this rarely come back.
 */
export function trackPenitenceTriggered(dayNumber: number, context?: CommonAnalyticsContext): void {
  dispatch('penitence_triggered', withCommonContext({ dayNumber }, context));
}

/**
 * Fire once when onboarding is completed.
 * Lets us measure conversion and segment users by initial setup choices.
 */
export function trackOnboardingCompleted(
  coachId: string,
  focusAreas: string[],
  customTargets: Record<string, number | null | undefined>,
): void {
  dispatch(
    'onboarding_completed',
    withCommonContext(
      {
        coachId,
        focusAreas,
        customTargets,
      },
      { coachId, hasCompletedOnboarding: true }
    )
  );
}

export function trackOnboardingStepViewed(step: number, stepName: string): void {
  dispatch('onboarding_step_viewed', { step, stepName });
}

export function trackOnboardingStepCompleted(step: number, stepName: string): void {
  dispatch('onboarding_step_completed', { step, stepName });
}

export function trackFirstMissionActivation(
  missionId: string,
  category: string,
  dayNumber: number,
  context?: CommonAnalyticsContext,
): void {
  dispatch(
    'first_mission_activation',
    withCommonContext({ missionId, category, dayNumber }, context)
  );
}

export function trackRpcMissionResult(
  ok: boolean,
  payload: {
    missionId: string;
    dayNumber: number;
    latencyMs: number;
    errorCode?: string;
  },
): void {
  dispatch('rpc_mission_result', {
    ok,
    missionId: payload.missionId,
    dayNumber: payload.dayNumber,
    latencyMs: payload.latencyMs,
    errorCode: payload.errorCode ?? null,
  });
}

export function trackRpcMissionFallback(
  missionId: string,
  dayNumber: number,
  reason: string,
): void {
  dispatch('rpc_mission_fallback', { missionId, dayNumber, reason });
}

export function trackReconcileDelta(
  field: 'xp' | 'streak' | 'current_day' | 'total_points',
  clientValue: number,
  serverValue: number,
): void {
  dispatch('reconcile_delta', {
    field,
    clientValue,
    serverValue,
    absoluteDelta: Math.abs(serverValue - clientValue),
  });
}

export function trackNotificationPermissionRequested(source: string): void {
  dispatch('notification_permission_requested', { source });
}

export function trackNotificationPermissionResult(source: string, granted: boolean): void {
  dispatch('notification_permission_result', { source, granted });
}

export function trackNotificationScheduleSynced(payload: {
  source: string;
  scheduledCount: number;
  coachId: string;
  dayNumber: number;
  goalsLineActive: boolean;
}): void {
  dispatch('notification_schedule_synced', payload);
}
