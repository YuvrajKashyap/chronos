create table if not exists chronos.daily_skill_rollups (
  user_id uuid not null references chronos.users (id) on delete cascade,
  skill_id uuid not null references chronos.skills (id) on delete cascade,
  rollup_date date not null,
  counted_seconds bigint not null default 0,
  private_seconds bigint not null default 0,
  skipped_seconds bigint not null default 0,
  pending_seconds bigint not null default 0,
  manual_seconds bigint not null default 0,
  timer_seconds bigint not null default 0,
  system_seconds bigint not null default 0,
  session_count integer not null default 0,
  counted_session_count integer not null default 0,
  longest_session_seconds bigint not null default 0,
  first_started_at timestamptz,
  last_ended_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, skill_id, rollup_date)
);

create table if not exists chronos.skill_lifetime_snapshots (
  user_id uuid not null references chronos.users (id) on delete cascade,
  skill_id uuid not null references chronos.skills (id) on delete cascade,
  snapshot_date date not null,
  lifetime_seconds bigint not null default 0,
  counted_session_seconds bigint not null default 0,
  lifetime_adjustment_seconds bigint not null default 0,
  counted_session_count integer not null default 0,
  active_session_seconds bigint not null default 0,
  source text not null default 'system',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, skill_id, snapshot_date),
  constraint skill_lifetime_snapshots_source_check check (source in ('system', 'timer', 'manual', 'admin', 'backfill'))
);

create table if not exists chronos.insight_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references chronos.users (id) on delete cascade,
  captured_at timestamptz not null default now(),
  lifetime_seconds bigint not null default 0,
  today_seconds bigint not null default 0,
  week_seconds bigint not null default 0,
  month_seconds bigint not null default 0,
  session_count integer not null default 0,
  active_day_count integer not null default 0,
  focus_score numeric(8, 6) not null default 0,
  balance_score numeric(8, 6) not null default 0,
  consistency_score numeric(8, 6) not null default 0,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists daily_skill_rollups_user_date_idx
  on chronos.daily_skill_rollups (user_id, rollup_date desc);

create index if not exists skill_lifetime_snapshots_user_date_idx
  on chronos.skill_lifetime_snapshots (user_id, snapshot_date desc);

create index if not exists insight_snapshots_user_captured_idx
  on chronos.insight_snapshots (user_id, captured_at desc);

alter table chronos.daily_skill_rollups enable row level security;
alter table chronos.skill_lifetime_snapshots enable row level security;
alter table chronos.insight_snapshots enable row level security;

drop policy if exists "Users can manage their own Chronos daily rollups" on chronos.daily_skill_rollups;
create policy "Users can manage their own Chronos daily rollups"
on chronos.daily_skill_rollups
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own Chronos lifetime snapshots" on chronos.skill_lifetime_snapshots;
create policy "Users can manage their own Chronos lifetime snapshots"
on chronos.skill_lifetime_snapshots
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can manage their own Chronos insight snapshots" on chronos.insight_snapshots;
create policy "Users can manage their own Chronos insight snapshots"
on chronos.insight_snapshots
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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
begin
  if p_user_id is null or p_skill_id is null or p_rollup_date is null then
    return;
  end if;

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
    count(*)::integer as session_count,
    count(*) filter (where se.counts_toward_lifetime is true or se.ended_at is null)::integer as counted_session_count,
    coalesce(max(greatest(0, extract(epoch from least(coalesce(se.ended_at, now()), now()) - se.started_at)))::bigint, 0) as longest_session_seconds,
    min(se.started_at) as first_started_at,
    max(se.ended_at) as last_ended_at
  into v_payload
  from chronos.sessions se
  where se.user_id = p_user_id
    and se.skill_id = p_skill_id
    and (se.started_at at time zone 'UTC')::date = p_rollup_date;

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
    session_count = excluded.session_count,
    counted_session_count = excluded.counted_session_count,
    longest_session_seconds = excluded.longest_session_seconds,
    first_started_at = excluded.first_started_at,
    last_ended_at = excluded.last_ended_at,
    updated_at = now();
end;
$$;

