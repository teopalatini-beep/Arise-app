import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FONT, GRADIENTS, INK, METAL, RADIUS, SPACING, SURFACES, TOUCH } from '@/theme';
import { useTabScreenMotion } from '@/hooks/useTabScreenMotion';

type HubItem = {
  key: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: '/(tabs)/diario' | '/(tabs)/discovery' | '/(tabs)/config';
};

const ITEMS: HubItem[] = [
  {
    key: 'diario',
    title: 'Diario',
    subtitle: 'Registro emocional y reflexión del día',
    icon: 'book-outline',
    href: '/(tabs)/diario',
  },
  {
    key: 'discovery',
    title: 'Descubre',
    subtitle: 'Herramientas, hábitos y recursos',
    icon: 'compass-outline',
    href: '/(tabs)/discovery',
  },
  {
    key: 'config',
    title: 'Ajustes',
    subtitle: 'Notificaciones, coach y cuenta',
    icon: 'settings-outline',
    href: '/(tabs)/config',
  },
];

export default function MasScreen() {
  const router = useRouter();
  const { screenAnimStyle } = useTabScreenMotion('mas');

  return (
    <LinearGradient colors={[...GRADIENTS.background]} style={styles.container}>
      <Animated.View style={[styles.motion, screenAnimStyle]}>
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Más</Text>
            <Text style={styles.subtitle}>Diario, recursos y ajustes</Text>

            <View style={styles.list}>
              {ITEMS.map((item) => (
                <Pressable
                  key={item.key}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                  onPress={() => router.push(item.href as any)}
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
                  accessibilityHint={item.subtitle}
                  hitSlop={TOUCH.hitSlop}
                >
                  <View style={styles.iconWrap}>
                    <Ionicons name={item.icon} size={22} color={METAL.gold} />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{item.title}</Text>
                    <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={INK.muted} />
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  motion: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  title: {
    fontSize: FONT.xxl,
    fontWeight: '800',
    color: INK.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FONT.sm,
    color: INK.secondary,
    marginTop: 6,
    marginBottom: SPACING.xl,
  },
  list: { gap: SPACING.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    minHeight: TOUCH.minTarget + 16,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.xl,
    backgroundColor: SURFACES.elevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACES.glassBorder,
  },
  rowPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: METAL.goldWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: METAL.goldBorder,
  },
  rowText: { flex: 1 },
  rowTitle: {
    fontSize: FONT.md,
    fontWeight: '700',
    color: INK.primary,
  },
  rowSubtitle: {
    fontSize: FONT.sm,
    color: INK.secondary,
    marginTop: 2,
    lineHeight: 18,
  },
});
