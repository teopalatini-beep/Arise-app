import { useCallback, useRef } from 'react';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useReducedMotionSetting } from '@/hooks/useReducedMotionSetting';

export function usePressSpring(scaleTo = 0.96) {
  const { reducedMotion } = useReducedMotionSetting();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    if (reducedMotion) return;
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 28,
      bounciness: 0,
    }).start();
  }, [reducedMotion, scale, scaleTo]);

  const onPressOut = useCallback(() => {
    if (reducedMotion) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 22,
      bounciness: 6,
    }).start();
  }, [reducedMotion, scale]);

  const triggerHaptic = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  return {
    scale,
    pressHandlers: { onPressIn, onPressOut },
    triggerHaptic,
    animatedStyle: { transform: [{ scale }] },
  };
}
