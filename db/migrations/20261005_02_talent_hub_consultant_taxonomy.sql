-- Talent Hub uses the same mining taxonomy as the YouMine consultant directory.

create table if not exists public.worker_service_interests (
  worker_id uuid not null references public.workers(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (worker_id, service_id)
);

-- Preserve selections when a legacy Talent Hub role already matches a shared service slug.
insert into public.worker_service_interests (worker_id, service_id)
select worker_role.worker_id, service.id
from public.worker_roles worker_role
join public.role_categories role_category on role_category.id = worker_role.role_category_id
join public.services service on service.slug = role_category.slug
on conflict (worker_id, service_id) do nothing;

alter table public.worker_service_interests enable row level security;
grant select, insert, delete on public.worker_service_interests to authenticated;

drop policy if exists worker_service_interests_select_own on public.worker_service_interests;
create policy worker_service_interests_select_own on public.worker_service_interests
  for select using (auth.uid() = worker_id);

drop policy if exists worker_service_interests_insert_own on public.worker_service_interests;
create policy worker_service_interests_insert_own on public.worker_service_interests
  for insert with check (auth.uid() = worker_id);

drop policy if exists worker_service_interests_delete_own on public.worker_service_interests;
create policy worker_service_interests_delete_own on public.worker_service_interests
  for delete using (auth.uid() = worker_id);

create or replace view public.talent_hub_public_profile_services
with (security_invoker = false) as
select
  talent_profile.worker_id,
  service.id as service_id,
  service.name as service_name,
  service.slug as service_slug
from public.talent_hub_public_profiles talent_profile
join public.worker_service_interests worker_service on worker_service.worker_id = talent_profile.worker_id
join public.services service on service.id = worker_service.service_id;

grant select on public.talent_hub_public_profile_services to anon, authenticated;

-- Legacy role categories no longer drive Talent Hub. Remove only records without a worker selection.
delete from public.role_categories role_category
where not exists (
  select 1
  from public.worker_roles worker_role
  where worker_role.role_category_id = role_category.id
);

select pg_notify('pgrst', 'reload schema');