create or replace function chronos.record_skill_lifetime_snapshot(
  p_user_id uuid,
  p_skill_id uuid,
  p_snapshot_date date default current_date,
  p_source text default 'system',
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = chronos, public, pg_temp
as $$
declare
  v_skill chronos.skills%rowtype;
  v_counted_seconds bigint;
  v_counted_count integer;
  v_active_seconds bigint;
  v_adjustment_seconds bigint;
  v_lifetime_seconds bigint;
begin
  if p_user_id is null or p_skill_id is null then
    return;
  end if;

  select *
  into v_skill
  from chronos.skills sk
  where sk.id = p_skill_id
    and sk.user_id = p_user_id;

  if not found then
    return;
  end if;

  select
    coalesce(sum(greatest(0, extract(epoch from se.ended_at - se.started_at)))::bigint, 0),
    count(*)::integer
  into v_counted_seconds, v_counted_count
  from chronos.sessions se
  where se.user_id = p_user_id
    and se.skill_id = p_skill_id
    and se.ended_at is not null
    and se.counts_toward_lifetime is true;

  select coalesce(sum(greatest(0, extract(epoch from now() - se.started_at)))::bigint, 0)
  into v_active_seconds
  from chronos.sessions se
  where se.user_id = p_user_id
    and se.skill_id = p_skill_id
    and se.ended_at is null;

  v_adjustment_seconds := coalesce(v_skill.lifetime_adjustment_seconds, 0);
  v_lifetime_seconds := greatest(0, coalesce(v_counted_seconds, 0) + v_adjustment_seconds);

  insert into chronos.skill_lifetime_snapshots (
    user_id,
    skill_id,
    snapshot_date,
    lifetime_seconds,
    counted_session_seconds,
    lifetime_adjustment_seconds,
    counted_session_count,
    active_session_seconds,
    source,
    metadata,
    updated_at
  )
  values (
    p_user_id,
    p_skill_id,
    coalesce(p_snapshot_date, current_date),
    v_lifetime_seconds,
    coalesce(v_counted_seconds, 0),
    v_adjustment_seconds,
    coalesce(v_counted_count, 0),
    coalesce(v_active_seconds, 0),
    case when p_source in ('system', 'timer', 'manual', 'admin', 'backfill') then p_source else 'system' end,
    coalesce(p_metadata, '{}'::jsonb),
    now()
  )
  on conflict (user_id, skill_id, snapshot_date)
  do update set
    lifetime_seconds = excluded.lifetime_seconds,
    counted_session_seconds = excluded.counted_session_seconds,
    lifetime_adjustment_seconds = excluded.lifetime_adjustment_seconds,
    counted_session_count = excluded.counted_session_count,
    active_session_seconds = excluded.active_session_seconds,
    source = excluded.source,
    metadata = chronos.skill_lifetime_snapshots.metadata || excluded.metadata,
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
begin
  if tg_op in ('INSERT', 'UPDATE') then
    v_new_date := (new.started_at at time zone 'UTC')::date;
    perform chronos.refresh_daily_skill_rollup(new.user_id, new.skill_id, v_new_date);
    perform chronos.record_skill_lifetime_snapshot(new.user_id, new.skill_id, current_date, new.source::text, jsonb_build_object('trigger', tg_op, 'session_id', new.id));
  end if;

  if tg_op in ('UPDATE', 'DELETE') then
    v_old_date := (old.started_at at time zone 'UTC')::date;
    perform chronos.refresh_daily_skill_rollup(old.user_id, old.skill_id, v_old_date);
    perform chronos.record_skill_lifetime_snapshot(old.user_id, old.skill_id, current_date, old.source::text, jsonb_build_object('trigger', tg_op, 'session_id', old.id));
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function chronos.touch_skill_lifetime_tracking()
returns trigger
language plpgsql
security definer
set search_path = chronos, public, pg_temp
as $$
begin
  if tg_op = 'UPDATE' and old.lifetime_adjustment_seconds is distinct from new.lifetime_adjustment_seconds then
    perform chronos.record_skill_lifetime_snapshot(new.user_id, new.id, current_date, 'admin', jsonb_build_object('trigger', 'skill_lifetime_adjustment'));
  end if;

  return new;
end;
$$;

drop trigger if exists sessions_touch_tracking on chronos.sessions;
create trigger sessions_touch_tracking
after insert or update or delete on chronos.sessions
for each row execute function chronos.touch_session_tracking();

drop trigger if exists skills_touch_lifetime_tracking on chronos.skills;
create trigger skills_touch_lifetime_tracking
after update of lifetime_adjustment_seconds on chronos.skills
for each row execute function chronos.touch_skill_lifetime_tracking();

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
  session_count,
  counted_session_count,
  longest_session_seconds,
  first_started_at,
  last_ended_at,
  updated_at
)
select
  se.user_id,
  se.skill_id,
  (se.started_at at time zone 'UTC')::date as rollup_date,
  coalesce(sum(case when se.counts_toward_lifetime is true then greatest(0, extract(epoch from se.ended_at - se.started_at)) else 0 end)::bigint, 0) as counted_seconds,
  coalesce(sum(case when se.is_private then greatest(0, extract(epoch from least(coalesce(se.ended_at, now()), now()) - se.started_at)) else 0 end)::bigint, 0) as private_seconds,
  coalesce(sum(case when se.counts_toward_lifetime is false then greatest(0, extract(epoch from se.ended_at - se.started_at)) else 0 end)::bigint, 0) as skipped_seconds,
  coalesce(sum(case when se.ended_at is not null and se.counts_toward_lifetime is null then greatest(0, extract(epoch from se.ended_at - se.started_at)) else 0 end)::bigint, 0) as pending_seconds,
  coalesce(sum(case when se.source = 'manual' then greatest(0, extract(epoch from least(coalesce(se.ended_at, now()), now()) - se.started_at)) else 0 end)::bigint, 0) as manual_seconds,
  coalesce(sum(case when se.source = 'timer' then greatest(0, extract(epoch from least(coalesce(se.ended_at, now()), now()) - se.started_at)) else 0 end)::bigint, 0) as timer_seconds,
  coalesce(sum(case when se.source = 'system' then greatest(0, extract(epoch from least(coalesce(se.ended_at, now()), now()) - se.started_at)) else 0 end)::bigint, 0) as system_seconds,
  count(*)::integer as session_count,
  count(*) filter (where se.counts_toward_lifetime is true)::integer as counted_session_count,
  coalesce(max(greatest(0, extract(epoch from least(coalesce(se.ended_at, now()), now()) - se.started_at)))::bigint, 0) as longest_session_seconds,
  min(se.started_at) as first_started_at,
  max(se.ended_at) as last_ended_at,
  now() as updated_at
