-- ─────────────────────────────────────────────────────────────────────────────
-- 004 — Campo `gender` del avatar (Fase 1 del onboarding rediseñado)
--
-- El resto de los datos nuevos del personaje se guardan en columnas jsonb ya
-- existentes: la línea de tiempo (3/6/12 meses) y el árbol de enfoque (focusAreas)
-- viajan dentro de `goals`; el nombre usa la columna `name`. Solo el sexo necesita
-- una columna nueva de primera clase (útil para segmentación de cohortes).
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists gender text;
