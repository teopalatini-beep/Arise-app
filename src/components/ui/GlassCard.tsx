import React from 'react';
import {
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { BLUR, ELEVATION, METAL, OPACITY, RADIUS, SURFACES, TOUCH } from '@/theme';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accentColor?: string;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  elevated?: 'sm' | 'md' | 'lg';
  blur?: boolean;
  /** Nested double-bezel shell (luxury refs) */
  bezel?: boolean;
  accessibilityLabel?: string;
};

function hexAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `#${clean}${a}`;
}

export default function GlassCard({
  children,
  style,
  accentColor = METAL.gold,
  onPress,
  onPressIn,
  onPressOut,
  elevated = 'md',
  blur = false,
  bezel = true,
  accessibilityLabel,
}: Props) {
  const elevation = ELEVATION[elevated];

  const body = (
    <View style={[bezel ? styles.bezel : null, style]}>
      <View style={[styles.shell, elevation, !bezel && style]}>
        <LinearGradient
          colors={[hexAlpha(accentColor, OPACITY.accentWash), 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        {blur && Platform.OS === 'ios' ? (
          <BlurView intensity={BLUR.card} tint="dark" style={StyleSheet.absoluteFillObject} />
        ) : null}

        <View
          style={[
            styles.inner,
            { borderColor: hexAlpha(accentColor, OPACITY.accentBorder) },
          ]}
        >
          {children}
        </View>
      </View>
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={TOUCH.hitSlop}
      android_ripple={{ color: SURFACES.glassHighlight }}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bezel: {
    borderRadius: RADIUS.xxxl,
    padding: 2,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  shell: {
    borderRadius: RADIUS.xxxl - 2,
    overflow: 'hidden',
    backgroundColor: SURFACES.glass,
  },
  inner: {
    borderRadius: RADIUS.xxxl - 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACES.glassBorder,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.03)' : SURFACES.elevated,
  },
});
