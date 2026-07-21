import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { COLORS, FONT, RADIUS, SPACING } from '@/theme';
import { CoachChatMessage } from '@/types';
import { getCoachById, getCoachVisualProfile } from '@/lib/coach';
import { getStageTheme } from '@/lib/progression';
import {
  coachContextToNotifContext,
  syncNotificationSchedule,
} from '@/lib/notifications';
import { getOpeningMessage, sendCoachMessage } from '@/services/coachChat';
import {
  loadCoachDayState,
  loadPersonalCoachEnabled,
  appendLocalCoachMessage,
} from '@/services/coachMemory';
import CoachMessageBubble from '@components/coach/CoachMessageBubble';
import { ALL_MISSIONS } from '@/data/missions';

export default function CoachChatScreen() {
  const { data, todayRecord } = useApp();
  const listRef = useRef<FlatList<CoachChatMessage>>(null);
  const [messages, setMessages] = useState<CoachChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [booting, setBooting] = useState(true);
  const [enabled, setEnabled] = useState(true);

  const coachId = data?.user.preferredCoachId ?? 'arise';
  const coach = getCoachById(coachId);
  const visual = getCoachVisualProfile(coachId);
  const stageTheme = getStageTheme(data?.user, coachId);
  const accent = visual.accent[0];

  const pendingMissions = useMemo(() => {
    if (!todayRecord) return [];
    return todayRecord.missionStates
      .filter((m) => m.points <= 0)
      .map((m) => ALL_MISSIONS.find((def) => def.id === m.missionId)?.name ?? m.missionId)
      .slice(0, 5);
  }, [todayRecord]);

  const journalSnippet = todayRecord?.journal?.slice(0, 180);

  const boot = useCallback(async () => {
    setBooting(true);
    const personalOn = await loadPersonalCoachEnabled();
    setEnabled(personalOn);
    const { messages: existing } = await loadCoachDayState();
    if (existing.length > 0) {
      setMessages(existing);
    } else if (personalOn) {
      const opener = await getOpeningMessage(coachId);
      const msg = await appendLocalCoachMessage('assistant', opener, coachId);
      setMessages([msg]);
    }
    setBooting(false);
  }, [coachId]);

  useEffect(() => {
    void boot();
  }, [boot]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending || !enabled) return;
    setInput('');
    setSending(true);

    // Optimistic user bubble
    const optimistic: CoachChatMessage = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content: text,
      coachId,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const result = await sendCoachMessage({
        text,
        coachId,
        appContext: {
          currentDay: data?.user.currentDay ?? 1,
          streak: data?.user.streak ?? 0,
          pendingMissions,
          journalSnippet,
          userName: data?.user.name,
        },
      });
      setMessages(result.messages);

      if (data?.user) {
        await syncNotificationSchedule(data.user, {
          requestPermission: false,
          coachContext: coachContextToNotifContext(result.context),
        });
      }
    } catch (error) {
      console.error('[CoachChat] send failed', error);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimistic.id),
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Hubo un problema al responder. Proba de nuevo en un momento.',
          coachId,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }

  if (!enabled) {
    return (
      <LinearGradient colors={stageTheme.background} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.disabledCard}>
            <Ionicons name="chatbubbles-outline" size={36} color={COLORS.textMuted} />
            <Text style={styles.disabledTitle}>Coach personal desactivado</Text>
            <Text style={styles.disabledText}>
              Activalo en Configuracion para chatear y recibir notificaciones contextuales.
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={stageTheme.background} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <View style={styles.header}>
            <View style={[styles.avatar, { borderColor: accent + '66', backgroundColor: accent + '22' }]}>
              <Ionicons name={visual.icon as any} size={22} color={accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{coach.name}</Text>
              <Text style={styles.subtitle}>
                Williamson · Hormozi · Goggins · Rohn · Plitt — una sola voz
              </Text>
            </View>
          </View>

          {booting ? (
            <View style={styles.loading}>
              <ActivityIndicator color={accent} />
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages.filter((m) => m.role !== 'system')}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
              renderItem={({ item }) => (
                <CoachMessageBubble
                  message={item}
                  accent={accent}
                  coachName={coach.name}
                />
              )}
            />
          )}

          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={`Escribile a ${coach.name}...`}
              placeholderTextColor={COLORS.textMuted}
              multiline
              maxLength={800}
              editable={!sending}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: accent }, (!input.trim() || sending) && styles.sendDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || sending}
              accessibilityLabel="Enviar mensaje al coach"
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONT.xl,
    fontWeight: '800',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    flexGrow: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: COLORS.textPrimary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONT.md,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.45,
  },
  disabledCard: {
    margin: SPACING.lg,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  disabledTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  disabledText: {
    color: COLORS.textSecondary,
    fontSize: FONT.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
