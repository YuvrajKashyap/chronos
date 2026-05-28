do $body$
declare
  v_definition text;
  v_updated_definition text;
begin
  select pg_get_functiondef('chronos.get_admin_timer_state()'::regprocedure)
  into v_definition;

  v_updated_definition := replace(
    v_definition,
    $match$'sort_order', sk.sort_order,
          'archived_at', sk.archived_at,$match$,
    $match$'sort_order', sk.sort_order,
          'updated_at', sk.updated_at,
          'archived_at', sk.archived_at,$match$
  );

  if v_updated_definition = v_definition then
    if v_definition not like '%''updated_at'', sk.updated_at%' then
      raise exception 'chronos.get_admin_timer_state() did not expose skill updated_at and could not be patched';
    end if;
  else
    execute v_updated_definition;
  end if;

  select pg_get_functiondef('chronos.get_public_dashboard()'::regprocedure)
  into v_definition;

  v_updated_definition := replace(
    v_definition,
    $match$'sort_order', sk.sort_order,
          'lifetime_seconds', case when b.public_show_lifetime_total then coalesce(r.lifetime_seconds, 0) else null end,$match$,
    $match$'sort_order', sk.sort_order,
          'updated_at', sk.updated_at,
          'lifetime_seconds', case when b.public_show_lifetime_total then coalesce(r.lifetime_seconds, 0) else null end,$match$
  );

  if v_updated_definition = v_definition then
    if v_definition not like '%''updated_at'', sk.updated_at%' then
      raise exception 'chronos.get_public_dashboard() did not expose skill updated_at and could not be patched';
    end if;
  else
    execute v_updated_definition;
  end if;
end
$body$;
