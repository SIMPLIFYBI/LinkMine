-- Keep Talent Hub's public identity separate from private worker identity.

create table if not exists public.talent_hub_profiles (
  worker_id uuid primary key references public.workers(id) on delete cascade,
  talent_alias text not null unique,
  headline text,
  bio text,
  location text,
  visibility text not null default 'public'
    check (visibility in ('public', 'private')),
  status text not null default 'draft'
    check (status in ('approved', 'pending', 'rejected', 'draft')),
  working_rights_slug text references public.working_rights_categories(slug),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint talent_hub_profiles_alias_check
    check (talent_alias ~ '^[A-Za-z]+ [A-Za-z]+$')
);

with legacy_workers as (
  select
    worker.*,
    row_number() over (order by worker.created_at, worker.id) - 1 as alias_index
  from public.workers worker
)
insert into public.talent_hub_profiles (
  worker_id,
  talent_alias,
  headline,
  bio,
  location,
  visibility,
  status,
  working_rights_slug,
  created_at,
  updated_at
)
select
  worker.id,
  (array['Amber', 'Basalt', 'Beryl', 'Bronze', 'Cobalt', 'Copper', 'Ember', 'Flint', 'Garnet', 'Golden', 'Granite', 'Iron', 'Jade', 'Nickel', 'Ochre', 'Onyx', 'Opal', 'Quartz', 'Silver', 'Titanium'])[(worker.alias_index / 20)::integer + 1]
    || ' ' ||
  (array['Albatross', 'Beaver', 'Bilby', 'Brolga', 'Capybara', 'Cassowary', 'Condor', 'Dingo', 'Eagle', 'Falcon', 'Jaguar', 'Kangaroo', 'Kookaburra', 'Koala', 'Macaw', 'Orca', 'Quokka', 'Wallaby', 'Wombat', 'Wolf'])[(worker.alias_index % 20)::integer + 1],
  worker.headline,
  worker.bio,
  worker.location,
  worker.visibility,
  worker.status,
  worker.working_rights_slug,
  worker.created_at,
  worker.updated_at
from legacy_workers worker
on conflict (worker_id) do nothing;

alter table public.talent_hub_profiles enable row level security;
grant select, insert, update on public.talent_hub_profiles to authenticated;

drop policy if exists talent_hub_profiles_select_own on public.talent_hub_profiles;
create policy talent_hub_profiles_select_own on public.talent_hub_profiles
  for select using (auth.uid() = worker_id);

drop policy if exists talent_hub_profiles_insert_own on public.talent_hub_profiles;
create policy talent_hub_profiles_insert_own on public.talent_hub_profiles
  for insert with check (auth.uid() = worker_id);

drop policy if exists talent_hub_profiles_update_own on public.talent_hub_profiles;
create policy talent_hub_profiles_update_own on public.talent_hub_profiles
  for update using (auth.uid() = worker_id)
  with check (auth.uid() = worker_id);

create or replace view public.talent_hub_public_profiles
with (security_invoker = false) as
select
  worker_id,
  talent_alias,
  headline,
  bio,
  location,
  working_rights_slug,
  created_at
from public.talent_hub_profiles
where visibility = 'public'
  and status = 'approved';

grant select on public.talent_hub_public_profiles to anon, authenticated;
revoke select on public.workers from anon, authenticated;

select pg_notify('pgrst', 'reload schema');