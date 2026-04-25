import { DayDefinition, TaskDefinition } from '../types';

// ─── FRASES MOTIVACIONALES (una por día) ──────────────────────────────────────
const QUOTES = [
  // Semana 1
  "Arise. No mañana. Hoy.",
  "El primer día es el más importante. Estás aquí.",
  "Consistencia > intensidad. Sigue.",
  "No necesitás motivación. Necesitás disciplina.",
  "Cada repetición es un voto por la persona que querés ser.",
  "Difícil hoy. Fácil después.",
  "Semana 1 completada. Apenas empieza.",
  // Semana 2
  "El cuerpo se queja. La mente decide.",
  "Tu versión futura te lo agradecerá.",
  "No bajés el ritmo. El momentum se construye.",
  "Dolor temporal. Orgullo permanente.",
  "Nadie te va a ver entrenar. Solo vos sabés.",
  "Dos semanas. ¿Ves el cambio? Viene.",
  "Los días fáciles son trampa. Empujá más.",
  // Semana 3
  "3 semanas. Ya no sos el mismo de antes.",
  "El hábito se está formando. No rompas la cadena.",
  "Hacer lo que no querés hacer es el punto.",
  "Cuando el cuerpo dice pará, la mente dice continúa.",
  "Progreso invisible → visible. Dale tiempo.",
  "Sin excusas. Sin negociaciones.",
  "Mitad del mes completada. Imparable.",
  // Semana 4
  "Un mes. ¿Cuántos lo intentaron y fallaron? Vos no.",
  "El trabajo duro no miente.",
  "Cada día que cumplís, te ganás el derecho al descanso.",
  "No hay atajos. Hay compromiso.",
  "Tu racha es tu identidad. Protegela.",
  "Semana 4. La disciplina ya es parte de vos.",
  "El que dura, gana.",
  // Semana 5
  "30 días. La mayoría se rinde aquí. Vos no.",
  "Subí el nivel. Ya no sos principiante.",
  "El cuerpo se adapta. La mente también.",
  "Nuevo nivel de exigencia. Lo aceptás.",
  "Esto ya no es un challenge. Es tu vida.",
  "La incomodidad es la puerta al crecimiento.",
  "Semana 5 completada. El cambio es real.",
  // Semana 6
  "6 semanas de trabajo real. Nadie te lo puede quitar.",
  "Lo que hiciste esta semana ya existirá para siempre.",
  "La disciplina es un regalo que te das a vos mismo.",
  "No pares cuando estés cansado. Pará cuando terminés.",
  "Dos meses se ven desde acá.",
  "Cada tarea es una decisión. Elegís a quién ser.",
  "Mitad del camino. La segunda mitad es la más importante.",
  // Semana 7
  "Día 43. Más de la mitad. Acelerá.",
  "La fatiga es mental antes que física.",
  "Las excusas son el idioma de los que no logran nada.",
  "Hoy hacés el trabajo. El resultado llega solo.",
  "No te compares con otros. Solo con quien eras ayer.",
  "Intensificamos. Estás listo.",
  "Semana 7. El final ya es visible.",
  // Semana 8
  "8 semanas de fuego. Sos otro.",
  "La versión final de vos se construye ahora.",
  "Dos meses. Muchos sueñan, pocos hacen.",
  "El cuerpo recuerda todo lo que hiciste. No lo traigas.",
  "Cada rep, cada página, cada minuto suma.",
  "Semana 8 completada. El momentum es imparable.",
  "Quedan 4 semanas. Se acerca el final.",
  // Semana 9
  "Último mes. Máxima intensidad.",
  "Ya cruzaste el punto de no retorno.",
  "90 días cambia la química de tu cerebro. Ya está pasando.",
  "Quedan 28 días. No aflojés ahora.",
  "Cada día restante vale doble.",
  "La gente ve el resultado. Vos sabés el precio.",
  "Semana 9. Elite.",
  // Semana 10
  "20 días. Podés ver el finish line.",
  "El trabajo final es el más importante.",
  "Cuando dudés, recordá por qué empezaste.",
  "No hay descanso hasta el día 90.",
  "El hábito ya está instalado. Ahora lo dominás.",
  "Quedan 15 días. Terminá fuerte.",
  "Semana 10 completada. Increíble.",
  // Semana 11
  "10 días. Una semana y media. No te detenés.",
  "El final define el camino.",
  "Cada día que queda es un regalo. Usalo.",
  "Ya no sos quien empezó. Sos quien lo está terminando.",
  "Quedan 7 días. Una semana más.",
  "El último push siempre es el más duro y el más importante.",
  "Última semana. Todo lo que tenés.",
  // Semana 13 (días 85-90)
  "6 días. Naciste para terminar esto.",
  "5 días. La racha no se rompe ahora.",
  "4 días. Estás en el podio.",
  "3 días. Absolutamente imparable.",
  "2 días. Mañana lo terminás.",
  "Día 90. LO LOGRASTE. Arise.",
];

