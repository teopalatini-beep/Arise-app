/**
 * coachVoice.ts — Tono de voz RPG por coach (Módulo 3: copies dinámicos).
 *
 * Cada Guild Master habla distinto: enmarca las misiones, felicita, avisa de la
 * racha y abre el diario con su propia personalidad. El Home, las misiones y el
 * diario consumen estos copies para que el usuario sienta que entrena con ESE
 * personaje. Complementa los `homePhrases`/`opener`/`motivator` de coach.ts.
 */
import { CoachId } from '../types';

export interface CoachVoice {
  /** CTA principal del Home ("Encendé el Ki de hoy"). */
  homeCTA: string;
  /** Frase que enmarca las misiones diarias. */
  missionIntro: string;
  /** Felicitación al completar una misión. */
  missionCheer: string;
  /** Grito de día completado (level up). */
  dayComplete: string;
  /** Aviso de racha en peligro. */
  streakWarning: string;
  /** Prompt de apertura del diario. */
  journalPrompt: string;
}

export const COACH_VOICES: Record<CoachId, CoachVoice> = {
  goku: {
    homeCTA: 'Encendé el Ki de hoy',
    missionIntro: 'Estas son tus batallas de hoy. Superá tu límite de ayer.',
    missionCheer: '¡Eso! Un paso más cerca del siguiente nivel.',
    dayComplete: '¡LÍMITE SUPERADO! Hoy te volviste más fuerte.',
    streakWarning: 'Tu poder se enfría. Entrená antes de que caiga la noche.',
    journalPrompt: '¿Qué límite rompiste hoy? Escribilo, saiyajin.',
  },
  gojo: {
    homeCTA: 'Dominá tu espacio',
    missionIntro: 'Tu dominio de hoy. Ejecutá con calma — nada te alcanza.',
    missionCheer: 'Limpio. Así se ve el control absoluto.',
    dayComplete: 'Dominio expandido. Hoy estuviste por encima de todo.',
    streakWarning: 'Tu infinito flaquea. Cerrá el día antes de perderlo.',
    journalPrompt: '¿Qué dominaste hoy sin esfuerzo? Reflexionalo.',
  },
  itachi: {
    homeCTA: 'Observá. Decidí. Ejecutá.',
    missionIntro: 'Tus objetivos de hoy. Sin desperdicio, sin ruido.',
    missionCheer: 'Preciso. El control silencioso es poder acumulado.',
    dayComplete: 'Te dominaste a vos mismo. Ese es el verdadero poder.',
    streakWarning: 'La disciplina se te escapa. Actuá antes del anochecer.',
    journalPrompt: '¿Qué observaste de vos mismo hoy? Anotalo con honestidad.',
  },
  rengoku: {
    homeCTA: 'Poné tu corazón en llamas',
    missionIntro: 'Tus llamas de hoy. Avanzá con firmeza, aunque cueste.',
    missionCheer: '¡Arde! Tu fuego protege tu proceso.',
    dayComplete: '¡CORAZÓN ARDIENTE! Cumpliste sin negociar.',
    streakWarning: 'Tu llama se apaga. Reavivala antes de que sea tarde.',
    journalPrompt: '¿Qué encendió tu corazón hoy? Dejalo escrito.',
  },
  jiraiya: {
    homeCTA: 'El sabio entrena hoy',
    missionIntro: 'Tus lecciones de hoy. La naturaleza no apura, pero llega.',
    missionCheer: 'Bien. Cada paso alimenta al sabio que estás forjando.',
    dayComplete: 'Un día más de sabiduría acumulada. Seguí el camino.',
    streakWarning: 'El camino se enfría. Retomá antes de perder el ritmo.',
    journalPrompt: '¿Qué aprendiste hoy, incluso del error más tonto?',
  },
  all_might: {
    homeCTA: 'Sonreí y empujá más allá',
    missionIntro: 'Tus desafíos de hoy. Con una sonrisa, siempre adelante.',
    missionCheer: '¡PLUS ULTRA! Un paso más para ser el símbolo.',
    dayComplete: '¡GO BEYOND! Hoy fuiste mejor que ayer.',
    streakWarning: 'El símbolo flaquea. Levantate y empujá el límite.',
    journalPrompt: '¿Cómo empujaste tu límite hoy? Escribilo con orgullo.',
  },
};

/** Devuelve la voz del coach indicado (default: Goku). */
export function getCoachVoice(id?: CoachId): CoachVoice {
  if (!id) return COACH_VOICES.goku;
  return COACH_VOICES[id] ?? COACH_VOICES.goku;
}
