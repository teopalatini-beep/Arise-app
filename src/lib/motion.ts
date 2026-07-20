import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessibilityInfo } from 'react-native';

export const REDUCED_MOTION_KEY = 'arise_reduced_motion_v1';

type Listener = (value: boolean) => void;

let cachedUserPref = false;
let cachedSystemReduce = false;
let initialized = false;
const listeners = new Set<Listener>();

function computeEffective(): boolean {
  return cachedSystemReduce || cachedUserPref;
}

function notifyListeners(): void {
  const value = computeEffective();
  listeners.forEach((listener) => listener(value));
}

async function initReducedMotion(): Promise<boolean> {
  const [raw, system] = await Promise.all([
    AsyncStorage.getItem(REDUCED_MOTION_KEY),
    AccessibilityInfo.isReduceMotionEnabled(),
  ]);
  cachedUserPref = raw === '1';
  cachedSystemReduce = system;
  initialized = true;
  return computeEffective();
}

export async function getReducedMotionSetting(): Promise<boolean> {
  if (initialized) return computeEffective();
  return initReducedMotion();
}

export async function getUserReducedMotionPref(): Promise<boolean> {
  if (!initialized) await initReducedMotion();
  return cachedUserPref;
}

export async function getSystemReducedMotion(): Promise<boolean> {
  if (!initialized) await initReducedMotion();
  return cachedSystemReduce;
}

export async function setReducedMotionSetting(value: boolean): Promise<void> {
  cachedUserPref = value;
  initialized = true;
  await AsyncStorage.setItem(REDUCED_MOTION_KEY, value ? '1' : '0');
  notifyListeners();
}

export function subscribeReducedMotion(listener: Listener): () => void {
  listeners.add(listener);

  const subscription = AccessibilityInfo.addEventListener(
    'reduceMotionChanged',
    (enabled) => {
      cachedSystemReduce = enabled;
      notifyListeners();
    },
  );

  return () => {
    listeners.delete(listener);
    subscription.remove();
  };
}
