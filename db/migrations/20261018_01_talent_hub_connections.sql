-- Talent Hub private connection workflow.
-- Public candidate profiles remain alias-only; requester details, messages, and resumes
-- are visible only to the two participants after a request is created or accepted.

create table if not exists public.talent_requester_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  company_name text,
  role_title text,
  contact_email text,
  contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint talent_requester_profiles_display_name_check
    check (char_length(trim(display_name)) between 2 and 120),
  constraint talent_requester_profiles_company_name_check
    check (company_name is null or char_length(trim(company_name)) <= 160),
  constraint talent_requester_profiles_role_title_check
    check (role_title is null or char_length(trim(role_title)) <= 160)
);

create table if not exists public.talent_connection_requests (
  id uuid primary key default gen_random_uuid(),
  candidate_worker_id uuid not null references public.workers(id) on delete cascade,
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  intent text not null default 'role'
    check (intent in ('role', 'contract', 'consulting', 'exploratory')),
  opportunity_title text,
  opportunity_location text,
  opportunity_url text,
  message text not null,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined', 'withdrawn', 'blocked')),
  responded_at timestamptz,
  withdrawn_at timestamptz,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint talent_connection_requests_message_check
    check (char_length(trim(message)) between 1 and 4000),
  constraint talent_connection_requests_opportunity_title_check
    check (opportunity_title is null or char_length(trim(opportunity_title)) <= 200),
  constraint talent_connection_requests_no_self_request
    check (candidate_worker_id <> requester_user_id)
);

-- One active request per requester/candidate pair. A declined or withdrawn request
-- does not prevent a future, materially different approach.
create unique index if not exists talent_connection_requests_one_active_per_pair
  on public.talent_connection_requests (candidate_worker_id, requester_user_id)
  where status in ('pending', 'accepted');

create index if not exists talent_connection_requests_candidate_status_created_idx
  on public.talent_connection_requests (candidate_worker_id, status, created_at desc);

create index if not exists talent_connection_requests_requester_status_created_idx
  on public.talent_connection_requests (requester_user_id, status, created_at desc);

create table if not exists public.talent_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.talent_connection_requests(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint talent_messages_body_check
    check (char_length(trim(body)) between 1 and 4000)
);

create index if not exists talent_messages_request_created_idx
  on public.talent_messages (request_id, created_at asc);

create table if not exists public.talent_resume_files (
  id uuid primary key default gen_random_uuid(),
  candidate_worker_id uuid not null references public.workers(id) on delete cascade,
  object_path text not null unique,
  file_name text not null,
  content_type text not null,
  byte_size bigint not null check (byte_size > 0 and byte_size <= 10485760),
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint talent_resume_files_name_check
    check (char_length(trim(file_name)) between 1 and 255),
  constraint talent_resume_files_content_type_check
    check (content_type in (
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ))
);

create unique index if not exists talent_resume_files_one_current_per_candidate
  on public.talent_resume_files (candidate_worker_id)
  where is_current;

-- A candidate can make their current resume available to a specific accepted match.
-- This is explicit per request and never inferred from acceptance.
create table if not exists public.talent_resume_shares (
  request_id uuid primary key references public.talent_connection_requests(id) on delete cascade,
  resume_file_id uuid not null references public.talent_resume_files(id) on delete cascade,
  candidate_worker_id uuid not null references public.workers(id) on delete cascade,
  shared_at timestamptz not null default now()
);

alter table public.talent_requester_profiles enable row level security;
alter table public.talent_connection_requests enable row level security;
alter table public.talent_messages enable row level security;
alter table public.talent_resume_files enable row level security;
alter table public.talent_resume_shares enable row level security;

grant select, insert, update, delete on public.talent_requester_profiles to authenticated;
grant select, insert, update, delete on public.talent_connection_requests to authenticated;
grant select, insert, update, delete on public.talent_messages to authenticated;
grant select, insert, update, delete on public.talent_resume_files to authenticated;
grant select, insert, update, delete on public.talent_resume_shares to authenticated;

