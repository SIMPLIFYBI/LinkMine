-- Mark seeded Talent Hub candidates so only administrators can identify and retire them.

alter table public.talent_hub_profiles
  add column if not exists is_test_profile boolean not null default false;

comment on column public.talent_hub_profiles.is_test_profile is
  'Administrator-only marker for seeded or generated Talent Hub profiles.';

select pg_notify('pgrst', 'reload schema');