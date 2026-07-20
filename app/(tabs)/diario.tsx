import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { COLORS, FONT, RADIUS, SPACING } from '@/theme';
import { DayMetrics } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getStageTheme } from '@/lib/progression';
import CoachParticles from '@components/CoachParticles';
import ScreenLoadingState from '@components/ui/ScreenLoadingState';
import StaggerIn from '@components/ui/StaggerIn';
import { DISCOVERY_TOOLS } from '@/data/discoveryTools';
import { useJournal } from '@/hooks/useJournal';
import { useTabScreenMotion } from '@/hooks/useTabScreenMotion';
import { dateFromDayNumber } from '@/lib/dates';

const MOOD_EMOJIS = ['😞', '😕', '😐', '🙂', '😄'];
const MOOD_LABELS = ['muy_bajo', 'bajo', 'neutral', 'alto', 'excelente'];

// ─── Herramientas data ────────────────────────────────────────────────────────
interface EmotionTool {
  id: string;
  emotion: string;
  emoji: string;
  color: string;
  message: string;
  actions: string[];
  phrases: string[];
}

const EMOTION_TOOLS: EmotionTool[] = DISCOVERY_TOOLS.map((tool) => ({
  id: tool.id,
  emotion: tool.emotion,
  emoji: tool.emoji,
  color: tool.color,
  message: tool.description,
  actions: [...tool.immediate.slice(0, 3), ...tool.shortTerm.slice(0, 2)],
  phrases: [tool.mindset, tool.stoic],
}));

function EmotionCard({ tool }: { tool: EmotionTool }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={[toolStyles.card, { borderColor: tool.color + '30' }]}>
      <TouchableOpacity
        style={toolStyles.cardHeader}
        onPress={() => setExpanded(e => !e)}
        activeOpacity={0.8}
      >
        <View style={[toolStyles.emojiBox, { backgroundColor: tool.color + '20' }]}>
          <Text style={{ fontSize: 22 }}>{tool.emoji}</Text>
        </View>
        <Text style={toolStyles.emotionLabel}>{tool.emotion}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={tool.color}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={toolStyles.expanded}>
          {/* Message */}
          <View style={[toolStyles.messageBox, { borderLeftColor: tool.color }]}>
            <Text style={toolStyles.messageText}>{tool.message}</Text>
          </View>

          {/* Actions */}
          <Text style={[toolStyles.subLabel, { color: tool.color }]}>QUÉ HACER AHORA</Text>
          {tool.actions.map((a, i) => (
            <View key={i} style={toolStyles.row}>
              <View style={[toolStyles.bullet, { backgroundColor: tool.color }]} />
              <Text style={toolStyles.rowText}>{a}</Text>
            </View>
          ))}

          {/* Phrases */}
          <Text style={[toolStyles.subLabel, { color: tool.color, marginTop: SPACING.md }]}>FRASES PARA ESTE MOMENTO</Text>
          {tool.phrases.map((p, i) => (
            <View key={i} style={[toolStyles.phraseBox, { backgroundColor: tool.color + '10' }]}>
              <Text style={toolStyles.phraseText}>{p}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const toolStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, marginBottom: SPACING.sm, overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    padding: SPACING.md,
  },
  emojiBox: {
    width: 44, height: 44, borderRadius: RADIUS.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  emotionLabel: { flex: 1, fontSize: FONT.base, fontWeight: '700', color: COLORS.textPrimary },
  expanded: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.md },
  messageBox: {
    borderLeftWidth: 3, paddingLeft: SPACING.sm,
    marginBottom: SPACING.md,
  },
  messageText: { fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 22 },
  subLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginBottom: SPACING.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0 },
  rowText: { flex: 1, fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 20 },
  phraseBox: { borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: 6 },
  phraseText: { fontSize: FONT.sm, color: COLORS.textPrimary, fontStyle: 'italic', lineHeight: 20 },
});

