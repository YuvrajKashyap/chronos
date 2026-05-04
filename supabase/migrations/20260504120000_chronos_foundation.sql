create schema if not exists chronos;

create extension if not exists pgcrypto;

do $$
begin
  create type chronos.access_status as enum ('active', 'disabled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type chronos.downtime_mode as enum ('manual', 'auto', 'hybrid', 'disabled');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type chronos.session_source as enum ('timer', 'manual', 'system');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type chronos.skill_visibility as enum ('public', 'private');
exception
  when duplicate_object then null;
end $$;

create table if not exists chronos.allowed_emails (
  email text primary key,
  note text,
  created_at timestamptz not null default now(),
  constraint allowed_emails_email_normalized check (email = lower(email))
);

create table if not exists chronos.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  access_status chronos.access_status not null default 'active',
  is_owner boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_email_normalized check (email = lower(email))
);

create table if not exists chronos.user_state (
  user_id uuid primary key references chronos.users(id) on delete cascade,
  last_seen_at timestamptz,
  preferred_theme text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chronos.settings (
  user_id uuid primary key references chronos.users(id) on delete cascade,
  timezone text not null default 'America/Chicago',
  downtime_mode chronos.downtime_mode not null default 'hybrid',
  public_show_active_session boolean not null default true,
  public_show_today_total boolean not null default true,
  public_show_week_total boolean not null default true,
  public_show_lifetime_total boolean not null default true,
  public_show_milestones boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chronos.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references chronos.users(id) on delete cascade,
  slug text not null,
  name text not null,
  description text,
  icon_key text,
  accent_key text,
  accent_color text,
  visibility chronos.skill_visibility not null default 'public',
  is_downtime boolean not null default false,
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint skills_slug_not_empty check (length(trim(slug)) > 0),
  constraint skills_name_not_empty check (length(trim(name)) > 0),
  constraint skills_user_slug_unique unique (user_id, slug)
);

create table if not exists chronos.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references chronos.users(id) on delete cascade,
  skill_id uuid not null references chronos.skills(id) on delete restrict,
  started_at timestamptz not null,
  ended_at timestamptz,
  source chronos.session_source not null default 'timer',
  note text,
  is_private boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sessions_ended_after_started check (ended_at is null or ended_at > started_at)
);

create table if not exists chronos.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references chronos.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_events_action_not_empty check (length(trim(action)) > 0)
);

create index if not exists users_owner_active_idx
  on chronos.users (created_at)
  where is_owner = true and access_status = 'active';

create index if not exists skills_user_sort_order_idx
  on chronos.skills (user_id, sort_order);

create index if not exists skills_user_visibility_idx
  on chronos.skills (user_id, visibility);

create index if not exists skills_user_archived_at_idx
  on chronos.skills (user_id, archived_at);

create unique index if not exists skills_one_downtime_per_user_idx
  on chronos.skills (user_id)
  where is_downtime = true;

create index if not exists sessions_user_started_at_idx
  on chronos.sessions (user_id, started_at desc);

create index if not exists sessions_skill_started_at_idx
  on chronos.sessions (skill_id, started_at desc);

create index if not exists sessions_user_ended_at_idx
  on chronos.sessions (user_id, ended_at);

create index if not exists sessions_user_source_idx
  on chronos.sessions (user_id, source);

create unique index if not exists sessions_one_active_timer_per_user_idx
  on chronos.sessions (user_id)
  where ended_at is null;

create or replace function chronos.set_updated_at()
returns trigger
language plpgsql
set search_path = chronos, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_users_updated_at on chronos.users;
create trigger set_users_updated_at
before update on chronos.users
for each row execute function chronos.set_updated_at();

drop trigger if exists set_user_state_updated_at on chronos.user_state;
create trigger set_user_state_updated_at
before update on chronos.user_state
for each row execute function chronos.set_updated_at();

drop trigger if exists set_settings_updated_at on chronos.settings;
create trigger set_settings_updated_at
before update on chronos.settings
for each row execute function chronos.set_updated_at();

drop trigger if exists set_skills_updated_at on chronos.skills;
create trigger set_skills_updated_at
before update on chronos.skills
for each row execute function chronos.set_updated_at();

drop trigger if exists set_sessions_updated_at on chronos.sessions;
create trigger set_sessions_updated_at
before update on chronos.sessions
for each row execute function chronos.set_updated_at();

