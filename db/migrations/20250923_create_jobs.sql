create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete set null,
  title text not null,
  description text null,
  location text null,
  service_slug text not null,
 recipient_ids  uuid[] not null default '{}',
  status text not null default 'open', -- open | fulfilled | cancelled
  created_at timestamptz not null default now()
);

create index if not exists jobs_created_by_idx on public.jobs(created_by);
create index if not exists jobs_status_idx on public.jobs(status);

select pg_notify('pgrst', 'reload schema');