-- Grant development/admin access to the existing authenticated test account.

insert into public.app_admins (user_id)
select id
from auth.users
where lower(email) = 'jaymeblue@gmail.com'
on conflict (user_id) do nothing;

do $$
begin
  if not exists (
    select 1 from auth.users where lower(email) = 'jaymeblue@gmail.com'
  ) then
    raise exception 'Cannot grant admin access: jaymeblue@gmail.com has not signed up yet.';
  end if;
end;
$$;