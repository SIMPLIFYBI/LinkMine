create or replace function public.resource_unique_openers_30d(p_resource_id uuid)
returns integer
language sql
security definer
set search_path = public
as $$
  select count(distinct user_id)::integer
  from public.resource_open_events
  where resource_id = p_resource_id
    and opened_at >= now() - interval '30 days';
$$;

revoke all on function public.resource_unique_openers_30d(uuid) from public;
grant execute on function public.resource_unique_openers_30d(uuid) to anon, authenticated;
