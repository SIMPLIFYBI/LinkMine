-- Ensure consultant_services links to services (not categories)

-- Add column if missing
alter table public.consultant_services
  add column if not exists service_id uuid;

-- Optional: if you had service_category_id before, keep it temporarily for backfill
-- alter table public.consultant_services add column if not exists service_category_id uuid;

-- FK + indexes
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'consultant_services_service_id_fkey'
      and conrelid = 'public.consultant_services'::regclass
  ) then
    alter table public.consultant_services
      add constraint consultant_services_service_id_fkey
      foreign key (service_id) references public.services(id) on delete cascade;
  end if;
end$$;

create index if not exists idx_consultant_services_service on public.consultant_services(service_id);
create index if not exists idx_consultant_services_consultant on public.consultant_services(consultant_id);

-- Enforce uniqueness
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'consultant_services_consultant_service_key'
      and conrelid = 'public.consultant_services'::regclass
  ) then
    alter table public.consultant_services
      add constraint consultant_services_consultant_service_key
      unique (consultant_id, service_id);
  end if;
end$$;

-- If you previously stored only category links, you cannot deterministically pick a sub-service.
-- Backfill must be done via UI or a mapping. Leave service_id null for those rows and fix forward:
-- update public.consultant_services set service_id = <chosen service uuid> where ...;

-- Convenience view: derive category for filtering by category slug
create or replace view public.consultant_services_with_category as
select
  cs.consultant_id,
  cs.service_id,
  s.slug        as service_slug,
  s.name        as service_name,
  s.category_id,
  c.slug        as category_slug,
  c.name        as category_name
from public.consultant_services cs
join public.services s on s.id = cs.service_id
join public.service_categories c on c.id = s.category_id;

select pg_notify('pgrst', 'reload schema');