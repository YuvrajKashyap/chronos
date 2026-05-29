alter table chronos.user_state
  add column if not exists idle_started_at timestamptz,
  add column if not exists idle_last_closed_at timestamptz;

create index if not exists user_state_idle_started_idx
  on chronos.user_state (user_id, idle_started_at)
  where idle_started_at is not null;

create or replace function chronos.ensure_idle_clock(p_user_id uuid, p_started_at timestamptz default now())
returns void
language plpgsql
security definer
set search_path = chronos, public, pg_temp
as $$
begin
  if p_user_id is null then
    return;
  end if;

  insert into chronos.user_state (user_id, last_seen_at, idle_started_at)
  values (p_user_id, now(), coalesce(p_started_at, now()))
  on conflict (user_id) do update
    set last_seen_at = now(),
        idle_started_at = case
          when chronos.user_state.idle_started_at is null
            and not exists (
              select 1
              from chronos.sessions se
              where se.user_id = p_user_id
                and se.ended_at is null
            )
          then coalesce(p_started_at, now())
          else chronos.user_state.idle_started_at
        end;
end;
$$;

create or replace function chronos.close_idle_window(
  p_user_id uuid,
  p_ended_at timestamptz default now(),
  p_reason text default 'timer_started'
)
returns uuid
language plpgsql
security definer
set search_path = chronos, public, pg_temp
as $$
declare
  v_state chronos.user_state%rowtype;
  v_downtime_skill chronos.skills%rowtype;
  v_ended_at timestamptz := coalesce(p_ended_at, now());
  v_session chronos.sessions%rowtype;
begin
  if p_user_id is null then
    return null;
  end if;

  select *
  into v_state
  from chronos.user_state us
  where us.user_id = p_user_id
  for update;

  if not found or v_state.idle_started_at is null then
    return null;
  end if;

  if v_ended_at <= v_state.idle_started_at then
    update chronos.user_state
    set idle_started_at = null,
        idle_last_closed_at = greatest(coalesce(idle_last_closed_at, v_ended_at), v_ended_at),
        last_seen_at = now()
    where user_id = p_user_id;

    return null;
  end if;

  select *
  into v_downtime_skill
  from chronos.skills sk
  where sk.user_id = p_user_id
    and sk.is_downtime = true
    and sk.archived_at is null
  order by sk.created_at asc
  limit 1;

  if not found then
    update chronos.user_state
    set idle_started_at = null,
        idle_last_closed_at = v_ended_at,
        last_seen_at = now()
    where user_id = p_user_id;

    return null;
  end if;

  insert into chronos.sessions (
    user_id,
    skill_id,
    started_at,
    ended_at,
    source,
    note,
    is_private,
    counts_toward_lifetime,
    outcome,
    project_key,
    tag_names
  )
  values (
    p_user_id,
    v_downtime_skill.id,
    v_state.idle_started_at,
    v_ended_at,
    'system',
    'Automatically tracked idle time with no active timer.',
    true,
    true,
    'Idle / downtime window',
    'downtime',
    array['idle', 'downtime']
  )
  returning * into v_session;

  update chronos.user_state
  set idle_started_at = null,
      idle_last_closed_at = v_ended_at,
      last_seen_at = now()
  where user_id = p_user_id;

  insert into chronos.audit_events (user_id, action, entity_type, entity_id, metadata)
  values (
    p_user_id,
    'close_idle_window',
    'session',
    v_session.id,
    jsonb_build_object(
      'skill_id', v_downtime_skill.id,
      'started_at', v_session.started_at,
      'ended_at', v_session.ended_at,
      'reason', coalesce(nullif(trim(p_reason), ''), 'timer_started')
    )
  );

  return v_session.id;
end;
$$;

create or replace function chronos.start_idle_window(p_user_id uuid, p_started_at timestamptz default now())
returns void
language plpgsql
security definer
set search_path = chronos, public, pg_temp
as $$
begin
  if p_user_id is null then
    return;
  end if;

  update chronos.user_state us
  set idle_started_at = coalesce(p_started_at, now()),
      last_seen_at = now()
  where us.user_id = p_user_id
    and not exists (
      select 1
      from chronos.sessions se
      where se.user_id = p_user_id
        and se.ended_at is null
    );

  if not found then
    insert into chronos.user_state (user_id, last_seen_at, idle_started_at)
    values (p_user_id, now(), coalesce(p_started_at, now()))
    on conflict (user_id) do nothing;
  end if;
end;
$$;

create or replace function chronos.bootstrap_current_user()
returns jsonb
language plpgsql
security definer
set search_path = chronos, public, auth, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text := lower(nullif(auth.jwt() ->> 'email', ''));
  v_display_name text := nullif(coalesce(auth.jwt() ->> 'full_name', auth.jwt() ->> 'name'), '');
  v_user chronos.users%rowtype;
