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
  morning: boolean;
  afternoon: boolean;
  night: boolean;
  streakReminder: boolean;   // recordatorio nocturno de racha
  morningHour: number;
  afternoonHour: number;
  nightHour: number;
  streakReminderHour: number;
}

export const DEFAULT_SETTINGS: NotifSettings = {
  enabled: true,
  morning: true,
  afternoon: true,
  night: true,
  streakReminder: true,
  morningHour: 9,
  afternoonHour: 15,
  nightHour: 21,
  streakReminderHour: 20,
};

// ─── Mensajes por turno ───────────────────────────────────────────────────────

// MAÑANA — encender el motor, disciplina antes de que el cerebro proteste
const MORNING_MESSAGES = [
  { title: '🔥 ARISE', body: 'La disciplina no negocia con el estado de ánimo. Arrancá ahora — el resto viene solo.' },
  { title: '⚡ Levantate', body: 'No esperes estar listo. Nadie grande esperó estarlo. Simplemente empezaron.' },
  { title: '⚔️ Modo guerrero', body: 'El Goku de hoy es el resultado de los entrenamientos que Goku de ayer no quería hacer.' },
  { title: '🐉 El Ki no espera', body: 'Cada mañana que arrancás con intención ya es una victoria. Capitalzala.' },
  { title: '🔥 Sin excusas', body: 'El cansancio es mentira que el cerebro inventa. El cuerpo puede más de lo que creés.' },
  { title: '⚡ Construís mientras dormían', body: 'Mientras otros piden cinco minutos más, vos ya estás construyendo quién vas a ser.' },
  { title: '🎯 Rock Lee lo sabía', body: 'Sin talento, pura disciplina. Mirá en lo que se convirtió. Vos tenés lo mismo adentro.' },
  { title: '🌅 El momento es ahora', body: '"No actúes como si tuvieras diez mil años de vida." — Marco Aurelio. Hoy es el día.' },
  { title: '⚔️ El ninja entrena', body: 'Itachi no llegó a ser el mejor esperando inspiración. Ni vos tampoco.' },
  { title: '💪 Empezá sin ganas', body: 'No tenés que querer hacerlo. Solo tenés que hacerlo. Las ganas aparecen en el camino.' },
  { title: '🔥 90 días, un capítulo', body: 'Cada mañana que cumplís escribe una línea más en la historia de quien vas a ser.' },
  { title: '⚡ Arise', body: '"La disciplina es el puente entre las metas y los logros." — Jim Rohn. Hoy cruzás ese puente.' },
  { title: '🌅 Primer movimiento', body: 'El secreto no es motivación. Es hacer el primer movimiento aunque cueste. Hacelo.' },
  { title: '🐉 Modo saiyan', body: 'Los saiyans se vuelven más fuertes después de cada derrota. Vos también. Hoy es un nuevo ciclo.' },
  { title: '⚔️ Lo que te define', body: 'Lo que hacés cuando no tenés ganas — ahí es exactamente donde se construye el carácter.' },
  // Estoicismo
  { title: '🧠 El obstáculo es el camino', body: 'No lo rodees. No lo evites. Atravesalo. Eso es exactamente lo que necesitás hoy. — Marco Aurelio' },
  { title: '⚡ Poder real', body: '"Tú tienes poder sobre tu mente, no sobre los eventos externos." — Marco Aurelio. Enfocate en lo que depende de vos.' },
  { title: '🌅 Conquistate', body: '"El hombre conquista el mundo al conquistarse a sí mismo." — Séneca. Hoy es tu campo de batalla.' },
  { title: '🎯 Solo lo necesario', body: '"La atención que le das a cada acción debe ser proporcional a su valor." — Marco Aurelio. Hoy: primero lo que importa.' },
  { title: '⚔️ Haz lo que toca', body: 'No busques que el día sea perfecto. Solo hacé lo que la naturaleza requiere ahora mismo. — Marco Aurelio' },
  { title: '💪 Lo controlable', body: '"Algunas cosas dependen de nosotros y otras no." — Epicteto. Hoy solo te ocupás de las que sí.' },
  { title: '🌅 Te convertís', body: '"Te convertís en lo que le das tu atención." Elegí bien dónde ponés el foco esta mañana.' },
  // Mis agregados
  { title: '🔥 No esperes el clima', body: 'No podés controlar el viento, pero sí ajustar la vela. Arrancá con lo que tenés ahora.' },
  { title: '⚡ La hora más importante', body: 'La primera hora del día define el resto. Lo que hacés ahora mismo tiene más peso del que creés.' },
  { title: '🌅 Naruto nunca bajó los brazos', body: 'Toda la aldea lo llamó fracasado. Él siguió de todas formas. Eso lo convirtió en Hokage.' },
];

