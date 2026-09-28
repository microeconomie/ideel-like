-- Ideel-like: dedicated function to reorder subscriptions without touching other columns,
-- avoiding the stale-overwrite risk of resending full rows via upsert.

create or replace function public.reorder_subscriptions(ordered_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.subscriptions as s
  set position = t.pos
  from (
    select id, ord - 1 as pos
    from unnest(ordered_ids) with ordinality as u(id, ord)
  ) as t
  where s.id = t.id
    and s.user_id = auth.uid();
end;
$$;

grant execute on function public.reorder_subscriptions(uuid[]) to authenticated;
