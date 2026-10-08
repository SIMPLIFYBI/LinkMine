create or replace function public.record_resource_open(
  p_resource_id uuid,
  p_access_kind text,
  p_source_surface text default 'unknown'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_access_kind not in ('hosted', 'external') then
    raise exception 'Invalid resource access kind';
  end if;

  insert into public.resource_open_events (user_id, resource_id, access_kind, source_surface)
  values (v_user_id, p_resource_id, p_access_kind, left(coalesce(nullif(trim(p_source_surface), ''), 'unknown'), 60));

  update public.resources
  set
    open_count = coalesce(open_count, 0) + 1,
    download_count = coalesce(download_count, 0) + 1
  where id = p_resource_id;

  if not found then
    raise exception 'Resource not found';
  end if;
end;
$$;

revoke all on function public.record_resource_open(uuid, text, text) from public;
grant execute on function public.record_resource_open(uuid, text, text) to authenticated;