-- A private, one-time claim created with every new Supabase auth user.
-- It lets the browser emit sign_up once without sending any user data to GA4.
create table if not exists public.signup_analytics_events (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);

alter table public.signup_analytics_events enable row level security;

create or replace function public.record_signup_analytics_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.signup_analytics_events (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists record_signup_analytics_event on auth.users;
create trigger record_signup_analytics_event
after insert on auth.users
for each row execute function public.record_signup_analytics_event();

create or replace function public.claim_signup_analytics_event()
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  was_claimed boolean;
begin
  update public.signup_analytics_events
  set claimed_at = now()
  where user_id = auth.uid()
    and claimed_at is null
  returning true into was_claimed;

  return coalesce(was_claimed, false);
end;
$$;

revoke all on function public.claim_signup_analytics_event() from public;
grant execute on function public.claim_signup_analytics_event() to authenticated;

select pg_notify('pgrst', 'reload schema');