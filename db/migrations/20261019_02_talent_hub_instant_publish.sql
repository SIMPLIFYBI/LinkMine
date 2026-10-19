-- Talent Hub candidates publish immediately when they choose Public visibility.
-- There is no administrator approval queue for this product flow.

alter table public.talent_hub_profiles
  alter column status set default 'approved';

update public.talent_hub_profiles
set status = 'approved',
    updated_at = now()
where status in ('draft', 'pending');

select pg_notify('pgrst', 'reload schema');