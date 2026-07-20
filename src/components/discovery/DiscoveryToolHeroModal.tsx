import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DiscoveryTool } from '@/data/discoveryTools';
import { useReducedMotionSetting } from '@/hooks/useReducedMotionSetting';
import { COLORS, FONT, RADIUS, SPACING } from '@/theme';

type Props = {
  tool: DiscoveryTool | null;
  onClose: () => void;
};

export default function DiscoveryToolHeroModal({ tool, onClose }: Props) {
  const { reducedMotion } = useReducedMotionSetting();
  const backdrop = useRef(new Animated.Value(0)).current;
  const sheetY = useRef(new Animated.Value(48)).current;

  useEffect(() => {
    if (!tool) return;

    backdrop.setValue(0);
    sheetY.setValue(reducedMotion ? 0 : 48);

    if (reducedMotion) {
      backdrop.setValue(1);
      return;
    }

    Animated.parallel([
      Animated.spring(backdrop, {
        toValue: 1,
        useNativeDriver: true,
        speed: 22,
        bounciness: 0,
      }),
      Animated.spring(sheetY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 18,
        bounciness: 7,
      }),
    ]).start();
  }, [backdrop, reducedMotion, sheetY, tool]);

  if (!tool) return null;

  function handleClose() {
    if (reducedMotion) {
      onClose();
      return;
    }

    Animated.parallel([
      Animated.spring(backdrop, {
        toValue: 0,
        useNativeDriver: true,
        speed: 24,
        bounciness: 0,
      }),
      Animated.spring(sheetY, {
        toValue: 48,
        useNativeDriver: true,
        speed: 24,
        bounciness: 0,
      }),
    ]).start(({ finished }) => {
      if (finished) onClose();
    });
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFillObject, styles.backdrop, { opacity: backdrop }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={{ transform: [{ translateY: sheetY }] }}>
          <LinearGradient colors={['#0D1628', '#111E35']} style={styles.sheet}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.handle} />

              <View style={[styles.header, { borderColor: tool.color + '30', backgroundColor: tool.color + '10' }]}>
                <Text style={styles.emoji}>{tool.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>Cuando estás {tool.emotion.toLowerCase()}</Text>
                  <Text style={[styles.meta, { color: tool.color, marginTop: 4 }]}>Toolkit emocional</Text>
                </View>
              </View>

              <Text style={[styles.description, { marginBottom: SPACING.md }]}>{tool.description}</Text>

              <Text style={styles.sectionLabel}>ACCIÓN INMEDIATA</Text>
              {tool.immediate.map((step, i) => (
                <View key={i} style={styles.listItem}>
                  <Text style={[styles.stepNum, { color: tool.color }]}>{i + 1}</Text>
                  <Text style={styles.listText}>{step}</Text>
                </View>
              ))}

              <Text style={styles.sectionLabel}>ESTRATEGIA A CORTO PLAZO</Text>
              {tool.shortTerm.map((item, i) => (
                <View key={i} style={styles.listItem}>
                  <View style={[styles.bullet, { backgroundColor: tool.color }]} />
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}

              <Text style={styles.sectionLabel}>CAMBIO DE MENTALIDAD</Text>
              <View style={[styles.quoteBox, { backgroundColor: tool.color + '15', borderLeftColor: tool.color }]}>
                <Text style={[styles.listText, { color: COLORS.textPrimary }]}>{tool.mindset}</Text>
              </View>

              <Text style={styles.sectionLabel}>PERSPECTIVA ESTOICA</Text>
              <View style={styles.stoicBox}>
                <Text style={[styles.listText, { color: COLORS.textSecondary, fontStyle: 'italic' }]}>{tool.stoic}</Text>
              </View>

              <Pressable style={[styles.closeBtn, { backgroundColor: tool.color }]} onPress={handleClose}>
                <Text style={styles.closeBtnText}>Cerrar</Text>
              </Pressable>
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { maxHeight: '85%', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl },
  content: { padding: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.xl },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.lg,
    alignItems: 'flex-start',
  },
  emoji: { fontSize: 36 },
  title: { fontSize: FONT.lg, fontWeight: '800', color: COLORS.textPrimary },
  meta: { fontSize: FONT.xs, color: COLORS.textMuted },
  sectionLabel: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  description: { fontSize: FONT.base, color: COLORS.textSecondary, lineHeight: 24 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.sm },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  stepNum: { fontSize: FONT.base, fontWeight: '900', width: 20, flexShrink: 0 },
  listText: { flex: 1, fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 22 },
  quoteBox: { borderRadius: RADIUS.md, padding: SPACING.md, borderLeftWidth: 3, marginBottom: SPACING.md },
  stoicBox: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  closeBtn: { borderRadius: RADIUS.lg, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.sm },
  closeBtnText: { color: '#fff', fontWeight: '800', fontSize: FONT.base, letterSpacing: 0.5 },
});
