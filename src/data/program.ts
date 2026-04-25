import { DayDefinition, TaskDefinition } from '../types';

// ─── FRASES MOTIVACIONALES ────────────────────────────────────────────────────
const QUOTES = [
  "Arise. No mañana. Hoy.",
  "El primer día es el más importante. Estás aquí.",
  "Consistencia > intensidad. Sigue.",
  "No necesitás motivación. Necesitás disciplina.",
  "Cada repetición es un voto por la persona que querés ser.",
  "Difícil hoy. Fácil después.",
  "Semana 1 completada. Apenas empieza.",
  "El cuerpo se queja. La mente decide.",
  "Tu versión futura te lo agradecerá.",
  "No bajés el ritmo. El momentum se construye.",
  "Dolor temporal. Orgullo permanente.",
  "Nadie te va a ver entrenar. Solo vos sabés.",
  "Dos semanas. ¿Ves el cambio? Viene.",
  "Los días fáciles son trampa. Empujá más.",
  "3 semanas. Ya no sos el mismo de antes.",
  "El hábito se está formando. No rompas la cadena.",
  "Hacer lo que no querés hacer es el punto.",
  "Cuando el cuerpo dice pará, la mente dice continúa.",
  "Progreso invisible → visible. Dale tiempo.",
  "Sin excusas. Sin negociaciones.",
  "Mitad del mes completada. Imparable.",
  "Un mes. ¿Cuántos lo intentaron y fallaron? Vos no.",
  "El trabajo duro no miente.",
  "Cada día que cumplís, te ganás el derecho al descanso.",
  "No hay atajos. Hay compromiso.",
  "Tu racha es tu identidad. Protegela.",
  "Semana 4. La disciplina ya es parte de vos.",
  "El que dura, gana.",
  "30 días. La mayoría se rinde aquí. Vos no.",
  "Subí el nivel. Ya no sos principiante.",
  "El cuerpo se adapta. La mente también.",
  "Nuevo nivel de exigencia. Lo aceptás.",
  "Esto ya no es un challenge. Es tu vida.",
  "La incomodidad es la puerta al crecimiento.",
  "Semana 5 completada. El cambio es real.",
  "6 semanas de trabajo real. Nadie te lo puede quitar.",
  "Lo que hiciste esta semana ya existirá para siempre.",
  "La disciplina es un regalo que te das a vos mismo.",
  "No pares cuando estés cansado. Pará cuando terminés.",
  "Dos meses se ven desde acá.",
  "Cada tarea es una decisión. Elegís a quién ser.",
  "Mitad del camino. La segunda mitad es la más importante.",
  "Día 43. Más de la mitad. Acelerá.",
  "La fatiga es mental antes que física.",
  "Las excusas son el idioma de los que no logran nada.",
  "Hoy hacés el trabajo. El resultado llega solo.",
  "No te compares con otros. Solo con quien eras ayer.",
  "Intensificamos. Estás listo.",
  "Semana 7. El final ya es visible.",
  "8 semanas de fuego. Sos otro.",
  "La versión final de vos se construye ahora.",
  "Dos meses. Muchos sueñan, pocos hacen.",
  "El cuerpo recuerda todo lo que hiciste. No lo traiciones.",
  "Cada rep, cada página, cada minuto suma.",
  "Semana 8 completada. El momentum es imparable.",
  "Quedan 4 semanas. Se acerca el final.",
  "Último mes. Máxima intensidad.",
  "Ya cruzaste el punto de no retorno.",
  "90 días cambia la química de tu cerebro. Ya está pasando.",
  "Quedan 28 días. No aflojés ahora.",
  "Cada día restante vale doble.",
  "La gente ve el resultado. Vos sabés el precio.",
  "Semana 9. Elite.",
  "20 días. Podés ver el finish line.",
  "El trabajo final es el más importante.",
  "Cuando dudés, recordá por qué empezaste.",
  "No hay descanso hasta el día 90.",
  "El hábito ya está instalado. Ahora lo dominás.",
  "Quedan 15 días. Terminá fuerte.",
  "Semana 10 completada. Increíble.",
  "10 días. Una semana y media. No te detenés.",
  "El final define el camino.",
  "Cada día que queda es un regalo. Usalo.",
  "Ya no sos quien empezó. Sos quien lo está terminando.",
  "Quedan 7 días. Una semana más.",
  "El último push siempre es el más duro y el más importante.",
  "Última semana. Todo lo que tenés.",
  "6 días. Naciste para terminar esto.",
  "5 días. La racha no se rompe ahora.",
  "4 días. Estás en el podio.",
  "3 días. Absolutamente imparable.",
  "2 días. Mañana lo terminás.",
  "Día 90. LO LOGRASTE. Arise.",
];

