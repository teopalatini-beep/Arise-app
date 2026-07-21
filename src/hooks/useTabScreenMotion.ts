import { useCallback, useRef } from 'react';
import { Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useReducedMotionSetting } from '@/hooks/useReducedMotionSetting';

type TabKey =
  | 'index'
  | 'coach'
  | 'programa'
  | 'progreso'
  | 'mas'
  | 'discovery'
  | 'diario'
  | 'config';

const TAB_ORDER: TabKey[] = [
  'index',
  'coach',
  'programa',
  'progreso',
  'mas',
  'discovery',
  'diario',
  'config',
];
let lastFocusedTabIndex = 0;

export function useTabScreenMotion(tabKey: TabKey) {
  const { reducedMotion } = useReducedMotionSetting();
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      if (reducedMotion) {
        translateX.setValue(0);
        opacity.setValue(1);
        return;
      }

      const currentIndex = TAB_ORDER.indexOf(tabKey);
      const direction = currentIndex >= lastFocusedTabIndex ? 1 : -1;
      lastFocusedTabIndex = currentIndex >= 0 ? currentIndex : lastFocusedTabIndex;

      translateX.setValue(14 * direction);
      opacity.setValue(0.92);

      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          speed: 24,
          bounciness: 4,
        }),
        Animated.spring(opacity, {
          toValue: 1,
          useNativeDriver: true,
          speed: 26,
          bounciness: 0,
        }),
      ]).start();
    }, [opacity, reducedMotion, tabKey, translateX]),
  );

  return {
    reducedMotion,
    screenAnimStyle: {
      transform: [{ translateX }],
      opacity,
    },
  };
}
