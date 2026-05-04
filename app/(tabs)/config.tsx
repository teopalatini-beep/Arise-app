import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, Alert, Switch, Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp, xpForLevel } from '../../src/context/AppContext';
import { useAuth } from '../../src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONT, RADIUS, SPACING } from '../../src/theme';
import { BADGE_DEFINITIONS, RANK_COLORS, BadgeId } from '../../src/types';
import { getStageTheme } from '../../src/lib/progression';
import { deleteUserData } from '../../src/lib/db';
import { supabase } from '../../src/lib/supabase';
import { ONBOARDING_KEY } from '../onboarding';
import { COACH_STORAGE_KEY } from '../../src/lib/coach';
import {
  NotifSettings, DEFAULT_SETTINGS,
  loadNotifSettings, saveNotifSettings,
  scheduleAllNotifications, requestPermissions,
} from '../../src/lib/notifications';

export default function ConfigScreen() {
  const { data, resetProgram, canUseGrace, loading } = useApp();
  const { logout, userEmail } = useAuth();
  const [notif, setNotif] = useState<NotifSettings>(DEFAULT_SETTINGS);
  const [busyAction, setBusyAction] = useState<'none' | 'backup' | 'delete'>('none');

  useEffect(() => {
    loadNotifSettings().then(setNotif);
  }, []);

  async function updateNotif(patch: Partial<NotifSettings>) {
    const next = { ...notif, ...patch };
    setNotif(next);
    await saveNotifSettings(next);
    // Pass startDate so milestone notifications stay correct
    const startDate = data?.user.startDate;
    await scheduleAllNotifications(next, startDate);
  }

  async function handleEnableToggle(value: boolean) {
    if (value) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Permisos requeridos',
          'Activá los permisos de notificaciones en Configuración del sistema para recibir alertas de ARISE.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    await updateNotif({ enabled: value });
  }

  const stageTheme = getStageTheme(data?.user);
  if (!data) {
    return (
      <LinearGradient colors={stageTheme.background} style={styles.container}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.emptyWrap}>
            <Ionicons name="settings-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>{loading ? 'Cargando configuracion...' : 'No pudimos cargar configuracion'}</Text>
            <Text style={styles.emptyText}>Verifica conexión e inicia sesión nuevamente.</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }
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

  async function handleExportBackup() {
    if (!data) return;
    setBusyAction('backup');
    try {
      const payload = {
        exportedAt: new Date().toISOString(),
        userEmail: userEmail || null,
        appData: data,
      };
      await Share.share({
        title: 'Backup ARISE',
        message: JSON.stringify(payload, null, 2),
      });
    } catch (error) {
      Alert.alert('No se pudo exportar', 'Hubo un problema al generar el backup.');
    } finally {
      setBusyAction('none');
    }
  }

  async function executeDeleteAccountData() {
    setBusyAction('delete');
    try {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) {
        Alert.alert('Sesion no valida', 'Inicia sesion otra vez e intenta nuevamente.');
        return;
      }
      const error = await deleteUserData(userId);
      if (error) {
        Alert.alert('No se pudo borrar', error);
        return;
      }
      await AsyncStorage.multiRemove([
        'arise_data_v1',
        ONBOARDING_KEY,
        COACH_STORAGE_KEY,
      ]);
      await logout();
      Alert.alert(
        'Datos eliminados',
        'Se elimino tu informacion de la app (nube y local). Tu cuenta de acceso queda creada para volver cuando quieras.'
      );
    } finally {
      setBusyAction('none');
    }
  }

  function confirmDeleteAccountData() {
    Alert.alert(
      'Eliminar todos mis datos',
      'Se borrara tu progreso, perfil, diario, metricas y configuracion guardada. Esta accion no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar todo', style: 'destructive', onPress: executeDeleteAccountData },
      ]
    );
  }

  return (
    <LinearGradient colors={stageTheme.background} style={styles.container}>
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
                    colors={stageTheme.accent}
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

          {/* Notificaciones */}
          <Text style={styles.sectionTitle}>🔔 NOTIFICACIONES</Text>
          <View style={styles.card}>
            {/* Master switch */}
            <View style={[styles.toggleRow, { marginBottom: SPACING.sm }]}>
              <Text style={{ fontSize: 20 }}>⚡</Text>
              <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                <Text style={styles.toggleLabel}>Activar notificaciones</Text>
                <Text style={styles.toggleSub}>Recordatorios diarios de ARISE</Text>
              </View>
              <Switch
                value={notif.enabled}
                onValueChange={handleEnableToggle}
                trackColor={{ true: COLORS.accent, false: COLORS.textMuted }}
                thumbColor="#fff"
              />
            </View>

            {notif.enabled && (
              <>
                <View style={styles.notifDivider} />

                {/* Mañana */}
                <View style={styles.notifRow}>
                  <View style={[styles.notifIcon, { backgroundColor: '#F59E0B20' }]}>
                    <Text style={{ fontSize: 18 }}>🌅</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifTitle}>Mañana · {notif.morningHour}:00 hs</Text>
                    <Text style={styles.notifDesc}>Activación chakra, frases de guerrero</Text>
                  </View>
                  <Switch
                    value={notif.morning}
                    onValueChange={v => updateNotif({ morning: v })}
                    trackColor={{ true: '#F59E0B', false: COLORS.textMuted }}
                    thumbColor="#fff"
                  />
                </View>

                {/* Tarde */}
                <View style={styles.notifRow}>
                  <View style={[styles.notifIcon, { backgroundColor: '#E8460A20' }]}>
                    <Text style={{ fontSize: 18 }}>🔥</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifTitle}>Tarde · {notif.afternoonHour}:00 hs</Text>
                    <Text style={styles.notifDesc}>Check de tareas, empuje de mediodia</Text>
                  </View>
                  <Switch
                    value={notif.afternoon}
                    onValueChange={v => updateNotif({ afternoon: v })}
                    trackColor={{ true: COLORS.accent, false: COLORS.textMuted }}
                    thumbColor="#fff"
                  />
                </View>

                {/* Noche */}
                <View style={styles.notifRow}>
                  <View style={[styles.notifIcon, { backgroundColor: '#7C3AED20' }]}>
                    <Text style={{ fontSize: 18 }}>🌙</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifTitle}>Noche · {notif.nightHour}:00 hs</Text>
                    <Text style={styles.notifDesc}>Reflexión, diario, cierre del día</Text>
                  </View>
                  <Switch
                    value={notif.night}
                    onValueChange={v => updateNotif({ night: v })}
                    trackColor={{ true: '#7C3AED', false: COLORS.textMuted }}
                    thumbColor="#fff"
                  />
                </View>

                <View style={styles.notifDivider} />

                {/* Horarios */}
                <Text style={[styles.toggleSub, { marginBottom: SPACING.sm }]}>AJUSTAR HORARIOS</Text>
                <View style={styles.timeRow}>
                  {[
                    { label: '🌅 Mañana', key: 'morningHour' as const, options: [7,8,9,10,11] },
                    { label: '🔥 Tarde', key: 'afternoonHour' as const, options: [13,14,15,16,17] },
                    { label: '🌙 Noche', key: 'nightHour' as const, options: [19,20,21,22,23] },
                  ].map(item => (
                    <View key={item.key} style={styles.timeCol}>
                      <Text style={styles.timeLabel}>{item.label}</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                          {item.options.map(h => (
                            <TouchableOpacity
                              key={h}
                              style={[
                                styles.timeChip,
                                notif[item.key] === h && styles.timeChipActive,
                              ]}
                              onPress={() => updateNotif({ [item.key]: h })}
                            >
                              <Text style={[
                                styles.timeChipText,
                                notif[item.key] === h && { color: '#fff' },
                              ]}>{h}h</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>

          {/* Appearance */}
          <Text style={styles.sectionTitle}>APARIENCIA</Text>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <Ionicons name="moon" size={18} color={COLORS.textSecondary} />
              <Text style={styles.toggleLabel}>Modo oscuro</Text>
              <View style={{ backgroundColor: 'rgba(232,70,10,0.15)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: '#E8460A', fontSize: 11, fontWeight: '700' }}>Solo modo oscuro</Text>
              </View>
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

          {/* Logros / Badges */}
          <Text style={styles.sectionTitle}>🏅 LOGROS</Text>
          {(() => {
            const allBadgeIds = Object.keys(BADGE_DEFINITIONS) as BadgeId[];
            const earnedIds: BadgeId[] = user.badges ?? [];
            const ranks = ['genin', 'chunin', 'jonin', 'kage'] as const;
            return ranks.map(rank => {
              const rankBadges = allBadgeIds.filter(id => BADGE_DEFINITIONS[id].rank === rank);
              const rankColor = RANK_COLORS[rank];
              return (
                <View key={rank} style={[styles.card, { marginBottom: SPACING.sm }]}>
                  <Text style={[styles.toggleSub, { color: rankColor, marginBottom: SPACING.sm }]}>
                    {rank.toUpperCase()}
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {rankBadges.map(id => {
                      const def = BADGE_DEFINITIONS[id];
                      const earned = earnedIds.includes(id);
                      return (
                        <View
                          key={id}
                          style={[
                            styles.badgeChip,
                            earned
                              ? { borderColor: rankColor, backgroundColor: rankColor + '18' }
                              : styles.badgeLocked,
                          ]}
                        >
                          <Text style={{ fontSize: 20, opacity: earned ? 1 : 0.3 }}>{def.emoji}</Text>
                          <Text
                            style={[
                              styles.badgeName,
                              { color: earned ? rankColor : COLORS.textMuted },
                            ]}
                            numberOfLines={1}
                          >
                            {def.name}
                          </Text>
                          {earned && (
                            <Text style={styles.badgeEarned}>✓</Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            });
          })()}

          {/* Danger zone */}
          <Text style={[styles.sectionTitle, { color: COLORS.danger }]}>ZONA PELIGROSA</Text>
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.3)' }]}
            onPress={handleExportBackup}
            disabled={busyAction !== 'none'}
          >
            <Ionicons name="download-outline" size={18} color="#60A5FA" />
            <Text style={[styles.resetText, { color: '#60A5FA' }]}>
              {busyAction === 'backup' ? 'Generando backup...' : 'Exportar backup (JSON)'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={confirmReset}>
            <Ionicons name="refresh" size={18} color={COLORS.danger} />
            <Text style={styles.resetText}>Reiniciar programa desde el Día 1</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.resetButton, { marginTop: SPACING.sm }]}
            onPress={confirmDeleteAccountData}
            disabled={busyAction !== 'none'}
          >
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            <Text style={styles.resetText}>
              {busyAction === 'delete' ? 'Eliminando datos...' : 'Eliminar todos mis datos'}
            </Text>
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

          <View style={{ height: 100 }} />
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

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  toggleLabel: { fontSize: FONT.base, color: COLORS.textPrimary, fontWeight: '600' },
  toggleSub: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 1 },

  notifDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  notifRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  notifIcon: {
    width: 38, height: 38, borderRadius: RADIUS.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  notifTitle: { fontSize: FONT.sm, color: COLORS.textPrimary, fontWeight: '700' },
  notifDesc: { fontSize: FONT.xs, color: COLORS.textMuted, marginTop: 1 },

  timeRow: { gap: SPACING.sm },
  timeCol: { gap: 6 },
  timeLabel: { fontSize: FONT.xs, color: COLORS.textSecondary, fontWeight: '600' },
  timeChip: {
    paddingHorizontal: 10, paddingVertical: 12,
    borderRadius: RADIUS.full, borderWidth: 1,
    borderColor: COLORS.border, backgroundColor: COLORS.bgCard,
  },
  timeChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  timeChipText: { fontSize: FONT.xs, color: COLORS.textMuted, fontWeight: '700' },

  aboutText: { fontSize: FONT.base, color: COLORS.textSecondary, lineHeight: 24 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  versionText: { fontSize: FONT.sm, color: COLORS.textMuted },

  badgeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: RADIUS.full, borderWidth: 1.5,
    paddingHorizontal: 10, paddingVertical: 6, maxWidth: '47%',
  },
  badgeLocked: { borderColor: COLORS.border, backgroundColor: 'rgba(255,255,255,0.03)' },
  badgeName: { fontSize: 10, fontWeight: '700', flex: 1 },
  badgeEarned: { fontSize: 10, color: COLORS.success, fontWeight: '900' },

  resetButton: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(248,113,113,0.1)', borderRadius: RADIUS.lg,
    padding: SPACING.md, borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)',
  },
  resetText: { fontSize: FONT.base, color: COLORS.danger, fontWeight: '600' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg, gap: 8 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: FONT.lg, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: COLORS.textSecondary, fontSize: FONT.sm, textAlign: 'center' },
});
