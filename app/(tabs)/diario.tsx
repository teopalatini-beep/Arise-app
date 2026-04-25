import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { COLORS, GRADIENTS, FONT, RADIUS, SPACING } from '../../src/theme';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DiarioScreen() {
  const { data, todayRecord, saveJournal, getDayRecord } = useApp();
  const [text, setText] = useState(todayRecord?.journal ?? '');
  const [saved, setSaved] = useState(false);
  const [viewingDay, setViewingDay] = useState<number | null>(null);

  useEffect(() => {
    setText(todayRecord?.journal ?? '');
  }, [todayRecord?.journal]);

  if (!data) return null;

  const { user, days } = data;

  // Days with journal entries
  const journalDays = days
    .filter(d => d.journal && d.journal.trim().length > 0)
    .sort((a, b) => b.dayNumber - a.dayNumber);

  function handleSave() {
    saveJournal(text);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const viewingRecord = viewingDay ? getDayRecord(viewingDay) : null;

  // ── Past entry viewer ──────────────────────────────────────────────────────
  if (viewingDay && viewingRecord) {
    return (
      <LinearGradient colors={GRADIENTS.background} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.viewerHeader}>
            <TouchableOpacity onPress={() => setViewingDay(null)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color={COLORS.accent} />
              <Text style={styles.backText}>Volver</Text>
            </TouchableOpacity>
            <Text style={styles.viewerDay}>Día {viewingDay}</Text>
          </View>
          <ScrollView contentContainerStyle={styles.scroll}>
            <Text style={styles.viewerText}>{viewingRecord.journal}</Text>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
                    colors={saved ? [COLORS.success, '#059669'] : GRADIENTS.accent}
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

            {/* Past entries */}
            {journalDays.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>ENTRADAS ANTERIORES</Text>
                {journalDays.map(d => (
                  <TouchableOpacity
                    key={d.dayNumber}
                    style={styles.pastEntry}
                    onPress={() => setViewingDay(d.dayNumber)}
                  >
                    <View style={styles.pastEntryLeft}>
                      <Text style={styles.pastEntryDay}>Día {d.dayNumber}</Text>
                      <Text style={styles.pastEntryPreview} numberOfLines={2}>
                        {d.journal}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                  </TouchableOpacity>
                ))}
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

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    paddingHorizontal: SPACING.md, gap: 6,
  },
  saveText: { color: '#fff', fontWeight: '700', fontSize: FONT.sm },

  sectionTitle: {
    fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '700',
    letterSpacing: 2, marginBottom: SPACING.sm, marginTop: SPACING.sm,
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
  viewerText: { fontSize: FONT.base, color: COLORS.textPrimary, lineHeight: 26, padding: SPACING.md },
});