create or replace function chronos.is_active_user(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = chronos, pg_temp
as $$
  select uid is not null
    and exists (
      select 1
      from chronos.users u
      where u.id = uid
        and u.access_status = 'active'
    );
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

  return jsonb_build_object(
    'id', v_user.id,
    'email', v_user.email,
    'display_name', v_user.display_name,
    'access_status', v_user.access_status,
    'is_owner', v_user.is_owner
  );
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
  rollups as (
    select
      se.skill_id,
      coalesce(sum(greatest(0, extract(epoch from least(coalesce(se.ended_at, now()), now()) - se.started_at)))::bigint, 0) as lifetime_seconds,
      coalesce(sum(
        case
          when least(coalesce(se.ended_at, now()), now()) > b.today_start
          then greatest(0, extract(epoch from least(coalesce(se.ended_at, now()), now()) - greatest(se.started_at, b.today_start)))
          else 0
        end
      )::bigint, 0) as today_seconds,
      coalesce(sum(
        case
          when least(coalesce(se.ended_at, now()), now()) > b.week_start
          then greatest(0, extract(epoch from least(coalesce(se.ended_at, now()), now()) - greatest(se.started_at, b.week_start)))
          else 0
        end
      )::bigint, 0) as week_seconds
    from visible_sessions se
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

alter table chronos.allowed_emails enable row level security;
alter table chronos.users enable row level security;
alter table chronos.user_state enable row level security;
alter table chronos.settings enable row level security;
alter table chronos.skills enable row level security;
alter table chronos.sessions enable row level security;
alter table chronos.audit_events enable row level security;

drop policy if exists "Users can select their own Chronos profile" on chronos.users;
create policy "Users can select their own Chronos profile"
on chronos.users
for select
to authenticated
using (id = auth.uid() and chronos.is_active_user(auth.uid()));

drop policy if exists "Users can select their own Chronos state" on chronos.user_state;
create policy "Users can select their own Chronos state"
on chronos.user_state
for select
to authenticated
using (user_id = auth.uid() and chronos.is_active_user(auth.uid()));

drop policy if exists "Users can update their own Chronos state" on chronos.user_state;
create policy "Users can update their own Chronos state"
on chronos.user_state
for update
to authenticated
using (user_id = auth.uid() and chronos.is_active_user(auth.uid()))
with check (user_id = auth.uid() and chronos.is_active_user(auth.uid()));

drop policy if exists "Users can select their own Chronos settings" on chronos.settings;
create policy "Users can select their own Chronos settings"
on chronos.settings
for select
to authenticated
using (user_id = auth.uid() and chronos.is_active_user(auth.uid()));

drop policy if exists "Users can update their own Chronos settings" on chronos.settings;
create policy "Users can update their own Chronos settings"
on chronos.settings
for update
to authenticated
using (user_id = auth.uid() and chronos.is_active_user(auth.uid()))
with check (user_id = auth.uid() and chronos.is_active_user(auth.uid()));

drop policy if exists "Users can select their own Chronos skills" on chronos.skills;
create policy "Users can select their own Chronos skills"
on chronos.skills
for select
to authenticated
using (user_id = auth.uid() and chronos.is_active_user(auth.uid()));

drop policy if exists "Users can insert their own Chronos skills" on chronos.skills;
create policy "Users can insert their own Chronos skills"
on chronos.skills
for insert
to authenticated
with check (user_id = auth.uid() and chronos.is_active_user(auth.uid()));

drop policy if exists "Users can update their own Chronos skills" on chronos.skills;
create policy "Users can update their own Chronos skills"
on chronos.skills
for update
to authenticated
using (user_id = auth.uid() and chronos.is_active_user(auth.uid()))
with check (user_id = auth.uid() and chronos.is_active_user(auth.uid()));

drop policy if exists "Users can delete their own Chronos skills" on chronos.skills;
create policy "Users can delete their own Chronos skills"
on chronos.skills
for delete
to authenticated
using (user_id = auth.uid() and chronos.is_active_user(auth.uid()));

drop policy if exists "Users can select their own Chronos sessions" on chronos.sessions;
create policy "Users can select their own Chronos sessions"
on chronos.sessions
for select
to authenticated
using (user_id = auth.uid() and chronos.is_active_user(auth.uid()));

drop policy if exists "Users can insert their own Chronos sessions" on chronos.sessions;
create policy "Users can insert their own Chronos sessions"
on chronos.sessions
for insert
to authenticated
with check (user_id = auth.uid() and chronos.is_active_user(auth.uid()));

drop policy if exists "Users can update their own Chronos sessions" on chronos.sessions;
create policy "Users can update their own Chronos sessions"
on chronos.sessions
for update
to authenticated
using (user_id = auth.uid() and chronos.is_active_user(auth.uid()))
with check (user_id = auth.uid() and chronos.is_active_user(auth.uid()));

drop policy if exists "Users can delete their own Chronos sessions" on chronos.sessions;
create policy "Users can delete their own Chronos sessions"
on chronos.sessions
for delete
to authenticated
using (user_id = auth.uid() and chronos.is_active_user(auth.uid()));

revoke all on schema chronos from public;
grant usage on schema chronos to anon, authenticated, service_role;

grant usage on all types in schema chronos to authenticated, service_role;

grant select on chronos.users to authenticated;
grant select, update on chronos.user_state to authenticated;
grant select, update on chronos.settings to authenticated;
grant select, insert, update, delete on chronos.skills to authenticated;
grant select, insert, update, delete on chronos.sessions to authenticated;

grant all privileges on all tables in schema chronos to service_role;
grant all privileges on all sequences in schema chronos to service_role;

revoke all on function chronos.set_updated_at() from public;
revoke all on function chronos.is_active_user(uuid) from public;
revoke all on function chronos.bootstrap_current_user() from public;
revoke all on function chronos.get_public_dashboard() from public;

grant execute on function chronos.is_active_user(uuid) to authenticated, service_role;
grant execute on function chronos.bootstrap_current_user() to authenticated, service_role;
grant execute on function chronos.get_public_dashboard() to anon, authenticated, service_role;
