import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  SafeAreaView, Modal, Alert, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { COLORS, FONT, METAL, RADIUS, SEMANTIC, SPACING, SURFACES, TOUCH } from '@/theme';
import { getStageTheme, StageTheme } from '@/lib/progression';
import StaggerIn from '@components/ui/StaggerIn';
import HeroZone from '@components/ui/HeroZone';
import DiscoveryToolCard from '@components/discovery/DiscoveryToolCard';
import DiscoveryToolHeroModal from '@components/discovery/DiscoveryToolHeroModal';
import DiscoverySkeleton from '@components/discovery/DiscoverySkeleton';
import { DISCOVERY_TOOLS, DiscoveryTool } from '@/data/discoveryTools';
import { useTabScreenMotion } from '@/hooks/useTabScreenMotion';

const DISCOVERY_HERO = {
  trustBadge: 'Ciencia y alto rendimiento',
  headline: { line1: 'Claridad', line2: 'mental' },
  subtitle:
    'Herramientas para enfoque, hábitos y control del día.',
} as const;

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = 1 | 2 | 3;

interface Exercise {
  id: string;
  name: string;
  emoji: string;
  category: string;
  difficulty: 1 | 2 | 3;
  duration: string;
  muscles: string[];
  description: string;
  protocol: string[];
  phase: Phase;
  color: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  emoji: string;
  pages: number;
  rating: number;
  category: string;
  review: string;
  whyRead: string;
  keyIdeas: string[];
  phase: Phase;
  color: string;
}

interface MindsetItem {
  id: string;
  title: string;
  emoji: string;
  type: 'disciplina' | 'motivacion' | 'productividad';
  description: string;
  howTo: string[];
  phase: Phase;
  color: string;
}

// ─── Content ──────────────────────────────────────────────────────────────────

const EXERCISES: Exercise[] = [
  // FASE 1
  {
    id: 'e1', name: 'HIIT Básico', emoji: '💪', category: 'Cardio',
    difficulty: 1, duration: '20-30 min', muscles: ['Cuerpo completo', 'Core'],
    description: 'El mejor punto de partida para construir capacidad cardiovascular y quemar grasa sin necesitar equipamiento.',
    protocol: [
      '5 min calentamiento: trote suave en el lugar',
      '20 seg trabajo / 10 seg descanso × 8 rondas',
      'Ejercicios: burpees, mountain climbers, saltos, sentadillas',
      '2 min descanso entre bloques',
      '3 bloques totales',
      '5 min elongación al final',
    ],
    phase: 1, color: '#FF6B6B',
  },
  {
    id: 'e2', name: 'Calistenia Básica', emoji: '💪', category: 'Fuerza',
    difficulty: 1, duration: '25-35 min', muscles: ['Pecho', 'Espalda', 'Brazos', 'Core'],
    description: 'Dominar el peso corporal es la base de toda fuerza. No necesitás gimnasio para empezar a construir músculo real.',
    protocol: [
      '3 series × 10 flexiones (modificadas si es necesario)',
      '3 series × 15 sentadillas con peso corporal',
      '3 series × 10 fondos en silla',
      '3 series × 30 seg plancha',
      '3 series × 10 elevaciones de cadera',
      'Descanso 60 seg entre series',
    ],
    phase: 1, color: '#4FC3F7',
  },
  {
    id: 'e3', name: 'Caminata de Poder', emoji: '🚶', category: 'Cardio',
    difficulty: 1, duration: '30-45 min', muscles: ['Piernas', 'Glúteos', 'Core'],
    description: 'Subestimada pero poderosa. Una caminata rápida diaria mejora el estado de ánimo, la creatividad y la salud cardiovascular.',
    protocol: [
      'Caminá a un ritmo que te permita hablar pero te cueste',
      'Mantené la espalda recta, brazos activos',
      'Usá el tiempo para escuchar podcasts o audiolibros',
      'Aumentá 5 min por semana hasta llegar a 45 min',
      'Si podés, elegí terreno con desnivel',
    ],
    phase: 1, color: '#68D391',
  },
  // FASE 2
  {
    id: 'e4', name: 'Sentadilla con Barra', emoji: '🏋️', category: 'Fuerza',
    difficulty: 2, duration: '40-50 min', muscles: ['Cuádriceps', 'Glúteos', 'Isquiotibiales', 'Core'],
    description: 'El rey de los ejercicios compuestos. Construye más músculo y hormona de crecimiento que cualquier otro movimiento.',
    protocol: [
      '10 min calentamiento: sentadillas sin peso + movilidad cadera',
      'Series de calentamiento progresivas: barra sola × 10, 40% × 8, 60% × 5',
      '4 series de trabajo × 5 repeticiones al 75-80% de tu máximo',
      'Descanso 3 min entre series de trabajo',
      'Enfocate en: espalda neutral, rodillas hacia afuera, profundidad paralela',
      'Terminá con 2 series de pause squat (1 seg abajo)',
    ],
    phase: 2, color: '#FF6B6B',
  },
  {
    id: 'e5', name: 'HIIT Intermedio', emoji: '⚡', category: 'Cardio',
    difficulty: 2, duration: '35-45 min', muscles: ['Cuerpo completo'],
    description: 'En la Fase 2 el cardio sube de nivel. Ciclos más largos, ejercicios más complejos, menor descanso.',
    protocol: [
      '5 min calentamiento dinámico',
      '40 seg trabajo / 20 seg descanso × 10 rondas',
      'Ejercicios: burpees con salto, thrusters, sprints en el lugar, box jumps',
      '90 seg descanso entre bloques',
      '4 bloques totales',
      'Monitorear frecuencia cardíaca: mantenerse en 80-90% del máximo',
    ],
    phase: 2, color: '#F6E05E',
  },
  {
    id: 'e6', name: 'Peso Muerto', emoji: '🔩', category: 'Fuerza',
    difficulty: 2, duration: '40 min', muscles: ['Isquiotibiales', 'Glúteos', 'Espalda baja', 'Trapecio'],
    description: 'El ejercicio que más músculo activa en todo el cuerpo. Dominar el peso muerto es dominar la fuerza funcional real.',
    protocol: [
      'Calentamiento: buenos días, hip hinge sin peso × 15',
      'Series progresivas hasta peso de trabajo',
      '4 series × 4 repeticiones al 80% del máximo',
      'Foco en: empujar el piso, no tirar la barra; espalda neutral todo el recorrido',
      'Pausa de 1 seg en el piso entre repeticiones (no rebotar)',
      'Terminá con 1 serie × 8 al 60% para sentir el patrón',
    ],
    phase: 2, color: '#D4AF37',
  },
  // FASE 3
  {
    id: 'e7', name: 'Sprint Intervals', emoji: '🏃', category: 'Cardio Elite',
    difficulty: 3, duration: '30 min', muscles: ['Piernas', 'Glúteos', 'Core', 'Sistema cardiovascular'],
    description: 'Los sprints son el cardio de élite. 20 minutos de sprints reales producen más adaptación que 1 hora de trote.',
    protocol: [
      '10 min calentamiento: trote progresivo + aceleraciones',
      '10 seg sprint máximo / 50 seg caminata × 10 rondas',
      'Semana 1-2: 6 rondas; aumentá 1 por semana',
      'En cada sprint: velocidad máxima absoluta, sin reserva',
      '5 min trote suave al final',
      '10 min elongación de piernas y caderas',
    ],
    phase: 3, color: '#FF6B6B',
  },
  {
    id: 'e8', name: 'Press de Banca & Dominadas', emoji: '💎', category: 'Fuerza Elite',
    difficulty: 3, duration: '50-60 min', muscles: ['Pecho', 'Hombros', 'Tríceps', 'Espalda', 'Bíceps'],
    description: 'Empuje + tirón en la misma sesión. La combinación perfecta para un tren superior equilibrado y potente.',
    protocol: [
      'Press banca: 5 series × 3 reps al 85% + 1 serie AMRAP al 70%',
      'Dominadas lastradas: 4 series × 5 reps (o con banda si es necesario)',
      'Superserie finalizadora: 3 × (10 flexiones explosivas + 10 remo con mancuernas)',
      'Descanso 2-3 min entre series pesadas',
      'Tempo: 3 seg bajada, explosivo en subida',
    ],
    phase: 3, color: '#4FC3F7',
  },
  {
    id: 'e9', name: 'Protocolo Wim Hof Completo', emoji: '❄️', category: 'Respiración Elite',
    difficulty: 3, duration: '30 min', muscles: ['Sistema nervioso', 'Sistema inmune'],
    description: 'El protocolo completo: respiración + retención + exposición al frío. Cambia tu sistema nervioso a nivel profundo.',
    protocol: [
      'Ronda 1: 30 respiraciones profundas → retención 1 min → recuperación 15 seg',
      'Ronda 2: 30 respiraciones → retención 1:30 min → recuperación',
      'Ronda 3: 30 respiraciones → retención 2 min → recuperación',
      'Flexiones durante la retención (máximo que puedas)',
      'Ducha fría inmediata: 3-5 min agua fría sin preparación mental',
      'No lo hagas en agua, manejando ni de pie sin apoyo',
    ],
    phase: 3, color: '#4895EF',
  },
];

