# ARISE — Tu programa de 90 días

> "Arise — levantáte."  
> App personal de transformación de 90 días. Construida para Teo.

---

## Pantallas

| Tab | Función |
|-----|---------|
| ☀️ Hoy | Tareas del día con checkboxes. Frase motivacional. Progreso del día. |
| ⊞ Programa | Grilla de los 90 días con colores de estado. Hitos del camino. |
| 📊 Progreso | Métricas diarias (peso, entrenamiento, lectura, meditación). Historial. |
| 📓 Diario | Notas y reflexiones diarias. Preguntas para reflexionar. Historial. |
| ⚙️ Config | Nivel XP, estadísticas, día de gracia, info del programa. |

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
├── app/
│   ├── _layout.tsx          → Root con provider
│   └── (tabs)/
│       ├── _layout.tsx      → Tab bar
│       ├── index.tsx        → Pantalla "Hoy"
│       ├── programa.tsx     → Grilla 90 días
│       ├── progreso.tsx     → Métricas y progreso
│       ├── diario.tsx       → Diario personal
│       └── config.tsx       → Configuración
├── src/
│   ├── context/
│   │   └── AppContext.tsx   → Estado global + AsyncStorage
│   ├── data/
│   │   └── program.ts       → Las 90 tareas de Teo
│   ├── theme/
│   │   └── index.ts         → Colores y tipografía
│   └── types/
│       └── index.ts         → Tipos TypeScript
└── package.json
```

---

## Tu programa de 90 días

**Fase 1 (Días 1-10): Fundación**
- Entrenamiento: 20-28 min
- Lectura: 10-13 páginas
- Meditación: 5-7 min
- Agua: 2L / Trabajo enfocado: 45-58 min

**Fase 2 (Días 11-30): Construcción**
- Entrenamiento: sube hasta ~45 min
- Lectura: sube a ~20 páginas
- Meditación: sube a ~10 min
- Trabajo: sube a ~90 min

**Fase 3 (Días 31-60): Momentum**
- Se agrega Visualización (día 20+)
- Se agrega Ducha fría (día 40+)
- Entrenamiento: 45-65 min con HIIT y pesas
- Trabajo profundo: hasta 135 min

**Fase 4 (Días 61-90): Elite**
- Entrenamiento: 70-95 min
- Lectura: hasta 40 páginas
- Meditación: 20 min
- Trabajo: hasta 3 horas
- Ducha fría: hasta 5 min

---

## Sistema de penalización

- **Si fallás un día** → Aparece una misión de penitencia (entrenamiento doble + meditación + carta de compromiso)
- **Si completás la penitencia** → Continuás desde donde estabas (racha reset a 0)
- **Día de gracia** → 1 por mes. No pierdes el progreso, solo la racha. Usalo con criterio.

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

*Arise — levantáte. 90 días. Sin excusas.*
