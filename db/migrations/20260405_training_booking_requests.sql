do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'training_session_bookings_status_check'
      and conrelid = 'public.training_session_bookings'::regclass
  ) then
    alter table public.training_session_bookings
      drop constraint training_session_bookings_status_check;
  end if;

  alter table public.training_session_bookings
    alter column status set default 'pending';

  alter table public.training_session_bookings
    add constraint training_session_bookings_status_check
    check (status = any (array['pending'::text, 'confirmed'::text, 'cancelled'::text, 'waitlisted'::text]));
end $$;

update public.training_session_bookings
set status = 'pending',
    updated_at = now()
where status is null;