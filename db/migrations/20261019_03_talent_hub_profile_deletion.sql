-- Candidates may remove their Talent Hub profile without deleting their account
-- or historical connection conversations.

grant delete on public.talent_hub_profiles to authenticated;

drop policy if exists talent_hub_profiles_delete_own on public.talent_hub_profiles;
create policy talent_hub_profiles_delete_own on public.talent_hub_profiles
  for delete to authenticated
  using (auth.uid() = worker_id);

select pg_notify('pgrst', 'reload schema');