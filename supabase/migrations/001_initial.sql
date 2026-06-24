-- RoadRunners initial schema + RLS

create extension if not exists "pgcrypto";

-- profiles
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  xp integer not null default 0 check (xp >= 0),
  level integer not null default 1 check (level >= 1),
  streak_days integer not null default 0 check (streak_days >= 0),
  last_activity_at timestamptz,
  onboarding_complete boolean not null default false,
  goal text,
  interests text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- skill catalog
create table if not exists public.skill_catalog (
  slug text primary key,
  name text not null,
  category text not null check (category in ('web', 'mobile', 'data', 'ai', 'devops', 'explore')),
  icon text
);

-- journeys
create table if not exists public.journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  goal text not null,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  current_node_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- journey nodes
create table if not exists public.journey_nodes (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys(id) on delete cascade,
  parent_id uuid references public.journey_nodes(id) on delete set null,
  skill_tag text not null,
  title text not null,
  content_md text not null,
  node_type text not null default 'choice' check (node_type in ('lesson', 'choice', 'milestone')),
  xp_value integer not null default 50 check (xp_value >= 0),
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.journeys
  add constraint journeys_current_node_id_fkey
  foreign key (current_node_id) references public.journey_nodes(id) on delete set null;

-- journey choices
create table if not exists public.journey_choices (
  id uuid primary key default gen_random_uuid(),
  node_id uuid not null references public.journey_nodes(id) on delete cascade,
  label text not null,
  description text,
  target_skill_tag text not null
);

-- decisions (idempotent per node)
create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys(id) on delete cascade,
  node_id uuid not null references public.journey_nodes(id) on delete cascade,
  choice_id uuid references public.journey_choices(id) on delete set null,
  decided_at timestamptz not null default now(),
  unique (journey_id, node_id)
);

-- indexes
create index if not exists journeys_user_id_idx on public.journeys(user_id);
create index if not exists journey_nodes_journey_id_idx on public.journey_nodes(journey_id);
create index if not exists journey_choices_node_id_idx on public.journey_choices(node_id);
create index if not exists decisions_journey_id_idx on public.decisions(journey_id);

-- RLS
alter table public.profiles enable row level security;
alter table public.journeys enable row level security;
alter table public.journey_nodes enable row level security;
alter table public.journey_choices enable row level security;
alter table public.decisions enable row level security;
alter table public.skill_catalog enable row level security;

-- profiles policies
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id);

-- journeys policies
create policy "journeys_select_own" on public.journeys for select using (auth.uid() = user_id);
create policy "journeys_insert_own" on public.journeys for insert with check (auth.uid() = user_id);
create policy "journeys_update_own" on public.journeys for update using (auth.uid() = user_id);

-- journey_nodes policies (nested via journeys)
create policy "journey_nodes_select_own" on public.journey_nodes for select using (
  exists (
    select 1 from public.journeys j
    where j.id = journey_nodes.journey_id and j.user_id = auth.uid()
  )
);
create policy "journey_nodes_insert_own" on public.journey_nodes for insert with check (
  exists (
    select 1 from public.journeys j
    where j.id = journey_nodes.journey_id and j.user_id = auth.uid()
  )
);
create policy "journey_nodes_update_own" on public.journey_nodes for update using (
  exists (
    select 1 from public.journeys j
    where j.id = journey_nodes.journey_id and j.user_id = auth.uid()
  )
);

-- journey_choices policies (nested via nodes → journeys)
create policy "journey_choices_select_own" on public.journey_choices for select using (
  exists (
    select 1 from public.journey_nodes n
    join public.journeys j on j.id = n.journey_id
    where n.id = journey_choices.node_id and j.user_id = auth.uid()
  )
);
create policy "journey_choices_insert_own" on public.journey_choices for insert with check (
  exists (
    select 1 from public.journey_nodes n
    join public.journeys j on j.id = n.journey_id
    where n.id = journey_choices.node_id and j.user_id = auth.uid()
  )
);

-- decisions policies
create policy "decisions_select_own" on public.decisions for select using (
  exists (
    select 1 from public.journeys j
    where j.id = decisions.journey_id and j.user_id = auth.uid()
  )
);
create policy "decisions_insert_own" on public.decisions for insert with check (
  exists (
    select 1 from public.journeys j
    where j.id = decisions.journey_id and j.user_id = auth.uid()
  )
);

-- skill catalog public read
create policy "skill_catalog_public_read" on public.skill_catalog for select using (true);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

revoke all on function public.handle_new_user() from public, anon, authenticated;
