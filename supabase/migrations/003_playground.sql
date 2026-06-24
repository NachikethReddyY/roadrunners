-- Interactive playground: scrims, node configs, workspace snapshots

alter table public.journey_nodes
  add column if not exists playground_config jsonb;

alter table public.journey_nodes
  drop constraint if exists journey_nodes_node_type_check;

alter table public.journey_nodes
  add constraint journey_nodes_node_type_check
  check (node_type in ('lesson', 'choice', 'milestone', 'interactive'));

-- curated flagship lessons (Scrimba-style timelines)
create table if not exists public.lesson_scrims (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  skill_tag text not null references public.skill_catalog(slug),
  template text not null check (template in ('vanilla', 'react-ts', 'python')),
  initial_files jsonb not null default '{}',
  timeline jsonb not null default '{"durationMs":0,"events":[]}',
  slides jsonb not null default '[]',
  duration_ms integer not null default 0 check (duration_ms >= 0),
  created_at timestamptz not null default now()
);

create index if not exists lesson_scrims_skill_tag_idx on public.lesson_scrims(skill_tag);

-- persist user edits across pause/refresh
create table if not exists public.user_workspace_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journey_id uuid references public.journeys(id) on delete cascade,
  node_id uuid references public.journey_nodes(id) on delete cascade,
  scrim_id uuid references public.lesson_scrims(id) on delete cascade,
  files jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  constraint workspace_snapshot_target check (
    (node_id is not null and scrim_id is null)
    or (node_id is null and scrim_id is not null)
  ),
  unique (user_id, node_id),
  unique (user_id, scrim_id)
);

create index if not exists user_workspace_snapshots_user_id_idx
  on public.user_workspace_snapshots(user_id);

-- RLS
alter table public.lesson_scrims enable row level security;
alter table public.user_workspace_snapshots enable row level security;

create policy "lesson_scrims_public_read" on public.lesson_scrims
  for select using (true);

create policy "workspace_snapshots_select_own" on public.user_workspace_snapshots
  for select using (auth.uid() = user_id);

create policy "workspace_snapshots_insert_own" on public.user_workspace_snapshots
  for insert with check (auth.uid() = user_id);

create policy "workspace_snapshots_update_own" on public.user_workspace_snapshots
  for update using (auth.uid() = user_id);

create policy "workspace_snapshots_delete_own" on public.user_workspace_snapshots
  for delete using (auth.uid() = user_id);

-- persist playground_config from AI-generated interactive nodes
create or replace function public.persist_generated_node(
  p_journey_id uuid,
  p_parent_id uuid,
  p_node jsonb,
  p_is_fallback boolean default false
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  new_node_id uuid;
  choice jsonb;
begin
  if not exists (
    select 1 from public.journeys
    where id = p_journey_id and user_id = auth.uid()
  ) then
    raise exception 'Journey not found';
  end if;

  if p_parent_id is not null and not exists (
    select 1 from public.journey_nodes
    where id = p_parent_id and journey_id = p_journey_id
  ) then
    raise exception 'Parent node does not belong to journey';
  end if;

  insert into public.journey_nodes (
    journey_id,
    parent_id,
    skill_tag,
    title,
    content_md,
    node_type,
    is_fallback,
    playground_config
  ) values (
    p_journey_id,
    p_parent_id,
    p_node->>'skill_tag',
    p_node->>'title',
    p_node->>'content_md',
    coalesce(p_node->>'node_type', 'choice'),
    p_is_fallback,
    p_node->'playground'
  ) returning id into new_node_id;

  for choice in select value from jsonb_array_elements(p_node->'choices')
  loop
    insert into public.journey_choices (
      node_id,
      label,
      description,
      target_skill_tag
    ) values (
      new_node_id,
      choice->>'label',
      choice->>'description',
      choice->>'target_skill_tag'
    );
  end loop;

  update public.journeys
  set current_node_id = new_node_id, updated_at = now()
  where id = p_journey_id and user_id = auth.uid();

  return new_node_id;
end;
$$;

revoke all on function public.persist_generated_node(uuid, uuid, jsonb, boolean) from public;
grant execute on function public.persist_generated_node(uuid, uuid, jsonb, boolean) to authenticated;
