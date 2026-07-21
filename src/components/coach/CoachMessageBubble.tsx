import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CoachChatMessage } from '@/types';
import { COLORS, FONT, RADIUS, SPACING } from '@/theme';

interface Props {
  message: CoachChatMessage;
  accent: string;
  coachName: string;
}

export default function CoachMessageBubble({ message, accent, coachName }: Props) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowCoach]}>
      {!isUser && (
        <Text style={[styles.sender, { color: accent }]}>{coachName}</Text>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? styles.bubbleUser
            : [styles.bubbleCoach, { borderColor: accent + '55', backgroundColor: accent + '18' }],
        ]}
      >
        <Text style={styles.text}>{message.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: SPACING.sm,
    maxWidth: '92%',
  },
  rowUser: {
    alignSelf: 'flex-end',
  },
  rowCoach: {
    alignSelf: 'flex-start',
  },
  sender: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    marginLeft: 4,
    letterSpacing: 0.3,
  },
  bubble: {
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  bubbleUser: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  bubbleCoach: {
    borderWidth: 1,
  },
  text: {
    color: COLORS.textPrimary,
    fontSize: FONT.md,
    lineHeight: 22,
  },
});
