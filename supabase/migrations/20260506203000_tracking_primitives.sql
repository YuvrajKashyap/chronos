alter table chronos.skills
  add column if not exists weekly_target_seconds bigint not null default 0,
  add column if not exists target_sessions_per_week integer not null default 0,
  add column if not exists priority_weight integer not null default 3,
  add column if not exists goal_note text,
  add constraint skills_weekly_target_seconds_check check (weekly_target_seconds >= 0),
  add constraint skills_target_sessions_per_week_check check (target_sessions_per_week between 0 and 99),
  add constraint skills_priority_weight_check check (priority_weight between 1 and 5);

alter table chronos.sessions
  add column if not exists planned_seconds bigint,
  add column if not exists planned_at timestamptz,
  add column if not exists quality_score smallint,
  add column if not exists energy_score smallint,
  add column if not exists focus_score smallint,
  add column if not exists outcome text,
  add column if not exists context_note text,
  add column if not exists project_key text,
  add column if not exists tag_names text[] not null default '{}'::text[],
  add column if not exists interruption_count integer not null default 0,
  add column if not exists paused_seconds bigint not null default 0,
  add constraint sessions_planned_seconds_check check (planned_seconds is null or planned_seconds >= 0),
  add constraint sessions_quality_score_check check (quality_score is null or quality_score between 1 and 5),
  add constraint sessions_energy_score_check check (energy_score is null or energy_score between 1 and 5),
  add constraint sessions_focus_score_check check (focus_score is null or focus_score between 1 and 5),
  add constraint sessions_interruption_count_check check (interruption_count >= 0),
  add constraint sessions_paused_seconds_check check (paused_seconds >= 0);

create table if not exists chronos.skill_milestone_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references chronos.users (id) on delete cascade,
  skill_id uuid not null references chronos.skills (id) on delete cascade,
  target_seconds bigint not null,
  lifetime_seconds bigint not null,
  reached_at timestamptz not null default now(),
  source text not null default 'system',
  metadata jsonb not null default '{}'::jsonb,
  constraint skill_milestone_events_target_check check (target_seconds > 0),
  constraint skill_milestone_events_lifetime_check check (lifetime_seconds >= target_seconds),
  constraint skill_milestone_events_source_check check (source in ('system', 'timer', 'manual', 'admin', 'backfill')),
  constraint skill_milestone_events_unique unique (user_id, skill_id, target_seconds)
);

create index if not exists skill_milestone_events_user_reached_idx
  on chronos.skill_milestone_events (user_id, reached_at desc);

alter table chronos.daily_skill_rollups
  add column if not exists planned_seconds bigint not null default 0,
  add column if not exists quality_sum integer not null default 0,
  add column if not exists quality_count integer not null default 0,
  add column if not exists energy_sum integer not null default 0,
  add column if not exists energy_count integer not null default 0,
  add column if not exists focus_sum integer not null default 0,
  add column if not exists focus_count integer not null default 0,
  add column if not exists interruption_count integer not null default 0,
  add column if not exists paused_seconds bigint not null default 0;

alter table chronos.skill_milestone_events enable row level security;

drop policy if exists "Users can manage their own Chronos milestone events" on chronos.skill_milestone_events;
create policy "Users can manage their own Chronos milestone events"
on chronos.skill_milestone_events
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function chronos.clean_session_tags(p_tag_names text[])
returns text[]
language sql
immutable
set search_path = chronos, public, pg_temp
as $$
  select coalesce(
    array(
      select distinct left(trim(lower(tag)), 40)
      from unnest(coalesce(p_tag_names, '{}'::text[])) as tag
      where length(trim(coalesce(tag, ''))) > 0
      order by left(trim(lower(tag)), 40)
      limit 12
    ),
    '{}'::text[]
  );
$$;

