-- Temporary permissive policies (keep RLS enabled, but allow anyone to modify)
alter table public.consultant_services enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname='cs_insert_any' and tablename='consultant_services') then
    create policy cs_insert_any on public.consultant_services
      for insert to anon, authenticated
      with check (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname='cs_delete_any' and tablename='consultant_services') then
    create policy cs_delete_any on public.consultant_services
      for delete to anon, authenticated
      using (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where policyname='cs_update_any' and tablename='consultant_services') then
    create policy cs_update_any on public.consultant_services
      for update to anon, authenticated
      using (true) with check (true);
  end if;
end $$;

-- Read policy (if not already present)
do $$ begin
  if not exists (select 1 from pg_policies where policyname='cs_select_any' and tablename='consultant_services') then
    create policy cs_select_any on public.consultant_services for select using (true);
  end if;
end $$;

select pg_notify('pgrst', 'reload schema');