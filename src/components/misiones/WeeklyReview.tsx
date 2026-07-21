import React, { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Modal, Pressable, View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SPACING } from '../../theme';

interface WeeklyReviewProps {
  weekNumber: number;
  stats: { completed: number; trainMin: number; readPages: number; breathMin: number };
  coachName: string;
  coachEmoji?: string;
  coachIcon?: React.ComponentProps<typeof Ionicons>['name'];
  wins: string[];
  focus: string[];
  coachMessage: string;
  onClose: (intention: string) => void;
}

export default function WeeklyReview({
  weekNumber,
  stats,
  coachName,
  coachEmoji,
  coachIcon = 'flash',
  wins,
  focus,
  coachMessage,
  onClose,
}: WeeklyReviewProps) {
  const [intention, setIntention] = useState('');
  const completionColor = stats.completed >= 6 ? COLORS.success : stats.completed >= 4 ? COLORS.warning : COLORS.danger;

  return (
    <Modal transparent animationType="slide" onRequestClose={() => onClose(intention)}>
      <Pressable style={styles.backdrop} onPress={() => onClose(intention)} />
      <View style={styles.sheet}>
        <LinearGradient colors={['#111E35', '#0D1628']} style={styles.content}>
          <View style={styles.handle} />

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <View>
                <Text style={styles.weekLabel}>SEMANA {weekNumber - 1} — REVIEW</Text>
                <Text style={styles.headerTitle}>¿Cómo fue tu semana?</Text>
              </View>
              <Ionicons name="clipboard-outline" size={28} color={COLORS.accent} />
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statBox, { borderColor: completionColor + '50' }]}>
                <Text style={[styles.statNum, { color: completionColor }]}>{stats.completed}/7</Text>
                <Text style={styles.statLabel}>Días</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{stats.trainMin}</Text>
                <Text style={styles.statLabel}>Min entreno</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{stats.readPages}</Text>
                <Text style={styles.statLabel}>Págs leídas</Text>
              </View>
              {stats.breathMin > 0 && (
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{stats.breathMin}</Text>
                  <Text style={styles.statLabel}>Min resp.</Text>
                </View>
              )}
            </View>

            <View style={styles.coachCard}>
              <View style={styles.coachHeader}>
                {coachEmoji ? (
                  <Text style={{ fontSize: 20 }}>{coachEmoji}</Text>
                ) : (
                  <Ionicons name={coachIcon} size={20} color={COLORS.accent} />
                )}
                <Text style={styles.coachName}>{coachName} dice:</Text>
              </View>
              <Text style={styles.coachMsg}>{coachMessage}</Text>
            </View>

            <Text style={styles.sectionLabel}>LO QUE FUNCIONÓ</Text>
            {wins.slice(0, 3).map((w, i) => (
              <View key={i} style={styles.listRow}>
                <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                <Text style={styles.listText}>{w}</Text>
              </View>
            ))}

            <Text style={styles.sectionLabel}>PRÓXIMA SEMANA — FOCO</Text>
            {focus.slice(0, 2).map((f, i) => (
              <View key={i} style={styles.listRow}>
                <Ionicons name="arrow-forward-circle" size={16} color={COLORS.accent} />
                <Text style={styles.listText}>{f}</Text>
              </View>
            ))}

            <Text style={styles.sectionLabel}>MI INTENCIÓN PARA LA SEMANA {weekNumber}</Text>
            <TextInput
              style={styles.intentionInput}
              placeholder="¿Qué vas a priorizar esta semana?"
              placeholderTextColor={COLORS.textMuted}
              value={intention}
              onChangeText={setIntention}
              multiline
              numberOfLines={3}
              maxLength={200}
            />

            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onClose(intention);
              }}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[COLORS.accent, '#3A7BD5']} style={styles.ctaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.ctaText}>ARRANCAR SEMANA {weekNumber} →</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: { maxHeight: '90%' },
  content: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, paddingTop: SPACING.sm, flex: 1 },
  handle: { width: 36, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: SPACING.md },

  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: SPACING.lg },
  weekLabel: { fontSize: FONT.xs, color: COLORS.accent, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  headerTitle: { fontSize: FONT.xl, fontWeight: '900', color: COLORS.textPrimary },

  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statBox: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statNum: { fontSize: FONT.lg, fontWeight: '900', color: COLORS.textPrimary },
  statLabel: { fontSize: 9, color: COLORS.textMuted, marginTop: 2, fontWeight: '600', textAlign: 'center' },

  coachCard: { backgroundColor: 'rgba(72,149,239,0.1)', borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.accent + '30', marginBottom: SPACING.lg },
  coachHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.sm },
  coachName: { fontSize: FONT.sm, fontWeight: '800', color: COLORS.accent },
  coachMsg: { fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 22, fontStyle: 'italic' },

  sectionLabel: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 2, marginBottom: SPACING.sm, marginTop: SPACING.md },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: 8 },
  listText: { flex: 1, fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 20 },

  intentionInput: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONT.sm,
    lineHeight: 22,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: SPACING.lg,
  },

  ctaBtn: { borderRadius: RADIUS.lg, overflow: 'hidden' },
  ctaGradient: { paddingVertical: SPACING.md, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '900', fontSize: FONT.base, letterSpacing: 1 },
});
