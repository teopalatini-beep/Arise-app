# ARISE — 90 Day Challenge

App de hábitos con estética shonen: un programa de **90 días** con misiones diarias, XP, rachas y progreso visible. Entrenamiento, lectura, meditación, deep work y más — gamificado para que levantarte sea el default.

> “Arise — levantáte.”

---

## Qué estoy haciendo

Estoy construyendo una app personal (Expo / React Native) de transformación en 90 días:

1. **Hoy** — misiones del día con checkboxes y frase del momento
2. **Programa** — grilla de 90 días en 4 fases, con hitos
3. **Progreso** — métricas (peso, entrenamiento, lectura, meditación, etc.)
4. **Diario** — reflexiones y notas
5. **Discovery / coaches / Pomodoro** — herramientas extra para sostener el hábito
6. **Sync** — auth y datos vía Supabase (cuando está configurado)

No es un tracker genérico: es un **camino con narrativa**, niveles y consecuencias (racha, penitencia, día de gracia).

---

## Por qué lo estoy haciendo

Las apps de hábitos suelen ser listas frías. A los tres días se abandonan.

Quería algo que:

- tenga un **arco claro de 90 días** (no “streak infinito” vacío)
- haga el progreso **visible y jugable** (XP, fases, misiones)
- combine **cuerpo + mente + foco** en un solo programa
- se sienta motivador sin volverse spam de notificaciones vacías

---

## Beneficios

| Beneficio | En la práctica |
|---|---|
| **Estructura** | 90 días / 4 fases, no improvisar cada mañana |
| **Gamificación útil** | XP y niveles atados a misiones reales |
| **Todo en un lugar** | Hoy + métricas + diario |
| **Multiplataforma** | Expo: iOS, Android y web |
| **Sync opcional** | Supabase para no perder el progreso |

---

## Qué hace (y qué no)

**Sí hace**
- Programa de 90 días con misiones diarias
- Tracking de métricas y diario
- Rachas, XP y configuración del challenge
- Correr en Expo Go / web / builds nativos

**No hace**
- Coaching médico o nutricional profesional
- Garantizar resultados: es un sistema de constancia, no magia
- Funcionar online-only: parte del estado puede vivir en el dispositivo

---

## Stack

- Expo / React Native + TypeScript
- Expo Router (tabs)
- AsyncStorage / estado local
- Supabase (auth + sync, opcional)

---

## Setup rápido

```bash
git clone https://github.com/teopalatini-beep/Arise-app.git
cd Arise-app   # o la carpeta local New-app
npm install
cp .env.example .env
# Completá EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY si usás sync
npm start
```

| Comando | Qué hace |
|---|---|
| `npm start` | Expo Dev Tools / QR |
| `npm run web` | Corre en el navegador |
| `npm run ios` | Simulador / device iOS |
| `npm run android` | Emulador / device Android |

En el celular: instalá **Expo Go**, escaneá el QR.

Los `.env` **nunca** se suben a git.

---

## Estructura (orientativa)

```
app/                 → pantallas (tabs, auth, discovery…)
src/
  data/              → programa, misiones
  services/          → métricas, journal, analytics
  theme/             → design system
supabase/            → schema / config
```

---

## Estado del proyecto

App en uso y evolución activa (UI, misiones, progreso). El README describe el producto; el programa concreto vive en `src/data/`.
