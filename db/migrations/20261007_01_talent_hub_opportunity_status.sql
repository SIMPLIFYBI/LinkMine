alter table public.talent_hub_profiles
  add column if not exists opportunity_status text not null default 'open_to_opportunities';

update public.talent_hub_profiles
set opportunity_status = 'open_to_opportunities'
where opportunity_status is null;

alter table public.talent_hub_profiles
  drop constraint if exists talent_hub_profiles_opportunity_status_check;

alter table public.talent_hub_profiles
  add constraint talent_hub_profiles_opportunity_status_check
  check (opportunity_status in (
    'actively_looking',
    'open_to_opportunities',
    'job_curious',
    'open_to_contract_work',
    'open_to_a_chat',
    'not_looking'
  ));

create or replace view public.talent_hub_public_profiles
with (security_invoker = false) as
select
  worker_id,
  talent_alias,
  headline,
  bio,
  location,
  working_rights_slug,
  created_at,
  opportunity_status
from public.talent_hub_profiles
where visibility = 'public'
  and status = 'approved';

grant select on public.talent_hub_public_profiles to anon, authenticated;
select pg_notify('pgrst', 'reload schema');