const BOOKS: Book[] = [
  // FASE 1
  {
    id: 'b1', title: 'Hábitos Atómicos', author: 'James Clear', emoji: '⚛️',
    pages: 320, rating: 5, category: 'Hábitos',
    review: 'El mejor libro sobre construcción de hábitos jamás escrito. Clear explica con precisión científica por qué los pequeños cambios del 1% generan resultados extraordinarios con el tiempo.',
    whyRead: 'Es el manual de instrucciones para convertirte en la persona que querés ser. Cambia cómo pensás sobre el progreso y la identidad.',
    keyIdeas: [
      'El 1% mejor cada día = 37x mejor en un año',
      'Los hábitos se construyen sobre identidad, no sobre metas',
      'El entorno diseña el comportamiento automático',
      'Hacer el bien hábito obvio, atractivo, fácil y satisfactorio',
    ],
    phase: 1, color: '#FF6B6B',
  },
  {
    id: 'b2', title: 'El Poder del Ahora', author: 'Eckhart Tolle', emoji: '🌅',
    pages: 236, rating: 4, category: 'Mentalidad',
    review: 'Difícil de leer, imposible de ignorar. Tolle te enseña que el sufrimiento viene de vivir en el pasado o el futuro, no en el presente.',
    whyRead: 'Te da herramientas para silenciar la mente que te sabotea. Esencial en la Fase 1 cuando la resistencia mental es máxima.',
    keyIdeas: [
      'El ego vive en el tiempo. El ser vive en el ahora',
      'El dolor no es necesario para el crecimiento',
      'La presencia es la práctica espiritual más poderosa',
      'No sos tus pensamientos — podés observarlos',
    ],
    phase: 1, color: '#F6E05E',
  },
  {
    id: 'b3', title: 'Los 7 Hábitos de la Gente Altamente Efectiva', author: 'Stephen Covey', emoji: '7️⃣',
    pages: 432, rating: 4, category: 'Productividad',
    review: 'Un clásico por razones obvias. Covey construye un sistema de efectividad personal basado en principios, no en técnicas.',
    whyRead: 'La base de la productividad real. Antes de optimizar, hay que entender qué vale la pena optimizar.',
    keyIdeas: [
      'Sé proactivo: respondé, no reaccionés',
      'Empezá con el fin en mente',
      'Primero lo primero: urgente ≠ importante',
      'Ganar/ganar o no hay trato',
    ],
    phase: 1, color: '#68D391',
  },
  // FASE 2
  {
    id: 'b4', title: 'No te rindas', author: 'David Goggins', emoji: '',
    pages: 364, rating: 5, category: 'Disciplina',
    review: 'El libro más brutal y honesto sobre la mente humana. Goggins pasó de ser un hombre obeso a convertirse en Navy SEAL, ultramaratonista y dueño del récord mundial de dominadas.',
    whyRead: 'Te muestra que el 99% de tus límites son mentales. Perfecto para la Fase 2 cuando querés bajar el ritmo.',
    keyIdeas: [
      'La "cookie jar": recordá todos tus logros pasados cuando flaquees',
      'El 40% de la mente: cuando creés que no podés, recién vas por el 40%',
      'El accountability mirror: sé brutal y honesto contigo mismo',
      'Abraza el sufrimiento — ahí es donde crecés',
    ],
    phase: 2, color: '#FF6B6B',
  },
  {
    id: 'b5', title: 'Trabajo Profundo', author: 'Cal Newport', emoji: '🎯',
    pages: 296, rating: 5, category: 'Productividad',
    review: 'Newport argumenta que la capacidad de concentrarse profundamente sin distracción es la habilidad más valiosa del siglo XXI — y la más rara.',
    whyRead: 'Transforma cómo trabajás. En la Fase 2 tu Deep Work ya es serio — este libro lo lleva al siguiente nivel.',
    keyIdeas: [
      'El trabajo profundo produce resultados en menos tiempo',
      'Las redes sociales entrenan la incapacidad de concentrarse',
      'Programá el Deep Work como si fuera una reunión obligatoria',
      'El aburrimiento es necesario — no lo evites con el celular',
    ],
    phase: 2, color: '#4895EF',
  },
  {
    id: 'b6', title: 'El Obstáculo es el Camino', author: 'Ryan Holiday', emoji: '🪨',
    pages: 224, rating: 5, category: 'Estoicismo',
    review: 'Holiday hace accesible la filosofía estoica aplicada a los problemas modernos. Cada obstáculo que enfrentás es la oportunidad que necesitabas.',
    whyRead: 'Cambia tu relación con la adversidad. Cuando algo sale mal en el programa, este libro te da el marco para convertirlo en combustible.',
    keyIdeas: [
      'La percepción define el obstáculo',
      'La acción directa y persistente supera todo',
      'La voluntad acepta lo que no puede controlar',
      'Amor fati: amá tu destino, incluyendo los problemas',
    ],
    phase: 2, color: '#D4AF37',
  },
  // FASE 3
  {
    id: 'b7', title: 'Meditaciones', author: 'Marco Aurelio', emoji: '📜',
    pages: 256, rating: 5, category: 'Filosofía / Disciplina',
    review: 'El diario personal del hombre más poderoso de Roma. Escrito solo para él mismo, nunca para ser publicado. La guía definitiva de autocontrol, virtud y estoicismo aplicado.',
    whyRead: 'En la Fase 3 ya no necesitás motivación — necesitás filosofía. Marco Aurelio vivió cada principio que escribió. Eso vale más que cualquier guru moderno.',
    keyIdeas: [
      'Nada externo puede hacerte daño sin tu permiso',
      'Hacé lo que la naturaleza de las cosas requiere',
      'La muerte es natural — vivir plenamente lo es aún más',
      'Tratá cada día como si fuera el primero y el último',
    ],
    phase: 3, color: '#F6E05E',
  },
  {
    id: 'b8', title: 'El Hombre en Busca de Sentido', author: 'Viktor Frankl', emoji: '🕯️',
    pages: 192, rating: 5, category: 'Psicología / Filosofía',
    review: 'Sobreviviente del Holocausto, Frankl describe cómo los prisioneros con un "porqué" para vivir sobrevivían cuando otros no podían. El libro más poderoso sobre el significado humano.',
    whyRead: 'En la Fase 3 te preguntás para qué. Este libro te da la respuesta más profunda que existe: el sufrimiento con sentido se convierte en fortaleza.',
    keyIdeas: [
      'Al hombre se le puede quitar todo menos su actitud ante las circunstancias',
      'El sufrimiento sin sentido destruye; el sufrimiento con propósito construye',
      'La Logoterapia: encontrá tu porqué y el cómo se resuelve solo',
      'El éxito no se persigue — se produce como efecto de dedicarte a algo mayor',
    ],
    phase: 3, color: '#4FC3F7',
  },
  {
    id: 'b9', title: '12 Reglas para Vivir', author: 'Jordan Peterson', emoji: '🦞',
    pages: 448, rating: 4, category: 'Psicología / Filosofía',
    review: 'Peterson mezcla psicología clínica, mitología y filosofía para construir un sistema de vida basado en responsabilidad y significado. Desafiante e incómodo en el mejor sentido.',
    whyRead: 'Para la Fase 3 necesitás pensar en qué viene después de los 90 días. Peterson te da el framework para construir una vida con propósito, no solo una rutina.',
    keyIdeas: [
      'Ponete de pie derecho y asumí tu lugar en el mundo',
      'Tratate a vos mismo como si fueras alguien a quien sos responsable',
      'Hacé amistad con gente que quiera lo mejor para vos',
      'Comparate con quien eras ayer, no con quien otro es hoy',
    ],
    phase: 3, color: '#FF6B6B',
  },
];

