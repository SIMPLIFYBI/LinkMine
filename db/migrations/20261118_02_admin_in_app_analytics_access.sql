create or replace function public.admin_in_app_analytics_for_admin(p_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.app_admins where user_id = auth.uid()
  ) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  return public.admin_in_app_analytics(p_days);
end;
$$;

revoke all on function public.admin_in_app_analytics_for_admin(integer) from public, anon;
grant execute on function public.admin_in_app_analytics_for_admin(integer) to authenticated;

select pg_notify('pgrst', 'reload schema');