create or replace function chronos.record_skill_milestones(
  p_user_id uuid,
  p_skill_id uuid,
  p_source text default 'system',
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = chronos, public, pg_temp
as $$
declare
  v_lifetime_seconds bigint;
  v_target_seconds bigint;
  v_thresholds bigint[] := array[36000, 90000, 180000, 360000, 900000, 1800000, 3600000, 9000000, 18000000];
begin
  if p_user_id is null or p_skill_id is null then
    return;
  end if;

  select greatest(
    0,
    coalesce(sum(greatest(0, extract(epoch from se.ended_at - se.started_at)))::bigint, 0)
      + coalesce(sk.lifetime_adjustment_seconds, 0)
  )
  into v_lifetime_seconds
  from chronos.skills sk
  left join chronos.sessions se on se.skill_id = sk.id
    and se.user_id = sk.user_id
    and se.ended_at is not null
    and se.counts_toward_lifetime is true
  where sk.id = p_skill_id
    and sk.user_id = p_user_id
  group by sk.lifetime_adjustment_seconds;

  if v_lifetime_seconds is null then
    return;
  end if;

  foreach v_target_seconds in array v_thresholds loop
    if v_lifetime_seconds >= v_target_seconds then
      insert into chronos.skill_milestone_events (
        user_id,
        skill_id,
        target_seconds,
        lifetime_seconds,
        source,
        metadata
      )
      values (
        p_user_id,
        p_skill_id,
        v_target_seconds,
        v_lifetime_seconds,
        case when p_source in ('system', 'timer', 'manual', 'admin', 'backfill') then p_source else 'system' end,
        coalesce(p_metadata, '{}'::jsonb)
      )
      on conflict (user_id, skill_id, target_seconds) do nothing;
    end if;
  end loop;
end;
$$;

create or replace function chronos.refresh_daily_skill_rollup(
  p_user_id uuid,
  p_skill_id uuid,
  p_rollup_date date
)
returns void
language plpgsql
security definer
set search_path = chronos, public, pg_temp
as $$
declare
  v_payload record;
  v_timezone text;
begin
  if p_user_id is null or p_skill_id is null or p_rollup_date is null then
    return;
  end if;

  select coalesce(st.timezone, 'America/Chicago')
  into v_timezone
  from chronos.settings st
  where st.user_id = p_user_id;

  v_timezone := coalesce(v_timezone, 'America/Chicago');

  select
    coalesce(sum(
      case
        when se.counts_toward_lifetime is true or se.ended_at is null
        then greatest(0, extract(epoch from least(coalesce(se.ended_at, now()), now()) - se.started_at))
        else 0
      end
    )::bigint, 0) as counted_seconds,
    coalesce(sum(
      case
        when se.is_private
        then greatest(0, extract(epoch from least(coalesce(se.ended_at, now()), now()) - se.started_at))
        else 0
      end
    )::bigint, 0) as private_seconds,
    coalesce(sum(
      case
        when se.counts_toward_lifetime is false
        then greatest(0, extract(epoch from least(coalesce(se.ended_at, now()), now()) - se.started_at))
        else 0
      end
    )::bigint, 0) as skipped_seconds,
    coalesce(sum(
      case
        when se.ended_at is not null and se.counts_toward_lifetime is null
        then greatest(0, extract(epoch from se.ended_at - se.started_at))
        else 0
      end
    )::bigint, 0) as pending_seconds,
    coalesce(sum(case when se.source = 'manual' then greatest(0, extract(epoch from least(coalesce(se.ended_at, now()), now()) - se.started_at)) else 0 end)::bigint, 0) as manual_seconds,
    coalesce(sum(case when se.source = 'timer' then greatest(0, extract(epoch from least(coalesce(se.ended_at, now()), now()) - se.started_at)) else 0 end)::bigint, 0) as timer_seconds,
    coalesce(sum(case when se.source = 'system' then greatest(0, extract(epoch from least(coalesce(se.ended_at, now()), now()) - se.started_at)) else 0 end)::bigint, 0) as system_seconds,
    coalesce(sum(coalesce(se.planned_seconds, 0))::bigint, 0) as planned_seconds,
    coalesce(sum(coalesce(se.quality_score, 0))::integer, 0) as quality_sum,
    count(se.quality_score)::integer as quality_count,
    coalesce(sum(coalesce(se.energy_score, 0))::integer, 0) as energy_sum,
    count(se.energy_score)::integer as energy_count,
    coalesce(sum(coalesce(se.focus_score, 0))::integer, 0) as focus_sum,
    count(se.focus_score)::integer as focus_count,
    coalesce(sum(coalesce(se.interruption_count, 0))::integer, 0) as interruption_count,
    coalesce(sum(coalesce(se.paused_seconds, 0))::bigint, 0) as paused_seconds,
    count(*)::integer as session_count,
    count(*) filter (where se.counts_toward_lifetime is true or se.ended_at is null)::integer as counted_session_count,
    coalesce(max(greatest(0, extract(epoch from least(coalesce(se.ended_at, now()), now()) - se.started_at)))::bigint, 0) as longest_session_seconds,
    min(se.started_at) as first_started_at,
    max(se.ended_at) as last_ended_at
  into v_payload
  from chronos.sessions se
  where se.user_id = p_user_id
    and se.skill_id = p_skill_id
    and (se.started_at at time zone v_timezone)::date = p_rollup_date;

  insert into chronos.daily_skill_rollups (
    user_id,
    skill_id,
    rollup_date,
    counted_seconds,
    private_seconds,
    skipped_seconds,
    pending_seconds,
    manual_seconds,
    timer_seconds,
    system_seconds,
    planned_seconds,
    quality_sum,
    quality_count,
    energy_sum,
    energy_count,
    focus_sum,
    focus_count,
    interruption_count,
    paused_seconds,
    session_count,
    counted_session_count,
    longest_session_seconds,
    first_started_at,
    last_ended_at,
    updated_at
  )
  values (
    p_user_id,
    p_skill_id,
    p_rollup_date,
    coalesce(v_payload.counted_seconds, 0),
    coalesce(v_payload.private_seconds, 0),
    coalesce(v_payload.skipped_seconds, 0),
    coalesce(v_payload.pending_seconds, 0),
    coalesce(v_payload.manual_seconds, 0),
    coalesce(v_payload.timer_seconds, 0),
    coalesce(v_payload.system_seconds, 0),
    coalesce(v_payload.planned_seconds, 0),
    coalesce(v_payload.quality_sum, 0),
    coalesce(v_payload.quality_count, 0),
    coalesce(v_payload.energy_sum, 0),
    coalesce(v_payload.energy_count, 0),
    coalesce(v_payload.focus_sum, 0),
    coalesce(v_payload.focus_count, 0),
    coalesce(v_payload.interruption_count, 0),
    coalesce(v_payload.paused_seconds, 0),
    coalesce(v_payload.session_count, 0),
    coalesce(v_payload.counted_session_count, 0),
    coalesce(v_payload.longest_session_seconds, 0),
    v_payload.first_started_at,
    v_payload.last_ended_at,
    now()
  )
  on conflict (user_id, skill_id, rollup_date)
  do update set
    counted_seconds = excluded.counted_seconds,
    private_seconds = excluded.private_seconds,
    skipped_seconds = excluded.skipped_seconds,
    pending_seconds = excluded.pending_seconds,
    manual_seconds = excluded.manual_seconds,
    timer_seconds = excluded.timer_seconds,
    system_seconds = excluded.system_seconds,
    planned_seconds = excluded.planned_seconds,
    quality_sum = excluded.quality_sum,
    quality_count = excluded.quality_count,
    energy_sum = excluded.energy_sum,
    energy_count = excluded.energy_count,
    focus_sum = excluded.focus_sum,
    focus_count = excluded.focus_count,
    interruption_count = excluded.interruption_count,
    paused_seconds = excluded.paused_seconds,
    session_count = excluded.session_count,
    counted_session_count = excluded.counted_session_count,
    longest_session_seconds = excluded.longest_session_seconds,
    first_started_at = excluded.first_started_at,
    last_ended_at = excluded.last_ended_at,
    updated_at = now();
end;
$$;

create or replace function chronos.touch_session_tracking()
returns trigger
language plpgsql
security definer
set search_path = chronos, public, pg_temp
as $$
declare
  v_old_date date;
  v_new_date date;
  v_old_timezone text;
  v_new_timezone text;
begin
  if tg_op in ('INSERT', 'UPDATE') then
    select coalesce(st.timezone, 'America/Chicago')
    into v_new_timezone
    from chronos.settings st
    where st.user_id = new.user_id;

    v_new_date := (new.started_at at time zone coalesce(v_new_timezone, 'America/Chicago'))::date;
    perform chronos.refresh_daily_skill_rollup(new.user_id, new.skill_id, v_new_date);
    perform chronos.record_skill_lifetime_snapshot(new.user_id, new.skill_id, current_date, new.source::text, jsonb_build_object('trigger', tg_op, 'session_id', new.id));
    perform chronos.record_skill_milestones(new.user_id, new.skill_id, new.source::text, jsonb_build_object('trigger', tg_op, 'session_id', new.id));
  end if;

  if tg_op in ('UPDATE', 'DELETE') then
    select coalesce(st.timezone, 'America/Chicago')
    into v_old_timezone
    from chronos.settings st
    where st.user_id = old.user_id;

    v_old_date := (old.started_at at time zone coalesce(v_old_timezone, 'America/Chicago'))::date;
    perform chronos.refresh_daily_skill_rollup(old.user_id, old.skill_id, v_old_date);
    perform chronos.record_skill_lifetime_snapshot(old.user_id, old.skill_id, current_date, old.source::text, jsonb_build_object('trigger', tg_op, 'session_id', old.id));
    perform chronos.record_skill_milestones(old.user_id, old.skill_id, old.source::text, jsonb_build_object('trigger', tg_op, 'session_id', old.id));
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop function if exists chronos.confirm_timer_session(uuid, boolean);

create or replace function chronos.confirm_timer_session(
  p_session_id uuid,
  p_count_towards_lifetime boolean,
  p_quality_score smallint default null,
  p_energy_score smallint default null,
  p_focus_score smallint default null,
  p_outcome text default null,
  p_project_key text default null,
  p_tag_names text[] default null,
  p_planned_seconds bigint default null,
  p_interruption_count integer default null,
  p_paused_seconds bigint default null
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
  set counts_toward_lifetime = coalesce(p_count_towards_lifetime, false),
      quality_score = case when p_quality_score between 1 and 5 then p_quality_score else null end,
      energy_score = case when p_energy_score between 1 and 5 then p_energy_score else null end,
      focus_score = case when p_focus_score between 1 and 5 then p_focus_score else null end,
      outcome = nullif(left(trim(coalesce(p_outcome, '')), 500), ''),
      project_key = nullif(left(trim(lower(coalesce(p_project_key, ''))), 80), ''),
      tag_names = chronos.clean_session_tags(p_tag_names),
      planned_seconds = case when p_planned_seconds is null then null else greatest(0, p_planned_seconds) end,
      planned_at = case when p_planned_seconds is null then null else se.started_at end,
      interruption_count = greatest(0, coalesce(p_interruption_count, 0)),
      paused_seconds = greatest(0, coalesce(p_paused_seconds, 0))
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
      'counts_toward_lifetime', v_session.counts_toward_lifetime,
      'quality_score', v_session.quality_score,
      'energy_score', v_session.energy_score,
      'focus_score', v_session.focus_score,
      'project_key', v_session.project_key,
      'tag_names', v_session.tag_names,
      'planned_seconds', v_session.planned_seconds,
      'interruption_count', v_session.interruption_count,
      'paused_seconds', v_session.paused_seconds
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
      'counts_toward_lifetime', v_session.counts_toward_lifetime,
      'quality_score', v_session.quality_score,
      'energy_score', v_session.energy_score,
      'focus_score', v_session.focus_score,
      'outcome', v_session.outcome,
      'project_key', v_session.project_key,
      'tag_names', v_session.tag_names
    )
  );
