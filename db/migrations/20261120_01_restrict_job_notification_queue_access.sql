begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.job_notification_dispatch_secrets (
  secret_name text primary key,
  secret_hash text not null,
  updated_at timestamptz not null default now()
);

alter table private.job_notification_dispatch_secrets enable row level security;
revoke all on table private.job_notification_dispatch_secrets from public, anon, authenticated;

revoke all on public.v_job_notifications_queue from public, anon, authenticated;

create or replace function public.configure_job_notification_dispatch_secret(p_secret text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth, private, extensions
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.app_admins where user_id = auth.uid()
  ) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  if length(trim(coalesce(p_secret, ''))) < 24 then
    raise exception 'Dispatch secret is invalid.' using errcode = '22023';
  end if;

  insert into private.job_notification_dispatch_secrets (secret_name, secret_hash, updated_at)
  values ('job_notifications', encode(extensions.digest(p_secret, 'sha256'), 'hex'), now())
  on conflict (secret_name) do update
    set secret_hash = excluded.secret_hash,
        updated_at = excluded.updated_at;
end;
$$;

create or replace function public.get_job_notifications_queue(p_limit integer default 50)
returns table (
  log_id bigint,
  job_id uuid,
  user_id uuid,
  recipient_email text,
  job_title text,
  job_location text,
  listing_type text,
  description_preview text,
  category_name text,
  job_created_at timestamptz
)
language plpgsql
security definer
set search_path = pg_catalog, public, auth, private, extensions
as $$
declare
  v_dispatch_secret text := coalesce(
    nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-job-notification-secret',
    ''
  );
begin
  if not exists (
    select 1 from public.app_admins where user_id = auth.uid()
  ) and not exists (
    select 1
    from private.job_notification_dispatch_secrets s
    where s.secret_name = 'job_notifications'
      and s.secret_hash = encode(extensions.digest(v_dispatch_secret, 'sha256'), 'hex')
  ) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  return query
    select q.log_id, q.job_id, q.user_id, q.recipient_email, q.job_title,
      q.job_location, q.listing_type, q.description_preview, q.category_name,
      q.job_created_at
    from public.v_job_notifications_queue q
    order by q.job_created_at asc
    limit coalesce(p_limit, 50);
end;
$$;

create or replace function public.queue_job_notifications(p_job_id uuid)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_count integer;
begin
  if auth.uid() is null or not exists (
    select 1 from public.app_admins where user_id = auth.uid()
  ) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  with job_info as (
    select j.id as job_id, j.category_id, j.listing_type
    from public.jobs j
    where j.id = p_job_id
  ), inserted as (
    insert into public.job_notification_log (job_id, user_id, category_id, delivery_status)
    select ji.job_id, subs.user_id, ji.category_id, 'queued'
    from job_info ji
    join public.job_category_subscriptions subs on subs.category_id = ji.category_id
    left join public.job_notification_log existing
      on existing.job_id = ji.job_id and existing.user_id = subs.user_id
    where ji.listing_type in ('Public', 'Both')
      and subs.paused = false
      and existing.id is null
    returning 1
  )
  select count(*)::integer into v_count from inserted;

  return v_count;
end;
$$;

create or replace function public.mark_job_notification_sent(
  p_log_id bigint,
  p_status text default 'sent',
  p_message_id text default null
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth, private, extensions
as $$
declare
  v_dispatch_secret text := coalesce(
    nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-job-notification-secret',
    ''
  );
begin
  if not exists (
    select 1 from public.app_admins where user_id = auth.uid()
  ) and not exists (
    select 1
    from private.job_notification_dispatch_secrets s
    where s.secret_name = 'job_notifications'
      and s.secret_hash = encode(extensions.digest(v_dispatch_secret, 'sha256'), 'hex')
  ) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  update public.job_notification_log
  set delivery_status = coalesce(p_status, 'sent'),
      message_id = p_message_id
  where id = p_log_id;
end;
$$;

revoke all on function public.configure_job_notification_dispatch_secret(text) from public, anon, authenticated;
grant execute on function public.configure_job_notification_dispatch_secret(text) to authenticated;

revoke all on function public.get_job_notifications_queue(integer) from public, anon, authenticated;
grant execute on function public.get_job_notifications_queue(integer) to anon, authenticated;

revoke all on function public.queue_job_notifications(uuid) from public, anon, authenticated;
grant execute on function public.queue_job_notifications(uuid) to authenticated;

revoke all on function public.mark_job_notification_sent(bigint, text, text) from public, anon, authenticated;
grant execute on function public.mark_job_notification_sent(bigint, text, text) to anon, authenticated;

select pg_notify('pgrst', 'reload schema');

commit;