const MINDSET_ITEMS: MindsetItem[] = [
  // FASE 1 — más motivación
  {
    id: 'm1', title: 'No Zero Days', emoji: '🔗', type: 'motivacion',
    description: 'La regla más simple y poderosa para construir momentum: nunca tener un día donde no hiciste absolutamente nada hacia tu objetivo. Aunque sea 1 rep, 1 página, 1 minuto.',
    howTo: [
      'Definí qué cuenta como "no cero" para cada área',
      'En los días malos: 1 flexión, 1 página, 1 minuto de meditación = éxito',
      'El objetivo no es la perfección — es no romper la cadena',
      'Celebrá los días difíciles donde igual hiciste algo pequeño',
    ],
    phase: 1, color: '#68D391',
  },
  {
    id: 'm2', title: '1% Mejor Cada Día', emoji: '📈', type: 'motivacion',
    description: 'El 1% mejor cada día durante un año equivale a ser 37 veces mejor. El problema es que esperamos resultados en semanas lo que lleva años.',
    howTo: [
      'Enfocate en el proceso, no en el resultado',
      'Medí el input (horas entrenadas, páginas leídas) no el output (peso, músculo)',
      'Cada día preguntate: ¿qué fue un poco mejor que ayer?',
      'Llevá un registro — lo que se mide, mejora',
    ],
    phase: 1, color: '#4895EF',
  },
  {
    id: 'm3', title: 'Identidad antes que Metas', emoji: '🪞', type: 'motivacion',
    description: 'No digas "quiero correr una maratón". Di "soy un corredor". Los hábitos fluyen naturalmente de la identidad que adoptás. Las metas son el resultado — la identidad es el motor.',
    howTo: [
      'Escribí quién sos (no quién querés ser): "Soy alguien que..."',
      'Cada acción es un voto por esa identidad',
      'Cuando flaquees, volvé a la identidad: ¿qué haría la persona que soy?',
      'Revisá tu identidad escrita cada semana',
    ],
    phase: 1, color: '#D4AF37',
  },
  // FASE 2 — mixto
  {
    id: 'm4', title: 'Time Blocking', emoji: '🗓️', type: 'productividad',
    description: 'El calendario no es solo para reuniones. Es para bloquear tiempo para lo que importa: entrenamiento, lectura, trabajo profundo. Si no está en el calendario, no existe.',
    howTo: [
      'Bloqueá el entrenamiento como si fuera una reunión de trabajo importante',
      'Usá colores por categoría: rojo = cuerpo, azul = trabajo, verde = descanso',
      'Bloqueá también el tiempo de transición (prep, ducha)',
      'Revisá el calendario la noche anterior y ajustá si es necesario',
    ],
    phase: 2, color: '#F6E05E',
  },
  {
    id: 'm5', title: 'La Regla de No Negociar', emoji: '🚫', type: 'disciplina',
    description: 'Los compromisos con vos mismo no se negocian. Cuando empezás a pensar "quizás hoy no entreno", la mente ya ganó. La disciplina es no abrir esa puerta.',
    howTo: [
      'Decidí la noche anterior — no por la mañana cuando estás débil',
      'Tus tareas son no-negociables como ir al trabajo',
      'Eliminá la opción de "quizás": es sí o sí',
      'Cuando la mente proponga una excusa, reconocela sin actuar sobre ella',
    ],
    phase: 2, color: '#FF6B6B',
  },
  {
    id: 'm6', title: 'El Método Pomodoro Extendido', emoji: '🍅', type: 'productividad',
    description: 'El Pomodoro clásico (25/5 min) es solo el comienzo. En la Fase 2 construís la capacidad de concentración hasta 90 minutos sostenidos.',
    howTo: [
      'Semana 1-2: 25 min trabajo / 5 min descanso × 4',
      'Semana 3-4: 45 min trabajo / 10 min descanso × 3',
      'Fase 2: 90 min trabajo / 20 min descanso × 2',
      'Celular en otra habitación durante el bloque',
      'Solo 1 tarea por bloque — multitasking es un mito',
    ],
    phase: 2, color: '#4895EF',
  },
  // FASE 3 — pura disciplina
  {
    id: 'm7', title: 'Amor Fati', emoji: '💎', type: 'disciplina',
    description: 'El concepto estoico más poderoso: no solo aceptar lo que te pasa, sino amarlo. El dolor de hoy es el carácter de mañana. La adversidad no te pasa a vos — te pasa para vos.',
    howTo: [
      'Cuando algo sale mal, preguntate: ¿cómo esto me sirve?',
      'Reencuadrá cada obstáculo como entrenamiento específico para tu objetivo',
      'Escribe las adversidades del mes y qué te enseñaron',
      'Practica la incomodidad voluntaria (ducha fría, ayuno, silencio)',
    ],
    phase: 3, color: '#D4AF37',
  },
  {
    id: 'm8', title: 'Visualización de Contraste', emoji: '🧠', type: 'disciplina',
    description: 'Visualizá claramente tu objetivo futuro, luego visualizá con igual claridad los obstáculos internos que te frenan. El contraste genera tensión que impulsa la acción.',
    howTo: [
      'Paso 1: Visualizá en detalle el resultado que querés (2 min)',
      'Paso 2: Visualizá el principal obstáculo interno (2 min)',
      'Paso 3: Escribí el plan específico "Si X ocurre, yo haré Y"',
      'Repetí cada mañana — 5 min de WOOP: Wish, Outcome, Obstacle, Plan',
    ],
    phase: 3, color: '#4895EF',
  },
  {
    id: 'm9', title: 'Revisión Semanal de Elite', emoji: '', type: 'disciplina',
    description: 'Los mejores del mundo no improvizan — revisan sistemáticamente. Una hora semanal de revisión vale más que 20 horas de ejecución sin dirección.',
    howTo: [
      'Todos los domingos: 60 min sin celular ni interrupciones',
      '¿Qué funcionó esta semana? ¿Por qué? Hacer más de eso.',
      '¿Qué no funcionó? ¿La causa raíz? Eliminar o cambiar.',
      '¿Estoy en línea con mis objetivos del mes?',
      'Planificar los 3 movimientos más importantes de la semana siguiente',
      'Medir: días completados, racha, XP, progreso físico',
    ],
    phase: 3, color: '#FF6B6B',
  },
];

