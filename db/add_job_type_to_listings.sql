-- Adds job_type to listings with an enum and a default of 'general'

do $$
begin
  if not exists (select 1 from pg_type where typname = 'listing_job_type') then
    create type public.listing_job_type as enum ('fixed_price','fixed_duration','eoi','general');
  end if;
end$$;

alter table public.listings
  add column if not exists job_type public.listing_job_type;

-- Set default and backfill
alter table public.listings alter column job_type set default 'general';
update public.listings set job_type = 'general' where job_type is null;

-- Optional: enforce not null after backfill
alter table public.listings alter column job_type set not null;

-- Refresh PostgREST
select pg_notify('pgrst', 'reload schema');