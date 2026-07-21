import React from 'react';
import { StyleSheet, View } from 'react-native';
import { RADIUS, SPACING, SURFACES } from '@/theme';

function Block({ height, radius = RADIUS.xxl }: { height: number; radius?: number }) {
  return (
    <View
      style={[
        styles.block,
        {
          height,
          borderRadius: radius,
        },
      ]}
    />
  );
}

export default function DiscoverySkeleton() {
  return (
    <View style={styles.wrap}>
      <Block height={168} radius={RADIUS.xxl} />
      <View style={styles.cardStack}>
        <Block height={156} />
        <Block height={156} />
        <Block height={156} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: SPACING.md,
    gap: SPACING.lg,
    flex: 1,
    backgroundColor: SURFACES.base,
  },
  cardStack: {
    gap: SPACING.md,
  },
  block: {
    backgroundColor: SURFACES.elevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACES.glassBorder,
    opacity: 0.85,
  },
});
