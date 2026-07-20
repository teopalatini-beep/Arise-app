import { useCallback, useEffect, useState } from 'react';
import {
  getReducedMotionSetting,
  getSystemReducedMotion,
  getUserReducedMotionPref,
  setReducedMotionSetting,
  subscribeReducedMotion,
} from '@/lib/motion';

export function useReducedMotionSetting() {
  const [reducedMotion, setReducedMotionState] = useState(false);
  const [userPref, setUserPref] = useState(false);
  const [systemReducedMotion, setSystemReducedMotion] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getReducedMotionSetting(),
      getUserReducedMotionPref(),
      getSystemReducedMotion(),
    ]).then(([effective, pref, system]) => {
      if (cancelled) return;
      setReducedMotionState(effective);
      setUserPref(pref);
      setSystemReducedMotion(system);
      setReady(true);
    });

    const unsubscribe = subscribeReducedMotion((value) => {
      if (!cancelled) setReducedMotionState(value);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const updateReducedMotion = useCallback(async (value: boolean) => {
    setUserPref(value);
    setReducedMotionState(value || systemReducedMotion);
    await setReducedMotionSetting(value);
  }, [systemReducedMotion]);

  return {
    reducedMotion,
    userPref,
    systemReducedMotion,
    ready,
    setReducedMotion: updateReducedMotion,
  };
}
