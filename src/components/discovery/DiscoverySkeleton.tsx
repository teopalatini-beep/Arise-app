import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '@/theme';

export default function DiscoverySkeleton() {
  return (
    <View style={styles.wrap}>
      {[120, 56, 72, 88, 88, 88].map((height, index) => (
        <View key={index} style={[styles.block, { height }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: SPACING.md, gap: SPACING.sm, marginTop: SPACING.sm },
  block: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
