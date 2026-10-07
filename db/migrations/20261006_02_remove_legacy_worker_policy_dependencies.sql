-- Remove legacy RLS policies that still query public.workers. PostgreSQL checks
-- referenced-table permissions while planning the policy, even when another
-- permissive policy would allow the request.
do $$
declare
  legacy_policy record;
begin
  for legacy_policy in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('worker_availability', 'worker_experiences', 'worker_service_interests')
      and (
        coalesce(qual, '') ilike '%workers%'
        or coalesce(with_check, '') ilike '%workers%'
      )
  loop
    execute format('drop policy if exists %I on public.%I', legacy_policy.policyname, legacy_policy.tablename);
  end loop;
end;
$$;

select pg_notify('pgrst', 'reload schema');