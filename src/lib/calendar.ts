import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';
import { MissionDef } from '../types';

const ARISE_CALENDAR_NAME = 'ARISE — 90 Day Challenge';
const ARISE_CALENDAR_COLOR = '#E8460A';

// ─── Permissions ─────────────────────────────────────────────────────────────
export async function requestCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

// ─── Get or create the ARISE calendar ────────────────────────────────────────
async function getOrCreateAriseCalendar(): Promise<string> {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

  // Look for existing ARISE calendar
  const existing = calendars.find(c => c.title === ARISE_CALENDAR_NAME);
  if (existing) return existing.id;

  // Create a new calendar
  let sourceId: string | undefined;

  if (Platform.OS === 'ios') {
    const defaultSource = calendars.find(c => c.source?.name === 'iCloud')
      ?? calendars.find(c => c.source?.name === 'Default')
      ?? calendars[0];
    sourceId = defaultSource?.source?.id;
  } else {
    // Android: use local account source
    const localSource = await Calendar.getDefaultCalendarAsync();
    sourceId = (localSource as any)?.source?.id;
  }

  const calendarId = await Calendar.createCalendarAsync({
    title: ARISE_CALENDAR_NAME,
    color: ARISE_CALENDAR_COLOR,
    entityType: Calendar.EntityTypes.EVENT,
    sourceId,
    source: Platform.OS === 'ios' ? {
      isLocalAccount: true,
      name: 'ARISE',
      type: Calendar.SourceType.LOCAL,
    } : undefined,
    name: 'arise',
    ownerAccount: 'personal',
    accessLevel: Calendar.CalendarAccessLevel.OWNER,
  });

  return calendarId;
}

// ─── Add today's missions as calendar events ──────────────────────────────────
export async function addMissionsToCalendar(
  missions: MissionDef[],
  dayNumber: number,
  wakeUpHour = 7,
): Promise<number> {
  const granted = await requestCalendarPermission();
  if (!granted) {
    Alert.alert(
      'Sin permiso',
      'Necesitamos acceso a tu calendario para agregar las misiones. Habilitalo en Ajustes.',
    );
    return 0;
  }

  const calendarId = await getOrCreateAriseCalendar();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let created = 0;
  let startHour = wakeUpHour + 1; // Start scheduling 1h after wake up

  for (const mission of missions) {
    const startDate = new Date(today);
    startDate.setHours(startHour, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 30); // 30-min blocks

    const categoryEmoji: Record<string, string> = {
      cuerpo: '💪',
      mente: '🧠',
      bienestar: '🌿',
      productividad: '🎯',
      motivacion: '⚡',
    };

    const emoji = mission.isFixed
      ? (mission.id === 'exercise' ? '🏋️' : mission.id === 'eat_healthy' ? '🥗' : '💧')
      : (categoryEmoji[mission.category] ?? '⚡');

    await Calendar.createEventAsync(calendarId, {
      title: `${emoji} ${mission.name} — ARISE Día ${dayNumber}`,
      notes: mission.description,
      startDate,
      endDate,
      alarms: [{ relativeOffset: -10 }], // 10 min reminder
    });

    created++;
    startHour++;
    if (startHour > 22) break; // Don't go past 10 PM
  }

  return created;
}

// ─── Add a single training block ─────────────────────────────────────────────
export async function addTrainingBlock(
  dayNumber: number,
  durationMinutes = 60,
  hour = 7,
): Promise<boolean> {
  const granted = await requestCalendarPermission();
  if (!granted) return false;

  const calendarId = await getOrCreateAriseCalendar();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(today);
  startDate.setHours(hour, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + durationMinutes);

  await Calendar.createEventAsync(calendarId, {
    title: `⚡ Entrenamiento — ARISE Día ${dayNumber}`,
    notes: 'Bloque de entrenamiento del programa ARISE 90 días.',
    startDate,
    endDate,
    alarms: [{ relativeOffset: -15 }],
  });

  return true;
}

// ─── Add phase milestone event ────────────────────────────────────────────────
export async function addMilestoneEvent(
  phaseName: string,
  date: Date,
): Promise<boolean> {
  const granted = await requestCalendarPermission();
  if (!granted) return false;

  const calendarId = await getOrCreateAriseCalendar();

  const endDate = new Date(date);
  endDate.setHours(date.getHours() + 1);

  await Calendar.createEventAsync(calendarId, {
    title: `👑 ${phaseName} — ARISE`,
    notes: '¡Completaste una fase del programa ARISE 90 días!',
    startDate: date,
    endDate,
    alarms: [{ relativeOffset: 0 }],
  });

  return true;
}