// ─── Recomendado para vos ─────────────────────────────────────────────────────
interface Recommendation {
  label: string;
  emoji: string;
  color: string;
  item: Exercise | Book | MindsetItem;
}

const TRACK_LABELS: Record<string, string> = {
  fat_loss: 'Pérdida de grasa',
  muscle_gain: 'Ganancia muscular',
  recomposition: 'Recomposición corporal',
  maintenance: 'Mantenimiento',
};

const TRACK_TIPS: Record<string, string> = {
  fat_loss: 'Tu enfoque ahora: cardio de alta intensidad + déficit calórico moderado. El HIIT quema más grasa en menos tiempo que el cardio estático.',
  muscle_gain: 'Tu enfoque ahora: sobrecarga progresiva + superávit calórico. Sin suficiente proteína y calorías, el músculo no aparece.',
  recomposition: 'Tu enfoque ahora: combinar fuerza + cardio con calorías de mantenimiento. El proceso es más lento pero los resultados son permanentes.',
  maintenance: 'Tu enfoque ahora: sostener lo construido con variedad. Explorá nuevas modalidades para evitar el estancamiento.',
};

function getRecommendations(track: string, phase: Phase): Recommendation[] {
  const recs: Record<string, Recommendation[]> = {
    fat_loss: [
      { label: 'Ejercicio', emoji: '💪', color: '#F87171', item: EXERCISES.find(e => e.id === (phase >= 2 ? 'e5' : 'e1'))! },
      { label: 'Mentalidad', emoji: '🔗', color: '#68D391', item: MINDSET_ITEMS.find(m => m.id === 'm1')! },
      { label: 'Libro', emoji: '⚛️', color: '#F6E05E', item: BOOKS.find(b => b.id === 'b1')! },
    ],
    muscle_gain: [
      { label: 'Ejercicio', emoji: '💪', color: '#4FC3F7', item: EXERCISES.find(e => e.id === (phase >= 2 ? 'e4' : 'e2'))! },
      { label: 'Mentalidad', emoji: '📈', color: '#4895EF', item: MINDSET_ITEMS.find(m => m.id === 'm2')! },
      { label: 'Libro', emoji: '💀', color: '#FF6B6B', item: BOOKS.find(b => b.id === (phase >= 2 ? 'b4' : 'b3'))! },
    ],
    recomposition: [
      { label: 'Ejercicio', emoji: '🔩', color: '#D4AF37', item: EXERCISES.find(e => e.id === (phase >= 2 ? 'e6' : 'e2'))! },
      { label: 'Mentalidad', emoji: '🚫', color: '#FF6B6B', item: MINDSET_ITEMS.find(m => m.id === (phase >= 2 ? 'm5' : 'm2'))! },
      { label: 'Libro', emoji: '🎯', color: '#4895EF', item: BOOKS.find(b => b.id === (phase >= 2 ? 'b5' : 'b1'))! },
    ],
    maintenance: [
      { label: 'Ejercicio', emoji: '🏃', color: '#FF6B6B', item: EXERCISES.find(e => e.id === (phase >= 3 ? 'e7' : phase >= 2 ? 'e5' : 'e3'))! },
      { label: 'Mentalidad', emoji: '✨', color: '#D4AF37', item: MINDSET_ITEMS.find(m => m.id === (phase >= 3 ? 'm7' : 'm3'))! },
      { label: 'Libro', emoji: '🪨', color: '#D4AF37', item: BOOKS.find(b => b.id === (phase >= 2 ? 'b6' : 'b2'))! },
    ],
  };
  return (recs[track] ?? recs['maintenance']).filter(r => r.item != null);
}

