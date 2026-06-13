create table if not exists public.job_page_views (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  viewer_id uuid references auth.users(id) on delete set null,
  anon_hash text,
  user_agent text,
  viewed_at timestamptz not null default now(),
  source text
);

create index if not exists idx_job_page_views_job on public.job_page_views (job_id);
create index if not exists idx_job_page_views_job_viewer_time
  on public.job_page_views (job_id, viewer_id, viewed_at desc);
create index if not exists idx_job_page_views_job_anon_time
  on public.job_page_views (job_id, anon_hash, viewed_at desc);

alter table public.job_page_views enable row level security;

drop policy if exists "job_page_views - insert authenticated or anon" on public.job_page_views;
drop policy if exists "job_page_views - select admin" on public.job_page_views;

create policy "job_page_views - insert authenticated or anon" on public.job_page_views
  for insert with check (true);

create policy "job_page_views - select admin" on public.job_page_views
  for select using (auth.role() = 'authenticated');

select pg_notify('pgrst', 'reload schema');