begin
  if v_user_id is null then
    raise exception 'Chronos bootstrap requires an authenticated Supabase user.';
  end if;

  if v_email is null then
    raise exception 'Chronos bootstrap requires an authenticated email claim.';
  end if;

  if not exists (
    select 1
    from chronos.allowed_emails allowed
    where allowed.email = v_email
  ) then
    raise exception 'This email is not allowed to administer Chronos.';
  end if;

  insert into chronos.users (id, email, display_name, access_status, is_owner)
  values (v_user_id, v_email, v_display_name, 'active', true)
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(chronos.users.display_name, excluded.display_name),
        access_status = 'active',
        is_owner = chronos.users.is_owner or excluded.is_owner
  returning * into v_user;

  insert into chronos.user_state (user_id, last_seen_at)
  values (v_user.id, now())
  on conflict (user_id) do update
    set last_seen_at = excluded.last_seen_at;

  insert into chronos.settings (user_id)
  values (v_user.id)
  on conflict (user_id) do nothing;

  perform chronos.ensure_idle_clock(v_user.id, now());

  return jsonb_build_object(
    'id', v_user.id,
    'email', v_user.email,
    'display_name', v_user.display_name,
    'access_status', v_user.access_status,
    'is_owner', v_user.is_owner
  );
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
  v_started_at timestamptz := coalesce(p_started_at, now());
  v_idle_session_id uuid;
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

  v_idle_session_id := chronos.close_idle_window(v_user_id, v_started_at, 'timer_started');

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
    v_started_at,
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
    jsonb_build_object('skill_id', v_skill.id, 'skill_slug', v_skill.slug, 'closed_idle_session_id', v_idle_session_id)
  );

  return jsonb_build_object(
    'success', true,
    'closed_idle_session_id', v_idle_session_id,
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
  v_ended_at timestamptz := coalesce(p_ended_at, now());
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
    perform chronos.ensure_idle_clock(v_user_id, now());
    return jsonb_build_object('success', false, 'error', 'No active timer exists.');
  end if;

  if v_ended_at <= v_session.started_at then
    return jsonb_build_object('success', false, 'error', 'Stop time must be after the start time.');
  end if;

  update chronos.sessions se
  set ended_at = v_ended_at,
      counts_toward_lifetime = null
  where se.id = v_session.id
  returning * into v_session;

  perform chronos.start_idle_window(v_user_id, v_session.ended_at);

  insert into chronos.audit_events (user_id, action, entity_type, entity_id, metadata)
  values (
    v_user_id,
    'stop_timer',
    'session',
    v_session.id,
    jsonb_build_object('skill_id', v_session.skill_id, 'ended_at', v_session.ended_at, 'requires_lifetime_decision', true, 'started_idle_tracking', true)
  );

  return jsonb_build_object(
    'success', true,
    'requires_lifetime_decision', true,
    'idle_started_at', v_session.ended_at,
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

  perform chronos.ensure_idle_clock(v_user_id, now());

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
  idle as (
    select
      us.idle_started_at,
      greatest(0, extract(epoch from now() - us.idle_started_at))::bigint as current_idle_elapsed_seconds
    from chronos.user_state us
    where us.user_id = v_user_id
      and us.idle_started_at is not null
      and not exists (select 1 from active)
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
          'weekly_target_seconds', sk.weekly_target_seconds,
          'target_sessions_per_week', sk.target_sessions_per_week,
          'priority_weight', sk.priority_weight,
          'goal_note', sk.goal_note,
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
          'is_downtime', recent.is_downtime,
          'started_at', recent.started_at,
          'ended_at', recent.ended_at,
          'source', recent.source,
          'is_private', recent.is_private,
          'counts_toward_lifetime', recent.counts_toward_lifetime,
          'duration_seconds', recent.duration_seconds,
          'planned_seconds', recent.planned_seconds,
          'quality_score', recent.quality_score,
          'energy_score', recent.energy_score,
          'focus_score', recent.focus_score,
          'outcome', recent.outcome,
          'project_key', recent.project_key,
          'tag_names', recent.tag_names,
          'interruption_count', recent.interruption_count,
          'paused_seconds', recent.paused_seconds
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
        sk.is_downtime,
        se.started_at,
        se.ended_at,
        se.source,
        se.is_private,
        se.counts_toward_lifetime,
        greatest(0, extract(epoch from least(coalesce(se.ended_at, now()), now()) - se.started_at))::bigint as duration_seconds,
        se.planned_seconds,
        se.quality_score,
        se.energy_score,
        se.focus_score,
        se.outcome,
        se.project_key,
        se.tag_names,
        se.interruption_count,
        se.paused_seconds
      from chronos.sessions se
      join chronos.skills sk on sk.id = se.skill_id
      where se.user_id = v_user_id
      order by se.started_at desc
      limit 20
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
    'idle_session', (
      select jsonb_build_object(
        'started_at', i.idle_started_at,
        'current_idle_elapsed_seconds', i.current_idle_elapsed_seconds
      )
      from idle i
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

update chronos.user_state us
set idle_started_at = coalesce(us.idle_started_at, now())
where not exists (
  select 1
  from chronos.sessions se
  where se.user_id = us.user_id
    and se.ended_at is null
);

revoke all on function chronos.ensure_idle_clock(uuid, timestamptz) from public;
revoke all on function chronos.close_idle_window(uuid, timestamptz, text) from public;
revoke all on function chronos.start_idle_window(uuid, timestamptz) from public;

grant execute on function chronos.ensure_idle_clock(uuid, timestamptz) to authenticated, service_role;
grant execute on function chronos.close_idle_window(uuid, timestamptz, text) to authenticated, service_role;
grant execute on function chronos.start_idle_window(uuid, timestamptz) to authenticated, service_role;