function RecomendadoSection({
  track,
  phase,
  stageTheme,
  onPress,
}: {
  track: string;
  phase: Phase;
  stageTheme: StageTheme;
  onPress: (item: Exercise | Book | MindsetItem) => void;
}) {
  const recs = getRecommendations(track, phase);
  const tip = TRACK_TIPS[track] ?? TRACK_TIPS['maintenance'];
  const trackLabel = TRACK_LABELS[track] ?? track;

  return (
    <View style={recStyles.container}>
      <View style={recStyles.header}>
        <Text style={recStyles.title}>Recomendado para vos</Text>
        <View style={recStyles.trackBadge}>
          <Text style={recStyles.trackLabel}>{trackLabel}</Text>
        </View>
      </View>

      <View style={recStyles.cards}>
        {recs.map((rec, i) => (
          <Pressable key={i} style={[recStyles.card, { borderColor: rec.color + '40' }]} onPress={() => onPress(rec.item)}>
            <View style={[recStyles.cardIcon, { backgroundColor: rec.color + '20' }]}>
              <Text style={{ fontSize: 20 }}>{rec.emoji}</Text>
            </View>
            <Text style={[recStyles.cardType, { color: rec.color }]}>{rec.label}</Text>
            <Text style={recStyles.cardName} numberOfLines={2}>
              {'title' in rec.item ? (rec.item as Book).title : 'name' in rec.item ? (rec.item as Exercise).name : (rec.item as MindsetItem).title}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={recStyles.tip}>
        <Text style={recStyles.tipIcon}>💡</Text>
        <Text style={recStyles.tipText}>{tip}</Text>
      </View>
    </View>
  );
}

const recStyles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  title: { fontSize: FONT.sm, fontWeight: '800', color: COLORS.textPrimary },
  trackBadge: { backgroundColor: COLORS.accent + '20', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.accent + '40' },
  trackLabel: { fontSize: 9, fontWeight: '700', color: COLORS.accent, letterSpacing: 0.5 },
  cards: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  card: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', borderWidth: 1, gap: 4 },
  cardIcon: { width: 40, height: 40, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  cardType: { fontSize: 8, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  cardName: { fontSize: FONT.xs, color: COLORS.textPrimary, fontWeight: '600', textAlign: 'center', lineHeight: 16 },
  tip: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: RADIUS.md, padding: SPACING.sm },
  tipIcon: { fontSize: 14 },
  tipText: { flex: 1, fontSize: FONT.xs, color: COLORS.textSecondary, lineHeight: 18 },
});

// ─── Phase helper ─────────────────────────────────────────────────────────────
function getPhase(day: number): Phase {
  if (day <= 30) return 1;
  if (day <= 60) return 2;
  return 3;
}

const PHASE_INFO = {
  1: { label: 'Fundación', subtitle: 'Días 1-30', color: COLORS.success, gradient: [COLORS.success + '30', 'transparent'] as string[] },
  2: { label: 'Construcción', subtitle: 'Días 31-60', color: COLORS.warning, gradient: [COLORS.warning + '30', 'transparent'] as string[] },
  3: { label: 'Elite', subtitle: 'Días 61-90', color: METAL.gold, gradient: [METAL.goldWash, 'transparent'] as string[] },
};

// ─── Star rating ──────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons key={i} name="star" size={10} color={i <= rating ? '#FFD93D' : COLORS.border} />
      ))}
    </View>
  );
}

