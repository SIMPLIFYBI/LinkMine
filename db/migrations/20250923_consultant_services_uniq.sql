create unique index if not exists consultant_services_unique
  on public.consultant_services (consultant_id, service_id);
create index if not exists consultant_services_service_idx
  on public.consultant_services (service_id);
select pg_notify('pgrst', 'reload schema');