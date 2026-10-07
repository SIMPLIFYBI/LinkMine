-- Talent Hub worker records are owned by the matching authenticated user.
-- These policies must not query public.workers because authenticated access to
-- that private table is intentionally revoked.

grant select, insert, update, delete on public.worker_availability to authenticated;
grant select, insert, update, delete on public.worker_experiences to authenticated;
grant select, insert, update, delete on public.worker_service_interests to authenticated;
grant select, insert, update, delete on public.talent_hub_profiles to authenticated;

drop policy if exists talent_hub_profiles_admin_manage on public.talent_hub_profiles;
create policy talent_hub_profiles_admin_manage on public.talent_hub_profiles
  for all to authenticated
  using (exists (select 1 from public.app_admins admin where admin.user_id = auth.uid()))
  with check (exists (select 1 from public.app_admins admin where admin.user_id = auth.uid()));

drop policy if exists worker_availability_admin_manage on public.worker_availability;
create policy worker_availability_admin_manage on public.worker_availability
  for all to authenticated
  using (exists (select 1 from public.app_admins admin where admin.user_id = auth.uid()))
  with check (exists (select 1 from public.app_admins admin where admin.user_id = auth.uid()));

drop policy if exists worker_service_interests_admin_manage on public.worker_service_interests;
create policy worker_service_interests_admin_manage on public.worker_service_interests
  for all to authenticated
  using (exists (select 1 from public.app_admins admin where admin.user_id = auth.uid()))
  with check (exists (select 1 from public.app_admins admin where admin.user_id = auth.uid()));

drop policy if exists worker_experiences_admin_manage on public.worker_experiences;
create policy worker_experiences_admin_manage on public.worker_experiences
  for all to authenticated
  using (exists (select 1 from public.app_admins admin where admin.user_id = auth.uid()))
  with check (exists (select 1 from public.app_admins admin where admin.user_id = auth.uid()));

drop policy if exists worker_availability_select_talent_owner on public.worker_availability;
create policy worker_availability_select_talent_owner on public.worker_availability
  for select to authenticated using (auth.uid() = worker_id);

drop policy if exists worker_availability_insert_talent_owner on public.worker_availability;
create policy worker_availability_insert_talent_owner on public.worker_availability
  for insert to authenticated with check (auth.uid() = worker_id);

drop policy if exists worker_availability_update_talent_owner on public.worker_availability;
create policy worker_availability_update_talent_owner on public.worker_availability
  for update to authenticated using (auth.uid() = worker_id)
  with check (auth.uid() = worker_id);

drop policy if exists worker_availability_delete_talent_owner on public.worker_availability;
create policy worker_availability_delete_talent_owner on public.worker_availability
  for delete to authenticated using (auth.uid() = worker_id);

drop policy if exists worker_experiences_select_talent_owner on public.worker_experiences;
create policy worker_experiences_select_talent_owner on public.worker_experiences
  for select to authenticated using (auth.uid() = worker_id);

drop policy if exists worker_experiences_insert_talent_owner on public.worker_experiences;
create policy worker_experiences_insert_talent_owner on public.worker_experiences
  for insert to authenticated with check (auth.uid() = worker_id);

drop policy if exists worker_experiences_update_talent_owner on public.worker_experiences;
create policy worker_experiences_update_talent_owner on public.worker_experiences
  for update to authenticated using (auth.uid() = worker_id)
  with check (auth.uid() = worker_id);

drop policy if exists worker_experiences_delete_talent_owner on public.worker_experiences;
create policy worker_experiences_delete_talent_owner on public.worker_experiences
  for delete to authenticated using (auth.uid() = worker_id);

select pg_notify('pgrst', 'reload schema');