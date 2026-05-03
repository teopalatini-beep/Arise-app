import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Config global de notificaciones ─────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const STORAGE_KEY = 'arise_notif_settings';

export interface NotifSettings {
  enabled: boolean;
  morning: boolean;   // 07:00
  afternoon: boolean; // 14:00
  night: boolean;     // 21:00
  morningHour: number;
  afternoonHour: number;
  nightHour: number;
}

export const DEFAULT_SETTINGS: NotifSettings = {
  enabled: true,
  morning: true,
  afternoon: true,
  night: true,
  morningHour: 9,
  afternoonHour: 15,
  nightHour: 21,
};

// ─── Mensajes por turno ───────────────────────────────────────────────────────

// MAÑANA — boost mental, disciplina, arrancar el día con fuego
const MORNING_MESSAGES = [
  { title: '🔥 Hoy es el día', body: 'La disciplina no negocia con el estado de ánimo. Arrancá ahora y el resto viene solo.' },
  { title: '⚡ Activá tu poder', body: 'No esperes estar listo. Los grandes nunca estuvieron listos — simplemente empezaron.' },
  { title: '⚔️ Tu versión élite te espera', body: 'El Teo de ayer ya fue superado. Hoy escribís un capítulo mejor. Andá a buscarlo.' },
  { title: '🐉 Modo guerrero ON', body: 'Goku no entrenó cuando tuvo ganas. Entrenó porque sabía que la batalla se gana hoy.' },
  { title: '🔥 Sin excusas', body: 'El cansancio es mentira que el cerebro inventa. El cuerpo puede más de lo que creés.' },
  { title: '⚡ La diferencia la hacés vos', body: 'Mientras otros duermen un rato más, vos ya estás construyendo quién vas a ser.' },
  { title: '🎯 Enfocate', body: '"La disciplina es el puente entre las metas y los logros." — Jim Rohn. Hoy cruzás ese puente.' },
  { title: '🌅 Arise', body: 'Cada mañana que te levantás con intención es una victoria antes de empezar. Ya ganaste una.' },
  { title: '⚔️ El camino del ninja', body: 'Rock Lee no tenía talentos. Solo tenía disciplina. Mirá en qué se convirtió.' },
  { title: '💪 Un día más', body: 'No tenés que querer hacerlo. Solo tenés que hacerlo. Las ganas vienen mientras actuás.' },
];

// TARDE — recordatorio de tareas, boost de disciplina para terminar el día fuerte
const AFTERNOON_MESSAGES = [
  { title: '🔥 La tarde te define', body: 'El mediodía ya pasó. Los que se rinden paran acá. Los que crecen siguen. ¿Vos?' },
  { title: '⚡ Check de misiones', body: 'Revisá tus tareas. Si falta algo, ahora es el momento. La noche llega rápido.' },
  { title: '💎 Presión = Diamante', body: 'El cansancio de la tarde es el momento exacto donde se construye el carácter.' },
  { title: '🎯 Sharingan activado', body: 'Enfocate. Una tarea a la vez. No necesitás perfección — necesitás constancia.' },
  { title: '🐉 El Ki no para', body: '"El único entrenamiento malo es el que no se hizo." Todavía estás a tiempo.' },
  { title: '⚔️ Segunda mitad del día', body: 'Los campeones no tienen buenas mañanas. Tienen buenos hábitos de tarde también.' },
  { title: '🔥 Terminá lo que empezaste', body: 'Empezar es fácil. Terminar es lo que separa al guerrero del resto. Terminá tu día.' },
  { title: '⚡ Sin rendirse', body: '"Cae siete veces, levántate ocho." — Proverbio japonés. Hoy no caés ni una.' },
  { title: '💪 El esfuerzo acumula', body: 'Cada tarde que terminás fuerte es un ladrillo en el edificio de quien serás en 90 días.' },
  { title: '🎯 El momentum es tuyo', body: 'Si completaste tareas hoy, seguí. Si no, este es tu momento. El día no terminó.' },
];

