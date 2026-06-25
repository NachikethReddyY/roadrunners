-- Task 3 — Platform contracts, completion, coverage, and RLS hardening

-- ============================================================
-- 1. Extend journey_nodes with checkpoint metadata
-- ============================================================

alter table public.journey_nodes
  add column if not exists checkpoint_mode text
    check (checkpoint_mode in ('guide', 'scrim', 'build', 'choice', 'milestone')),
  add column if not exists controlled_concepts text[] not null default '{}',
  add column if not exists prerequisite_node_ids uuid[] not null default '{}',
  add column if not exists feature_outcome text,
  add column if not exists verification_entrypoint text;

-- ============================================================
-- 2. Extend journey_choices with full FeatureChoice contract fields
-- ============================================================

alter table public.journey_choices
  add column if not exists concepts text[] not null default '{}',
  add column if not exists prerequisites text[] not null default '{}',
  add column if not exists estimated_minutes integer,
  add column if not exists suggested_mode text
    check (suggested_mode in ('guide', 'scrim', 'build')),
  add column if not exists project_contribution text not null default '',
  add column if not exists is_pivot boolean not null default false,
  add column if not exists availability text not null default 'unlocked'
    check (availability in ('unlocked', 'deferred', 'locked')),
  add column if not exists offer_batch_id uuid;  -- FK added after table creation below

-- ============================================================
-- 3. Choice offer batches — deduplication and offer history
-- ============================================================

create table if not exists public.choice_offer_batches (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys(id) on delete cascade,
  node_id uuid not null references public.journey_nodes(id) on delete cascade,
  -- md5 of sorted "skill_tag:label" pairs; prevents re-offering identical sets
  offer_fingerprint text not null,
  offered_at timestamptz not null default now(),
  unique (journey_id, node_id, offer_fingerprint)
);

alter table public.journey_choices
  add constraint journey_choices_offer_batch_fk
  foreign key (offer_batch_id) references public.choice_offer_batches(id) on delete set null;

-- ============================================================
-- 4. Verification evidence — objective evidence separate from AI advisory
-- ============================================================

create table if not exists public.verification_evidence (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys(id) on delete cascade,
  node_id uuid not null references public.journey_nodes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Execution state
  runs boolean not null,
  exit_code integer,
  timed_out boolean not null default false,
  -- Bounded output (never unbounded raw source)
  stdout_summary text,
  stderr_summary text,
  -- Objective evidence
  objective_fulfillment text not null
    check (objective_fulfillment in ('pass', 'fail', 'inconclusive')),
  fulfills boolean not null default false,
  infrastructure_error boolean not null default false,
  verification_reason text not null default '',
  entrypoint text,
  -- AI advisory stored separately from objective evidence
  ai_plausible boolean,
  ai_reason text,
  recorded_at timestamptz not null default now()
);

-- ============================================================
-- 5. Checkpoint completions — distinct from decisions and recovery snapshots
-- ============================================================

create table if not exists public.checkpoint_completions (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys(id) on delete cascade,
  node_id uuid not null references public.journey_nodes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completion_basis text not null
    check (completion_basis in ('objective', 'user_confirmed', 'acknowledgment')),
  verification_evidence_id uuid
    references public.verification_evidence(id) on delete set null,
  completed_at timestamptz not null default now(),
  -- One completion record per checkpoint; ON CONFLICT DO NOTHING enforces idempotency
  unique (journey_id, node_id)
);

-- ============================================================
-- 6. Concept coverage
-- ============================================================

