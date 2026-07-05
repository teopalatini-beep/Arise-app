-- ─────────────────────────────────────────────────────────────────────────────
-- 003 — Limpieza de tablas fantasma (drift del servidor)
--
-- Conteos verificados en producción (2026-07):
--   • metrics          → 2 filas  (VIVA — la usa db.ts)
--   • user_metrics     → 2 filas  (fantasma CON data → comparar antes de dropear)
--   • journal          → 0 filas  (VIVA)
--   • journal_entries  → 0 filas  (fantasma VACÍO → drop seguro)
--   • mission_catalog  → 40 filas (NO es basura → adoptar, no borrar)
--
-- ⚠️  NO CORRER A CIEGAS. Ejecutar por pasos y en orden.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── PASO A — journal_entries está vacío: drop directo y seguro ─────────────────
drop table if exists public.journal_entries cascade;

-- ── PASO B — user_metrics: verificado como data de prueba/seed ────────────────
-- Inspección (2026-07): 2 filas, un solo user_id de test, mismo created_at (insert
-- por script), fechas de abril backfilleadas, con metadata de onboarding en `notes`.
-- Schema date-based distinto al de `metrics` (day_number). No hay data orgánica que
-- rescatar → drop directo. La app viva usa `metrics`.
drop table if exists public.user_metrics cascade;

-- ── mission_catalog (40 filas) — NO se dropea ─────────────────────────────────
-- Contiene un catálogo real de misiones. Se conserva y se adopta en schema.sql
-- (candidato a base del anti-cheat server-side: recomputar puntos desde el catálogo).
-- No requiere acción destructiva acá.
