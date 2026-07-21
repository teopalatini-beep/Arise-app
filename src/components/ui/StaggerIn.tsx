import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { MOTION } from '@/theme';

type StaggerInProps = {
  index: number;
  reducedMotion?: boolean;
  children: React.ReactNode;
};

const easeOut = Easing.bezier(...MOTION.easeOutBezier);

export default function StaggerIn({
  index,
  reducedMotion = false,
  children,
}: StaggerInProps) {
  const opacity = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reducedMotion ? 0 : 10)).current;

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }

    const delay = index * MOTION.staggerMs;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: MOTION.enterMs,
        delay,
        easing: easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: MOTION.enterMs,
        delay,
        easing: easeOut,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, reducedMotion, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}
