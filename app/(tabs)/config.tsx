import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, Alert, Switch, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp, xpForLevel, levelFromXP } from '../../src/context/AppContext';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, GRADIENTS, FONT, RADIUS, SPACING } from '../../src/theme';

export default function ConfigScreen() {
  const { data, resetProgram, canUseGrace } = useApp();
  const { logout } = useAuth();
  const [darkMode] = useState(true);

  if (!data) return null;
  const { user } = data;

  const xpNext = xpForLevel(user.level + 1);
  const xpCurrent = xpForLevel(user.level);
  const xpProgress = Math.min((user.xp - xpCurrent) / (xpNext - xpCurrent), 1);
  const completedDays = data.days.filter(d => d.completed).length;
  const missedDays = data.days.filter(d => d.missed).length;

  function confirmReset() {
    Alert.alert(
      '¿Reiniciar programa?',
      'Esto borrará todo tu progreso y comenzará el programa de nuevo desde el Día 1. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: resetProgram,
        },
      ]
    );
  }

  return (
    <LinearGradient colors={GRADIENTS.background} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Profile header */}
          <LinearGradient
            colors={['rgba(72,149,239,0.2)', 'rgba(155,89,182,0.1)']}
            style={styles.profileCard}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{user.name[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileSub}>
                Día {user.currentDay} · Nivel {user.level} · {user.streak}🔥
              </Text>
            </View>
          </LinearGradient>

          {/* Level & XP */}
          <Text style={styles.sectionTitle}>NIVEL & XP</Text>
          <View style={styles.card}>
            <View style={styles.levelRow}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelNumber}>{user.level}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.xpText}>{user.xp} / {xpNext} XP</Text>
                <View style={styles.xpBarBg}>
                  <LinearGradient
                    colors={GRADIENTS.accent}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.xpBarFill, { width: `${xpProgress * 100}%` as any }]}
                  />
                </View>
                <Text style={styles.xpSub}>
                  {xpNext - user.xp} XP para el nivel {user.level + 1}
                </Text>
              </View>
            </View>
          </View>

          {/* Program stats */}
          <Text style={styles.sectionTitle}>ESTADÍSTICAS DEL PROGRAMA</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: COLORS.success }]}>{completedDays}</Text>
              <Text style={styles.statLbl}>Completados</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: COLORS.streak }]}>{user.maxStreak}</Text>
              <Text style={styles.statLbl}>Racha máx</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: COLORS.danger }]}>{missedDays}</Text>
              <Text style={styles.statLbl}>Fallados</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: COLORS.accent }]}>
                {90 - user.currentDay + 1}
              </Text>
              <Text style={styles.statLbl}>Restantes</Text>
            </View>
          </View>

          {/* Grace day */}
          <Text style={styles.sectionTitle}>DÍA DE GRACIA</Text>
          <View style={styles.card}>
            <View style={styles.graceRow}>
              <Ionicons
                name="shield"
                size={24}
                color={canUseGrace ? COLORS.warning : COLORS.textMuted}
              />
              <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                <Text style={styles.graceTitle}>
                  {canUseGrace ? 'Disponible este mes' : 'Ya usado este mes'}
                </Text>
                <Text style={styles.graceDesc}>
                  {canUseGrace
                    ? 'Tenés 1 día de gracia. Si fallás, no perdés el progreso (pero sí la racha).'
                    : 'Tu día de gracia se renueva el 1° del próximo mes.'}
                </Text>
              </View>
              <View style={[
                styles.graceDot,
                { backgroundColor: canUseGrace ? COLORS.success : COLORS.danger }
              ]} />
            </View>
          </View>

          {/* Program info */}
          <Text style={styles.sectionTitle}>PROGRAMA ACTUAL</Text>
          <View style={styles.card}>
            <InfoRow icon="calendar" label="Inicio" value={user.startDate} />
            <InfoRow icon="flag" label="Días totales" value="90 días" />
            <InfoRow icon="time" label="Tiempo diario" value="1-2 horas" />
            <InfoRow icon="fitness" label="Entrenamiento" value="Cardio + Fuerza" />
            <InfoRow icon="book" label="Lectura" value="10-40 páginas/día" />
            <InfoRow icon="leaf" label="Meditación" value="5-20 min/día" />
            <InfoRow icon="water" label="Hidratación" value="2-3 litros/día" />
            <InfoRow icon="flash" label="Trabajo profundo" value="45-180 min/día" />
          </View>

          {/* Appearance */}
          <Text style={styles.sectionTitle}>APARIENCIA</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <Ionicons name="moon" size={18} color={COLORS.textSecondary} />
              <Text style={styles.toggleLabel}>Modo oscuro</Text>
              <Switch value={darkMode} disabled trackColor={{ true: COLORS.accent }} />
            </View>
          </View>

          {/* About */}
          <Text style={styles.sectionTitle}>SOBRE ARISE</Text>
          <View style={styles.card}>
            <Text style={styles.aboutText}>
              Arise es tu programa personal de 90 días. Construido para Teo.
              {'\n\n'}
              Sin excusas. Sin negociaciones.{'\n'}
              Arise — levantáte.
            </Text>
            <View style={styles.divider} />
            <Text style={styles.versionText}>Versión 1.0 — MVP</Text>
          </View>

          {/* Danger zone */}
          <Text style={[styles.sectionTitle, { color: COLORS.danger }]}>ZONA PELIGROSA</Text>
          <TouchableOpacity style={styles.resetButton} onPress={confirmReset}>
            <Ionicons name="refresh" size={18} color={COLORS.danger} />
            <Text style={styles.resetText}>Reiniciar programa desde el Día 1</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resetButton, { marginTop: SPACING.sm, borderColor: 'rgba(255,255,255,0.1)' }]}
            onPress={() =>
              Alert.alert(
                'Cerrar sesión',
                '¿Querés salir? Tu progreso está guardado.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Salir', onPress: logout },
                ]
              )
            }
          >
            <Ionicons name="log-out-outline" size={18} color={COLORS.textSecondary} />
            <Text style={[styles.resetText, { color: COLORS.textSecondary }]}>Cerrar sesión</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={infoStyles.row}>
      <Ionicons name={icon as any} size={14} color={COLORS.textMuted} style={infoStyles.icon} />
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  icon: { marginRight: 8 },
  label: { flex: 1, fontSize: FONT.base, color: COLORS.textSecondary },
  value: { fontSize: FONT.base, color: COLORS.textPrimary, fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: SPACING.md },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.lg,
    padding: SPACING.md, gap: SPACING.md, marginBottom: SPACING.md,
    marginTop: SPACING.sm, borderWidth: 1, borderColor: 'rgba(72,149,239,0.25)',
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: FONT.xl, fontWeight: '900', color: '#fff' },
  profileName: { fontSize: FONT.xl, fontWeight: '800', color: COLORS.textPrimary },
  profileSub: { fontSize: FONT.sm, color: COLORS.textSecondary, marginTop: 2 },

  sectionTitle: {
    fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '700',
    letterSpacing: 2, marginBottom: SPACING.sm, marginTop: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.bgCard, borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },

  levelRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  levelBadge: {
    width: 52, height: 52, borderRadius: RADIUS.full,
    backgroundColor: 'rgba(72,149,239,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.accent,
  },
  levelNumber: { fontSize: FONT.xl, fontWeight: '900', color: COLORS.accent },
  xpText: { fontSize: FONT.sm, color: COLORS.textSecondary, marginBottom: 4 },
  xpBarBg: {
    height: 6, backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: 4,
  },
  xpBarFill: { height: '100%', borderRadius: RADIUS.full, minWidth: 4 },
  xpSub: { fontSize: FONT.xs, color: COLORS.textMuted },

  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  statBox: {
    flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md,
    padding: SPACING.sm, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  statNum: { fontSize: FONT.xl, fontWeight: '900' },
  statLbl: { fontSize: 9, color: COLORS.textMuted, fontWeight: '600', marginTop: 2 },

  graceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  graceTitle: { fontSize: FONT.base, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  graceDesc: { fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 20 },
  graceDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
  },
  toggleLabel: { flex: 1, fontSize: FONT.base, color: COLORS.textPrimary },

  aboutText: { fontSize: FONT.base, color: COLORS.textSecondary, lineHeight: 24 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  versionText: { fontSize: FONT.sm, color: COLORS.textMuted },

  resetButton: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)',
  },
  resetText: { fontSize: FONT.base, color: COLORS.danger, fontWeight: '600' },
});