create table if not exists public.concept_coverage (
  id uuid primary key default gen_random_uuid(),
  journey_id uuid not null references public.journeys(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  concept_tag text not null,
  coverage_state text not null
    check (coverage_state in ('introduced', 'practiced', 'verified')),
  updated_at timestamptz not null default now(),
  -- Highest achieved state wins; upsert on (journey_id, concept_tag)
  unique (journey_id, concept_tag)
);

-- ============================================================
-- 7. Indexes — new tables + missing FK indexes from 001–004
-- ============================================================

-- New tables
create index if not exists choice_offer_batches_journey_node_idx
  on public.choice_offer_batches(journey_id, node_id);

create index if not exists journey_choices_offer_batch_idx
  on public.journey_choices(offer_batch_id);

create index if not exists verification_evidence_journey_node_idx
  on public.verification_evidence(journey_id, node_id);

create index if not exists verification_evidence_user_idx
  on public.verification_evidence(user_id);

create index if not exists checkpoint_completions_journey_node_idx
  on public.checkpoint_completions(journey_id, node_id);

create index if not exists checkpoint_completions_user_idx
  on public.checkpoint_completions(user_id);

create index if not exists concept_coverage_journey_idx
  on public.concept_coverage(journey_id);

create index if not exists concept_coverage_user_idx
  on public.concept_coverage(user_id);

-- Missing FK/RLS indexes from 001–004
create index if not exists journey_nodes_parent_id_idx
  on public.journey_nodes(parent_id);

create index if not exists decisions_node_id_idx
  on public.decisions(node_id);

create index if not exists sandbox_sessions_journey_id_idx
  on public.sandbox_sessions(journey_id);

create index if not exists sandbox_sessions_node_id_idx
  on public.sandbox_sessions(node_id);

create index if not exists user_scrims_journey_id_idx
  on public.user_scrims(journey_id);

create index if not exists scrim_checkpoints_journey_id_idx
  on public.scrim_checkpoints(journey_id);

-- ============================================================
-- 8. RLS for new tables
-- ============================================================

alter table public.choice_offer_batches enable row level security;
alter table public.verification_evidence enable row level security;
alter table public.checkpoint_completions enable row level security;
alter table public.concept_coverage enable row level security;

-- choice_offer_batches: ownership via journey
create policy "choice_offer_batches_select_own" on public.choice_offer_batches
  for select to authenticated using (
    exists (
      select 1 from public.journeys j
      where j.id = choice_offer_batches.journey_id
        and j.user_id = (select auth.uid())
    )
  );

create policy "choice_offer_batches_insert_own" on public.choice_offer_batches
  for insert to authenticated with check (
    exists (
      select 1 from public.journeys j
      where j.id = choice_offer_batches.journey_id
        and j.user_id = (select auth.uid())
    )
  );

-- verification_evidence: direct ownership
create policy "verification_evidence_select_own" on public.verification_evidence
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "verification_evidence_insert_own" on public.verification_evidence
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- checkpoint_completions: direct ownership
create policy "checkpoint_completions_select_own" on public.checkpoint_completions
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "checkpoint_completions_insert_own" on public.checkpoint_completions
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- concept_coverage: direct ownership, promote-only via upsert
create policy "concept_coverage_select_own" on public.concept_coverage
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "concept_coverage_insert_own" on public.concept_coverage
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "concept_coverage_update_own" on public.concept_coverage
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================
-- 9. Harden existing RLS policies
--    Switch bare auth.uid() to (select auth.uid()) and add WITH CHECK
--    to all UPDATE policies that were missing it.
-- ============================================================

-- profiles
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- journeys: re-create all three to use (select auth.uid())
drop policy if exists "journeys_select_own" on public.journeys;
create policy "journeys_select_own" on public.journeys
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "journeys_insert_own" on public.journeys;
create policy "journeys_insert_own" on public.journeys
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "journeys_update_own" on public.journeys;
create policy "journeys_update_own" on public.journeys
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- journey_nodes UPDATE: add WITH CHECK and switch to (select auth.uid())
drop policy if exists "journey_nodes_update_own" on public.journey_nodes;
create policy "journey_nodes_update_own" on public.journey_nodes
  for update to authenticated
  using (
    exists (
      select 1 from public.journeys j
      where j.id = journey_nodes.journey_id
        and j.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.journeys j
      where j.id = journey_nodes.journey_id
        and j.user_id = (select auth.uid())
    )
  );

-- decisions: add UPDATE policy with WITH CHECK (was missing entirely)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'decisions' and policyname = 'decisions_update_own'
  ) then
    execute $p$
      create policy "decisions_update_own" on public.decisions
        for update to authenticated
        using (
          exists (
            select 1 from public.journeys j
            where j.id = decisions.journey_id
              and j.user_id = (select auth.uid())
          )
        )
        with check (
          exists (
            select 1 from public.journeys j
            where j.id = decisions.journey_id
              and j.user_id = (select auth.uid())
          )
        )
    $p$;
  end if;