create or replace function public.talent_request_candidate_user_id(p_candidate_worker_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select worker.id from public.workers worker where worker.id = p_candidate_worker_id
$$;

grant execute on function public.talent_request_candidate_user_id(uuid) to authenticated;

drop policy if exists talent_requester_profiles_manage_own on public.talent_requester_profiles;
create policy talent_requester_profiles_manage_own on public.talent_requester_profiles
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists talent_requester_profiles_candidate_select on public.talent_requester_profiles;
create policy talent_requester_profiles_candidate_select on public.talent_requester_profiles
  for select to authenticated
  using (
    exists (
      select 1
      from public.talent_connection_requests request
      where request.requester_user_id = talent_requester_profiles.user_id
        and public.talent_request_candidate_user_id(request.candidate_worker_id) = auth.uid()
    )
  );

drop policy if exists talent_connection_requests_participants_select on public.talent_connection_requests;
create policy talent_connection_requests_participants_select on public.talent_connection_requests
  for select to authenticated
  using (
    requester_user_id = auth.uid()
    or public.talent_request_candidate_user_id(candidate_worker_id) = auth.uid()
  );

drop policy if exists talent_connection_requests_requester_insert on public.talent_connection_requests;
create policy talent_connection_requests_requester_insert on public.talent_connection_requests
  for insert to authenticated
  with check (
    requester_user_id = auth.uid()
    and candidate_worker_id <> auth.uid()
  );

drop policy if exists talent_connection_requests_participants_update on public.talent_connection_requests;
create policy talent_connection_requests_participants_update on public.talent_connection_requests
  for update to authenticated
  using (
    requester_user_id = auth.uid()
    or public.talent_request_candidate_user_id(candidate_worker_id) = auth.uid()
  )
  with check (
    requester_user_id = auth.uid()
    or public.talent_request_candidate_user_id(candidate_worker_id) = auth.uid()
  );

drop policy if exists talent_messages_participants_select on public.talent_messages;
create policy talent_messages_participants_select on public.talent_messages
  for select to authenticated
  using (
    exists (
      select 1
      from public.talent_connection_requests request
      where request.id = request_id
        and request.status = 'accepted'
        and (
          request.requester_user_id = auth.uid()
          or public.talent_request_candidate_user_id(request.candidate_worker_id) = auth.uid()
        )
    )
  );

drop policy if exists talent_messages_participants_insert on public.talent_messages;
create policy talent_messages_participants_insert on public.talent_messages
  for insert to authenticated
  with check (
    sender_user_id = auth.uid()
    and exists (
      select 1
      from public.talent_connection_requests request
      where request.id = request_id
        and request.status = 'accepted'
        and (
          request.requester_user_id = auth.uid()
          or public.talent_request_candidate_user_id(request.candidate_worker_id) = auth.uid()
        )
    )
  );

drop policy if exists talent_messages_recipient_update on public.talent_messages;
create policy talent_messages_recipient_update on public.talent_messages
  for update to authenticated
  using (
    sender_user_id <> auth.uid()
    and exists (
      select 1
      from public.talent_connection_requests request
      where request.id = request_id
        and request.status = 'accepted'
        and (
          request.requester_user_id = auth.uid()
          or public.talent_request_candidate_user_id(request.candidate_worker_id) = auth.uid()
        )
    )
  )
  with check (sender_user_id <> auth.uid());

drop policy if exists talent_resume_files_candidate_manage on public.talent_resume_files;
create policy talent_resume_files_candidate_manage on public.talent_resume_files
  for all to authenticated
  using (public.talent_request_candidate_user_id(candidate_worker_id) = auth.uid())
  with check (public.talent_request_candidate_user_id(candidate_worker_id) = auth.uid());

drop policy if exists talent_resume_shares_participants_select on public.talent_resume_shares;
create policy talent_resume_shares_participants_select on public.talent_resume_shares
  for select to authenticated
  using (
    exists (
      select 1
      from public.talent_connection_requests request
      where request.id = request_id
        and request.status = 'accepted'
        and (
          request.requester_user_id = auth.uid()
          or public.talent_request_candidate_user_id(request.candidate_worker_id) = auth.uid()
        )
    )
  );

drop policy if exists talent_resume_shares_candidate_manage on public.talent_resume_shares;
create policy talent_resume_shares_candidate_manage on public.talent_resume_shares
  for all to authenticated
  using (public.talent_request_candidate_user_id(candidate_worker_id) = auth.uid())
  with check (public.talent_request_candidate_user_id(candidate_worker_id) = auth.uid());

-- Resume objects are private. API routes issue short-lived signed URLs after checking
-- the matching request and share record.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'talent-resumes',
  'talent-resumes',
  false,
  10485760,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists talent_resumes_candidate_storage_manage on storage.objects;
create policy talent_resumes_candidate_storage_manage on storage.objects
  for all to authenticated
  using (
    bucket_id = 'talent-resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'talent-resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

select pg_notify('pgrst', 'reload schema');