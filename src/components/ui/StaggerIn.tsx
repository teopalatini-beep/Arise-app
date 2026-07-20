import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

type StaggerInProps = {
  index: number;
  reducedMotion?: boolean;
  children: React.ReactNode;
};

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

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        delay: index * 45,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 240,
        delay: index * 45,
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
