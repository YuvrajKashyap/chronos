do $body$
declare
  v_definition text;
  v_updated_definition text;
begin
  select pg_get_functiondef('chronos.get_admin_timer_state()'::regprocedure)
  into v_definition;

  v_updated_definition := replace(
    v_definition,
    $match$'updated_at', sk.updated_at,
          'archived_at', sk.archived_at,$match$,
    $match$'updated_at', sk.updated_at,
          'last_active_at', (
            select max(case when activity.ended_at is null then now() else activity.started_at end)
            from chronos.sessions activity
            where activity.skill_id = sk.id
              and activity.user_id = v_user_id
          ),
          'archived_at', sk.archived_at,$match$
  );

  if v_updated_definition = v_definition then
    if v_definition not like '%''last_active_at''%' then
      raise exception 'chronos.get_admin_timer_state() did not expose skill last_active_at and could not be patched';
    end if;
  else
    execute v_updated_definition;
  end if;

  select pg_get_functiondef('chronos.get_public_dashboard()'::regprocedure)
  into v_definition;

  v_updated_definition := replace(
    v_definition,
    $match$'updated_at', sk.updated_at,
          'lifetime_seconds', case when b.public_show_lifetime_total then coalesce(r.lifetime_seconds, 0) else null end,$match$,
    $match$'updated_at', sk.updated_at,
          'last_active_at', (
            select max(case when activity.ended_at is null then now() else activity.started_at end)
            from visible_sessions activity
            where activity.skill_id = sk.id
          ),
          'lifetime_seconds', case when b.public_show_lifetime_total then coalesce(r.lifetime_seconds, 0) else null end,$match$
  );

  if v_updated_definition = v_definition then
    if v_definition not like '%''last_active_at''%' then
      raise exception 'chronos.get_public_dashboard() did not expose skill last_active_at and could not be patched';
    end if;
  else
    execute v_updated_definition;
  end if;
end
$body$;