// TARDE — terminar fuerte, no dejar misiones pendientes
const AFTERNOON_MESSAGES = [
  { title: '🔥 Segunda mitad', body: 'La tarde es donde los que crecen se separan de los que sobreviven. ¿Dónde estás vos?' },
  { title: '⚡ Check de misiones', body: 'Revisá qué te falta. Si algo está pendiente, ahora es el momento exacto. La noche llega rápido.' },
  { title: '💎 Presión = diamante', body: 'El cansancio de la tarde es el momento exacto donde se talla el carácter. No esquives ese momento.' },
  { title: '🎯 Sharingan activado', body: 'Enfocate. Una misión a la vez. No necesitás perfección — necesitás que se haga.' },
  { title: '🐉 El único entreno malo', body: '"El único entrenamiento malo es el que no se hizo." Todavía estás a tiempo de hacerlo.' },
  { title: '⚔️ Los campeones no paran', body: 'Los campeones no tienen solo buenas mañanas. Tienen buenos hábitos de tarde también.' },
  { title: '🔥 Terminá lo que empezaste', body: 'Empezar es fácil. Terminar separa al guerrero del resto. Terminá tu día fuerte.' },
  { title: '⚡ Siete veces, ocho', body: '"Cae siete veces, levántate ocho." — Proverbio japonés. Hoy no caés ni una.' },
  { title: '💪 Ladrillo a ladrillo', body: 'Cada tarde que cerrás fuerte es un ladrillo más en el edificio de quien serás en 90 días.' },
  { title: '🎯 El momentum es tuyo', body: 'Si completaste misiones hoy, seguí. Si no, este es tu momento. El día no terminó.' },
  { title: '🌿 Fuerza mental', body: 'Los Hashira no son los más talentosos — son los que aguantaron cuando los demás se rindieron.' },
  { title: '⚡ Ventana abierta', body: 'Hay una ventana de tiempo antes de que cierre el día. Todavía estás dentro. Aprovechala.' },
  { title: '🔥 Jiraiya lo haría', body: 'Jiraiya entrenó a Naruto incluso cuando estaba cansado. La grandeza no espera que pase el cansancio.' },
  { title: '💎 Sin negociación', body: 'Tu yo futuro no negocia excusas. Solo ve resultados. Dale algo de qué estar orgulloso.' },
  { title: '⚔️ El esfuerzo acumula', body: 'Cada acción de hoy se suma en silencio. En 30 días lo vas a ver clarísimo.' },
  // Estoicismo
  { title: '🧠 Lo que depende de vos', body: '"Algunas cosas dependen de nosotros y otras no." — Epicteto. Completá lo que sí depende. Soltá el resto.' },
  { title: '💪 Las dificultades fortalecen', body: '"Las dificultades fortalecen la mente, como el trabajo fortalece el cuerpo." — Séneca. Este momento difícil te está construyendo.' },
  { title: '🎯 Valor proporcional', body: 'No toda tarea vale lo mismo. Identificá la más importante que te falta y hacela primero. — Marco Aurelio' },
  { title: '⚡ El bien que hacés', body: '"El que hace el bien a otro, también hace el bien a sí mismo." — Séneca. Cerrá el día siendo alguien de quien te orgullecés.' },
  // Mis agregados
  { title: '🔥 Perspectiva', body: '"Todo lo que escuchamos es solo una opinión, no un hecho." — Marco Aurelio. La excusa que estás escuchando ahora mismo no es real.' },
  { title: '⚔️ Baja el ruido', body: 'El cerebro de la tarde fabrica urgencias falsas. Cerrá las distracciones. Abrí la app. Completá lo que queda.' },
  { title: '🌿 Gojo lo haría sin quejarse', body: 'El más poderoso del mundo no necesita excusas. Vos tampoco. Terminá el día como un Limitless.' },
];

