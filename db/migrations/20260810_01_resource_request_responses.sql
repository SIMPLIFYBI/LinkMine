alter table public.resource_requests
  add column if not exists accepted_response_id uuid;

create table if not exists public.resource_request_responses (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.resource_requests(id) on delete cascade,
  responder_user_id uuid not null references auth.users(id) on delete cascade,
  resource_id uuid references public.resources(id) on delete set null,
  message text,
  status text not null default 'submitted'
    check (status = any (array['submitted'::text, 'accepted'::text, 'rejected'::text, 'withdrawn'::text])),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  rejected_at timestamptz,
  withdrawn_at timestamptz
);

alter table public.resource_requests
  drop constraint if exists resource_requests_accepted_response_id_fkey;
alter table public.resource_requests
  add constraint resource_requests_accepted_response_id_fkey
  foreign key (accepted_response_id)
  references public.resource_request_responses(id)
  on delete set null;

create index if not exists idx_resource_request_responses_request_status
  on public.resource_request_responses (request_id, status);

create index if not exists idx_resource_request_responses_responder_status
  on public.resource_request_responses (responder_user_id, status);

create index if not exists idx_resource_requests_accepted_response_id
  on public.resource_requests (accepted_response_id);

create unique index if not exists idx_resource_request_responses_one_active_per_responder
  on public.resource_request_responses (request_id, responder_user_id)
  where status = 'submitted';

drop trigger if exists trg_resource_request_responses_updated_at on public.resource_request_responses;
create trigger trg_resource_request_responses_updated_at
before update on public.resource_request_responses
for each row execute function public.set_row_updated_at();

alter table public.resource_request_responses enable row level security;

drop policy if exists resource_request_responses_select_participants on public.resource_request_responses;
create policy resource_request_responses_select_participants on public.resource_request_responses
  for select using (
    auth.role() = 'authenticated'
    and (
      responder_user_id = auth.uid()
      or public.is_app_admin(auth.uid())
      or exists (
        select 1
        from public.resource_requests rq
        where rq.id = resource_request_responses.request_id
          and rq.requester_user_id = auth.uid()
      )
    )
  );

drop policy if exists resource_request_responses_insert_responder on public.resource_request_responses;
create policy resource_request_responses_insert_responder on public.resource_request_responses
  for insert with check (
    auth.role() = 'authenticated'
    and responder_user_id = auth.uid()
    and exists (
      select 1
      from public.resource_requests rq
      where rq.id = resource_request_responses.request_id
        and rq.status <> 'cancelled'
    )
  );

drop policy if exists resource_request_responses_update_participants on public.resource_request_responses;
create policy resource_request_responses_update_participants on public.resource_request_responses
  for update using (
    auth.role() = 'authenticated'
    and (
      responder_user_id = auth.uid()
      or public.is_app_admin(auth.uid())
      or exists (
        select 1
        from public.resource_requests rq
        where rq.id = resource_request_responses.request_id
          and rq.requester_user_id = auth.uid()
      )
    )
  )
  with check (
    auth.role() = 'authenticated'
    and (
      responder_user_id = auth.uid()
      or public.is_app_admin(auth.uid())
      or exists (
        select 1
        from public.resource_requests rq
        where rq.id = resource_request_responses.request_id
          and rq.requester_user_id = auth.uid()
      )
    )
  );

select pg_notify('pgrst', 'reload schema');
