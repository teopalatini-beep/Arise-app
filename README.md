# ARISE — 90 Day Challenge

> App de productividad y transformación personal, tematizada con estética anime/shonen (Naruto, Dragon Ball, Jujutsu Kaisen, Demon Slayer). Convertí tu rutina diaria en un sistema de niveles, rangos y logros.

**Stack:** React Native · Expo (Router, SDK 54) · TypeScript · Supabase (Auth + Postgres + RLS)

---

## El concepto

ARISE toma la lógica de progresión de un RPG/anime shonen — XP, niveles, rangos ninja (Genin → Chunin → Jonin → Kage), "formas de poder" al estilo Super Saiyan/Sharingan — y la aplica a un programa real de 90 días de hábitos: entrenamiento, lectura, meditación, trabajo enfocado, journaling.

La idea de fondo: la disciplina diaria se siente más como "subir de nivel" que como una lista de tareas. Cada día completado suma puntos y XP, las rachas desbloquean "auras" y transformaciones visuales, y fallar un día activa una misión de penitencia en vez de simplemente romper el progreso.

## Funcionalidades implementadas

- **Programa de 90 días en 4 fases** (Fundación → Construcción → Momentum → Elite), con misiones que escalan en dificultad (minutos de entrenamiento, páginas de lectura, meditación, ducha fría, visualización, trabajo profundo).
- **Sistema de misiones con puntos**: misiones binarias, escalonadas (steps) y proporcionales, con puntaje diario objetivo (30 normal / 40 modo difícil).
- **XP, niveles y "power stages"**: 4 etapas visuales que cambian colores/tema de la app según el progreso.
- **Sistema de rachas y penitencia**: perder un día activa una misión de penitencia; incluye 1 día de gracia mensual que no rompe la racha.
- **Coaches temáticos seleccionables**: cada uno con frases, overlays visuales y reportes semanales de progreso con tono propio.
- **Insignias / badges** con rangos ninja por rachas, fases completadas, hitos de lectura/entrenamiento, etc.
- **Grilla del programa**: vista de los 90 días con estado (completado/fallado/pendiente) e hitos.
- **Progreso y diario**: métricas diarias (peso, entrenamiento, lectura, meditación, ánimo) con historial, más notas y reflexiones diarias.
- **Discovery**: biblioteca curada de ejercicios y libros recomendados, organizados por fase.
- **Timer Pomodoro** integrado para bloques de trabajo enfocado.
- **Integración con calendario nativo** (expo-calendar) y **notificaciones locales** programables.
- **Autenticación y sync en la nube** vía Supabase: registro/login/reset de contraseña, datos persistidos por usuario con Row Level Security.
- **Onboarding adaptativo**: cuestionario inicial que genera un perfil y recomendaciones personalizadas.

## Estado del proyecto

Proyecto personal en desarrollo activo (WIP), originalmente pensado para uso propio y pulido luego con vistas a una eventual publicación en tiendas (incluye configuración de EAS Build/Submit y política de privacidad). No es un producto comercial ni tiene usuarios externos.

---

## Instalación paso a paso

### 1. Instalá Node.js
Descargá e instalá desde [nodejs.org](https://nodejs.org) (versión LTS recomendada).

### 2. Instalá las dependencias
```bash
cd arise-app
npm install
```

### 3. Correlo en tu computadora (web)
```bash
npx expo start --web
```
Se abre automáticamente en el navegador.

### 4. Correlo en tu celular
1. Instalá **Expo Go** desde la App Store (iOS) o Google Play
2. Corré:
   ```bash
   npx expo start
   ```
3. Escaneá el código QR que aparece en la terminal con la cámara (iOS) o con Expo Go (Android)

---

## Estructura del proyecto

```
arise-app/
├── app/                      → rutas (Expo Router)
│   ├── welcome.tsx / login.tsx / onboarding.tsx
│   └── (tabs)/                → Hoy · Programa · Progreso · Diario · Discovery · Config
├── src/
│   ├── context/                → AppContext (estado global + AsyncStorage/Supabase), AuthContext
│   ├── data/                   → definición de las 90 misiones/día y estructura del programa
│   ├── lib/                    → progresión/XP, coaches, calendario, notificaciones, frases, db, cliente Supabase
│   ├── components/              → PomodoroTimer, CoachParticles (efectos visuales)
│   └── theme/                   → tokens de color y tipografía
└── supabase/
    ├── schema.sql               → tablas + políticas RLS
    └── migrations/
```

**Backend:** Supabase (Postgres) con autenticación propia y tablas `profiles`, `day_records`, `metrics`, `journal`, todas protegidas con Row Level Security por `auth.uid()` — cada usuario solo accede a sus propios datos.

---

## Sistema de penalización

- **Si fallás un día** → Aparece una misión de penitencia (entrenamiento doble + meditación + carta de compromiso)
- **Si completás la penitencia** → Continuás desde donde estabas (racha reset a 0)
- **Día de gracia** → 1 por mes. No perdés el progreso, solo la racha.

---

## Backend (cuentas + nube)

La app usa **Supabase** para:
- Autenticación (registro/login/reset contraseña)
- Guardado en la nube por usuario
- Recuperar todo el progreso al iniciar sesión desde cualquier dispositivo

### Configuración rápida del backend

1. Abrí tu proyecto en Supabase.
2. Andá a **SQL Editor**.
3. Ejecutá el script `supabase/schema.sql`.
4. Creá un archivo `.env` (podés copiar `.env.example`) y completá:
   - `EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY=<tu_anon_key>`
5. Verificá que existan tablas: `profiles`, `day_records`, `metrics`, `journal`.

Con eso, cada usuario tendrá su información persistida y privada (RLS por `auth.uid()`).

### EAS secrets (builds de producción)

Para no depender del `.env` local en builds remotos, cargá estas variables en EAS:

```bash
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value "https://<project-ref>.supabase.co"
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<tu_anon_key>"
```

También podés repetirlo para `preview` o `development` cambiando `--environment`.

---

*Construida con Expo + TypeScript + Supabase.*