// ─── GENERADOR DE TAREAS POR DÍA ──────────────────────────────────────────────

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

function buildDay(dayNum: number): DayDefinition {
  const d = dayNum;

  // Progresión de entrenamiento (cardio + fuerza) — 25 min → 90 min
  const trainMin = clamp(Math.round(20 + (d - 1) * 0.82), 20, 95);

  // Lectura — 10 páginas → 40 páginas
  const readPages = clamp(Math.round(10 + (d - 1) * 0.34), 10, 40);

  // Meditación — 5 min → 20 min
  const meditMin = clamp(Math.round(5 + (d - 1) * 0.17), 5, 20);

  // Agua — constante 2.5L siempre
  const waterL = d <= 30 ? 2 : d <= 60 ? 2.5 : 3;

  // Trabajo profundo — 45 min → 180 min
  const workMin = clamp(Math.round(45 + (d - 1) * 1.5), 45, 180);

  // Desde día 20: visualización (5 → 15 min)
  const visMin = d >= 20 ? clamp(Math.round(5 + (d - 20) * 0.14), 5, 15) : 0;

  // Desde día 40: ducha fría (1 → 5 min)
  const coldMin = d >= 40 ? clamp(Math.round(1 + (d - 40) * 0.08), 1, 5) : 0;

  // Descripción de entrenamiento según el día
  function trainDescription(): string {
    if (d <= 10) return `${trainMin} min de entrenamiento base: cardio ligero (caminata rápida o trote suave) + ejercicios de fuerza con peso corporal. Calentá 5 min antes.`;
    if (d <= 20) return `${trainMin} min: 20 min cardio (trote o bicicleta) + ${trainMin - 20} min de fuerza (sentadillas, flexiones, peso). Intensidad moderada.`;
    if (d <= 35) return `${trainMin} min: HIIT 15 min (tabata o circuito) + ${trainMin - 15} min pesas o funcional. Sin descansos mayores a 60 seg.`;
    if (d <= 50) return `${trainMin} min: Sesión completa de fuerza (compuestos: sentadillas, press, peso muerto) + 20 min cardio al final. No negociable.`;
    if (d <= 65) return `${trainMin} min: Entrenamiento de alta intensidad. 30 min cardio (correr o HIIT) + ${trainMin - 30} min pesas compuestas con carga real.`;
    if (d <= 80) return `${trainMin} min: Sesión de elite. Splits de fuerza + 25 min HIIT. Peso máximo que puedas manejar con buena forma.`;
    return `${trainMin} min: Modo bestia. Circuito completo cardio + fuerza sin pausas largas. Todo lo que tenés.`;
  }

  function workDescription(): string {
    if (d <= 20) return `${workMin} min de trabajo profundo sin interrupciones. Celular en modo avión. Una sola tarea importante.`;
    if (d <= 45) return `${workMin} min de Deep Work. Mínimo 2 bloques de 45 min con 10 min de descanso. Sin redes sociales.`;
    if (d <= 70) return `${workMin} min de trabajo de máximo impacto. Bloques pomodoro extendidos. Tu tarea más difícil primero.`;
    return `${workMin} min de trabajo de elite. Foco absoluto en tu objetivo principal. Sin compromisos.`;
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
      id: `d${d}-meditacion`,
      name: 'Meditación',
      category: 'bienestar',
      description: `${meditMin} min de meditación. Silencio total, atención en la respiración. Si pensás, volvé al aliento.`,
      target: meditMin,
      unit: 'minutos',
    },
    {
      id: `d${d}-agua`,
      name: 'Hidratación',
      category: 'bienestar',
      description: `Tomá ${waterL}L de agua durante el día. El cuerpo funciona al máximo hidratado.`,
      target: waterL,
      unit: 'litros',
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

  // Visualización desde día 20
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

  // Ducha fría desde día 40
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
  };
}

// Generar los 90 días
export const PROGRAM: DayDefinition[] = Array.from({ length: 90 }, (_, i) =>
  buildDay(i + 1)
);

// Misión de penalización (aparece cuando el usuario falla un día)
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
    id: 'penalty-meditacion',
    name: 'Penitencia: Meditación extendida',
    category: 'bienestar',
    description: '20 min de meditación. Reflexioná sobre por qué fallaste y qué cambiarás.',
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