from chronos.sessions se
group by se.user_id, se.skill_id, (se.started_at at time zone 'UTC')::date
on conflict (user_id, skill_id, rollup_date)
do update set
  counted_seconds = excluded.counted_seconds,
  private_seconds = excluded.private_seconds,
  skipped_seconds = excluded.skipped_seconds,
  pending_seconds = excluded.pending_seconds,
  manual_seconds = excluded.manual_seconds,
  timer_seconds = excluded.timer_seconds,
  system_seconds = excluded.system_seconds,
  session_count = excluded.session_count,
  counted_session_count = excluded.counted_session_count,
  longest_session_seconds = excluded.longest_session_seconds,
  first_started_at = excluded.first_started_at,
  last_ended_at = excluded.last_ended_at,
  updated_at = now();

insert into chronos.skill_lifetime_snapshots (
  user_id,
  skill_id,
  snapshot_date,
  lifetime_seconds,
  counted_session_seconds,
  lifetime_adjustment_seconds,
  counted_session_count,
  active_session_seconds,
  source,
  metadata,
  updated_at
)
select
  sk.user_id,
  sk.id,
  current_date,
  greatest(0, coalesce(sum(greatest(0, extract(epoch from se.ended_at - se.started_at)))::bigint, 0) + coalesce(sk.lifetime_adjustment_seconds, 0)),
  coalesce(sum(greatest(0, extract(epoch from se.ended_at - se.started_at)))::bigint, 0),
  coalesce(sk.lifetime_adjustment_seconds, 0),
  count(se.id)::integer,
  0,
  'backfill',
  jsonb_build_object('migration', '20260506190000_insight_lifetime_tracking'),
  now()
from chronos.skills sk
left join chronos.sessions se on se.skill_id = sk.id
  and se.user_id = sk.user_id
  and se.ended_at is not null
  and se.counts_toward_lifetime is true
group by sk.user_id, sk.id, sk.lifetime_adjustment_seconds
on conflict (user_id, skill_id, snapshot_date)
do update set
  lifetime_seconds = excluded.lifetime_seconds,
  counted_session_seconds = excluded.counted_session_seconds,
  lifetime_adjustment_seconds = excluded.lifetime_adjustment_seconds,
  counted_session_count = excluded.counted_session_count,
  source = excluded.source,
  metadata = chronos.skill_lifetime_snapshots.metadata || excluded.metadata,
  updated_at = now();

grant select, insert, update, delete on chronos.daily_skill_rollups to authenticated, service_role;
grant select, insert, update, delete on chronos.skill_lifetime_snapshots to authenticated, service_role;
grant select, insert, update, delete on chronos.insight_snapshots to authenticated, service_role;
