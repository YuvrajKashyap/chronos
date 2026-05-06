alter table chronos.sessions
  add column if not exists counts_toward_lifetime boolean;

update chronos.sessions
set counts_toward_lifetime = true
where ended_at is not null
  and counts_toward_lifetime is null;

create index if not exists sessions_pending_lifetime_decision_idx
  on chronos.sessions (user_id, ended_at desc)
  where ended_at is not null and counts_toward_lifetime is null;

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
  set ended_at = coalesce(p_ended_at, now()),
      counts_toward_lifetime = null
  where se.id = v_session.id
  returning * into v_session;

  insert into chronos.audit_events (user_id, action, entity_type, entity_id, metadata)
  values (
    v_user_id,
    'stop_timer',
    'session',
    v_session.id,
    jsonb_build_object('skill_id', v_session.skill_id, 'ended_at', v_session.ended_at, 'requires_lifetime_decision', true)
  );

  return jsonb_build_object(
    'success', true,
    'requires_lifetime_decision', true,
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

create or replace function chronos.confirm_timer_session(
  p_session_id uuid,
  p_count_towards_lifetime boolean
)
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

  if p_session_id is null then
    return jsonb_build_object('success', false, 'error', 'Session is required.');
  end if;

  update chronos.sessions se
  set counts_toward_lifetime = coalesce(p_count_towards_lifetime, false)
  where se.id = p_session_id
    and se.user_id = v_user_id
    and se.ended_at is not null
    and se.counts_toward_lifetime is null
  returning * into v_session;

  if not found then
    return jsonb_build_object('success', false, 'error', 'No stopped timer is awaiting a lifetime decision.');
  end if;

  insert into chronos.audit_events (user_id, action, entity_type, entity_id, metadata)
  values (
    v_user_id,
    'confirm_timer_session',
    'session',
    v_session.id,
    jsonb_build_object(
      'skill_id', v_session.skill_id,
      'counts_toward_lifetime', v_session.counts_toward_lifetime
    )
  );

  return jsonb_build_object(
    'success', true,
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
      coalesce(sum(greatest(0, extract(epoch from se.ended_at - se.started_at)))::bigint, 0) as lifetime_seconds
    from chronos.skills sk
    left join chronos.sessions se on se.skill_id = sk.id
      and se.user_id = v_user_id
      and se.ended_at is not null
      and se.counts_toward_lifetime is true
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

create or replace function chronos.get_public_dashboard()
returns jsonb
language plpgsql
stable
security definer
set search_path = chronos, pg_temp
as $$
declare
  v_payload jsonb;
begin
  with owner_row as (
    select
      u.id,
      u.display_name,
      s.timezone,
      s.public_show_active_session,
      s.public_show_today_total,
      s.public_show_week_total,
      s.public_show_lifetime_total,
      s.public_show_milestones
    from chronos.users u
    join chronos.settings s on s.user_id = u.id
    where u.is_owner = true
      and u.access_status = 'active'
    order by u.created_at asc
    limit 1
  ),
  bounds as (
    select
      o.*,
      ((now() at time zone o.timezone)::date::timestamp at time zone o.timezone) as today_start,
      (date_trunc('week', now() at time zone o.timezone) at time zone o.timezone) as week_start
    from owner_row o
  ),
  public_skills as (
    select sk.*
    from chronos.skills sk
    join bounds b on b.id = sk.user_id
    where sk.visibility = 'public'
      and sk.is_downtime = false
      and sk.archived_at is null
  ),
  visible_sessions as (
    select se.*
    from chronos.sessions se
    join public_skills sk on sk.id = se.skill_id
    where se.is_private = false
  ),
  counted_sessions as (
    select se.*
    from visible_sessions se
    where se.ended_at is not null
      and se.counts_toward_lifetime is true
  ),
  rollups as (
    select
      se.skill_id,
      coalesce(sum(greatest(0, extract(epoch from se.ended_at - se.started_at)))::bigint, 0) as lifetime_seconds,
      coalesce(sum(
        case
          when se.ended_at > b.today_start
          then greatest(0, extract(epoch from se.ended_at - greatest(se.started_at, b.today_start)))
          else 0
        end
      )::bigint, 0) as today_seconds,
      coalesce(sum(
        case
          when se.ended_at > b.week_start
          then greatest(0, extract(epoch from se.ended_at - greatest(se.started_at, b.week_start)))
          else 0
        end
      )::bigint, 0) as week_seconds
    from counted_sessions se
    cross join bounds b
    group by se.skill_id
  ),
  active_session as (
    select
      se.id,
      se.skill_id,
      sk.slug,
      sk.name,
      se.started_at,
      greatest(0, extract(epoch from now() - se.started_at))::bigint as current_active_elapsed_seconds
    from visible_sessions se
    join public_skills sk on sk.id = se.skill_id
    where se.ended_at is null
    order by se.started_at asc
    limit 1
  ),
  skill_payload as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', sk.id,
          'slug', sk.slug,
          'name', sk.name,
          'icon_key', sk.icon_key,
          'accent_key', sk.accent_key,
          'accent_color', sk.accent_color,
          'sort_order', sk.sort_order,
          'lifetime_seconds', case when b.public_show_lifetime_total then coalesce(r.lifetime_seconds, 0) else null end,
          'today_seconds', case when b.public_show_today_total then coalesce(r.today_seconds, 0) else null end,
          'week_seconds', case when b.public_show_week_total then coalesce(r.week_seconds, 0) else null end,
          'active_session_started_at', case when b.public_show_active_session then a.started_at else null end,
          'current_active_elapsed_seconds', case when b.public_show_active_session then a.current_active_elapsed_seconds else null end,
          'next_milestone_seconds', case when b.public_show_milestones then null::bigint else null::bigint end
        )
        order by sk.sort_order asc, sk.name asc
      ),
      '[]'::jsonb
    ) as skills
    from public_skills sk
    cross join bounds b
    left join rollups r on r.skill_id = sk.id
    left join active_session a on a.skill_id = sk.id
  ),
  totals as (
    select
      coalesce(sum(r.today_seconds), 0)::bigint as today_seconds,
      coalesce(sum(r.week_seconds), 0)::bigint as week_seconds,
      coalesce(sum(r.lifetime_seconds), 0)::bigint as lifetime_seconds
    from rollups r
  )
  select jsonb_build_object(
    'generated_at', now(),
    'owner', case
      when b.id is null then null
      else jsonb_build_object('display_name', b.display_name)
    end,
    'active_session', case
      when b.public_show_active_session then (
        select jsonb_build_object(
          'id', a.id,
          'skill_id', a.skill_id,
          'skill_slug', a.slug,
          'skill_name', a.name,
          'started_at', a.started_at,
          'current_active_elapsed_seconds', a.current_active_elapsed_seconds
        )
        from active_session a
        limit 1
      )
      else null
    end,
    'skills', coalesce(sp.skills, '[]'::jsonb),
    'totals', jsonb_build_object(
      'today_seconds', case when b.public_show_today_total then coalesce(t.today_seconds, 0) else null end,
      'week_seconds', case when b.public_show_week_total then coalesce(t.week_seconds, 0) else null end,
      'lifetime_seconds', case when b.public_show_lifetime_total then coalesce(t.lifetime_seconds, 0) else null end
    ),
    'visibility', jsonb_build_object(
      'show_active_session', coalesce(b.public_show_active_session, false),
      'show_today_total', coalesce(b.public_show_today_total, false),
      'show_week_total', coalesce(b.public_show_week_total, false),
      'show_lifetime_total', coalesce(b.public_show_lifetime_total, false),
      'show_milestones', coalesce(b.public_show_milestones, false)
    )
  )
  into v_payload
  from (select 1) root
  left join bounds b on true
  left join skill_payload sp on true
  left join totals t on true;

  return coalesce(
    v_payload,
    jsonb_build_object(
      'generated_at', now(),
      'owner', null,
      'active_session', null,
      'skills', '[]'::jsonb,
      'totals', jsonb_build_object('today_seconds', 0, 'week_seconds', 0, 'lifetime_seconds', 0),
      'visibility', jsonb_build_object(
        'show_active_session', false,
        'show_today_total', false,
        'show_week_total', false,
        'show_lifetime_total', false,
        'show_milestones', false
      )
    )
  );
end;
$$;

revoke all on function chronos.confirm_timer_session(uuid, boolean) from public;
grant execute on function chronos.confirm_timer_session(uuid, boolean) to authenticated, service_role;
