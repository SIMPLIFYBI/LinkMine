alter table public.talent_hub_profiles
  add column if not exists alias_descriptor text,
  add column if not exists alias_animal text;

update public.talent_hub_profiles
set
  alias_descriptor = lower(split_part(talent_alias, ' ', 1)),
  alias_animal = lower(split_part(talent_alias, ' ', 2))
where alias_descriptor is null or alias_animal is null;

alter table public.talent_hub_profiles
  alter column alias_descriptor set not null,
  alter column alias_animal set not null;

create or replace view public.talent_hub_public_profiles
with (security_invoker = false) as
select
  worker_id,
  talent_alias,
  alias_descriptor,
  alias_animal,
  headline,
  bio,
  location,
  working_rights_slug,
  created_at
from public.talent_hub_profiles
where visibility = 'public'
  and status = 'approved';

grant select on public.talent_hub_public_profiles to anon, authenticated;
select pg_notify('pgrst', 'reload schema');