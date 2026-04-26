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
  morningHour: 7,
  afternoonHour: 14,
  nightHour: 21,
};

// ─── Mensajes por turno ───────────────────────────────────────────────────────
const MORNING_MESSAGES = [
  { title: '🔥 Despierta tu Chakra', body: 'El guerrero que duerme pierde la batalla antes de empezar. Hoy es el día.' },
  { title: '⚡ Super Saiyan Mode', body: 'Cada mañana es un nuevo nivel. Teo, activá tu poder interior ahora.' },
  { title: '⚔️ Misión del día activada', body: 'Los ninjas no esperan. Tu entrenamiento del día te espera. ¡Empieza!' },
  { title: '🌅 Arise, Teo', body: 'El sol salió. Tu chakra también tiene que salir. Un día más hacia la cima.' },
  { title: '🐉 El dragón despierta', body: 'Goku entrena cuando todos duermen. Tú entrenás cuando todos se rinden.' },
  { title: '🔥 Modo Bestia ON', body: 'Respirá profundo. Estirá. Hoy vas a superar al Teo de ayer. Garantizado.' },
  { title: '⚔️ Honor del guerrero', body: 'Los Hashira no faltaron ni un día. Vos tampoco. Levantáte.' },
];

const AFTERNOON_MESSAGES = [
  { title: '⚡ Check de poder', body: '¿Completaste tu entrenamiento? El día sigue. Tus tareas te esperan, guerrero.' },
  { title: '🎯 Ojo de Sharingan', body: 'A mitad del día. ¿Cuántas misiones completadas? El progreso no miente.' },
  { title: '🔥 Fuego de mediodia', body: 'La tarde es cuando los débiles se rinden. Los fuertes aceleran. ¿Cuál sos vos?' },
  { title: '📜 Pergamino incompleto', body: 'Revisá tus tareas del día. Cada tilde verde es un paso hacia tu mejor versión.' },
  { title: '⚔️ Segunda ronda', body: 'Si el entrenamiento está hecho, perfecto. Si no, ahora es el momento. Sin excusas.' },
  { title: '🐉 El Ki no se detiene', body: 'Vegeta nunca tomó un descanso cuando el universo estaba en juego. Seguí.' },
  { title: '💎 Presión = Diamante', body: 'La tarde es el test real de tu disciplina. No dejes que el cansancio gane.' },
];

const NIGHT_MESSAGES = [
  { title: '📜 El guerrero reflexiona', body: 'Antes de dormir, el ninja revisa su día. Abrí el diario y escribí tu historia.' },
  { title: '🌙 Hora de cierre ninja', body: '¿Completaste todas las misiones de hoy? Marcá tu día y descansá con honor.' },
  { title: '⭐ Reflexión del alma', body: 'Los grandes guerreros aprenden de cada jornada. ¿Qué te llevás de hoy, Teo?' },
  { title: '🔥 El fuego no se apaga', body: 'El día casi termina. Si te queda alguna tarea, ahora es el último momento.' },
  { title: '🐲 Senzu Bean', body: 'El descanso es parte del entrenamiento. Escribí, cerrá el día y recargá energía.' },
  { title: '⚔️ El dojo cierra', body: 'Tus tareas de hoy. Tu diario. Tu descanso. En ese orden. El guerrero descansa con conciencia.' },
  { title: '🌟 Día completado', body: 'Cada día que terminás es una cicatriz de batalla. Mañana, más fuerte. Descansá, guerrero.' },
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

// ─── Programar todas las notificaciones ──────────────────────────────────────
export async function scheduleAllNotifications(settings: NotifSettings): Promise<void> {
  // Cancelar todo primero
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!settings.enabled) return;

  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

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
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
