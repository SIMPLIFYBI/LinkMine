alter table public.resources
  add column if not exists open_count bigint not null default 0;

update public.resources
set open_count = coalesce(download_count, 0)
where coalesce(open_count, 0) = 0;

create table if not exists public.resource_open_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  access_kind text not null
    check (access_kind = any (array['hosted'::text, 'external'::text])),
  source_surface text not null default 'unknown',
  opened_at timestamptz not null default now()
);

create index if not exists idx_resource_open_events_resource_opened
  on public.resource_open_events (resource_id, opened_at desc);

create index if not exists idx_resource_open_events_user_opened
  on public.resource_open_events (user_id, opened_at desc);

alter table public.resource_open_events enable row level security;

drop policy if exists resource_open_events_select_own on public.resource_open_events;
create policy resource_open_events_select_own on public.resource_open_events
  for select using (user_id = auth.uid() or public.is_app_admin(auth.uid()));

drop policy if exists resource_open_events_insert_own_or_admin on public.resource_open_events;
create policy resource_open_events_insert_own_or_admin on public.resource_open_events
  for insert with check (user_id = auth.uid() or public.is_app_admin(auth.uid()));
