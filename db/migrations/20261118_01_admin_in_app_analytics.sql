create or replace function public.admin_in_app_analytics(p_days integer default 30)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  start_at timestamptz;
  end_at timestamptz := now();
  result jsonb;
begin
  if p_days is null or p_days not in (7, 30, 90) then
    raise exception 'Invalid reporting period';
  end if;

  start_at := (date_trunc('day', end_at at time zone 'UTC') - (p_days - 1) * interval '1 day') at time zone 'UTC';

  with daily_events as (
    select (created_at at time zone 'UTC')::date as day, 'signups' as kind from auth.users where created_at >= start_at and created_at < end_at
    union all
    select (created_at at time zone 'UTC')::date, 'consultants' from public.consultants where created_at >= start_at and created_at < end_at
    union all
    select (created_at at time zone 'UTC')::date, 'resources' from public.resources where created_at >= start_at and created_at < end_at
    union all
    select (opened_at at time zone 'UTC')::date, 'resourceOpens' from public.resource_open_events where opened_at >= start_at and opened_at < end_at
    union all
    select (viewed_at at time zone 'UTC')::date, 'consultantViews' from public.consultant_page_views where viewed_at >= start_at and viewed_at < end_at
    union all
    select (created_at at time zone 'UTC')::date, 'enquiries' from public.consultant_contacts where created_at >= start_at and created_at < end_at
  ), daily_counts as (
    select day,
      count(*) filter (where kind = 'signups') as signups,
      count(*) filter (where kind = 'consultants') as consultants,
      count(*) filter (where kind = 'resources') as resources,
      count(*) filter (where kind = 'resourceOpens') as resource_opens,
      count(*) filter (where kind = 'consultantViews') as consultant_views,
      count(*) filter (where kind = 'enquiries') as enquiries
    from daily_events group by day
  ), trend as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'date', to_char(calendar.day, 'YYYY-MM-DD'),
      'signups', coalesce(counts.signups, 0),
      'consultants', coalesce(counts.consultants, 0),
      'resources', coalesce(counts.resources, 0),
      'resourceOpens', coalesce(counts.resource_opens, 0),
      'consultantViews', coalesce(counts.consultant_views, 0),
      'enquiries', coalesce(counts.enquiries, 0)
    ) order by calendar.day), '[]'::jsonb) as value
    from generate_series((start_at at time zone 'UTC')::date, (end_at at time zone 'UTC')::date, interval '1 day') as calendar(day)
    left join daily_counts counts on counts.day = calendar.day::date
  ), top_resources as (
    select resources.id, resources.title, resources.slug, count(*) as opens, count(distinct events.user_id) as unique_openers
    from public.resource_open_events events
    join public.resources resources on resources.id = events.resource_id
    where events.opened_at >= start_at and events.opened_at < end_at
    group by resources.id, resources.title, resources.slug
    order by opens desc, resources.title, resources.id
    limit 8
  )
  select jsonb_build_object(
    'generatedAt', end_at,
    'overview', jsonb_build_object(
      'signups', coalesce((select sum(signups) from daily_counts), 0),
      'consultants', coalesce((select sum(consultants) from daily_counts), 0),
      'resources', coalesce((select sum(resources) from daily_counts), 0),
      'resourceOpens', coalesce((select sum(resource_opens) from daily_counts), 0),
      'uniqueResourceOpeners', (select count(distinct user_id) from public.resource_open_events where opened_at >= start_at and opened_at < end_at),
      'consultantViews', coalesce((select sum(consultant_views) from daily_counts), 0),
      'enquiries', coalesce((select sum(enquiries) from daily_counts), 0),
      'pendingConsultants', (select count(*) from public.consultants where status = 'pending'),
      'approvedConsultants', (select count(*) from public.consultants where status = 'approved'),
      'pendingResources', (select count(*) from public.resources where status = 'pending'),
      'approvedResources', (select count(*) from public.resources where status = 'approved')
    ),
    'trend', (select value from trend),
    'topResources', (select coalesce(jsonb_agg(jsonb_build_object(
      'id', id, 'title', title, 'slug', slug, 'opens', opens, 'uniqueOpeners', unique_openers
    ) order by opens desc, title, id), '[]'::jsonb) from top_resources)
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_in_app_analytics(integer) from public, anon, authenticated;
grant execute on function public.admin_in_app_analytics(integer) to service_role;

select pg_notify('pgrst', 'reload schema');