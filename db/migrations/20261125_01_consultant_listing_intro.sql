begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.consultant_listing_intros (
  consultant_id uuid primary key references public.consultants(id) on delete cascade,
  attempt_id uuid,
  completed_at timestamptz,
  postmark_message_id uuid
);

alter table private.consultant_listing_intros enable row level security;
revoke all on table private.consultant_listing_intros from public, anon, authenticated;

-- Existing live listings are outside this first-publication campaign.
lock table public.consultants in share row exclusive mode;
insert into private.consultant_listing_intros (consultant_id, completed_at)
select id, now()
from public.consultants
where status = 'approved' and visibility = 'public'
  and coalesce(profile_type, 'consultant') in ('consultant', 'both');

create function private.queue_consultant_listing_intro()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'approved' and new.visibility = 'public'
     and coalesce(new.profile_type, 'consultant') in ('consultant', 'both')
     and new.claimed_by is null and new.claimed_at is null then
    if tg_op = 'UPDATE' then
      if old.status = 'approved' and old.visibility = 'public' then
        return new;
      end if;
    end if;

    insert into private.consultant_listing_intros (consultant_id)
    values (new.id)
    on conflict (consultant_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger queue_consultant_listing_intro
after insert or update of status, visibility on public.consultants
for each row execute function private.queue_consultant_listing_intro();

create function public.reserve_consultant_listing_intro(p_consultant_id uuid)
returns table (attempt_id uuid, consultant_name text, contact_email text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.app_admins where user_id = auth.uid()) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  return query
    update private.consultant_listing_intros as q
    set attempt_id = pg_catalog.gen_random_uuid()
    from public.consultants as c
    where q.consultant_id = p_consultant_id and c.id = q.consultant_id
      and q.attempt_id is null and q.completed_at is null
      and c.status = 'approved' and c.visibility = 'public'
      and coalesce(c.profile_type, 'consultant') in ('consultant', 'both')
      and c.claimed_by is null and c.claimed_at is null
      and pg_catalog.btrim(c.contact_email) <> ''
    returning q.attempt_id, coalesce(nullif(pg_catalog.btrim(c.company), ''), c.display_name),
      pg_catalog.btrim(c.contact_email);
end;
$$;

create function public.finish_consultant_listing_intro(
  p_consultant_id uuid, p_attempt_id uuid, p_message_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.app_admins where user_id = auth.uid()) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  update private.consultant_listing_intros
  set attempt_id = null,
      completed_at = case when p_message_id is not null then pg_catalog.now() end,
      postmark_message_id = p_message_id
  where consultant_id = p_consultant_id
    and attempt_id = p_attempt_id and completed_at is null;
end;
$$;

revoke all on function private.queue_consultant_listing_intro() from public, anon, authenticated;
revoke all on function public.reserve_consultant_listing_intro(uuid) from public, anon, authenticated;
revoke all on function public.finish_consultant_listing_intro(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.reserve_consultant_listing_intro(uuid) to authenticated;
grant execute on function public.finish_consultant_listing_intro(uuid, uuid, uuid) to authenticated;

commit;
