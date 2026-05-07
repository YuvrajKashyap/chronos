create or replace function chronos.ensure_default_skills()
returns jsonb
language plpgsql
security definer
set search_path = chronos, public, auth, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_owner boolean;
  v_has_productive_skill_history boolean;
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

  select exists (
    select 1
    from chronos.skills sk
    where sk.user_id = v_user_id
      and sk.is_downtime = false
  )
  into v_has_productive_skill_history;

  if not coalesce(v_has_productive_skill_history, false) then
    with default_skills(slug, name, icon_key, accent_key, visibility, is_downtime, sort_order) as (
      values
        ('coding', 'Coding', 'code', 'coding', 'public'::chronos.skill_visibility, false, 10),
        ('fitness', 'Fitness', 'dumbbell', 'fitness', 'public'::chronos.skill_visibility, false, 20),
        ('business', 'Business', 'briefcase', 'business', 'public'::chronos.skill_visibility, false, 30),
        ('content', 'Content', 'pencil', 'content', 'public'::chronos.skill_visibility, false, 40),
        ('research', 'Research', 'search', 'research', 'public'::chronos.skill_visibility, false, 50),
        ('learning', 'Learning', 'book', 'learning', 'public'::chronos.skill_visibility, false, 60)
    )
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
    on conflict (user_id, slug) do nothing;
  end if;

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
    'downtime',
    'Downtime',
    'clock',
    'downtime',
    'private'::chronos.skill_visibility,
    true,
    999,
    null::timestamptz
  where not exists (
    select 1
    from chronos.skills sk
    where sk.user_id = v_user_id
      and sk.is_downtime = true
  )
  on conflict (user_id, slug) do nothing;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', sk.id,
        'slug', sk.slug,
        'name', sk.name,
        'visibility', sk.visibility,
        'is_downtime', sk.is_downtime,
        'sort_order', sk.sort_order,
        'archived_at', sk.archived_at
      )
      order by sk.sort_order, sk.name
    ),
    '[]'::jsonb
  )
  into v_skills
  from chronos.skills sk
  where sk.user_id = v_user_id
    and sk.archived_at is null;

  return jsonb_build_object(
    'success', true,
    'seeded_productive_defaults', not coalesce(v_has_productive_skill_history, false),
    'skills', v_skills
  );
end;
$$;

revoke all on function chronos.ensure_default_skills() from public;
grant execute on function chronos.ensure_default_skills() to authenticated, service_role;
