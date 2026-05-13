-- Tabla de frases dinámicas para notificaciones
-- Ejecutar en Supabase SQL Editor: https://supabase.com/dashboard/project/<tu-project>/sql
create table if not exists phrases (
  id bigint generated always as identity primary key,
  title text not null,
  body text not null,
  turn text not null check (turn in ('morning', 'afternoon', 'night', 'streak')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- RLS: lectura pública (anon key), escritura solo admin
alter table phrases enable row level security;

create policy "Phrases are readable by everyone"
  on phrases for select
  using (true);

-- Index para queries filtradas
create index idx_phrases_turn_active on phrases (turn, active);
