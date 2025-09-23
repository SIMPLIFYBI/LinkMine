create index if not exists idx_services_slug on public.services (slug);
create index if not exists idx_consultant_services_service on public.consultant_services (service_id);
create index if not exists idx_consultant_services_consultant on public.consultant_services (consultant_id);
select pg_notify('pgrst', 'reload schema');