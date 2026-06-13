drop policy if exists jobs_update_admin on public.jobs;

create policy jobs_update_admin on public.jobs
  for update
  using (
    exists (
      select 1
      from public.app_admins admin
      where admin.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.app_admins admin
      where admin.user_id = auth.uid()
    )
  );

select pg_notify('pgrst', 'reload schema');