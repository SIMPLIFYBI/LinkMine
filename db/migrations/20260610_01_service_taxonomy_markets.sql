do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'service_market'
  ) then
    create type public.service_market as enum ('mining', 'oil_gas');
  end if;
end;
$$;

alter table public.service_categories
  add column if not exists market public.service_market;

alter table public.services
  add column if not exists market public.service_market;

update public.service_categories
set market = 'mining'::public.service_market
where market is null;

update public.services s
set market = sc.market
from public.service_categories sc
where sc.id = s.category_id
  and s.market is null;

update public.services
set market = 'mining'::public.service_market
where market is null;

alter table public.service_categories
  alter column market set default 'mining'::public.service_market;

alter table public.service_categories
  alter column market set not null;

alter table public.services
  alter column market set default 'mining'::public.service_market;

alter table public.services
  alter column market set not null;

create or replace function public.sync_service_market_from_category()
returns trigger
language plpgsql
as $$
declare
  v_market public.service_market;
begin
  select sc.market
  into v_market
  from public.service_categories sc
  where sc.id = new.category_id;

  if v_market is null then
    raise exception 'service category % is missing a market', new.category_id;
  end if;

  new.market := v_market;
  return new;
end;
$$;

drop trigger if exists trg_services_sync_market on public.services;

create trigger trg_services_sync_market
before insert or update of category_id, market
on public.services
for each row
execute function public.sync_service_market_from_category();

do $$
declare
  v_constraint_name text;
begin
  for v_constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    join unnest(con.conkey) with ordinality as cols(attnum, ordinality) on true
    join pg_attribute att on att.attrelid = rel.oid and att.attnum = cols.attnum
    where nsp.nspname = 'public'
      and rel.relname = 'service_categories'
      and con.contype = 'u'
    group by con.conname
    having array_agg(att.attname::text order by cols.ordinality) = array['slug']::text[]
  loop
    execute format('alter table public.service_categories drop constraint %I', v_constraint_name);
  end loop;

  for v_constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    join unnest(con.conkey) with ordinality as cols(attnum, ordinality) on true
    join pg_attribute att on att.attrelid = rel.oid and att.attnum = cols.attnum
    where nsp.nspname = 'public'
      and rel.relname = 'service_categories'
      and con.contype = 'u'
    group by con.conname
    having array_agg(att.attname::text order by cols.ordinality) = array['name']::text[]
  loop
    execute format('alter table public.service_categories drop constraint %I', v_constraint_name);
  end loop;

  for v_constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    join unnest(con.conkey) with ordinality as cols(attnum, ordinality) on true
    join pg_attribute att on att.attrelid = rel.oid and att.attnum = cols.attnum
    where nsp.nspname = 'public'
      and rel.relname = 'services'
      and con.contype = 'u'
    group by con.conname
    having array_agg(att.attname::text order by cols.ordinality) = array['slug']::text[]
  loop
    execute format('alter table public.services drop constraint %I', v_constraint_name);
  end loop;
end;
$$;

drop index if exists public.idx_services_slug_unique;

create unique index if not exists idx_service_categories_market_slug
  on public.service_categories (market, slug);

create unique index if not exists idx_service_categories_market_name
  on public.service_categories (market, name);

create unique index if not exists idx_services_market_slug
  on public.services (market, slug);

create index if not exists idx_service_categories_market_position
  on public.service_categories (market, position, name);

create index if not exists idx_services_market_category_position
  on public.services (market, category_id, position, name);

select pg_notify('pgrst', 'reload schema');
