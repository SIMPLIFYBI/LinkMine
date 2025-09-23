-- FKs (safe if already exist)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'consultant_services_consultant_id_fkey'
  ) then
    alter table public.consultant_services
      add constraint consultant_services_consultant_id_fkey
      foreign key (consultant_id) references public.consultants(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'consultant_services_service_id_fkey'
  ) then
    alter table public.consultant_services
      add constraint consultant_services_service_id_fkey
      foreign key (service_id) references public.services(id) on delete cascade;
  end if;
end$$;

-- Unique pair
create unique index if not exists consultant_services_unique
  on public.consultant_services (consultant_id, service_id);

-- Enable RLS
alter table public.consultant_services enable row level security;

-- Allow read (adjust if needed)
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='consultant_services' and policyname='cs_select_any'
  ) then
    create policy cs_select_any on public.consultant_services for select using (true);
  end if;
end $$;

-- Only the owner (consultants.user_id) can add/remove links
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='consultant_services' and policyname='cs_insert_owner'
  ) then
    create policy cs_insert_owner on public.consultant_services
      for insert to authenticated
      with check (
        exists (
          select 1 from public.consultants c
          where c.id = consultant_id and c.user_id = auth.uid()
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='consultant_services' and policyname='cs_delete_owner'
  ) then
    create policy cs_delete_owner on public.consultant_services
      for delete to authenticated
      using (
        exists (
          select 1 from public.consultants c
          where c.id = consultant_id and c.user_id = auth.uid()
        )
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='consultant_services' and policyname='cs_update_owner'
  ) then
    create policy cs_update_owner on public.consultant_services
      for update to authenticated
      using (
        exists (select 1 from public.consultants c where c.id = consultant_id and c.user_id = auth.uid())
      )
      with check (
        exists (select 1 from public.consultants c where c.id = consultant_id and c.user_id = auth.uid())
      );
  end if;
end $$;

-- Set the consultant to your auth user
update public.consultants
set user_id = auth.uid()
where slug = 'orelogy'; -- or the consultant you're testing

select pg_notify('pgrst', 'reload schema');