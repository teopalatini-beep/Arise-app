import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import {
  FONT,
  GRADIENTS,
  INK,
  METAL,
  RADIUS,
  SPACING,
  SURFACES,
  TOUCH,
} from '@/theme';
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
import { useRouter } from 'expo-router';

export default function CoachChatScreen() {
  const router = useRouter();
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
      <LinearGradient colors={[...GRADIENTS.ambient]} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.disabledCard}>
            <Ionicons name="chatbubbles-outline" size={36} color={METAL.goldDim} />
            <Text style={styles.disabledTitle}>Coach personal desactivado</Text>
            <Text style={styles.disabledText}>
              Activalo en Ajustes para chatear y recibir notificaciones contextuales.
            </Text>
            <Pressable
              style={styles.disabledCta}
              onPress={() => router.push("/(tabs)/config" as any)}
              accessibilityRole="button"
              accessibilityLabel="Abrir ajustes"
              hitSlop={TOUCH.hitSlop}
            >
              <Text style={styles.disabledCtaText}>Ir a Ajustes</Text>
              <Ionicons name="chevron-forward" size={16} color={INK.inverse} />
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[...stageTheme.background]} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <View style={styles.header}>
            <View style={styles.avatarBezel}>
              <View style={[styles.avatar, { borderColor: accent + '66', backgroundColor: accent + '18' }]}>
                <Ionicons name={visual.icon as any} size={22} color={accent} />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{coach.name}</Text>
              <Text style={styles.subtitle}>
                Disciplina, claridad y seguimiento diario
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

          <View style={styles.composerBezel}>
            <View style={styles.composer}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Escribe tu foco, miedo o compromiso..."
                placeholderTextColor={INK.muted}
                multiline
                maxLength={800}
                editable={!sending}
                onSubmitEditing={handleSend}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.sendBtn,
                  { backgroundColor: accent, opacity: !input.trim() || sending ? 0.4 : pressed ? 0.88 : 1 },
                ]}
                onPress={handleSend}
                disabled={!input.trim() || sending}
                accessibilityRole="button"
                accessibilityLabel="Enviar mensaje al coach"
                hitSlop={TOUCH.hitSlop}
              >
                {sending ? (
                  <ActivityIndicator color={INK.inverse} size="small" />
                ) : (
                  <Ionicons name="arrow-up" size={20} color={INK.inverse} />
                )}
              </Pressable>
            </View>
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
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: METAL.goldBorder,
  },
  avatarBezel: {
    padding: 2,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: METAL.goldBorder,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: {
    color: METAL.gold,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
    marginBottom: 2,
  },
  title: {
    color: INK.primary,
    fontSize: FONT.xl,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: INK.secondary,
    fontSize: FONT.xs,
    marginTop: 3,
    letterSpacing: 0.2,
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    flexGrow: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerBezel: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.full,
    padding: 2,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: METAL.goldBorder,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
    paddingLeft: SPACING.md,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: SURFACES.elevated,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    color: INK.primary,
    paddingVertical: SPACING.sm,
    fontSize: FONT.base,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledCard: {
    margin: SPACING.lg,
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: METAL.goldBorder,
    backgroundColor: SURFACES.glass,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  disabledTitle: {
    color: INK.primary,
    fontSize: FONT.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  disabledText: {
    color: INK.secondary,
    fontSize: FONT.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  disabledCta: {
    marginTop: SPACING.md,
    minHeight: TOUCH.minTarget,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
    backgroundColor: METAL.gold,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  disabledCtaText: {
    color: INK.inverse,
    fontWeight: '700',
    fontSize: FONT.sm,
  },
});
