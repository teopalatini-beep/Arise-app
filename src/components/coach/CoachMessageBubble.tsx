import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CoachChatMessage } from '@/types';
import { FONT, INK, METAL, RADIUS, SPACING, SURFACES } from '@/theme';

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
          isUser ? styles.bubbleUser : styles.bubbleCoach,
          !isUser && { borderColor: accent + '44', backgroundColor: accent + '14' },
        ]}
      >
        <Text style={[styles.text, isUser && styles.textOnGold]}>{message.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: SPACING.sm + 2,
    maxWidth: '90%',
  },
  rowUser: {
    alignSelf: 'flex-end',
  },
  rowCoach: {
    alignSelf: 'flex-start',
  },
  sender: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
    marginLeft: 6,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  bubble: {
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
  },
  bubbleUser: {
    backgroundColor: METAL.gold,
    borderWidth: 0,
  },
  bubbleCoach: {
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: SURFACES.glass,
  },
  text: {
    color: INK.primary,
    fontSize: FONT.base,
    lineHeight: 22,
  },
  textOnGold: {
    color: INK.inverse,
    fontWeight: '600',
  },
});
