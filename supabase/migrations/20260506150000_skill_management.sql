create or replace function chronos.make_skill_slug(
  p_user_id uuid,
  p_name text,
  p_excluding_skill_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = chronos, public, pg_temp
as $$
declare
  v_base text;
  v_candidate text;
  v_suffix integer := 2;
begin
  v_base := regexp_replace(lower(coalesce(p_name, 'tracker')), '[^a-z0-9]+', '-', 'g');
  v_base := trim(both '-' from v_base);

  if v_base = '' then
    v_base := 'tracker';
  end if;

  v_candidate := left(v_base, 48);

  while exists (
    select 1
    from chronos.skills sk
    where sk.user_id = p_user_id
      and sk.slug = v_candidate
      and (p_excluding_skill_id is null or sk.id <> p_excluding_skill_id)
  ) loop
    v_candidate := left(v_base, 42) || '-' || v_suffix;
    v_suffix := v_suffix + 1;
  end loop;

  return v_candidate;
end;
$$;

create or replace function chronos.create_skill(
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

  if v_name is null then
    return jsonb_build_object('success', false, 'error', 'Name is required.');
  end if;

  insert into chronos.skills (
    user_id,
    slug,
    name,
    icon_key,
    accent_key,
    visibility,
    is_downtime,
    sort_order
  )
  values (
    v_user_id,
    chronos.make_skill_slug(v_user_id, v_name),
    v_name,
    nullif(trim(coalesce(p_icon_key, 'sparkles')), ''),
    nullif(trim(coalesce(p_accent_key, 'coral')), ''),
    v_visibility,
    false,
    coalesce((select max(sk.sort_order) + 10 from chronos.skills sk where sk.user_id = v_user_id and sk.is_downtime = false), 10)
  )
  returning * into v_skill;

  insert into chronos.audit_events (user_id, action, entity_type, entity_id, metadata)
  values (
    v_user_id,
    'create_skill',
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
      slug = chronos.make_skill_slug(v_user_id, v_name, p_skill_id),
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

create or replace function chronos.delete_skill(p_skill_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = chronos, public, auth, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_owner boolean;
  v_skill chronos.skills%rowtype;
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

  select *
  into v_skill
  from chronos.skills sk
  where sk.id = p_skill_id
    and sk.user_id = v_user_id
    and sk.archived_at is null
    and sk.is_downtime = false
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Dashboard card not found.');
  end if;

  if exists (
    select 1
    from chronos.sessions se
    where se.skill_id = v_skill.id
      and se.user_id = v_user_id
      and se.ended_at is null
  ) then
    return jsonb_build_object('success', false, 'error', 'Stop the active timer before deleting this card.');
  end if;

  update chronos.skills sk
  set archived_at = now()
  where sk.id = v_skill.id
  returning * into v_skill;

  insert into chronos.audit_events (user_id, action, entity_type, entity_id, metadata)
  values (
    v_user_id,
    'delete_skill',
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
      'archived_at', v_skill.archived_at
    )
  );
end;
$$;

create or replace function chronos.ensure_default_skills()
returns jsonb
language plpgsql
security definer
set search_path = chronos, public, auth, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_owner boolean;
  v_skills jsonb;
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

  update chronos.skills sk
  set slug = 'downtime',
      name = 'Downtime',
      icon_key = coalesce(sk.icon_key, 'clock'),
      accent_key = coalesce(sk.accent_key, 'downtime'),
      visibility = 'private',
      is_downtime = true,
      sort_order = 999,
      archived_at = null
  where sk.user_id = v_user_id
    and sk.is_downtime = true
    and sk.slug <> 'downtime'
    and not exists (
      select 1
      from chronos.skills existing
      where existing.user_id = v_user_id
        and existing.slug = 'downtime'
    );

  with default_skills(slug, name, icon_key, accent_key, visibility, is_downtime, sort_order) as (
    values
      ('coding', 'Coding', 'code', 'coral', 'public'::chronos.skill_visibility, false, 10),
      ('fitness', 'Fitness', 'dumbbell', 'blue', 'public'::chronos.skill_visibility, false, 20),
      ('business', 'Business', 'briefcase', 'amber', 'public'::chronos.skill_visibility, false, 30),
      ('content', 'Content', 'pencil', 'violet', 'public'::chronos.skill_visibility, false, 40),
      ('research', 'Research', 'search', 'teal', 'public'::chronos.skill_visibility, false, 50),
      ('learning', 'Learning', 'book', 'indigo', 'public'::chronos.skill_visibility, false, 60),
      ('downtime', 'Downtime', 'alarm', 'coral', 'private'::chronos.skill_visibility, true, 999)
  ),
  upserted as (
    insert into chronos.skills (
      user_id,
      slug,
      name,
      icon_key,
      accent_key,
      visibility,
      is_downtime,
      sort_order,
      archived_at
    )
    select
      v_user_id,
      ds.slug,
      ds.name,
      ds.icon_key,
      ds.accent_key,
      ds.visibility,
      ds.is_downtime,
      ds.sort_order,
      null::timestamptz
    from default_skills ds
    on conflict (user_id, slug) do update
      set name = excluded.name,
          icon_key = excluded.icon_key,
          accent_key = excluded.accent_key,
          visibility = excluded.visibility,
          is_downtime = excluded.is_downtime,
          sort_order = excluded.sort_order
    returning id, slug, name, visibility, is_downtime, sort_order, archived_at
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', u.id,
        'slug', u.slug,
        'name', u.name,
        'visibility', u.visibility,
        'is_downtime', u.is_downtime,
        'sort_order', u.sort_order,
        'archived_at', u.archived_at
      )
      order by u.sort_order, u.name
    ),
    '[]'::jsonb
  )
  into v_skills
  from upserted u;

  return jsonb_build_object('success', true, 'skills', v_skills);
exception
  when unique_violation then
    return jsonb_build_object('success', false, 'error', 'Default skills could not be ensured because a conflicting downtime skill exists.');
end;
$$;

revoke all on function chronos.make_skill_slug(uuid, text, uuid) from public;
revoke all on function chronos.create_skill(text, text, text, text) from public;
revoke all on function chronos.update_skill(uuid, text, text, text, text) from public;
revoke all on function chronos.delete_skill(uuid) from public;

grant execute on function chronos.create_skill(text, text, text, text) to authenticated, service_role;
grant execute on function chronos.update_skill(uuid, text, text, text, text) to authenticated, service_role;
grant execute on function chronos.delete_skill(uuid) to authenticated, service_role;
