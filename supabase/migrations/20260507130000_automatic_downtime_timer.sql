create or replace function chronos.ensure_downtime_timer(p_started_at timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path = chronos, public, auth, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_owner boolean;
  v_started_at timestamptz := coalesce(p_started_at, now());
  v_downtime_skill chronos.skills%rowtype;
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
  limit 1;

  if found then
    return jsonb_build_object(
      'success', true,
      'created', false,
      'session', jsonb_build_object(
        'id', v_session.id,
        'skill_id', v_session.skill_id,
        'started_at', v_session.started_at
      )
    );
  end if;

  select *
  into v_downtime_skill
  from chronos.skills sk
  where sk.user_id = v_user_id
    and sk.is_downtime = true
  order by sk.archived_at nulls first, sk.created_at asc
  limit 1
  for update;

  if found then
    update chronos.skills sk
    set slug = 'downtime',
        name = 'Downtime',
        icon_key = coalesce(sk.icon_key, 'clock'),
        accent_key = coalesce(sk.accent_key, 'downtime'),
        visibility = 'private',
        is_downtime = true,
        sort_order = 999,
        archived_at = null
    where sk.id = v_downtime_skill.id
    returning * into v_downtime_skill;
  else
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
      'downtime',
      'Downtime',
      'clock',
      'downtime',
      'private',
      true,
      999
    )
    returning * into v_downtime_skill;
  end if;

  insert into chronos.sessions (
    user_id,
    skill_id,
    started_at,
    ended_at,
    source,
    note,
    is_private,
    counts_toward_lifetime
  )
  values (
    v_user_id,
    v_downtime_skill.id,
    v_started_at,
    null,
    'system',
    'Automatic downtime',
    true,
    null
  )
  returning * into v_session;

  insert into chronos.audit_events (user_id, action, entity_type, entity_id, metadata)
  values (
    v_user_id,
    'start_downtime_timer',
    'session',
    v_session.id,
    jsonb_build_object('skill_id', v_session.skill_id, 'started_at', v_session.started_at)
  );

  return jsonb_build_object(
    'success', true,
    'created', true,
    'session', jsonb_build_object(
      'id', v_session.id,
      'skill_id', v_session.skill_id,
      'started_at', v_session.started_at
    )
  );
