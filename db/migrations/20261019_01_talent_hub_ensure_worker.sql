-- A Talent Hub profile is backed by workers(id), which in turn requires a
-- user_profiles row. Create those private prerequisite records for the signed-in
-- user on their first Talent Hub profile save.

create or replace function public.ensure_talent_hub_worker()
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  auth_user_row auth.users%rowtype;
  display_label text;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into auth_user_row
  from auth.users
  where id = current_user_id;

  if not found then
    raise exception 'Authenticated user no longer exists';
  end if;

  display_label := coalesce(
    nullif(trim(auth_user_row.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(auth_user_row.email, ''), '@', 1), ''),
    'YouMine member'
  );

  insert into public.user_profiles (id)
  values (current_user_id)
  on conflict (id) do nothing;

  insert into public.workers (
    id,
    display_name,
    public_profile_name,
    visibility,
    status
  )
  values (
    current_user_id,
    display_label,
    null,
    'private',
    'draft'
  )
  on conflict (id) do nothing;

  return current_user_id;
end;
$$;

grant execute on function public.ensure_talent_hub_worker() to authenticated;

select pg_notify('pgrst', 'reload schema');