// ─── FRASES ESTOICAS (una por día) ────────────────────────────────────────────
const STOIC_QUOTES = [
  "\"El hombre que sufre antes de que sea necesario sufre más de lo necesario.\" — Séneca",
  "\"No desperdicies lo que te queda de vida en pensamientos sobre los demás.\" — Marco Aurelio",
  "\"Primero di qué tipo de hombre querés ser, luego hacé lo que tenés que hacer.\" — Epicteto",
  "\"La felicidad de tu vida depende de la calidad de tus pensamientos.\" — Marco Aurelio",
  "\"No es lo que nos pasa lo que nos daña, sino nuestra respuesta.\" — Epicteto",
  "\"Sé tolerante con los demás y estricto contigo mismo.\" — Marco Aurelio",
  "\"Nunca te quejes de lo que podés evitar.\" — Marco Aurelio",
  "\"Dos palabras que deben guiarte: seguí adelante.\" — Marco Aurelio",
  "\"Querer que las cosas sucedan como suceden, eso es la paz.\" — Epicteto",
  "\"Si querés mejorar, estar dispuesto a ser visto como ignorante.\" — Epicteto",
  "\"El alma se colorea con el color de tus pensamientos.\" — Marco Aurelio",
  "\"No es que las cosas sean difíciles y no nos atrevemos; es que no nos atrevemos y son difíciles.\" — Séneca",
  "\"Si no es correcto, no lo hagas. Si no es verdad, no lo digas.\" — Marco Aurelio",
  "\"El dolor que elegís voluntariamente es entrenamiento. El que evitás es debilidad.\" — Epicteto",
  "\"Nadie puede hacerte daño sin tu permiso.\" — Gandhi",
  "\"Lo que importa no es lo que te pasa, sino cómo reaccionás.\" — Epicteto",
  "\"Comienza haciendo lo necesario, luego lo posible y de repente estarás haciendo lo imposible.\" — San Francisco de Asís",
  "\"Ama la disciplina y la disciplina te amará.\" — Marco Aurelio",
  "\"Lo que tenemos dentro es infinitamente más importante que lo que nos rodea.\" — Marco Aurelio",
  "\"No hay viento favorable para el barco que no sabe a dónde va.\" — Séneca",
  "\"No busques la aprobación de los demás. Buscá tu propia aprobación.\" — Epicteto",
  "\"Nunca confundas el movimiento con la acción.\" — Hemingway",
  "\"Las grandes almas tienen voluntades; las débiles solo tienen deseos.\" — Proverbio chino",
  "\"Un guerrero no desiste ante el primer obstáculo.\" — Marco Aurelio",
  "\"Actúa bien ahora, aunque nadie te vea. El universo lleva la cuenta.\" — Marco Aurelio",
  "\"La virtud no consiste en abstenerse del vicio, sino en no desearlo.\" — George Bernard Shaw",
  "\"El hombre que mueve montañas comienza cargando pequeñas piedras.\" — Confucio",
  "\"La disciplina es la mejor amiga del hombre libre.\" — Epicteto",
  "\"El que aprende y no practica es como el que ara y no siembra.\" — Platón",
  "\"Cada problema es una oportunidad disfrazada.\" — John Adams",
  "\"No busques ser mejor que los demás. Sé mejor que ayer.\" — Epicteto",
  "\"La mente lo es todo. En lo que pensás, te convertís.\" — Buda",
  "\"Un pequeño progreso cada día genera grandes resultados.\" — Satya Nani",
  "\"La mayor gloria no está en no caer, sino en levantarse cada vez.\" — Confucio",
  "\"La perfección no es un acto, es un hábito.\" — Aristóteles",
  "\"No es la fuerza sino la perseverancia la que logra cosas grandes.\" — Samuel Johnson",
  "\"La adversidad despierta talentos que en la prosperidad habrían permanecido dormidos.\" — Horacio",
  "\"Quien no arriesga no gana.\" — Proverbio",
  "\"En el medio de la dificultad yace la oportunidad.\" — Einstein",
  "\"Siempre parece imposible hasta que se hace.\" — Nelson Mandela",
  "\"Sé el cambio que querés ver en el mundo.\" — Gandhi",
  "\"Quien tiene un porqué para vivir puede soportar casi cualquier cómo.\" — Nietzsche",
  "\"La perfección es el enemigo del progreso.\" — Churchill",
  "\"El éxito no es definitivo, el fracaso no es fatal: lo que cuenta es el coraje de continuar.\" — Churchill",
  "\"Todo lo que alguna vez quisiste está del otro lado del miedo.\" — George Addair",
  "\"Haz lo que tenés que hacer y lo que el destino disponga ya lo hará saber.\" — Marco Aurelio",
  "\"Si querés algo que nunca tuviste, tenés que hacer algo que nunca hiciste.\" — Thomas Jefferson",
  "\"El coraje no es la ausencia del miedo, sino el juicio de que algo es más importante.\" — Ambrose Redmoon",
  "\"No hay descanso para el que busca la excelencia.\" — Marco Aurelio",
  "\"Los límites existen solo en la mente.\" — Epicteto",
  "\"Cuida tus pensamientos, pues se convierten en palabras. Cuida tus palabras, pues se convierten en actos.\" — Lao Tzu",
  "\"Lo que resistes, persiste. Lo que aceptás, te transforma.\" — Carl Jung",
  "\"El sabio no dice todo lo que piensa, pero siempre piensa todo lo que dice.\" — Aristóteles",
  "\"No importa cuán lento vayas, siempre y cuando no te detengas.\" — Confucio",
  "\"Si crees que podés, o si crees que no podés, en ambos casos tenés razón.\" — Henry Ford",
  "\"Prefiero morir de pie que vivir arrodillado.\" — Emiliano Zapata",
  "\"Un guerrero con causa es más peligroso que diez soldados sin ella.\" — Marco Aurelio",
  "\"El dolor es temporal. El orgullo es para siempre.\" — Lance Armstrong",
  "\"La vida se encoge o se expande en proporción al coraje de uno.\" — Anaïs Nin",
  "\"Ser paciente con la ignorancia es sabio. Ser paciente con la pereza es tonto.\" — Epicteto",
  "\"Los obstáculos son esas cosas espantosas que ves cuando apartas los ojos de tu objetivo.\" — Henry Ford",
  "\"El que tiene salud tiene esperanza, y el que tiene esperanza lo tiene todo.\" — Proverbio árabe",
  "\"La excelencia no es una singularidad sino un hábito.\" — Aristóteles",
  "\"Quien se domina a sí mismo domina a sus enemigos.\" — Marco Aurelio",
  "\"No te detengas cuando estés cansado. Detenéte cuando hayas terminado.\" — David Goggins",
  "\"El hombre débil crea tiempos difíciles. El hombre fuerte crea tiempos buenos.\" — Proverbio",
  "\"Nadie recuerda a los que se rindieron.\" — Marco Aurelio",
  "\"Sos más fuerte de lo que pensás. Más capaz de lo que creés.\" — Arise",
  "\"Cada repetición te separa más del hombre que eras.\" — Arise",
  "\"La transformación duele. Eso es evidencia de que está funcionando.\" — Arise",
  "\"Quedan pocos días. Estos son los que te van a definir.\" — Arise",
  "\"El día 90 no es el final. Es el nuevo punto de partida.\" — Arise",
  "\"Lo que empezaste con dudas, lo terminás con certeza.\" — Arise",
  "\"Sos la prueba de que el compromiso vence al talento.\" — Arise",
  "\"El último esfuerzo siempre parece el más imposible. Dalo todo.\" — Arise",
  "\"Ya no sos quien empezó. Sos quien lo terminó.\" — Arise",
  "\"90 días después: sos la prueba viva de que podés con todo.\" — Arise",
];