end;
$$;

-- workspace_snapshots UPDATE: add WITH CHECK
drop policy if exists "workspace_snapshots_update_own" on public.user_workspace_snapshots;
create policy "workspace_snapshots_update_own" on public.user_workspace_snapshots
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- sandbox_sessions UPDATE: add WITH CHECK
drop policy if exists "sandbox_sessions_update_own" on public.sandbox_sessions;
create policy "sandbox_sessions_update_own" on public.sandbox_sessions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- user_scrims UPDATE: add WITH CHECK
drop policy if exists "user_scrims_update_own" on public.user_scrims;
create policy "user_scrims_update_own" on public.user_scrims
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- scrim_checkpoints UPDATE: add WITH CHECK
drop policy if exists "scrim_checkpoints_update_own" on public.scrim_checkpoints;
create policy "scrim_checkpoints_update_own" on public.scrim_checkpoints
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================
-- 10. Updated persist_generated_node — handles richer FeatureChoice fields
-- ============================================================

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
  v_new_node_id uuid;
  v_choice jsonb;
  v_batch_id uuid;
  v_fingerprint text;
  v_choices jsonb;
begin
  if not exists (
    select 1 from public.journeys
    where id = p_journey_id and user_id = (select auth.uid())
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
    playground_config,
    checkpoint_mode,
    controlled_concepts,
    feature_outcome,
    verification_entrypoint
  ) values (
    p_journey_id,
    p_parent_id,
    p_node->>'skill_tag',
    p_node->>'title',
    p_node->>'content_md',
    coalesce(p_node->>'node_type', 'choice'),
    p_is_fallback,
    p_node->'playground',
    p_node->>'checkpoint_mode',
    coalesce(
      array(select jsonb_array_elements_text(p_node->'controlled_concepts')),
      '{}'::text[]
    ),
    p_node->>'feature_outcome',
    p_node->>'verification_entrypoint'
  ) returning id into v_new_node_id;

  v_choices := coalesce(p_node->'choices', '[]'::jsonb);

  if jsonb_array_length(v_choices) > 0 then
    select md5(string_agg(
      coalesce(c->>'target_skill_tag', '') || ':' || coalesce(c->>'label', c->>'title', ''),
      '|' order by coalesce(c->>'target_skill_tag', '')
    ))
    into v_fingerprint
    from jsonb_array_elements(v_choices) as c;

    insert into public.choice_offer_batches (journey_id, node_id, offer_fingerprint)
    values (p_journey_id, v_new_node_id, coalesce(v_fingerprint, 'empty'))
    on conflict (journey_id, node_id, offer_fingerprint) do update
      set offered_at = now()
    returning id into v_batch_id;

    for v_choice in select value from jsonb_array_elements(v_choices)
    loop
      insert into public.journey_choices (
        node_id,
        label,
        description,
        target_skill_tag,
        concepts,
        prerequisites,
        estimated_minutes,
        suggested_mode,
        project_contribution,
        is_pivot,
        availability,
        offer_batch_id
      ) values (
        v_new_node_id,
        coalesce(v_choice->>'label', v_choice->>'title', 'Continue'),
        v_choice->>'description',
        coalesce(v_choice->>'target_skill_tag', ''),
        coalesce(
          array(select jsonb_array_elements_text(v_choice->'concepts')),
          '{}'::text[]
        ),
        coalesce(
          array(select jsonb_array_elements_text(v_choice->'prerequisites')),
          '{}'::text[]
        ),
        (v_choice->>'estimated_minutes')::integer,
        v_choice->>'suggested_mode',
        coalesce(v_choice->>'project_contribution', ''),
        coalesce((v_choice->>'is_pivot')::boolean, false),
        coalesce(v_choice->>'availability', 'unlocked'),
        v_batch_id
      );
    end loop;
  end if;

  update public.journeys
  set current_node_id = v_new_node_id, updated_at = now()
  where id = p_journey_id and user_id = (select auth.uid());

  return v_new_node_id;