// NOCHE — relajante, orgullo, celebración del día completado
const NIGHT_MESSAGES = [
  { title: '🌙 Lo lograste, Teo', body: 'Pusiste un día más. No todos pueden decir eso. Estar orgulloso de vos mismo no es arrogancia — es justicia.' },
  { title: '⭐ Un día más en el camino', body: 'Cada noche que llegás a este punto, sos un poco más de la persona que querés ser. Eso vale.' },
  { title: '🌟 Orgulloso de vos', body: 'Hayas hecho mucho o poco hoy — estuviste presente. Y eso ya es más que la mayoría.' },
  { title: '🌙 Cerrá el día con paz', body: 'Respirá. El guerrero que dio todo hoy merece descansar sin culpa. Escribí y soltá.' },
  { title: '💫 Construiste algo hoy', body: 'Quizás no lo ves todavía. Pero el progreso es silencioso hasta que de repente es evidente.' },
  { title: '🌙 El esfuerzo no se borra', body: 'Lo que hiciste hoy quedó grabado en quién sos. Nadie te lo puede quitar. Descansá tranquilo.' },
  { title: '⭐ Más fuerte que ayer', body: 'No importa el nivel del día. Seguiste. Y seguir, cuando podrías no haberlo hecho, es todo.' },
  { title: '🌟 Hacelo por vos', body: 'No hacés esto para impresionar a nadie. Lo hacés para mirarte al espejo y respetarte. Ya lo merecés.' },
  { title: '🌙 La racha sigue', body: 'Un día más en la racha. Cerrá los ojos sabiendo que mañana arrancás con momentum.' },
  { title: '💙 Estás en el camino correcto', body: 'Dias difíciles, días fáciles — seguiste igual. Eso es exactamente lo que hace a alguien extraordinario.' },
];


function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Permisos ─────────────────────────────────────────────────────────────────
export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Guardar / leer settings ──────────────────────────────────────────────────
export async function saveNotifSettings(settings: NotifSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export async function loadNotifSettings(): Promise<NotifSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

// ─── Mensajes de hito (días 30, 60, 90) ──────────────────────────────────────
const MILESTONE_MESSAGES: Record<number, { title: string; body: string }> = {
  30: {
    title: '🌿 FASE 1 COMPLETADA — Genin desbloqueado',
    body: '30 días de fuego puro. El 80% no llega aquí. Vos sí. La Fase 2 empieza mañana.',
  },
  60: {
    title: '⚔️ FASE 2 COMPLETADA — Chunin confirmado',
    body: '60 días. Dos meses construyendo quien sos. Quedan 30 días para la leyenda. No pares.',
  },
  90: {
    title: '👑 ARISE COMPLETE — LEYENDA',
    body: '90 días. Terminaste lo que casi nadie termina. Abrí la app — hay algo esperándote.',
  },
};

// ─── Programar todas las notificaciones ──────────────────────────────────────
export async function scheduleAllNotifications(
  settings: NotifSettings,
  startDate?: string,  // 'yyyy-MM-dd' — para calcular fechas de hitos
): Promise<void> {
  // Cancelar todo primero — garantiza cero duplicados
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!settings.enabled) return;

  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  // ── Notificaciones diarias ─────────────────────────────────────────────
  if (settings.morning) {
    const msg = randomFrom(MORNING_MESSAGES);
    await Notifications.scheduleNotificationAsync({
      content: { title: msg.title, body: msg.body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.morningHour,
        minute: 0,
      },
    });
  }

  if (settings.afternoon) {
    const msg = randomFrom(AFTERNOON_MESSAGES);
    await Notifications.scheduleNotificationAsync({
      content: { title: msg.title, body: msg.body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.afternoonHour,
        minute: 0,
      },
    });
  }

  if (settings.night) {
    const msg = randomFrom(NIGHT_MESSAGES);
    await Notifications.scheduleNotificationAsync({
      content: { title: msg.title, body: msg.body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.nightHour,
        minute: 0,
      },
    });
  }

  // ── Notificaciones de hito (días 30, 60, 90) ───────────────────────────
  if (startDate) {
    const start = new Date(startDate);
    for (const [dayStr, msg] of Object.entries(MILESTONE_MESSAGES)) {
      const dayOffset = parseInt(dayStr) - 1; // day 30 = 29 days after start
      const milestoneDate = new Date(start);
      milestoneDate.setDate(start.getDate() + dayOffset);
      milestoneDate.setHours(settings.nightHour, 0, 0, 0);

      // Only schedule if the milestone is in the future
      if (milestoneDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: { title: msg.title, body: msg.body, sound: true },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: milestoneDate,
          },
        });
      }
    }
  }
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