// ─── GENERADOR ────────────────────────────────────────────────────────────────
function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

function buildDay(dayNum: number): DayDefinition {
  const d = dayNum;

  const trainMin = clamp(Math.round(20 + (d - 1) * 0.82), 20, 95);
  const readPages = clamp(Math.round(10 + (d - 1) * 0.34), 10, 40);
  const breathMin = clamp(Math.round(5 + (d - 1) * 0.17), 5, 20);
  const workMin   = clamp(Math.round(45 + (d - 1) * 1.5), 45, 180);
  const visMin    = d >= 20 ? clamp(Math.round(5 + (d - 20) * 0.14), 5, 15) : 0;
  const coldMin   = d >= 40 ? clamp(Math.round(1 + (d - 40) * 0.08), 1, 5) : 0;
  const motivMin  = clamp(Math.round(5 + (d - 1) * 0.08), 5, 12);

  function trainDescription(): string {
    if (d <= 10) return `${trainMin} min de entrenamiento base: cardio ligero + ejercicios de fuerza con peso corporal. Calentá 5 min antes.`;
    if (d <= 20) return `${trainMin} min: 20 min cardio + ${trainMin - 20} min de fuerza. Intensidad moderada.`;
    if (d <= 35) return `${trainMin} min: HIIT 15 min + ${trainMin - 15} min pesas o funcional. Sin descansos mayores a 60 seg.`;
    if (d <= 50) return `${trainMin} min: Sesión completa de fuerza (sentadillas, press, peso muerto) + 20 min cardio al final.`;
    if (d <= 65) return `${trainMin} min: Alta intensidad. 30 min cardio + ${trainMin - 30} min pesas compuestas con carga real.`;
    if (d <= 80) return `${trainMin} min: Elite. Splits de fuerza + 25 min HIIT. Peso máximo con buena forma.`;
    return `${trainMin} min: Modo bestia. Circuito completo cardio + fuerza sin pausas largas. Todo lo que tenés.`;
  }

  function breathDescription(): string {
    if (d <= 15) return `${breathMin} min de respiración consciente. Técnica box breathing: inhalá 4 seg, sostené 4 seg, exhalá 4 seg, sostené 4 seg. Repetí el ciclo.`;
    if (d <= 30) return `${breathMin} min. Alterna: 3 rondas box breathing + 3 rondas respiración 4-7-8 (inhalá 4, sostené 7, exhalá 8).`;
    if (d <= 50) return `${breathMin} min. Introducción al método Wim Hof: 30 respiraciones profundas + retención + recuperación.`;
    if (d <= 70) return `${breathMin} min Wim Hof completo: 3 rondas de 30 respiraciones con retención progresiva.`;
    return `${breathMin} min de pranayama avanzado. Combina Wim Hof + respiración alternada nasal. Máxima claridad mental.`;
  }

  function workDescription(): string {
    if (d <= 20) return `${workMin} min de trabajo profundo sin interrupciones. Celular en modo avión. Una sola tarea importante.`;
    if (d <= 45) return `${workMin} min de Deep Work. Mínimo 2 bloques de 45 min con 10 min de descanso. Sin redes sociales.`;
    if (d <= 70) return `${workMin} min de trabajo de máximo impacto. Bloques pomodoro extendidos. Tu tarea más difícil primero.`;
    return `${workMin} min de trabajo de elite. Foco absoluto en tu objetivo principal. Sin compromisos.`;
  }

  function motivDescription(): string {
    if (d <= 20) return `${motivMin} min: Escribí 3 cosas por las que estás agradecido hoy + 1 afirmación en voz alta sobre quién estás siendo.`;
    if (d <= 40) return `${motivMin} min: Gratitud (3 cosas) + visualizá cómo querés terminar el día + decí en voz alta tu compromiso con el programa.`;
    if (d <= 60) return `${motivMin} min: Escribí tu "porqué" otra vez + 3 logros de las últimas semanas + 1 afirmación fuerte en voz alta.`;
    if (d <= 80) return `${motivMin} min: Revisá tus objetivos iniciales + escribí cómo cambió tu mentalidad + afirmá: "Soy la persona que termina lo que empieza".`;
    return `${motivMin} min: Modo final. Escribí una carta a quien eras el día 1. Contale lo que lograste y quién sos ahora.`;
  }

  const tasks: TaskDefinition[] = [
    {
      id: `d${d}-entrenamiento`,
      name: 'Entrenamiento',
      category: 'cuerpo',
      description: trainDescription(),
      target: trainMin,
      unit: 'minutos',
    },
    {
      id: `d${d}-lectura`,
      name: 'Lectura',
      category: 'mente',
      description: `Leer ${readPages} páginas de un libro que te desafíe. Sin distracciones. Subrayá lo que te impacte.`,
      target: readPages,
      unit: 'páginas',
    },
    {
      id: `d${d}-respiracion`,
      name: 'Respiración',
      category: 'bienestar',
      description: breathDescription(),
      target: breathMin,
      unit: 'minutos',
    },
    {
      id: `d${d}-estoico`,
      name: 'Frase estoica',
      category: 'bienestar',
      description: `Leé la frase del día y reflexioná 2 minutos sobre cómo aplicarla HOY en tu vida concreta.\n\n${STOIC_QUOTES[Math.min(d - 1, STOIC_QUOTES.length - 1)]}`,
      target: 1,
      unit: 'reflexión',
    },
    {
      id: `d${d}-motivacion`,
      name: 'Motivación & Gratitud',
      category: 'motivacion',
      description: motivDescription(),
      target: motivMin,
      unit: 'minutos',
    },
    {
      id: `d${d}-trabajo`,
      name: 'Trabajo profundo',
      category: 'productividad',
      description: workDescription(),
      target: workMin,
      unit: 'minutos',
    },
  ];

  if (d >= 20) {
    tasks.push({
      id: `d${d}-visualizacion`,
      name: 'Visualización',
      category: 'productividad',
      description: `${visMin} min visualizando vividamente a tu versión de 90 días. Sentí cómo se ve, cómo actúa, qué piensa. Sé esa persona ahora.`,
      target: visMin,
      unit: 'minutos',
    });
  }

  if (d >= 40) {
    tasks.push({
      id: `d${d}-ducha`,
      name: 'Ducha fría',
      category: 'cuerpo',
      description: `${coldMin} min de agua fría. Sin preparación mental. Entrás y aguantás. Construye tolerancia al discomfort.`,
      target: coldMin,
      unit: 'minutos',
    });
  }

  const quoteIndex = Math.min(d - 1, QUOTES.length - 1);

  return {
    dayNumber: d,
    tasks,
    quote: QUOTES[quoteIndex],
    stoicQuote: STOIC_QUOTES[quoteIndex],
  };
}

export const PROGRAM: DayDefinition[] = Array.from({ length: 90 }, (_, i) =>
  buildDay(i + 1)
);

export const PENALTY_MISSION: TaskDefinition[] = [
  {
    id: 'penalty-entrenamiento',
    name: 'Penitencia: Entrenamiento doble',
    category: 'cuerpo',
    description: 'Faltaste ayer. Hoy pagás: 60 min de cardio + fuerza sin descansos. Sin negociación.',
    target: 60,
    unit: 'minutos',
  },
  {
    id: 'penalty-respiracion',
    name: 'Penitencia: Respiración extendida',
    category: 'bienestar',
    description: '20 min de respiración Wim Hof. Reflexioná sobre por qué fallaste y qué cambiarás.',
    target: 20,
    unit: 'minutos',
  },
  {
    id: 'penalty-escritura',
    name: 'Penitencia: Carta de compromiso',
    category: 'productividad',
    description: 'Escribí una carta de 200 palabras comprometiendo por qué no fallarás de nuevo. Sé brutal con vos mismo.',
    target: 200,
    unit: 'palabras',
  },
];