// ─── Difficulty dots ──────────────────────────────────────────────────────────
function DifficultyDots({ level, color }: { level: 1 | 2 | 3; color: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[1, 2, 3].map(i => (
        <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: i <= level ? color : COLORS.border }} />
      ))}
    </View>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function DetailModal({ item, onClose, stageTheme }: { item: Exercise | Book | MindsetItem | null; onClose: () => void; stageTheme: StageTheme }) {
  if (!item) return null;

  const isExercise = 'muscles' in item;
  const isBook = 'author' in item;
  const isMindset = !isExercise && !isBook;

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={modalStyles.backdrop} onPress={onClose} />
      <View style={modalStyles.sheet}>
        <LinearGradient colors={stageTheme.background} style={modalStyles.content}>
          <View style={modalStyles.handle} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={[modalStyles.header, { borderColor: (item as any).color + '40' }]}>
              <Text style={modalStyles.emoji}>{item.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={modalStyles.title}>{isBook ? (item as Book).title : isExercise ? (item as Exercise).name : (item as MindsetItem).title}</Text>
                {isBook && <Text style={modalStyles.author}>{(item as Book).author}</Text>}
                {isExercise && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <DifficultyDots level={(item as Exercise).difficulty} color={(item as any).color} />
                    <Text style={modalStyles.meta}>{(item as Exercise).duration}</Text>
                    <Text style={[modalStyles.tag, { borderColor: (item as any).color + '50', color: (item as any).color }]}>
                      {(item as Exercise).category}
                    </Text>
                  </View>
                )}
                {isBook && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Stars rating={(item as Book).rating} />
                    <Text style={modalStyles.meta}>{(item as Book).pages} págs</Text>
                  </View>
                )}
                {isMindset && (
                  <Text style={[modalStyles.tag, { borderColor: (item as any).color + '50', color: (item as any).color, marginTop: 4, alignSelf: 'flex-start' }]}>
                    {(item as MindsetItem).type.toUpperCase()}
                  </Text>
                )}
              </View>
            </View>

            {/* Description */}
            <Text style={modalStyles.sectionLabel}>DESCRIPCIÓN</Text>
            <Text style={modalStyles.description}>{isBook ? (item as Book).review : item.description}</Text>

            {isBook && (
              <>
                <Text style={modalStyles.sectionLabel}>POR QUÉ LEERLO</Text>
                <Text style={modalStyles.description}>{(item as Book).whyRead}</Text>
                <Text style={modalStyles.sectionLabel}>IDEAS CLAVE</Text>
                {(item as Book).keyIdeas.map((idea, i) => (
                  <View key={i} style={modalStyles.listItem}>
                    <View style={[modalStyles.bullet, { backgroundColor: (item as any).color }]} />
                    <Text style={modalStyles.listText}>{idea}</Text>
                  </View>
                ))}
              </>
            )}

            {isExercise && (
              <>
                <Text style={modalStyles.sectionLabel}>MÚSCULOS</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.md }}>
                  {(item as Exercise).muscles.map((m, i) => (
                    <Text key={i} style={[modalStyles.muscleTag, { borderColor: (item as any).color + '40' }]}>{m}</Text>
                  ))}
                </View>
                <Text style={modalStyles.sectionLabel}>PROTOCOLO</Text>
                {(item as Exercise).protocol.map((step, i) => (
                  <View key={i} style={modalStyles.listItem}>
                    <Text style={[modalStyles.stepNum, { color: (item as any).color }]}>{i + 1}</Text>
                    <Text style={modalStyles.listText}>{step}</Text>
                  </View>
                ))}
              </>
            )}

            {isMindset && (
              <>
                <Text style={modalStyles.sectionLabel}>CÓMO APLICARLO</Text>
                {(item as MindsetItem).howTo.map((step, i) => (
                  <View key={i} style={modalStyles.listItem}>
                    <View style={[modalStyles.bullet, { backgroundColor: (item as any).color }]} />
                    <Text style={modalStyles.listText}>{step}</Text>
                  </View>
                ))}
              </>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>

          <Pressable style={[modalStyles.closeBtn, { backgroundColor: (item as any).color }]} onPress={onClose}>
            <Text style={modalStyles.closeBtnText}>Cerrar</Text>
          </Pressable>
        </LinearGradient>
      </View>
    </Modal>
  );
}

// ─── Card components ──────────────────────────────────────────────────────────
function ExerciseCard({ item, locked, onPress }: { item: Exercise; locked: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={() => { if (locked) { Alert.alert('Bloqueado', `Este contenido se desbloquea en la Fase ${item.phase}.`); return; } onPress(); }}>
      <View style={[cardStyles.card, locked && cardStyles.locked, { borderColor: item.color + '30' }]}>
        <View style={[cardStyles.emoji, { backgroundColor: item.color + '20' }]}>
          <Text style={{ fontSize: 22 }}>{locked ? '🔒' : item.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[cardStyles.name, locked && cardStyles.lockedText]}>{item.name}</Text>
          <Text style={cardStyles.meta}>{item.category} · {item.duration}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <DifficultyDots level={item.difficulty} color={locked ? COLORS.textMuted : item.color} />
            {locked && <Text style={cardStyles.lockedLabel}>Fase {item.phase}</Text>}
          </View>
        </View>
        {!locked && <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />}
      </View>
    </Pressable>
  );
}

function BookCard({ item, locked, onPress }: { item: Book; locked: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={() => { if (locked) { Alert.alert('Bloqueado', `Este contenido se desbloquea en la Fase ${item.phase}.`); return; } onPress(); }}>
      <View style={[cardStyles.card, locked && cardStyles.locked, { borderColor: item.color + '30' }]}>
        <View style={[cardStyles.emoji, { backgroundColor: item.color + '20' }]}>
          <Text style={{ fontSize: 22 }}>{locked ? '🔒' : item.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[cardStyles.name, locked && cardStyles.lockedText]}>{item.title}</Text>
          <Text style={cardStyles.meta}>{item.author} · {item.pages} págs</Text>
          <View style={{ marginTop: 4 }}>
            {locked ? <Text style={cardStyles.lockedLabel}>Se desbloquea en Fase {item.phase}</Text> : <Stars rating={item.rating} />}
          </View>
        </View>
        {!locked && <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />}
      </View>
    </Pressable>
  );
}

