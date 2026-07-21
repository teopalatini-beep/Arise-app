import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { DISPLAY, INK, METAL } from '@/theme';

type Variant = 'heroLine1' | 'heroLine2' | 'trustBadge' | 'subtitle' | 'caption' | 'cardTitle' | 'cardBody';

const VARIANTS: Record<Variant, TextStyle> = {
  heroLine1: { ...DISPLAY.hero.line1, color: INK.primary },
  heroLine2: { ...DISPLAY.hero.line2, color: INK.primary },
  trustBadge: { ...DISPLAY.trustBadge, color: METAL.gold },
  subtitle: { ...DISPLAY.subtitle, color: INK.secondary },
  caption: { ...DISPLAY.caption, color: INK.muted },
  cardTitle: { ...DISPLAY.cardTitle, color: INK.primary },
  cardBody: { ...DISPLAY.cardBody, color: INK.secondary },
};

type Props = {
  variant: Variant;
  children: React.ReactNode;
  style?: TextStyle;
  numberOfLines?: number;
};

export default function DisplayText({ variant, children, style, numberOfLines }: Props) {
  return (
    <Text style={[VARIANTS[variant], style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

export function TrustBadgePill({ text, style }: { text: string; style?: ViewStyle }) {
  return (
    <View style={[styles.trustPill, style]}>
      <DisplayText variant="trustBadge">{text}</DisplayText>
    </View>
  );
}

const styles = StyleSheet.create({
  trustPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: METAL.goldBorder,
    backgroundColor: METAL.goldWash,
  },
});
