begin;

-- Daily coach memory: topics, commitments, mood, summary for contextual notifications.
create table if not exists public.coach_daily_context (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  topics text[] not null default '{}',
  commitments text[] not null default '{}',
  mood text,
  summary text,
  notif_afternoon_title text,
  notif_afternoon_body text,
  notif_night_title text,
  notif_night_body text,
  notif_morning_title text,
  notif_morning_body text,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists coach_daily_context_user_date_idx
  on public.coach_daily_context (user_id, date desc);

alter table public.coach_daily_context enable row level security;

drop policy if exists "coach_daily_context_select_own" on public.coach_daily_context;
create policy "coach_daily_context_select_own"
  on public.coach_daily_context
  for select
  using (auth.uid() = user_id);

drop policy if exists "coach_daily_context_insert_own" on public.coach_daily_context;
create policy "coach_daily_context_insert_own"
  on public.coach_daily_context
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "coach_daily_context_update_own" on public.coach_daily_context;
create policy "coach_daily_context_update_own"
  on public.coach_daily_context
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "coach_daily_context_delete_own" on public.coach_daily_context;
create policy "coach_daily_context_delete_own"
  on public.coach_daily_context
  for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.coach_daily_context to authenticated;

-- Short chat history for the personal coach.
create table if not exists public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  coach_id text,
  created_at timestamptz not null default now()
);

create index if not exists coach_messages_user_date_idx
  on public.coach_messages (user_id, date desc, created_at asc);

alter table public.coach_messages enable row level security;

drop policy if exists "coach_messages_select_own" on public.coach_messages;
create policy "coach_messages_select_own"
  on public.coach_messages
  for select
  using (auth.uid() = user_id);

drop policy if exists "coach_messages_insert_own" on public.coach_messages;
create policy "coach_messages_insert_own"
  on public.coach_messages
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "coach_messages_delete_own" on public.coach_messages;
create policy "coach_messages_delete_own"
  on public.coach_messages
  for delete
  using (auth.uid() = user_id);

grant select, insert, delete on public.coach_messages to authenticated;

commit;
