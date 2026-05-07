create or replace function chronos.update_skill(
  p_skill_id uuid,
  p_name text,
  p_icon_key text default 'sparkles',
  p_accent_key text default 'coral',
  p_visibility text default 'public'
)
returns jsonb
language plpgsql
security definer
set search_path = chronos, public, auth, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_owner boolean;
  v_skill chronos.skills%rowtype;
  v_name text := nullif(trim(coalesce(p_name, '')), '');
  v_visibility chronos.skill_visibility := case when p_visibility = 'private' then 'private'::chronos.skill_visibility else 'public'::chronos.skill_visibility end;
begin
  select exists (
    select 1
    from chronos.users u
    where u.id = v_user_id
      and u.access_status = 'active'
      and u.is_owner = true
  )
  into v_is_owner;

  if not coalesce(v_is_owner, false) then
    return jsonb_build_object('success', false, 'error', 'Chronos admin access is required.');
  end if;

  if p_skill_id is null then
    return jsonb_build_object('success', false, 'error', 'Skill is required.');
  end if;

  if v_name is null then
    return jsonb_build_object('success', false, 'error', 'Name is required.');
  end if;

  update chronos.skills sk
  set name = v_name,
      icon_key = nullif(trim(coalesce(p_icon_key, 'sparkles')), ''),
      accent_key = nullif(trim(coalesce(p_accent_key, 'coral')), ''),
      visibility = v_visibility
  where sk.id = p_skill_id
    and sk.user_id = v_user_id
    and sk.archived_at is null
    and sk.is_downtime = false
  returning * into v_skill;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Dashboard card not found.');
  end if;

  insert into chronos.audit_events (user_id, action, entity_type, entity_id, metadata)
  values (
    v_user_id,
    'update_skill',
    'skill',
    v_skill.id,
    jsonb_build_object('skill_slug', v_skill.slug, 'name', v_skill.name)
  );

  return jsonb_build_object(
    'success', true,
    'skill', jsonb_build_object(
      'id', v_skill.id,
      'slug', v_skill.slug,
      'name', v_skill.name,
      'icon_key', v_skill.icon_key,
      'accent_key', v_skill.accent_key,
      'visibility', v_skill.visibility
    )
  );
end;
$$;

revoke all on function chronos.update_skill(uuid, text, text, text, text) from public;
grant execute on function chronos.update_skill(uuid, text, text, text, text) to authenticated, service_role;
