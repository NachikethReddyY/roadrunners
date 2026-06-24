-- Scrim checkpoints, user-owned scrims, TTS cache, Daytona sandbox sessions

create table if not exists public.user_scrims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journey_id uuid not null references public.journeys(id) on delete cascade,
  source_node_id uuid references public.journey_nodes(id) on delete set null,
  source_lesson_scrim_id uuid references public.lesson_scrims(id) on delete set null,
  title text not null,
  skill_tag text references public.skill_catalog(slug),
  template text not null check (template in ('vanilla', 'react-ts', 'python')),
  initial_files jsonb not null default '{}',
  timeline jsonb not null default '{"durationMs":0,"events":[]}',
  slides jsonb not null default '[]',
  duration_ms integer not null default 0 check (duration_ms >= 0),
  resume_timeline_ms integer not null default 0 check (resume_timeline_ms >= 0),
  created_at timestamptz not null default now()
);

create index if not exists user_scrims_user_journey_idx
  on public.user_scrims(user_id, journey_id, created_at desc);

create table if not exists public.scrim_checkpoints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journey_id uuid not null references public.journeys(id) on delete cascade,
  node_id uuid references public.journey_nodes(id) on delete cascade,
  lesson_scrim_id uuid references public.lesson_scrims(id) on delete cascade,
  user_scrim_id uuid references public.user_scrims(id) on delete cascade,
  timeline_ms integer not null default 0 check (timeline_ms >= 0),
  files jsonb not null default '{}',
  active_file text,
  label text,
  created_at timestamptz not null default now(),
  constraint scrim_checkpoint_target check (
    num_nonnulls(node_id, lesson_scrim_id, user_scrim_id) = 1
  )
);

create index if not exists scrim_checkpoints_user_journey_idx
  on public.scrim_checkpoints(user_id, journey_id, created_at desc);

create index if not exists scrim_checkpoints_lesson_scrim_idx
  on public.scrim_checkpoints(user_id, lesson_scrim_id, created_at desc);

create index if not exists scrim_checkpoints_node_idx
  on public.scrim_checkpoints(user_id, node_id, created_at desc);

create index if not exists scrim_checkpoints_user_scrim_idx
  on public.scrim_checkpoints(user_id, user_scrim_id, created_at desc);

create table if not exists public.tts_cache (
  cache_key text primary key,
  storage_path text not null,
  voice_id text not null,
  text_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.sandbox_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journey_id uuid references public.journeys(id) on delete cascade,
  node_id uuid references public.journey_nodes(id) on delete cascade,
  scrim_id uuid,
  daytona_sandbox_id text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id, id)
);

create index if not exists sandbox_sessions_user_expires_idx
  on public.sandbox_sessions(user_id, expires_at);

-- RLS
alter table public.scrim_checkpoints enable row level security;
alter table public.user_scrims enable row level security;
alter table public.tts_cache enable row level security;
alter table public.sandbox_sessions enable row level security;

create policy "scrim_checkpoints_select_own" on public.scrim_checkpoints
  for select using (auth.uid() = user_id);

create policy "scrim_checkpoints_insert_own" on public.scrim_checkpoints
  for insert with check (auth.uid() = user_id);

create policy "scrim_checkpoints_update_own" on public.scrim_checkpoints
  for update using (auth.uid() = user_id);

create policy "scrim_checkpoints_delete_own" on public.scrim_checkpoints
  for delete using (auth.uid() = user_id);

create policy "user_scrims_select_own" on public.user_scrims
  for select using (auth.uid() = user_id);

create policy "user_scrims_insert_own" on public.user_scrims
  for insert with check (auth.uid() = user_id);

create policy "user_scrims_update_own" on public.user_scrims
  for update using (auth.uid() = user_id);

create policy "user_scrims_delete_own" on public.user_scrims
  for delete using (auth.uid() = user_id);

-- tts_cache: service role only (no client policies)
create policy "tts_cache_no_client" on public.tts_cache
  for all using (false);

create policy "sandbox_sessions_select_own" on public.sandbox_sessions
  for select using (auth.uid() = user_id);

create policy "sandbox_sessions_insert_own" on public.sandbox_sessions
  for insert with check (auth.uid() = user_id);

create policy "sandbox_sessions_update_own" on public.sandbox_sessions
  for update using (auth.uid() = user_id);

create policy "sandbox_sessions_delete_own" on public.sandbox_sessions
  for delete using (auth.uid() = user_id);
