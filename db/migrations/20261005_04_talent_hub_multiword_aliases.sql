alter table public.talent_hub_profiles
  drop constraint if exists talent_hub_profiles_alias_check;

alter table public.talent_hub_profiles
  add constraint talent_hub_profiles_alias_check
  check (talent_alias ~ '^[A-Za-z]+( [A-Za-z]+)+$');