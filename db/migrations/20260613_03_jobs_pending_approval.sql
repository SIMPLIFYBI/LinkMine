alter table public.jobs
  drop constraint if exists jobs_status_check;

alter table public.jobs
  alter column status set default 'pending';

alter table public.jobs
  add constraint jobs_status_check
  check (status = any (array['pending'::text, 'open'::text, 'closed'::text, 'deleted'::text, 'paused'::text]));

select pg_notify('pgrst', 'reload schema');