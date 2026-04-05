create extension if not exists "pgcrypto";

alter table public.training_sessions
  add column if not exists bookings_enabled boolean not null default false,
  add column if not exists availability_display text not null default 'remaining_places',
  add column if not exists booking_url text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'training_sessions_availability_display_check'
  ) then
    alter table public.training_sessions
      add constraint training_sessions_availability_display_check
      check (availability_display = any (array['remaining_places'::text, 'availability_only'::text]));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'training_sessions_booking_url_check'
  ) then
    alter table public.training_sessions
      add constraint training_sessions_booking_url_check
      check (
        booking_url is null
        or (char_length(booking_url) <= 2048 and booking_url ~* '^https?://')
      );
  end if;
end $$;

create table if not exists public.training_session_bookings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  booking_name text not null check (char_length(trim(booking_name)) between 1 and 120),
  booking_email text not null check (char_length(trim(booking_email)) between 3 and 320),
  booking_phone text,
  status text not null default 'confirmed' check (status = any (array['confirmed'::text, 'cancelled'::text, 'waitlisted'::text])),
  notes text,
  booked_at timestamp with time zone not null default now(),
  cancelled_at timestamp with time zone,
  updated_at timestamp with time zone not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint training_session_bookings_session_user_key unique (session_id, user_id)
);

create index if not exists idx_training_session_bookings_session_status
  on public.training_session_bookings (session_id, status);

create index if not exists idx_training_session_bookings_user
  on public.training_session_bookings (user_id, booked_at desc);

alter table public.training_session_bookings enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'training_session_bookings'
      and policyname = 'training_bookings_select_own'
  ) then
    create policy training_bookings_select_own on public.training_session_bookings
      for select to authenticated
      using (user_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'training_session_bookings'
      and policyname = 'training_bookings_insert_own'
  ) then
    create policy training_bookings_insert_own on public.training_session_bookings
      for insert to authenticated
      with check (
        user_id = auth.uid()
        and exists (
          select 1
          from public.training_sessions s
          join public.training_courses c on c.id = s.course_id
          where s.id = session_id
            and s.status = 'scheduled'
            and c.status = 'published'
            and coalesce(s.bookings_enabled, false) = true
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'training_session_bookings'
      and policyname = 'training_bookings_update_own'
  ) then
    create policy training_bookings_update_own on public.training_session_bookings
      for update to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'training_session_bookings'
      and policyname = 'training_bookings_select_trainer'
  ) then
    create policy training_bookings_select_trainer on public.training_session_bookings
      for select to authenticated
      using (
        exists (
          select 1
          from public.training_sessions s
          join public.training_courses course on course.id = s.course_id
          join public.consultants consultant on consultant.id = course.consultant_id
          where s.id = session_id
            and (
              consultant.user_id = auth.uid()
              or consultant.claimed_by = auth.uid()
              or exists (
                select 1 from public.app_admins admin where admin.user_id = auth.uid()
              )
            )
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'training_session_bookings'
      and policyname = 'training_bookings_update_trainer'
  ) then
    create policy training_bookings_update_trainer on public.training_session_bookings
      for update to authenticated
      using (
        exists (
          select 1
          from public.training_sessions s
          join public.training_courses course on course.id = s.course_id
          join public.consultants consultant on consultant.id = course.consultant_id
          where s.id = session_id
            and (
              consultant.user_id = auth.uid()
              or consultant.claimed_by = auth.uid()
              or exists (
                select 1 from public.app_admins admin where admin.user_id = auth.uid()
              )
            )
        )
      )
      with check (
        exists (
          select 1
          from public.training_sessions s
          join public.training_courses course on course.id = s.course_id
          join public.consultants consultant on consultant.id = course.consultant_id
          where s.id = session_id
            and (
              consultant.user_id = auth.uid()
              or consultant.claimed_by = auth.uid()
              or exists (
                select 1 from public.app_admins admin where admin.user_id = auth.uid()
              )
            )
        )
      );
  end if;
end $$;