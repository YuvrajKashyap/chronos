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
      ('coding', 'Coding', 'code', 'coding', 'public'::chronos.skill_visibility, false, 10),
      ('fitness', 'Fitness', 'dumbbell', 'fitness', 'public'::chronos.skill_visibility, false, 20),
      ('business', 'Business', 'briefcase', 'business', 'public'::chronos.skill_visibility, false, 30),
      ('content', 'Content', 'pencil', 'content', 'public'::chronos.skill_visibility, false, 40),
      ('research', 'Research', 'search', 'research', 'public'::chronos.skill_visibility, false, 50),
      ('learning', 'Learning', 'book', 'learning', 'public'::chronos.skill_visibility, false, 60),
      ('downtime', 'Downtime', 'clock', 'downtime', 'private'::chronos.skill_visibility, true, 999)
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
          sort_order = excluded.sort_order,
          archived_at = null
    returning id, slug, name, visibility, is_downtime, sort_order
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', u.id,
        'slug', u.slug,
        'name', u.name,
        'visibility', u.visibility,
        'is_downtime', u.is_downtime,
        'sort_order', u.sort_order
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

create or replace function chronos.start_timer(
  p_skill_id uuid,
  p_started_at timestamptz default now(),
  p_note text default null
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
  v_session chronos.sessions%rowtype;
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

  select *
  into v_skill
  from chronos.skills sk
  where sk.id = p_skill_id
    and sk.user_id = v_user_id;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Skill not found.');
  end if;

  if v_skill.archived_at is not null then
    return jsonb_build_object('success', false, 'error', 'Archived skills cannot start timers.');
  end if;

  if exists (
    select 1
    from chronos.sessions se
    where se.user_id = v_user_id
      and se.ended_at is null
  ) then
    return jsonb_build_object('success', false, 'error', 'A timer is already active.');
  end if;

  insert into chronos.sessions (
    user_id,
    skill_id,
    started_at,
    ended_at,
    source,
    note,
    is_private
  )
  values (
    v_user_id,
    v_skill.id,
    coalesce(p_started_at, now()),
    null,
    'timer',
    p_note,
    v_skill.visibility <> 'public' or v_skill.is_downtime
  )
  returning * into v_session;

  insert into chronos.audit_events (user_id, action, entity_type, entity_id, metadata)
  values (
    v_user_id,
    'start_timer',
    'session',
    v_session.id,
    jsonb_build_object('skill_id', v_skill.id, 'skill_slug', v_skill.slug)
  );

  return jsonb_build_object(
    'success', true,
    'session', jsonb_build_object(
      'id', v_session.id,
      'skill_id', v_session.skill_id,
      'started_at', v_session.started_at,
      'ended_at', v_session.ended_at,
      'is_private', v_session.is_private
    )
  );
exception
  when unique_violation then
    return jsonb_build_object('success', false, 'error', 'A timer is already active.');
end;
$$;

create or replace function chronos.stop_timer(p_ended_at timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path = chronos, public, auth, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_owner boolean;
  v_session chronos.sessions%rowtype;
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

  select *
  into v_session
  from chronos.sessions se
  where se.user_id = v_user_id
    and se.ended_at is null
  order by se.started_at asc
  limit 1
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'No active timer exists.');
  end if;

  if coalesce(p_ended_at, now()) <= v_session.started_at then
    return jsonb_build_object('success', false, 'error', 'Stop time must be after the start time.');
  end if;

  update chronos.sessions se
  set ended_at = coalesce(p_ended_at, now())
  where se.id = v_session.id
  returning * into v_session;

  insert into chronos.audit_events (user_id, action, entity_type, entity_id, metadata)
  values (
    v_user_id,
    'stop_timer',
    'session',
    v_session.id,
    jsonb_build_object('skill_id', v_session.skill_id, 'ended_at', v_session.ended_at)
  );

  return jsonb_build_object(
    'success', true,
    'session', jsonb_build_object(
      'id', v_session.id,
      'skill_id', v_session.skill_id,
      'started_at', v_session.started_at,
      'ended_at', v_session.ended_at,
      'is_private', v_session.is_private
    )
  );
end;
$$;

create or replace function chronos.get_admin_timer_state()
returns jsonb
language plpgsql
stable
security definer
set search_path = chronos, public, auth, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_user chronos.users%rowtype;
  v_payload jsonb;
begin
  select *
  into v_user
  from chronos.users u
  where u.id = v_user_id
    and u.access_status = 'active'
    and u.is_owner = true;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Chronos admin access is required.');
  end if;

  with skill_rollups as (
    select
      sk.id as skill_id,
      coalesce(sum(greatest(0, extract(epoch from least(coalesce(se.ended_at, now()), now()) - se.started_at)))::bigint, 0) as lifetime_seconds
    from chronos.skills sk
    left join chronos.sessions se on se.skill_id = sk.id
      and se.user_id = v_user_id
    where sk.user_id = v_user_id
    group by sk.id
  ),
  active as (
    select
      se.id,
      se.skill_id,
      sk.slug as skill_slug,
      sk.name as skill_name,
      sk.is_downtime,
      sk.visibility,
      se.started_at,
      se.is_private,
      greatest(0, extract(epoch from now() - se.started_at))::bigint as current_active_elapsed_seconds
    from chronos.sessions se
    join chronos.skills sk on sk.id = se.skill_id
    where se.user_id = v_user_id
      and se.ended_at is null
    order by se.started_at asc
    limit 1
  ),
  skills_json as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', sk.id,
          'slug', sk.slug,
          'name', sk.name,
          'description', sk.description,
          'icon_key', sk.icon_key,
          'accent_key', sk.accent_key,
          'accent_color', sk.accent_color,
          'visibility', sk.visibility,
          'is_downtime', sk.is_downtime,
          'sort_order', sk.sort_order,
          'archived_at', sk.archived_at,
          'lifetime_seconds', coalesce(sr.lifetime_seconds, 0),
          'active_session_started_at', a.started_at,
          'current_active_elapsed_seconds', a.current_active_elapsed_seconds
        )
        order by sk.sort_order asc, sk.name asc
      ),
      '[]'::jsonb
    ) as skills
    from chronos.skills sk
    left join skill_rollups sr on sr.skill_id = sk.id
    left join active a on a.skill_id = sk.id
    where sk.user_id = v_user_id
      and sk.archived_at is null
  ),
  recent_json as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', recent.id,
          'skill_id', recent.skill_id,
          'skill_name', recent.skill_name,
          'started_at', recent.started_at,
          'ended_at', recent.ended_at,
          'source', recent.source,
          'is_private', recent.is_private,
          'duration_seconds', recent.duration_seconds
        )
        order by recent.started_at desc
      ),
      '[]'::jsonb
    ) as recent_sessions
    from (
      select
        se.id,
        se.skill_id,
        sk.name as skill_name,
        se.started_at,
        se.ended_at,
        se.source,
        se.is_private,
        greatest(0, extract(epoch from least(coalesce(se.ended_at, now()), now()) - se.started_at))::bigint as duration_seconds
      from chronos.sessions se
      join chronos.skills sk on sk.id = se.skill_id
      where se.user_id = v_user_id
      order by se.started_at desc
      limit 10
    ) recent
  )
  select jsonb_build_object(
    'success', true,
    'generated_at', now(),
    'user', jsonb_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'display_name', v_user.display_name,
      'access_status', v_user.access_status,
      'is_owner', v_user.is_owner
    ),
    'skills', sj.skills,
    'active_session', (
      select jsonb_build_object(
        'id', a.id,
        'skill_id', a.skill_id,
        'skill_slug', a.skill_slug,
        'skill_name', a.skill_name,
        'is_downtime', a.is_downtime,
        'visibility', a.visibility,
        'started_at', a.started_at,
        'is_private', a.is_private,
        'current_active_elapsed_seconds', a.current_active_elapsed_seconds
      )
      from active a
      limit 1
    ),
    'recent_sessions', rj.recent_sessions
  )
  into v_payload
  from skills_json sj
  cross join recent_json rj;

  return v_payload;
end;
$$;

revoke all on function chronos.ensure_default_skills() from public;
revoke all on function chronos.start_timer(uuid, timestamptz, text) from public;
revoke all on function chronos.stop_timer(timestamptz) from public;
revoke all on function chronos.get_admin_timer_state() from public;

grant execute on function chronos.ensure_default_skills() to authenticated, service_role;
grant execute on function chronos.start_timer(uuid, timestamptz, text) to authenticated, service_role;
grant execute on function chronos.stop_timer(timestamptz) to authenticated, service_role;
grant execute on function chronos.get_admin_timer_state() to authenticated, service_role;
