import { useCallback, useRef } from 'react';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useReducedMotionSetting } from '@/hooks/useReducedMotionSetting';
import { MOTION } from '@/theme';

export function usePressSpring(scaleTo = MOTION.pressScale) {
  const { reducedMotion } = useReducedMotionSetting();
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    if (reducedMotion) return;
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      damping: MOTION.spring.damping,
      stiffness: MOTION.spring.stiffness,
    }).start();
  }, [reducedMotion, scale, scaleTo]);

  const onPressOut = useCallback(() => {
    if (reducedMotion) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: MOTION.spring.damping,
      stiffness: MOTION.spring.stiffness + 20,
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