exception
  when unique_violation then
    return jsonb_build_object('success', false, 'error', 'A timer is already active.');
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
  v_started_at timestamptz := coalesce(p_started_at, now());
  v_skill chronos.skills%rowtype;
  v_active_session chronos.sessions%rowtype;
  v_active_skill chronos.skills%rowtype;
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

  if v_skill.is_downtime then
    return chronos.ensure_downtime_timer(v_started_at);
  end if;

  select se.*
  into v_active_session
  from chronos.sessions se
  where se.user_id = v_user_id
    and se.ended_at is null
  order by se.started_at asc
  limit 1
  for update;

  if found then
    select *
    into v_active_skill
    from chronos.skills sk
    where sk.id = v_active_session.skill_id;

    if not v_active_skill.is_downtime then
      return jsonb_build_object('success', false, 'error', 'A timer is already active.');
    end if;

    if v_started_at <= v_active_session.started_at then
      v_started_at := v_active_session.started_at + interval '1 millisecond';
    end if;

    update chronos.sessions se
    set ended_at = v_started_at,
        counts_toward_lifetime = true
    where se.id = v_active_session.id
    returning * into v_active_session;

    insert into chronos.audit_events (user_id, action, entity_type, entity_id, metadata)
    values (
      v_user_id,
      'stop_downtime_timer',
      'session',
      v_active_session.id,
      jsonb_build_object(
        'skill_id', v_active_session.skill_id,
        'ended_at', v_active_session.ended_at,
        'counts_toward_lifetime', true
      )
    );
  end if;

  insert into chronos.sessions (
    user_id,
    skill_id,
    started_at,
    ended_at,
    source,
    note,
    is_private,
    counts_toward_lifetime
  )
  values (
    v_user_id,
    v_skill.id,
    v_started_at,
    null,
    'timer',
    p_note,
    v_skill.visibility <> 'public',
    null
  )
  returning * into v_session;

  insert into chronos.audit_events (user_id, action, entity_type, entity_id, metadata)
  values (
    v_user_id,
    'start_timer',
    'session',
    v_session.id,
    jsonb_build_object('skill_id', v_session.skill_id, 'started_at', v_session.started_at)
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
  v_ended_at timestamptz := coalesce(p_ended_at, now());
  v_session chronos.sessions%rowtype;
  v_skill chronos.skills%rowtype;
  v_downtime_result jsonb;
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

  select se.*
  into v_session
  from chronos.sessions se
  where se.user_id = v_user_id
    and se.ended_at is null
  order by se.started_at asc
  limit 1
  for update;

  if not found then
    v_downtime_result := chronos.ensure_downtime_timer(v_ended_at);

    return jsonb_build_object(
      'success', true,
      'created_downtime', true,
      'downtime', v_downtime_result
    );
  end if;

  select *
  into v_skill
  from chronos.skills sk
  where sk.id = v_session.skill_id;

  if v_ended_at <= v_session.started_at then
    v_ended_at := v_session.started_at + interval '1 millisecond';
  end if;

  update chronos.sessions se
  set ended_at = v_ended_at,
      counts_toward_lifetime = case when v_skill.is_downtime then true else null end
  where se.id = v_session.id
  returning * into v_session;

  insert into chronos.audit_events (user_id, action, entity_type, entity_id, metadata)
  values (
    v_user_id,
    case when v_skill.is_downtime then 'stop_downtime_timer' else 'stop_timer' end,
    'session',
    v_session.id,
    jsonb_build_object(
      'skill_id', v_session.skill_id,
      'ended_at', v_session.ended_at,
      'counts_toward_lifetime', v_session.counts_toward_lifetime,
      'requires_lifetime_decision', not v_skill.is_downtime
    )
  );

  if not v_skill.is_downtime then
    v_downtime_result := chronos.ensure_downtime_timer(v_ended_at);
  end if;

  return jsonb_build_object(
    'success', true,
    'requires_lifetime_decision', not v_skill.is_downtime,
    'downtime', v_downtime_result,
    'session', jsonb_build_object(
      'id', v_session.id,
      'skill_id', v_session.skill_id,
      'started_at', v_session.started_at,
      'ended_at', v_session.ended_at,
      'is_private', v_session.is_private,
      'counts_toward_lifetime', v_session.counts_toward_lifetime
    )
  );
end;
$$;

create or replace function chronos.get_admin_timer_state()
returns jsonb
language plpgsql
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

  perform chronos.ensure_downtime_timer(now());

  with skill_rollups as (
    select
      sk.id as skill_id,
      greatest(
        0,
        coalesce(sum(greatest(0, extract(epoch from se.ended_at - se.started_at)))::bigint, 0)
          + coalesce(sk.lifetime_adjustment_seconds, 0)
      ) as lifetime_seconds
    from chronos.skills sk
    left join chronos.sessions se on se.skill_id = sk.id
      and se.user_id = v_user_id
      and se.ended_at is not null
      and se.counts_toward_lifetime is true
    where sk.user_id = v_user_id
    group by sk.id, sk.lifetime_adjustment_seconds
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
          'lifetime_adjustment_seconds', sk.lifetime_adjustment_seconds,
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
  pending_json as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', pending.id,
          'skill_id', pending.skill_id,
          'skill_name', pending.skill_name,
          'started_at', pending.started_at,
          'ended_at', pending.ended_at,
          'duration_seconds', pending.duration_seconds
        )
        order by pending.ended_at desc
      ),
      '[]'::jsonb
    ) as pending_sessions
    from (
      select
        se.id,
        se.skill_id,
        sk.name as skill_name,
        se.started_at,
        se.ended_at,
        greatest(0, extract(epoch from se.ended_at - se.started_at))::bigint as duration_seconds
      from chronos.sessions se
      join chronos.skills sk on sk.id = se.skill_id
      where se.user_id = v_user_id
        and se.ended_at is not null
        and se.counts_toward_lifetime is null
        and sk.is_downtime = false
      order by se.ended_at desc
      limit 6
    ) pending
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
          'counts_toward_lifetime', recent.counts_toward_lifetime,
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
        se.counts_toward_lifetime,
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
    'pending_sessions', pj.pending_sessions,
    'recent_sessions', rj.recent_sessions
  )
  into v_payload
  from skills_json sj
  cross join pending_json pj
  cross join recent_json rj;

  return v_payload;
end;
$$;

do $$
declare
  v_user chronos.users%rowtype;
  v_downtime_skill chronos.skills%rowtype;
begin
  for v_user in
    select *
    from chronos.users u
    where u.access_status = 'active'
      and u.is_owner = true
  loop
    select *
    into v_downtime_skill
    from chronos.skills sk
    where sk.user_id = v_user.id
      and sk.is_downtime = true
    order by sk.archived_at nulls first, sk.created_at asc
    limit 1;

    if found then
      update chronos.skills sk
      set slug = 'downtime',
          name = 'Downtime',
          icon_key = coalesce(sk.icon_key, 'clock'),
          accent_key = coalesce(sk.accent_key, 'downtime'),
          visibility = 'private',
          is_downtime = true,
          sort_order = 999,
          archived_at = null
      where sk.id = v_downtime_skill.id
      returning * into v_downtime_skill;
    else
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
        v_user.id,
        'downtime',
        'Downtime',
        'clock',
        'downtime',
        'private',
        true,
        999
      )
      returning * into v_downtime_skill;
    end if;

    insert into chronos.sessions (
      user_id,
      skill_id,
      started_at,
      ended_at,
      source,
      note,
      is_private,
      counts_toward_lifetime
    )
    select
      v_user.id,
      v_downtime_skill.id,
      now(),
      null,
      'system',
      'Automatic downtime',
      true,
      null
    where not exists (
      select 1
      from chronos.sessions se
      where se.user_id = v_user.id
        and se.ended_at is null
    );
  end loop;
end;
$$;

revoke all on function chronos.ensure_downtime_timer(timestamptz) from public;
revoke all on function chronos.start_timer(uuid, timestamptz, text) from public;
revoke all on function chronos.stop_timer(timestamptz) from public;
revoke all on function chronos.get_admin_timer_state() from public;

grant execute on function chronos.ensure_downtime_timer(timestamptz) to authenticated, service_role;
grant execute on function chronos.start_timer(uuid, timestamptz, text) to authenticated, service_role;
grant execute on function chronos.stop_timer(timestamptz) to authenticated, service_role;
grant execute on function chronos.get_admin_timer_state() to authenticated, service_role;
