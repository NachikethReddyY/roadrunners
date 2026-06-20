alter table public.journey_nodes
  add column if not exists is_fallback boolean not null default false;

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
    is_fallback
  ) values (
    p_journey_id,
    p_parent_id,
    p_node->>'skill_tag',
    p_node->>'title',
    p_node->>'content_md',
    coalesce(p_node->>'node_type', 'choice'),
    p_is_fallback
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
