alter table public.talent_hub_profiles
  add column if not exists avatar_background text not null default 'sage';

alter table public.talent_hub_profiles
  drop constraint if exists talent_hub_profiles_avatar_background_check;

alter table public.talent_hub_profiles
  add constraint talent_hub_profiles_avatar_background_check
  check (avatar_background in (
    'sage', 'dusty-blue', 'muted-teal', 'sand', 'terracotta',
    'lavender', 'slate', 'muted-rose', 'moss', 'stone'
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
  opportunity_status,
  avatar_background
from public.talent_hub_profiles
where visibility = 'public'
  and status = 'approved';

grant select on public.talent_hub_public_profiles to anon, authenticated;
select pg_notify('pgrst', 'reload schema');