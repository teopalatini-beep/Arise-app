import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DisplayText, { TrustBadgePill } from '@/components/ui/DisplayText';
import { GRADIENTS, METAL, RADIUS, SPACING, SURFACES } from '@/theme';

export type HeroZoneProps = {
  trustBadge: string;
  headline: { line1: string; line2: string };
  subtitle: string;
};

export default function HeroZone({ trustBadge, headline, subtitle }: HeroZoneProps) {
  return (
    <View style={styles.bezel}>
      <View style={styles.wrap}>
        <LinearGradient
          colors={[...GRADIENTS.heroMesh]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={styles.mesh}
          pointerEvents="none"
        />
        <View style={styles.goldEdge} pointerEvents="none" />
        <View style={styles.content}>
          <TrustBadgePill text={trustBadge} />
          <View style={styles.headlineBlock}>
            <DisplayText variant="heroLine1">{headline.line1}</DisplayText>
            <DisplayText variant="heroLine2" style={styles.line2}>{headline.line2}</DisplayText>
          </View>
          <DisplayText variant="subtitle">{subtitle}</DisplayText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bezel: {
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.xxl,
    padding: 2,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: METAL.goldBorder,
  },
  wrap: {
    borderRadius: RADIUS.xxl - 2,
    overflow: 'hidden',
    backgroundColor: SURFACES.raised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACES.glassBorder,
  },
  mesh: {
    ...StyleSheet.absoluteFillObject,
  },
  goldEdge: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 2,
    borderRadius: 2,
    backgroundColor: METAL.gold,
    opacity: 0.55,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  headlineBlock: {
    gap: 2,
  },
  line2: {
    opacity: 0.92,
  },
});