// ─── Mood Trend Strip ─────────────────────────────────────────────────────────
function MoodTrendStrip({
  days,
  currentDay,
  onPress,
}: {
  days: any[];
  currentDay: number;
  onPress: (day: number) => void;
}) {
  const MOOD_COLORS = ['#EF4444', '#F97316', '#A3A3A3', '#22C55E', '#10B981'];
  const last14 = Array.from({ length: 14 }, (_, i) => currentDay - 13 + i).filter(d => d >= 1);

  return (
    <View style={trendStyles.container}>
      <Text style={trendStyles.label}>ÁNIMO · ÚLTIMOS {last14.length} DÍAS</Text>
      <View style={trendStyles.strip}>
        {last14.map(dayNum => {
          const record = days.find((d: any) => d.dayNumber === dayNum);
          const moodVal = record?.metrics?.mood;
          const hasEntry = record?.journal && record.journal.trim().length > 0;
          const isToday = dayNum === currentDay;
          const bgColor = record?.completed
            ? 'rgba(34,197,94,0.15)'
            : record?.missed
            ? 'rgba(239,68,68,0.15)'
            : 'rgba(255,255,255,0.05)';

          return (
            <TouchableOpacity
              key={dayNum}
              style={[trendStyles.cell, { backgroundColor: bgColor }, isToday && trendStyles.cellToday]}
              onPress={() => hasEntry && onPress(dayNum)}
              activeOpacity={hasEntry ? 0.7 : 1}
            >
              <Text style={trendStyles.cellDay}>{dayNum}</Text>
              {moodVal != null ? (
                <Text style={trendStyles.cellEmoji}>{MOOD_EMOJIS[moodVal - 1]}</Text>
              ) : (
                <View style={[trendStyles.cellDot, { backgroundColor: hasEntry ? COLORS.accent : 'rgba(255,255,255,0.1)' }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={trendStyles.legend}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: 'rgba(34,197,94,0.4)' }} />
          <Text style={trendStyles.legendText}>Completado</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: 'rgba(239,68,68,0.4)' }} />
          <Text style={trendStyles.legendText}>Fallado</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent }} />
          <Text style={trendStyles.legendText}>Con entrada</Text>
        </View>
      </View>
    </View>
  );
}

const trendStyles = StyleSheet.create({
  container: { marginBottom: SPACING.lg },
  label: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 2, marginBottom: SPACING.sm },
  strip: { flexDirection: 'row', gap: 4 },
  cell: { flex: 1, borderRadius: RADIUS.sm, paddingVertical: 6, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cellToday: { borderColor: COLORS.accent + '60', borderWidth: 1.5 },
  cellDay: { fontSize: 8, color: COLORS.textMuted, fontWeight: '700' },
  cellEmoji: { fontSize: 13 },
  cellDot: { width: 6, height: 6, borderRadius: 3 },
  legend: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  legendText: { fontSize: 9, color: COLORS.textMuted },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function DiarioScreen() {
  const { reducedMotion, screenAnimStyle } = useTabScreenMotion('diario');
  const { data, todayRecord, saveJournal, saveMetrics, getDayRecord, loading } = useApp();
  const { saveJournalEntry } = useJournal();
  const [text, setText] = useState(todayRecord?.journal ?? '');
  const [mood, setMood] = useState(todayRecord?.metrics?.mood ?? 0);
  const [saved, setSaved] = useState(false);
  const [viewingDay, setViewingDay] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setText(todayRecord?.journal ?? '');
    setMood(todayRecord?.metrics?.mood ?? 0);
  }, [todayRecord?.journal, todayRecord?.metrics?.mood]);

  if (!data) {
    const fallbackTheme = getStageTheme();
    return (
      <LinearGradient colors={fallbackTheme.background} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          {loading ? (
            <ScreenLoadingState
              title="Diario"
              subtitle="Abriendo tu pergamino emocional..."
              icon="book-outline"
              accent={fallbackTheme.tabActive}
              reducedMotion={reducedMotion}
              hints={[
                'Cargando entrada de hoy',
                'Preparando estado de animo',
                'Sincronizando historial',
              ]}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>
                No pudimos cargar tu diario.{'\n'}Revisa conexión e inicia sesión de nuevo.
              </Text>
            </View>
          )}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const { user, days } = data;
  const stageTheme = getStageTheme(user);
  const coachId = user.preferredCoachId ?? 'goku';

  // Days with journal entries
  const journalDays = days
    .filter(d => d.journal && d.journal.trim().length > 0)
    .sort((a, b) => b.dayNumber - a.dayNumber);

  const filteredJournalDays = searchQuery.trim().length > 0
    ? journalDays.filter(d => d.journal?.toLowerCase().includes(searchQuery.toLowerCase()))
    : journalDays;

  async function handleSave() {
    const currentDay = data?.user.currentDay ?? 0;
    saveJournal(text);
    if (mood > 0) {
      const existing = todayRecord?.metrics ?? {};
      saveMetrics({ ...existing, mood } as DayMetrics);
    }
    try {
      const entryDate = user.startDate
        ? dateFromDayNumber(user.startDate, currentDay)
        : new Date().toISOString().slice(0, 10);
      await saveJournalEntry({
        date: entryDate,
        mood: mood > 0 ? MOOD_LABELS[mood - 1] : undefined,
        reflection: text,
        tags: [
          mood > 0 ? `mood:${MOOD_LABELS[mood - 1]}` : null,
          `day:${currentDay}`,
        ].filter((tag): tag is string => Boolean(tag)),
      });
    } catch (error) {
      console.error('[Diario] saveJournalEntry failed', error);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleMoodSelect(value: number) {
    setMood(v => v === value ? 0 : value);
  }

  const viewingRecord = viewingDay ? getDayRecord(viewingDay) : null;

  // ── Past entry viewer ──────────────────────────────────────────────────────
  if (viewingDay && viewingRecord) {
    const m = viewingRecord.metrics;
    return (
      <LinearGradient colors={stageTheme.background} style={styles.container}>
        <CoachParticles coachId={coachId} screen="diario" tappable reducedMotion={reducedMotion} />
        <Animated.View style={[styles.motionLayer, screenAnimStyle]}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.viewerHeader}>
            <TouchableOpacity onPress={() => setViewingDay(null)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color={COLORS.accent} />
              <Text style={styles.backText}>Volver</Text>
            </TouchableOpacity>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.viewerDay}>Día {viewingDay}</Text>
              <Text style={[styles.viewerStatus, {
                color: viewingRecord.completed ? COLORS.success : viewingRecord.missed ? COLORS.danger : COLORS.textMuted
              }]}>
                {viewingRecord.completed ? '✅ Completado' : viewingRecord.missed ? '❌ Fallado' : '—'}
              </Text>
            </View>
          </View>
          <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 100 }]}>
            {/* Metrics snapshot */}
            {m && (
              <View style={styles.viewerMetricsRow}>
                {m.mood != null && (
                  <View style={styles.viewerMetricChip}>
                    <Text style={styles.viewerMetricEmoji}>{MOOD_EMOJIS[m.mood - 1] ?? '😐'}</Text>
                    <Text style={styles.viewerMetricLabel}>Ánimo</Text>
                  </View>
                )}
                {m.energyLevel != null && (
                  <View style={styles.viewerMetricChip}>
                    <Text style={styles.viewerMetricEmoji}>⚡</Text>
                    <Text style={styles.viewerMetricVal}>{m.energyLevel}/10</Text>
                    <Text style={styles.viewerMetricLabel}>Energía</Text>
                  </View>
                )}
                {m.trainingMinutes != null && (
                  <View style={styles.viewerMetricChip}>
                    <Text style={styles.viewerMetricEmoji}>🏋️</Text>
                    <Text style={styles.viewerMetricVal}>{m.trainingMinutes}m</Text>
                    <Text style={styles.viewerMetricLabel}>Entreno</Text>
                  </View>
                )}
                {m.sleepHours != null && (
                  <View style={styles.viewerMetricChip}>
                    <Text style={styles.viewerMetricEmoji}>😴</Text>
                    <Text style={styles.viewerMetricVal}>{m.sleepHours}h</Text>
                    <Text style={styles.viewerMetricLabel}>Sueño</Text>
                  </View>
                )}
                {m.readingPages != null && (
                  <View style={styles.viewerMetricChip}>
                    <Text style={styles.viewerMetricEmoji}>📚</Text>
                    <Text style={styles.viewerMetricVal}>{m.readingPages}p</Text>
                    <Text style={styles.viewerMetricLabel}>Lectura</Text>
                  </View>
                )}
              </View>
            )}
            <Text style={styles.viewerText}>{viewingRecord.journal}</Text>
          </ScrollView>
        </SafeAreaView>
        </Animated.View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={stageTheme.background} style={styles.container}>
      <CoachParticles coachId={coachId} screen="diario" tappable reducedMotion={reducedMotion} />
      <Animated.View style={[styles.motionLayer, screenAnimStyle]}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Diario</Text>
              <Text style={styles.subtitle}>
                {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
              </Text>
            </View>

            {/* Today's entry */}
            <View style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <View style={styles.entryTag}>
                  <Ionicons name="pencil" size={12} color={COLORS.accent} />
                  <Text style={styles.entryTagText}>DÍA {user.currentDay}</Text>
                </View>
                {todayRecord?.completed && (
                  <View style={styles.doneTag}>
                    <Ionicons name="checkmark" size={10} color={COLORS.success} />
                    <Text style={styles.doneTagText}>Día completado</Text>
                  </View>
                )}
              </View>

              {/* Mood quick-select */}
              <View style={styles.moodRow}>
                <Text style={styles.moodLabel}>¿Cómo te sentís hoy?</Text>
                <View style={styles.moodButtons}>
                  {MOOD_EMOJIS.map((emoji, i) => {
                    const val = i + 1;
                    return (
                      <TouchableOpacity
                        key={val}
                        style={[styles.moodBtn, mood === val && styles.moodBtnActive]}
                        onPress={() => handleMoodSelect(val)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.moodEmoji}>{emoji}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <Text style={styles.promptLabel}>
                ¿Cómo fue tu día? ¿Qué lograste? ¿Qué aprendiste?
              </Text>

              <TextInput
                style={styles.journalInput}
                value={text}
                onChangeText={setText}
                multiline
                placeholder={`Día ${user.currentDay} de 90. Escribí sin filtros. Solo para vos.`}
                placeholderTextColor={COLORS.textMuted}
                textAlignVertical="top"
                autoCorrect={false}
              />

              <View style={styles.inputFooter}>
                <Text style={styles.charCount}>{text.length} caracteres</Text>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <LinearGradient
                    colors={saved ? [COLORS.success, '#059669'] : stageTheme.accent}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveGradient}
                  >
                    <Ionicons name={saved ? 'checkmark' : 'save-outline'} size={14} color="#fff" />
                    <Text style={styles.saveText}>{saved ? '¡Guardado!' : 'Guardar'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Prompts section */}
            <Text style={styles.sectionTitle}>PREGUNTAS PARA REFLEXIONAR</Text>
            <View style={styles.promptsCard}>
              {REFLECTION_PROMPTS.map((p, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.promptItem}
                  onPress={() => setText(t => t + (t ? '\n\n' : '') + p + '\n')}
                >
                  <Ionicons name="add-circle-outline" size={16} color={COLORS.accent} />
                  <Text style={styles.promptItemText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Herramientas emocionales */}
            <Text style={styles.sectionTitle}>HERRAMIENTAS PARA LO QUE SENTÍS</Text>
            <Text style={styles.toolsIntro}>
              Tocá la emoción que estás sintiendo para ver qué hacer y frases que ayudan.
            </Text>
            {EMOTION_TOOLS.map((tool, index) => (
              <StaggerIn key={tool.id} index={index} reducedMotion={reducedMotion}>
                <EmotionCard tool={tool} />
              </StaggerIn>
            ))}

            {/* Mood trend strip */}
            {days.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>TENDENCIA DE ÁNIMO</Text>
                <MoodTrendStrip
                  days={days}
                  currentDay={user.currentDay}
                  onPress={setViewingDay}
                />
              </>
            )}

            {/* Past entries */}
            {journalDays.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>
                  ENTRADAS ANTERIORES · {journalDays.length} {journalDays.length === 1 ? 'entrada' : 'entradas'}
                </Text>

                {/* Search bar */}
                <View style={styles.searchRow}>
                  <Ionicons name="search-outline" size={16} color={COLORS.textMuted} style={{ marginLeft: SPACING.sm }} />
                  <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Buscar en tus entradas..."
                    placeholderTextColor={COLORS.textMuted}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: SPACING.sm }}>
                      <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {filteredJournalDays.length === 0 && searchQuery.length > 0 && (
                  <View style={{ padding: SPACING.lg, alignItems: 'center' }}>
                    <Text style={{ color: COLORS.textMuted, fontSize: FONT.sm }}>Sin resultados para "{searchQuery}"</Text>
                  </View>
                )}

                {filteredJournalDays.map(d => {
                  const moodVal = d.metrics?.mood;
                  const statusColor = d.completed ? COLORS.success : d.missed ? COLORS.danger : COLORS.textMuted;
                  const statusDot = d.completed ? '●' : d.missed ? '●' : '○';
                  return (
                    <TouchableOpacity
                      key={d.dayNumber}
                      style={styles.pastEntry}
                      onPress={() => setViewingDay(d.dayNumber)}
                    >
                      <View style={[styles.pastEntryAccent, { backgroundColor: statusColor }]} />
                      <View style={styles.pastEntryLeft}>
                        <View style={styles.pastEntryMeta}>
                          <Text style={styles.pastEntryDay}>Día {d.dayNumber}</Text>
                          {moodVal != null && (
                            <Text style={styles.pastEntryMood}>{MOOD_EMOJIS[moodVal - 1]}</Text>
                          )}
                          <Text style={[styles.pastEntryDot, { color: statusColor }]}>{statusDot}</Text>
                        </View>
                        <Text style={styles.pastEntryPreview} numberOfLines={2}>
                          {d.journal}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  );
                })}
              </>
            )}

            {journalDays.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="journal-outline" size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>
                  Empezá a escribir tu primer entrada.{'\n'}Tu diario de transformación comienza hoy.
                </Text>
              </View>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      </Animated.View>
    </LinearGradient>
  );
}

const REFLECTION_PROMPTS = [
  '¿Qué fue lo más difícil de hoy y cómo lo superé?',
  '¿En qué momento sentí que di el 100%?',
  '¿Qué haría diferente mañana?',
  '¿Cómo se siente el cuerpo hoy vs hace 30 días?',
  '¿Qué aprendí hoy que no sabía ayer?',
  '¿Qué me dijo mi mente cuando quería parar?',
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  motionLayer: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: SPACING.md },

  header: { marginBottom: SPACING.lg, marginTop: SPACING.sm },
  title: { fontSize: FONT.xxl, fontWeight: '800', color: COLORS.textPrimary },
  subtitle: { fontSize: FONT.base, color: COLORS.textSecondary, marginTop: 2, textTransform: 'capitalize' },

  entryCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg,
  },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  entryTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(72,149,239,0.15)', borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
  },
  entryTagText: { fontSize: FONT.xs, color: COLORS.accent, fontWeight: '700', letterSpacing: 1 },
  doneTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(52,211,153,0.15)', borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
  },
  doneTagText: { fontSize: FONT.xs, color: COLORS.success, fontWeight: '600' },

  promptLabel: { fontSize: FONT.sm, color: COLORS.textSecondary, marginBottom: SPACING.sm },
  journalInput: {
    color: COLORS.textPrimary, fontSize: FONT.base,
    minHeight: 180, lineHeight: 24,
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: RADIUS.md,
    padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.border,
  },
  inputFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.sm },
  charCount: { fontSize: FONT.xs, color: COLORS.textMuted },
  saveButton: { borderRadius: RADIUS.md, overflow: 'hidden' },
  saveGradient: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    paddingHorizontal: SPACING.md, gap: 6,
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: FONT.sm },

  sectionTitle: {
    fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '700',
    letterSpacing: 2, marginBottom: SPACING.sm, marginTop: SPACING.sm,
  },
  toolsIntro: {
    fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 20,
    marginBottom: SPACING.md,
  },

  promptsCard: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  promptItem: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
    borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: SPACING.sm,
  },
  promptItemText: { flex: 1, fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 20 },

  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    marginBottom: SPACING.md, gap: 4,
  },
  searchInput: {
    flex: 1, color: COLORS.textPrimary, fontSize: FONT.sm,
    paddingVertical: SPACING.sm, paddingRight: SPACING.sm,
  },

  pastEntry: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  pastEntryLeft: { flex: 1 },
  pastEntryDay: { fontSize: FONT.sm, fontWeight: '700', color: COLORS.accent, marginBottom: 4 },
  pastEntryPreview: { fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 18 },

  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyText: {
    fontSize: FONT.base, color: COLORS.textMuted, textAlign: 'center',
    lineHeight: 24, marginTop: SPACING.md,
  },

  viewerHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { color: COLORS.accent, fontSize: FONT.base, fontWeight: '600' },
  viewerDay: { fontSize: FONT.base, color: COLORS.textSecondary, fontWeight: '700' },
  viewerStatus: { fontSize: FONT.xs, fontWeight: '700', marginTop: 2 },
  viewerText: { fontSize: FONT.base, color: COLORS.textPrimary, lineHeight: 26, padding: SPACING.md },

  viewerMetricsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingTop: SPACING.md,
  },
  viewerMetricChip: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    padding: SPACING.sm, alignItems: 'center', borderWidth: 1,
    borderColor: COLORS.border, minWidth: 64,
  },
  viewerMetricEmoji: { fontSize: 18 },
  viewerMetricVal: { fontSize: FONT.sm, fontWeight: '800', color: COLORS.textPrimary, marginTop: 2 },
  viewerMetricLabel: { fontSize: 9, color: COLORS.textMuted, fontWeight: '600', marginTop: 1 },

  // Mood selector
  moodRow: { marginBottom: SPACING.md },
  moodLabel: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 1, marginBottom: SPACING.xs },
  moodButtons: { flexDirection: 'row', gap: SPACING.sm },
  moodBtn: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: COLORS.border, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  moodBtnActive: {
    backgroundColor: 'rgba(72,149,239,0.18)',
    borderColor: 'rgba(72,149,239,0.5)',
  },
  moodEmoji: { fontSize: 22 },

  // Past entry enriched
  pastEntryAccent: { width: 3, alignSelf: 'stretch', borderRadius: 2, marginRight: SPACING.sm },
  pastEntryMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: 4 },
  pastEntryMood: { fontSize: 14 },
  pastEntryDot: { fontSize: 10, fontWeight: '900' },
});