// NOCHE — reflexión, orgullo sin arrogancia, preparar el descanso
const NIGHT_MESSAGES = [
  { title: '🌙 Cerraste el día', body: 'Pusiste un día más. No todos pueden decir eso. Estar orgulloso no es arrogancia — es justicia.' },
  { title: '⭐ Un día más en el camino', body: 'Cada noche que llegás a este punto sos un poco más de la persona que querés ser. Eso vale.' },
  { title: '🌟 Estuviste presente', body: 'Hayas hecho mucho o poco — estuviste. Y eso ya es más que la mayoría decidió hacer hoy.' },
  { title: '🌙 El guerrero descansa', body: 'Respirá. El que dio todo hoy merece descansar sin culpa. Abrí el diario y soltá el día.' },
  { title: '💫 El progreso es silencioso', body: 'Quizás no lo ves todavía. Pero el progreso acumula en silencio hasta que de repente es evidente.' },
  { title: '🌙 Quedó grabado', body: 'Lo que hiciste hoy quedó grabado en quién sos. Nadie puede borrarlo. Descansá tranquilo.' },
  { title: '⭐ Más fuerte que ayer', body: 'No importa el nivel del día. Seguiste. Y seguir cuando podrías no hacerlo — eso es todo.' },
  { title: '🌟 Lo hacés por vos', body: 'No hacés esto para impresionar. Lo hacés para mirarte al espejo y respetarte. Ya lo merecés.' },
  { title: '🌙 La racha vive', body: 'Un día más sostenido. Mañana arrancás con momentum — eso es un regalo que te diste hoy.' },
  { title: '💙 En el camino correcto', body: 'Días difíciles, días fáciles — seguiste igual. Eso es lo que hace a alguien extraordinario.' },
  { title: '🌙 Marco Aurelio', body: '"Termina cada día y descansa. Hiciste lo que pudiste." Lo hiciste. Ahora recuperate.' },
  { title: '⭐ Naruto lo entendió', body: 'No era el más fuerte. Era el que nunca paraba. Vos tampoco parás. Eso lo cambia todo.' },
  { title: '🌟 El proceso funciona', body: 'Confiá en el proceso aunque hoy no se vea el resultado. La semilla tarda en verse desde afuera.' },
  { title: '🌙 Sin culpa', body: 'Si hoy fue difícil, está bien. Mañana arrancás de nuevo. Lo importante es que seguís en el juego.' },
  { title: '💫 Escribí', body: 'Antes de dormir, una línea en el diario. Lo que sentís hoy es parte de tu historia de transformación.' },
  // Tus frases — Estoicismo y reflexión
  { title: '🌙 Nadie puede hundirte', body: '"Nadie puede hacerte sentir inferior sin tu consentimiento." — Eleanor Roosevelt. Lo que otros piensen no define lo que construiste hoy.' },
  { title: '⭐ Solo imaginación', body: '"Sufrimos más en la imaginación que en la realidad." — Séneca. El día que viviste fue mejor que el que temías. Descansá.' },
  { title: '🌟 Libertad real', body: '"La libertad y la felicidad vienen de entender y trabajar con nuestros límites." — Epicteto. Conocerse es la base de todo.' },
  { title: '🌙 La tranquilidad', body: 'Soltá lo que dicen. Soltá lo que no salió. Quedate con lo que hiciste. Eso es lo único real esta noche.' },
  { title: '💫 Sin miedo al futuro', body: '"La mente que está ansiosa por los eventos futuros es miserable." — Séneca. Hoy terminó. Mañana no llegó. Estás bien.' },
  { title: '🌙 El cambio es la naturaleza', body: '"La pérdida no es más que cambio, y el cambio es el deleite de la naturaleza." — Marco Aurelio. Fluí hoy. Seguí mañana.' },
  { title: '⭐ Sé estricto, sé generoso', body: '"Sé estricto contigo mismo y tolerante con los demás." Hoy cumpliste tu parte. Eso es suficiente.' },
  { title: '🌟 La oscuridad enseña', body: '"El miedo lleva a la ira, la ira al odio, el odio al sufrimiento." — Yoda. Lo que enfrentaste hoy sin rendirte rompió ese ciclo.' },
  // Mis agregados noche
  { title: '🌙 Examiná el día', body: 'Antes de dormir: ¿en qué fallaste? ¿en qué triunfaste? Una respuesta honesta vale más que mil planes. — Séneca adaptado' },
  { title: '💫 El descanso es parte', body: 'El descanso no es recompensa del perezoso — es la recarga del guerrero. Dormí bien. Mañana arrancás.' },
  { title: '⭐ Perspectiva nocturna', body: '"Todo lo que vemos es una perspectiva, no la realidad." — Marco Aurelio. El día que viviste tuvo más de bueno de lo que notaste.' },
];

// RECORDATORIO DE RACHA — aviso nocturno para no perder la racha
const STREAK_REMINDER_MESSAGES = [
  { title: '🔥 Tu racha está en juego', body: 'Todavía hay tiempo. Completá tus misiones antes de cerrar el día y protegé lo que construiste.' },
  { title: '⚡ No rompas la cadena', body: 'La racha es sagrada. Si falta algo por hacer, este es el momento. No dejes que se corte.' },
  { title: '🎯 Última ventana', body: 'El día casi cierra. ¿Cerraste tus misiones? Tu racha depende de lo que hagas en las próximas horas.' },
  { title: '⚔️ El ninja no falla dos veces', body: 'Hoy todavía podés cumplir. La racha vale más de lo que cuesta hacer las misiones ahora.' },
  { title: '🔥 No se negocia', body: 'Llevas días construyendo algo. No lo tires a la noche. Revisá el app y cerrá lo que falta.' },
  { title: '💎 La racha es tuya', body: 'Días de constancia acumulados. No los pierdas esta noche. Cerrá fuerte y dormí tranquilo.' },
  { title: '🌙 Antes de dormir', body: '¿Completaste el día? Si no, todavía estás a tiempo. Abrí la app y terminá lo que empezaste.' },
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

  if (settings.streakReminder) {
    const msg = randomFrom(STREAK_REMINDER_MESSAGES);
    await Notifications.scheduleNotificationAsync({
      content: { title: msg.title, body: msg.body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.streakReminderHour,
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