end;
$$;

revoke all on function public.persist_generated_node(uuid, uuid, jsonb, boolean) from public;
grant execute on function public.persist_generated_node(uuid, uuid, jsonb, boolean) to authenticated;

-- ============================================================
-- 11. complete_checkpoint RPC — idempotent, atomic
-- ============================================================

create or replace function public.complete_checkpoint(
  p_journey_id uuid,
  p_node_id uuid,
  p_basis text,
  p_verification_evidence_id uuid default null
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_completion_id uuid;
  v_uid uuid;
begin
  v_uid := (select auth.uid());

  if not exists (
    select 1 from public.journeys
    where id = p_journey_id and user_id = v_uid
  ) then
    raise exception 'Journey not found';
  end if;

  if p_basis not in ('objective', 'user_confirmed', 'acknowledgment') then
    raise exception 'Invalid completion basis';
  end if;

  -- Verify evidence belongs to this user/node if provided
  if p_verification_evidence_id is not null and not exists (
    select 1 from public.verification_evidence
    where id = p_verification_evidence_id
      and journey_id = p_journey_id
      and node_id = p_node_id
      and user_id = v_uid
  ) then
    raise exception 'Verification evidence not found';
  end if;

  insert into public.checkpoint_completions (
    journey_id, node_id, user_id, completion_basis, verification_evidence_id
  ) values (
    p_journey_id, p_node_id, v_uid, p_basis, p_verification_evidence_id
  )
  on conflict (journey_id, node_id) do nothing
  returning id into v_completion_id;

  return v_completion_id;
end;
$$;

revoke all on function public.complete_checkpoint(uuid, uuid, text, uuid) from public;
grant execute on function public.complete_checkpoint(uuid, uuid, text, uuid) to authenticated;

-- ============================================================
-- 12. upsert_concept_coverage RPC — promote-only, never demotes
-- ============================================================

create or replace function public.upsert_concept_coverage(
  p_journey_id uuid,
  p_concept_tag text,
  p_state text
)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_uid uuid;
  v_new_order int;
  v_old_order int;
  v_old_state text;
begin
  v_uid := (select auth.uid());

  if not exists (
    select 1 from public.journeys
    where id = p_journey_id and user_id = v_uid
  ) then
    raise exception 'Journey not found';
  end if;

  if p_state not in ('introduced', 'practiced', 'verified') then
    raise exception 'Invalid coverage state';
  end if;

  v_new_order := case p_state
    when 'introduced' then 1
    when 'practiced'  then 2
    when 'verified'   then 3
  end;

  select coverage_state into v_old_state
  from public.concept_coverage
  where journey_id = p_journey_id and concept_tag = p_concept_tag;

  v_old_order := case v_old_state
    when 'introduced' then 1
    when 'practiced'  then 2
    when 'verified'   then 3
    else 0
  end;

  if v_new_order > v_old_order then
    insert into public.concept_coverage (journey_id, user_id, concept_tag, coverage_state)
    values (p_journey_id, v_uid, p_concept_tag, p_state)
    on conflict (journey_id, concept_tag) do update
      set coverage_state = excluded.coverage_state,
          updated_at     = now();
  end if;
end;
$$;

revoke all on function public.upsert_concept_coverage(uuid, text, text) from public;
grant execute on function public.upsert_concept_coverage(uuid, text, text) to authenticated;
