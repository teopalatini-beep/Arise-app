import React, { memo } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DiscoveryTool } from '@/data/discoveryTools';
import { usePressSpring } from '@/hooks/usePressSpring';
import { COLORS, FONT, RADIUS, SPACING } from '@/theme';

type Props = {
  tool: DiscoveryTool;
  onPress: (tool: DiscoveryTool) => void;
};

function DiscoveryToolCardBase({ tool, onPress }: Props) {
  const { animatedStyle, pressHandlers, triggerHaptic } = usePressSpring(0.97);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir herramienta para ${tool.emotion}`}
      onPress={() => {
        triggerHaptic();
        onPress(tool);
      }}
      {...pressHandlers}
    >
      <Animated.View
        style={[
          styles.card,
          { borderColor: tool.color + '30', backgroundColor: tool.color + '10' },
          animatedStyle,
        ]}
      >
        <View style={[styles.emoji, { backgroundColor: tool.color + '25' }]}>
          <Text style={styles.emojiText}>{tool.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{tool.emotion}</Text>
          <Text style={styles.meta} numberOfLines={2}>{tool.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={tool.color} />
      </Animated.View>
    </Pressable>
  );
}

export default memo(DiscoveryToolCardBase);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
  },
  emoji: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 24 },
  name: { fontSize: FONT.base, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  meta: { fontSize: FONT.xs, color: COLORS.textSecondary, lineHeight: 16 },
});
