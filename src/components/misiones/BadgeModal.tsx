import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BADGE_DEFINITIONS, BadgeId, RANK_COLORS, RANK_LABELS } from '../../types';
import { COLORS, FONT, RADIUS, SPACING } from '../../theme';

interface BadgeModalProps {
  badges: BadgeId[];
  onClose: () => void;
}

export default function BadgeModal({ badges, onClose }: BadgeModalProps) {
  if (!badges.length) return null;

  const first = badges[0];
  const def = BADGE_DEFINITIONS[first];
  const rankColor = RANK_COLORS[def.rank];

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.overlay}>
        <LinearGradient
          colors={['#0A0A14', '#12121F']}
          style={[styles.card, { borderColor: rankColor + '60' }]}
        >
          <Text style={styles.unlocked}>🏅 ¡LOGRO DESBLOQUEADO!</Text>
          <Text style={styles.emoji}>{def.emoji}</Text>
          <Text style={[styles.name, { color: rankColor }]}>{def.name}</Text>
          <Text style={styles.rank}>{RANK_LABELS[def.rank]}</Text>
          <Text style={styles.desc}>{def.description}</Text>
          {badges.length > 1 && (
            <Text style={styles.more}>+{badges.length - 1} logro{badges.length > 2 ? 's' : ''} más</Text>
          )}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: rankColor }]}
            onPress={onClose}
          >
            <Text style={styles.btnText}>GENIAL</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 2,
    gap: SPACING.sm,
  },
  unlocked: { fontSize: FONT.xs, color: COLORS.gold, fontWeight: '800', letterSpacing: 2 },
  emoji: { fontSize: 64, marginVertical: SPACING.sm },
  name: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  rank: { fontSize: FONT.xs, fontWeight: '800', letterSpacing: 2, color: COLORS.textMuted },
  desc: { fontSize: FONT.base, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  more: { fontSize: FONT.sm, color: COLORS.textMuted, fontStyle: 'italic' },
  btn: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
  },
  btnText: { color: '#fff', fontWeight: '900', fontSize: FONT.base, letterSpacing: 1 },
});
