import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import GlassCard from '@/components/ui/GlassCard';
import DisplayText from '@/components/ui/DisplayText';
import { SharedText, SharedView } from '@/components/ui/SharedTransition';
import { DiscoveryTool } from '@/data/discoveryTools';
import { useReducedMotionSetting } from '@/hooks/useReducedMotionSetting';
import { discoveryToolEmojiTag, discoveryToolTitleTag } from '@/lib/discoveryTransitions';
import { INK, MOTION, RADIUS, SPACING, TOUCH } from '@/theme';

type Props = {
  tool: DiscoveryTool;
  onPress: (tool: DiscoveryTool) => void;
};

function DiscoveryToolCardBase({ tool, onPress }: Props) {
  const { reducedMotion } = useReducedMotionSetting();
  const scale = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    if (reducedMotion) return;
    scale.value = withSpring(MOTION.pressScale, MOTION.spring);
  }

  function handlePressOut() {
    if (reducedMotion) return;
    scale.value = withSpring(1, {
      damping: MOTION.spring.damping,
      stiffness: MOTION.spring.stiffness + 20,
    });
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir herramienta para ${tool.emotion}`}
      hitSlop={TOUCH.hitSlop}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(tool);
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.wrap, cardStyle]}>
        <GlassCard accentColor={tool.color} elevated="lg">
          <View style={styles.body}>
            <View style={styles.topRow}>
              <SharedView
                tag={discoveryToolEmojiTag(tool.id)}
                style={[styles.emojiOrb, { backgroundColor: `${tool.color}18` }]}
              >
                <Text style={styles.emoji}>{tool.emoji}</Text>
              </SharedView>
              <View style={styles.cta}>
                <Ionicons name="arrow-forward" size={16} color={INK.secondary} />
              </View>
            </View>

            <View style={styles.copy}>
              <SharedText tag={discoveryToolTitleTag(tool.id)} style={styles.titleNative}>
                {tool.emotion}
              </SharedText>
              <DisplayText variant="cardBody" numberOfLines={2}>
                {tool.description}
              </DisplayText>
            </View>

            <DisplayText variant="caption" style={styles.footer}>
              Toolkit emocional · Tocá para explorar
            </DisplayText>
          </View>
        </GlassCard>
      </Animated.View>
    </Pressable>
  );
}

export default memo(DiscoveryToolCardBase);

const styles = StyleSheet.create({
  wrap: {
    marginBottom: SPACING.md,
  },
  body: {
    padding: SPACING.lg,
    minHeight: 156,
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  emojiOrb: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emoji: { fontSize: 28 },
  cta: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  copy: { gap: 6 },
  titleNative: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 22,
    color: INK.primary,
  },
  footer: {
    marginTop: 2,
  },
});
