export interface DiscoveryTool {
  id: string;
  emotion: string;
  emoji: string;
  color: string;
  description: string;
  immediate: string[];
  shortTerm: string[];
  mindset: string;
  stoic: string;
}

export const DISCOVERY_TOOLS: DiscoveryTool[] = [
  {
    id: 'tristeza',
    emotion: 'Tristeza',
    emoji: '🌧️',
    color: '#4FC3F7',
    description: 'La tristeza es una señal, no una sentencia. Hay pasos concretos para no quedarte atrapado en ella.',
    immediate: [
      'Salí al aire libre aunque sea 10 minutos — la luz y el movimiento cambian la química del cerebro',
      'Escribí 3 cosas que pasaron hoy, sin filtro. Solo sacarlas de la cabeza',
      'Ponete agua fría en la cara o date una ducha fría de 30 segundos',
      'Llamá o mandá un mensaje a alguien de confianza — la conexión es el antídoto',
    ],
    shortTerm: [
      'Mantené la rutina básica aunque no tengas ganas: comé, dormí, movete',
      'Reducí las decisiones — hacé solo lo que ya está planeado',
      'Evitá el aislamiento total: salí aunque no quieras socializar',
      'Revisá si hay algo concreto que puedas resolver — la acción pequeña rompe la parálisis',
    ],
    mindset: 'La tristeza te dice que algo importaba. Escuchala sin dejarte hundir por ella. El dolor procesado se convierte en sabiduría; el evitado se vuelve carga.',
    stoic: '"No sufras por lo imaginado — muchos se pierden en el miedo a algo que nunca llega." — Marco Aurelio. El momento presente siempre es manejable.',
  },
  {
    id: 'ansiedad',
    emotion: 'Ansiedad',
    emoji: '⚡',
    color: '#FBBF24',
    description: 'La ansiedad es energía mal dirigida. Tu cuerpo se preparó para actuar — dale algo concreto que hacer.',
    immediate: [
      'Respiración 4-7-8: inhalá 4 seg, retené 7, exhalá 8. Repetí 4 veces',
      'Nombrá lo que sentís en voz alta o por escrito: "Siento ansiedad porque..."',
      'Hacé una actividad física intensa por 5-10 minutos — quema la adrenalina',
      'Grounding 5-4-3-2-1: nombrá 5 cosas que ves, 4 que tocás, 3 que escuchás, 2 que olés, 1 que saboreás',
    ],
    shortTerm: [
      'Hacé una lista de lo que podés controlar vs lo que no — enfocáte solo en lo primero',
      'Reducí cafeína y azúcar hasta que baje la intensidad',
      'Desarmá el problema en piezas pequeñas — "¿cuál es el próximo paso concreto?"',
      'Establecé una hora del día para preocuparte; fuera de ese horario, redirigí el pensamiento',
    ],
    mindset: 'La ansiedad imagina el peor futuro posible. Preguntate: "¿Es esto real ahora mismo?" El 90% de lo que tememos nunca ocurre. Lo que sí ocurre, lo manejás.',
    stoic: '"El hombre sabio no teme el futuro porque sabe que lo que venga, lo afrontará." — Séneca. Preparáte para lo posible, no te paralices por lo imaginado.',
  },
  {
    id: 'motivacion',
    emotion: 'Sin motivación',
    emoji: '🔋',
    color: '#C084FC',
    description: 'La motivación no viene sola — se construye con acción. El truco es empezar sin esperar sentirla.',
    immediate: [
      'Empezá con 2 minutos de la tarea que evitás — el inicio genera momentum',
      'Recordá tu "por qué" original: ¿para qué empezaste ARISE?',
      'Ponete música que te active; el estado emocional cambia con el entorno auditivo',
      'Hacé algo físico primero: 20 flexiones o una caminata corta',
    ],
    shortTerm: [
      'Reducí el objetivo al mínimo viable: ¿qué es lo más pequeño que puedo hacer hoy?',
      'Eliminá fricciones: dejá lista la ropa de entrenamiento la noche anterior',
      'Celebrá completar, no la perfección; el hábito importa más que el resultado',
      'Revisá sueño y comida: la motivación depende del combustible básico',
    ],
    mindset: 'La disciplina es la motivación que no necesita sentirse bien. Los grandes no esperan querer hacerlo; lo hacen igual. La motivación aparece después de la acción.',
    stoic: '"No actúes como si tuvieras diez mil años de vida. Lo urgente te espera." — Marco Aurelio.',
  },
  {
    id: 'enojo',
    emotion: 'Enojo',
    emoji: '🔥',
    color: '#F87171',
    description: 'El enojo no controlado destruye lo que construiste. Aprendé a usarlo como combustible, no como explosivo.',
    immediate: [
      'Salí del espacio donde estás; el movimiento físico rompe el ciclo del enojo',
      'Esperá 10 minutos antes de responder o actuar',
      'Respiración de caja: 4-4-4-4 × 5 ciclos',
      'Escribí lo que pensás sin filtro, en privado',
    ],
    shortTerm: [
      'Identificá qué valor fue violado: ¿respeto, justicia, control?',
      'Distinguí entre lo que pasó y la historia que te contás sobre eso',
      'Usá el enojo como energía en entrenamiento',
      'Cuando baje la intensidad, definí una conversación o acción concreta',
    ],
    mindset: 'El enojo dice "algo importa aquí". Pero actuar en caliente suele dañar lo que más querés proteger. La frialdad estratégica es más poderosa que la reacción.',
    stoic: '"¿Cuánto daño te hace la ira? Más del que causó quien te enojó." — Séneca.',
  },
  {
    id: 'perdido',
    emotion: 'Perdido en la vida',
    emoji: '🧭',
    color: '#68D391',
    description: 'Sentirse perdido no es el final; muchas veces significa que creciste y tus viejos mapas ya no sirven.',
    immediate: [
      'Escribí 10 respuestas a: "¿Qué me importa de verdad?"',
      'Elegí una sola acción de hoy que te acerque a sentido',
      'Hablá con alguien que admires o que te inspire',
      'Caminá 30 minutos sin distracciones para ordenar la cabeza',
    ],
    shortTerm: [
      'Volvé a lo básico: sueño, comida y movimiento',
      'Hacé algo concreto por otra persona',
      'Probá algo nuevo esta semana para abrir perspectiva',
      'No busques el plan perfecto: buscá el próximo paso',
    ],
    mindset: 'El sentido no se encuentra esperando: se construye eligiendo. Cada acción alineada con valores trae más claridad.',
    stoic: '"No importa cuán despacio vayas, siempre que no te detengas." — Confucio.',
  },
  {
    id: 'presion',
    emotion: 'Bajo presión',
    emoji: '💎',
    color: '#FB923C',
    description: 'La presión no te rompe: te define. Lo que sentís ahora puede convertirse en foco y ejecución.',
    immediate: [
      'Priorizá: ¿cuál es la única cosa crítica a resolver ahora?',
      'Dividí el problema en bloques de 30 minutos',
      'Respirá profundo 5 veces antes de cada bloque',
      'Quitá de hoy todo lo que no sea esencial',
    ],
    shortTerm: [
      'Diseñá una secuencia simple: prioridad A, luego B, luego C',
      'Limitá distracciones y protegé ventanas de foco',
      'Revisá carga de trabajo y delegá o recortá donde sea posible',
      'Medí avance por bloques cerrados, no por ansiedad percibida',
    ],
    mindset: 'La presión es energía concentrada. Si la ordenás, juega a tu favor. Si la evitás, te domina.',
    stoic: '"La adversidad revela el carácter." Enfocate en lo que controlás y ejecutá con calma.',
  },
];
