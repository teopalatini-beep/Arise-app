import React, { useEffect } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { DiscoveryTool } from '@/data/discoveryTools';
import { useReducedMotionSetting } from '@/hooks/useReducedMotionSetting';
import { discoveryToolEmojiTag, discoveryToolTitleTag } from '@/lib/discoveryTransitions';
import DisplayText from '@/components/ui/DisplayText';
import { SharedText, SharedView } from '@/components/ui/SharedTransition';
import { DISPLAY, INK, OPACITY, RADIUS, SPACING, SURFACES } from '@/theme';

const { height: SH } = Dimensions.get('window');
const SHEET_HEIGHT = SH * 0.88;
const BACKDROP_DURATION = 280;

type Props = {
  tool: DiscoveryTool | null;
  onClose: () => void;
};

export default function DiscoveryToolHeroModal({ tool, onClose }: Props) {
  const { reducedMotion } = useReducedMotionSetting();
  const backdropOpacity = useSharedValue(0);
  const sheetY = useSharedValue(56);

  useEffect(() => {
    if (!tool) return;

    if (reducedMotion) {
      backdropOpacity.value = 1;
      sheetY.value = 0;
      return;
    }

    backdropOpacity.value = withTiming(1, { duration: BACKDROP_DURATION });
    sheetY.value = withSpring(0, { damping: 20, stiffness: 240 });
  }, [backdropOpacity, reducedMotion, sheetY, tool]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

  function finishClose() {
    onClose();
  }

  function handleClose() {
    if (!tool) return;
    if (reducedMotion) {
      finishClose();
      return;
    }

    backdropOpacity.value = withTiming(0, { duration: BACKDROP_DURATION });
    sheetY.value = withSpring(56, { damping: 22, stiffness: 280 }, (finished) => {
      if (finished) {
        runOnJS(finishClose)();
      }
    });
  }

  return (
    <Modal
      visible={!!tool}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {tool ? (
        <View style={styles.root}>
          <Animated.View style={[StyleSheet.absoluteFillObject, backdropStyle]}>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={48} tint="dark" style={StyleSheet.absoluteFillObject} />
            ) : null}
            <View style={styles.scrim} />
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={handleClose}
              accessibilityLabel="Cerrar herramienta"
            />
          </Animated.View>

          <Animated.View style={[styles.sheetWrap, { height: SHEET_HEIGHT }, sheetStyle]}>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={64} tint="dark" style={StyleSheet.absoluteFillObject} />
            ) : null}
            <View style={styles.sheetFallback} />

            <View style={styles.sheetInner}>
              <View style={styles.handle} />

              <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
              >
                <View style={[styles.header, { borderColor: `${tool.color}22` }]}>
                  <SharedView
                    tag={discoveryToolEmojiTag(tool.id)}
                    style={[styles.emojiWrap, { backgroundColor: `${tool.color}20` }]}
                  >
                    <Text style={styles.emoji}>{tool.emoji}</Text>
                  </SharedView>
                  <View style={{ flex: 1 }}>
                    <DisplayText variant="caption">Cuando estás</DisplayText>
                    <SharedText tag={discoveryToolTitleTag(tool.id)} style={styles.titleNative}>
                      {tool.emotion}
                    </SharedText>
                    <DisplayText variant="caption" style={{ color: tool.color, marginTop: 4 }}>
                      Toolkit emocional
                    </DisplayText>
                  </View>
                </View>

                <DisplayText variant="subtitle" style={styles.description}>
                  {tool.description}
                </DisplayText>

                <DisplayText variant="caption" style={styles.sectionLabel}>ACCIÓN INMEDIATA</DisplayText>
                {tool.immediate.map((step, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={[styles.stepNum, { color: INK.primary }]}>{i + 1}</Text>
                    <DisplayText variant="cardBody">{step}</DisplayText>
                  </View>
                ))}

                <DisplayText variant="caption" style={styles.sectionLabel}>ESTRATEGIA A CORTO PLAZO</DisplayText>
                {tool.shortTerm.map((item, i) => (
                  <View key={i} style={styles.listItem}>
                    <View style={[styles.bullet, { backgroundColor: INK.secondary }]} />
                    <DisplayText variant="cardBody">{item}</DisplayText>
                  </View>
                ))}

                <DisplayText variant="caption" style={styles.sectionLabel}>CAMBIO DE MENTALIDAD</DisplayText>
                <View style={[styles.quoteBox, { borderLeftColor: tool.color }]}>
                  <DisplayText variant="cardBody" style={{ color: INK.primary }}>{tool.mindset}</DisplayText>
                </View>

                <DisplayText variant="caption" style={styles.sectionLabel}>PERSPECTIVA ESTOICA</DisplayText>
                <View style={styles.stoicBox}>
                  <DisplayText variant="cardBody" style={styles.stoicText}>{tool.stoic}</DisplayText>
                </View>

                <Pressable style={styles.closeBtn} onPress={handleClose}>
                  <Text style={styles.closeBtnText}>Cerrar</Text>
                </Pressable>
              </ScrollView>
            </View>
          </Animated.View>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: `rgba(0,0,0,${OPACITY.sheetScrim})`,
  },
  sheetWrap: {
    borderTopLeftRadius: RADIUS.xxxl,
    borderTopRightRadius: RADIUS.xxxl,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACES.glassHighlight,
    borderBottomWidth: 0,
  },
  sheetFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SURFACES.overlay,
  },
  sheetInner: {
    flex: 1,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: SURFACES.glassHighlight,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: SPACING.lg,
    alignItems: 'flex-start',
    backgroundColor: SURFACES.glass,
  },
  emojiWrap: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACES.glassBorder,
  },
  emoji: { fontSize: 34 },
  titleNative: {
    ...DISPLAY.cardTitle,
    color: INK.primary,
    marginTop: 2,
  },
  description: {
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
    letterSpacing: 1.2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 7,
    flexShrink: 0,
  },
  stepNum: {
    fontSize: 15,
    fontWeight: '800',
    width: 20,
    flexShrink: 0,
  },
  quoteBox: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderLeftWidth: 2,
    backgroundColor: SURFACES.glass,
    marginBottom: SPACING.md,
  },
  stoicBox: {
    backgroundColor: SURFACES.glass,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACES.glassBorder,
  },
  stoicText: {
    fontStyle: 'italic',
  },
  closeBtn: {
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
    backgroundColor: INK.primary,
  },
  closeBtnText: {
    color: INK.inverse,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.3,
  },
});