end;
$$;

drop function if exists chronos.update_skill(uuid, text, text, text, text);

create or replace function chronos.update_skill(
  p_skill_id uuid,
  p_name text,
  p_icon_key text default 'sparkles',
  p_accent_key text default 'coral',
  p_visibility text default 'public',
  p_weekly_target_seconds bigint default 0,
  p_target_sessions_per_week integer default 0,
  p_priority_weight integer default 3,
  p_goal_note text default null
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
      visibility = v_visibility,
      weekly_target_seconds = greatest(0, coalesce(p_weekly_target_seconds, 0)),
      target_sessions_per_week = least(99, greatest(0, coalesce(p_target_sessions_per_week, 0))),
      priority_weight = least(5, greatest(1, coalesce(p_priority_weight, 3))),
      goal_note = nullif(left(trim(coalesce(p_goal_note, '')), 500), '')
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
    jsonb_build_object(
      'skill_slug', v_skill.slug,
      'name', v_skill.name,
      'weekly_target_seconds', v_skill.weekly_target_seconds,
      'target_sessions_per_week', v_skill.target_sessions_per_week,
      'priority_weight', v_skill.priority_weight
    )
  );

  return jsonb_build_object(
    'success', true,
    'skill', jsonb_build_object(
      'id', v_skill.id,
      'slug', v_skill.slug,
      'name', v_skill.name,
      'icon_key', v_skill.icon_key,
      'accent_key', v_skill.accent_key,
      'visibility', v_skill.visibility,
      'weekly_target_seconds', v_skill.weekly_target_seconds,
      'target_sessions_per_week', v_skill.target_sessions_per_week,
      'priority_weight', v_skill.priority_weight,
      'goal_note', v_skill.goal_note
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

create or replace function chronos.record_insight_snapshot(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = chronos, public, auth, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_owner boolean;
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

  insert into chronos.insight_snapshots (
    user_id,
    lifetime_seconds,
    today_seconds,
    week_seconds,
    month_seconds,
    session_count,
    active_day_count,
    focus_score,
    balance_score,
    consistency_score,
    payload
  )
  values (
    v_user_id,
    greatest(0, coalesce((p_payload #>> '{totals,lifetime_seconds}')::bigint, 0)),
    greatest(0, coalesce((p_payload #>> '{totals,today_seconds}')::bigint, 0)),
    greatest(0, coalesce((p_payload #>> '{totals,week_seconds}')::bigint, 0)),
    greatest(0, coalesce((p_payload #>> '{totals,month_seconds}')::bigint, 0)),
    greatest(0, coalesce((p_payload #>> '{totals,session_count}')::integer, 0)),
    greatest(0, coalesce((p_payload #>> '{behavior,active_day_count}')::integer, 0)),
    greatest(0, least(1, coalesce((p_payload #>> '{behavior,focus_score}')::numeric, 0))),
    greatest(0, least(1, coalesce((p_payload #>> '{behavior,balance_score}')::numeric, 0))),
    greatest(0, least(1, coalesce((p_payload #>> '{behavior,consistency_score}')::numeric, 0))),
    coalesce(p_payload, '{}'::jsonb)
  );

  return jsonb_build_object('success', true);
end;
$$;

revoke all on function chronos.clean_session_tags(text[]) from public;
revoke all on function chronos.record_skill_milestones(uuid, uuid, text, jsonb) from public;
revoke all on function chronos.confirm_timer_session(uuid, boolean, smallint, smallint, smallint, text, text, text[], bigint, integer, bigint) from public;
revoke all on function chronos.update_skill(uuid, text, text, text, text, bigint, integer, integer, text) from public;
revoke all on function chronos.record_insight_snapshot(jsonb) from public;

grant execute on function chronos.confirm_timer_session(uuid, boolean, smallint, smallint, smallint, text, text, text[], bigint, integer, bigint) to authenticated, service_role;
grant execute on function chronos.update_skill(uuid, text, text, text, text, bigint, integer, integer, text) to authenticated, service_role;
grant execute on function chronos.record_insight_snapshot(jsonb) to authenticated, service_role;
grant select, insert, update, delete on chronos.skill_milestone_events to authenticated, service_role;
