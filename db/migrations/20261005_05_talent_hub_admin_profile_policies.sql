-- Let authenticated application admins manage Talent Hub profiles without a service-role key.

grant select, insert, update, delete on public.talent_hub_profiles to authenticated;
grant select, insert, update, delete on public.worker_availability to authenticated;
grant select, insert, update, delete on public.worker_service_interests to authenticated;
grant select, insert, update, delete on public.worker_experiences to authenticated;

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