function MindsetCard({ item, locked, onPress }: { item: MindsetItem; locked: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={() => { if (locked) { Alert.alert('Bloqueado', `Este contenido se desbloquea en la Fase ${item.phase}.`); return; } onPress(); }}>
      <View style={[cardStyles.card, locked && cardStyles.locked, { borderColor: item.color + '30' }]}>
        <View style={[cardStyles.emoji, { backgroundColor: item.color + '20' }]}>
          <Text style={{ fontSize: 22 }}>{locked ? '🔒' : item.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[cardStyles.name, locked && cardStyles.lockedText]}>{item.title}</Text>
          <Text style={cardStyles.meta} numberOfLines={2}>{item.description}</Text>
          {locked && <Text style={[cardStyles.lockedLabel, { marginTop: 4 }]}>Fase {item.phase}</Text>}
        </View>
        {!locked && <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />}
      </View>
    </Pressable>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
type Tab = 'ejercicios' | 'libros' | 'mentalidad' | 'herramientas';

export default function DiscoveryScreen() {
  const router = useRouter();
  const { reducedMotion, screenAnimStyle } = useTabScreenMotion('discovery');
  const { data, loading } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('ejercicios');
  const [selected, setSelected] = useState<Exercise | Book | MindsetItem | null>(null);
  const [selectedTool, setSelectedTool] = useState<DiscoveryTool | null>(null);

  if (!data && loading) {
    return (
      <View style={[styles.container, { backgroundColor: SURFACES.base }]}>
        <SafeAreaView style={styles.safe}>
          <DiscoverySkeleton />
        </SafeAreaView>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.container, { backgroundColor: SURFACES.base }]}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.emptyWrap}>
            <Ionicons name="compass-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No pudimos cargar esta sección</Text>
            <Text style={styles.emptyText}>Verifica conexión e inicia sesión nuevamente.</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const { user } = data;
  const currentDay = user.currentDay;
  const stageTheme = getStageTheme(user);
  const currentPhase = getPhase(currentDay);
  const phaseInfo = PHASE_INFO[currentPhase];

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'ejercicios', label: 'Ejercicios', icon: 'barbell' },
    { key: 'libros', label: 'Libros', icon: 'book' },
    { key: 'mentalidad', label: 'Mentalidad', icon: 'brain' },
    { key: 'herramientas', label: 'Herramientas', icon: 'heart' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: SURFACES.base }]}>
      <Animated.View style={[styles.motionLayer, screenAnimStyle]}>
        <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <Pressable
                onPress={() => router.push("/(tabs)/mas" as any)}
                style={styles.backBtn}
                accessibilityRole="button"
                accessibilityLabel="Volver a Más"
                hitSlop={TOUCH.hitSlop}
              >
                <Ionicons name="chevron-back" size={22} color={COLORS.textSecondary} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Descubre</Text>
                <Text style={styles.subtitle}>{DISCOVERY_HERO.subtitle}</Text>
              </View>
            </View>
            <LinearGradient colors={[phaseInfo.color + '30', phaseInfo.color + '10']} style={styles.phaseBadge}>
              <Text style={[styles.phaseLabel, { color: phaseInfo.color }]}>{phaseInfo.label}</Text>
              <Text style={styles.phaseSub}>{phaseInfo.subtitle}</Text>
            </LinearGradient>
          </View>

          <HeroZone {...DISCOVERY_HERO} />

          {/* Phase progress bar */}
          <View style={styles.phaseBarBg}>
            <LinearGradient
              colors={[phaseInfo.color, phaseInfo.color + '80']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.phaseBarFill, { width: `${(currentDay / 90) * 100}%` as any }]}
            />
          </View>
          <Text style={styles.phaseProgress}>Día {currentDay} de 90 — {90 - currentDay} días para desbloquear todo</Text>

          {/* Personalized recommendations */}
          {user.adaptiveProfile?.track && (
            <RecomendadoSection
              track={user.adaptiveProfile.track}
              phase={currentPhase}
              stageTheme={stageTheme}
              onPress={item => setSelected(item)}
            />
          )}

          {/* Tab selector */}
          <View style={styles.tabRow}>
            {tabs.map(t => (
              <Pressable
                key={t.key}
                style={({ pressed }) => [
                  styles.tab,
                  activeTab === t.key && styles.tabActive,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => setActiveTab(t.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === t.key }}
                accessibilityLabel={t.label}
                hitSlop={TOUCH.hitSlop}
              >
                <Ionicons name={t.icon as any} size={14} color={activeTab === t.key ? SEMANTIC.primary : SEMANTIC.onSurfaceMuted} />
                <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Content */}
          {activeTab === 'ejercicios' && (
            <>
              {[1, 2, 3].map(phase => {
                const items = EXERCISES.filter(e => e.phase === phase);
                const locked = phase > currentPhase;
                return (
                  <View key={phase}>
                    <View style={styles.phaseHeader}>
                      <Text style={[styles.phaseTitle, { color: PHASE_INFO[phase as Phase].color }]}>
                        {PHASE_INFO[phase as Phase].label}
                      </Text>
                      {locked && <Ionicons name="lock-closed" size={12} color={COLORS.textMuted} />}
                    </View>
                    {items.map((item, itemIndex) => (
                      <StaggerIn
                        key={item.id}
                        index={(phase - 1) * 8 + itemIndex}
                        reducedMotion={reducedMotion}
                      >
                        <ExerciseCard
                          item={item}
                          locked={locked}
                          onPress={() => setSelected(item)}
                        />
                      </StaggerIn>
                    ))}
                  </View>
                );
              })}
            </>
          )}

          {activeTab === 'libros' && (
            <>
              {[1, 2, 3].map(phase => {
                const items = BOOKS.filter(b => b.phase === phase);
                const locked = phase > currentPhase;
                return (
                  <View key={phase}>
                    <View style={styles.phaseHeader}>
                      <Text style={[styles.phaseTitle, { color: PHASE_INFO[phase as Phase].color }]}>
                        {PHASE_INFO[phase as Phase].label}
                      </Text>
                      {locked && <Ionicons name="lock-closed" size={12} color={COLORS.textMuted} />}
                    </View>
                    {items.map((item, itemIndex) => (
                      <StaggerIn
                        key={item.id}
                        index={(phase - 1) * 8 + itemIndex}
                        reducedMotion={reducedMotion}
                      >
                        <BookCard
                          item={item}
                          locked={locked}
                          onPress={() => setSelected(item)}
                        />
                      </StaggerIn>
                    ))}
                  </View>
                );
              })}
            </>
          )}

          {activeTab === 'mentalidad' && (
            <>
              {[1, 2, 3].map(phase => {
                const items = MINDSET_ITEMS.filter(m => m.phase === phase);
                const locked = phase > currentPhase;
                return (
                  <View key={phase}>
                    <View style={styles.phaseHeader}>
                      <Text style={[styles.phaseTitle, { color: PHASE_INFO[phase as Phase].color }]}>
                        {PHASE_INFO[phase as Phase].label}
                      </Text>
                      {locked && <Ionicons name="lock-closed" size={12} color={COLORS.textMuted} />}
                    </View>
                    {items.map((item, itemIndex) => (
                      <StaggerIn
                        key={item.id}
                        index={(phase - 1) * 8 + itemIndex}
                        reducedMotion={reducedMotion}
                      >
                        <MindsetCard
                          item={item}
                          locked={locked}
                          onPress={() => setSelected(item)}
                        />
                      </StaggerIn>
                    ))}
                  </View>
                );
              })}
            </>
          )}

          {activeTab === 'herramientas' && (
            <>
              {DISCOVERY_TOOLS.map((tool, index) => (
                <StaggerIn key={tool.id} index={index + 1} reducedMotion={reducedMotion}>
                  <DiscoveryToolCard tool={tool} onPress={setSelectedTool} />
                </StaggerIn>
              ))}
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
        </SafeAreaView>
      </Animated.View>

      <DetailModal item={selected} stageTheme={stageTheme} onClose={() => setSelected(null)} />
      <DiscoveryToolHeroModal tool={selectedTool} onClose={() => setSelectedTool(null)} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  motionLayer: { flex: 1 },
  safe: { flex: 1 },
  scroll: { padding: SPACING.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: SPACING.sm, marginBottom: SPACING.md },
  backBtn: {
    width: TOUCH.minTarget,
    height: TOUCH.minTarget,
    borderRadius: TOUCH.minTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SURFACES.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SURFACES.glassBorder,
  },
  title: { fontSize: FONT.xxl, fontWeight: '800', color: SEMANTIC.onSurface },
  subtitle: { fontSize: FONT.sm, color: SEMANTIC.onSurfaceVariant, marginTop: 2 },
  phaseBadge: { borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', minWidth: 90 },
  phaseLabel: { fontSize: FONT.xs, fontWeight: '900', letterSpacing: 1 },
  phaseSub: { fontSize: 9, color: SEMANTIC.onSurfaceMuted, marginTop: 2 },
  phaseBarBg: { height: 4, backgroundColor: SURFACES.glass, borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: SPACING.xs },
  phaseBarFill: { height: '100%', borderRadius: RADIUS.full },
  phaseProgress: { fontSize: FONT.xs, color: SEMANTIC.onSurfaceMuted, marginBottom: SPACING.lg },
  tabRow: { flexDirection: 'row', backgroundColor: SURFACES.glass, borderRadius: RADIUS.lg, padding: 4, gap: TOUCH.minGap, marginBottom: SPACING.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: SURFACES.glassBorder },
  tab: { flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 10, borderRadius: RADIUS.md, minHeight: TOUCH.minTarget },
  tabActive: { backgroundColor: SURFACES.elevated },
  tabLabel: { fontSize: 9, color: SEMANTIC.onSurfaceMuted, fontWeight: '600' },
  tabLabelActive: { color: SEMANTIC.primary },
  phaseHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.md, marginBottom: SPACING.sm },
  phaseTitle: { fontSize: FONT.xs, fontWeight: '800', letterSpacing: 1.5 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg, gap: 8 },
  emptyTitle: { color: SEMANTIC.onSurface, fontSize: FONT.lg, fontWeight: '800', textAlign: 'center' },
  emptyText: { color: SEMANTIC.onSurfaceVariant, fontSize: FONT.sm, textAlign: 'center' },
});

const cardStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: SURFACES.glass, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: SURFACES.glassBorder },
  locked: { opacity: 0.45 },
  emoji: { width: 44, height: 44, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: FONT.base, fontWeight: '700', color: SEMANTIC.onSurface, marginBottom: 2 },
  lockedText: { color: SEMANTIC.onSurfaceMuted },
  meta: { fontSize: FONT.xs, color: SEMANTIC.onSurfaceVariant, lineHeight: 16 },
  lockedLabel: { fontSize: FONT.xs, color: SEMANTIC.onSurfaceMuted, fontStyle: 'italic' },
});

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: SEMANTIC.scrim },
  sheet: { maxHeight: '85%' },
  content: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, paddingTop: SPACING.sm },
  handle: { width: 36, height: 4, backgroundColor: SURFACES.glassBorder, borderRadius: 2, alignSelf: 'center', marginBottom: SPACING.md },
  header: { flexDirection: 'row', gap: SPACING.md, padding: SPACING.md, borderRadius: RADIUS.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: SURFACES.glassBorder, marginBottom: SPACING.lg, alignItems: 'flex-start', backgroundColor: SURFACES.glass },
  emoji: { fontSize: 36 },
  title: { fontSize: FONT.lg, fontWeight: '800', color: SEMANTIC.onSurface },
  author: { fontSize: FONT.sm, color: SEMANTIC.onSurfaceVariant, marginTop: 2 },
  meta: { fontSize: FONT.xs, color: SEMANTIC.onSurfaceMuted },
  tag: { fontSize: 9, fontWeight: '700', borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 6, paddingVertical: 2, letterSpacing: 0.5 },
  sectionLabel: { fontSize: FONT.xs, color: SEMANTIC.onSurfaceMuted, fontWeight: '700', letterSpacing: 2, marginBottom: SPACING.sm, marginTop: SPACING.md },
  description: { fontSize: FONT.base, color: SEMANTIC.onSurfaceVariant, lineHeight: 24 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, marginBottom: SPACING.sm },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  stepNum: { fontSize: FONT.base, fontWeight: '900', width: 20, flexShrink: 0 },
  listText: { flex: 1, fontSize: FONT.sm, color: SEMANTIC.onSurfaceVariant, lineHeight: 22 },
  muscleTag: { fontSize: FONT.xs, color: SEMANTIC.onSurfaceVariant, borderWidth: 1, borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
  closeBtn: { borderRadius: RADIUS.lg, paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.sm, minHeight: TOUCH.minTarget, justifyContent: 'center' },
  closeBtnText: { color: SEMANTIC.onPrimary, fontWeight: '800', fontSize: FONT.base, letterSpacing: 0.5 },
});
