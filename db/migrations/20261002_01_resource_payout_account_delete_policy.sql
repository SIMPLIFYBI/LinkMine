drop policy if exists resource_payout_accounts_delete_owner on public.resource_payout_accounts;
create policy resource_payout_accounts_delete_owner on public.resource_payout_accounts
  for delete using (user_id = auth.uid() or public.is_app_admin(auth.uid()));

select pg_notify('pgrst', 'reload schema');