-- Store admin-managed placement settings for the Vault home page.

create table if not exists public.resource_homepage_placements (
  placement_key text primary key,
  hero_resource_id uuid references public.resources(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint resource_homepage_placements_key_check
    check (placement_key = 'vault_home')
);

insert into public.resource_homepage_placements (placement_key)
values ('vault_home')
on conflict (placement_key) do nothing;

alter table public.resource_homepage_placements enable row level security;

drop policy if exists resource_homepage_placements_select_public on public.resource_homepage_placements;
create policy resource_homepage_placements_select_public on public.resource_homepage_placements
  for select using (true);

drop policy if exists resource_homepage_placements_write_admin on public.resource_homepage_placements;
create policy resource_homepage_placements_write_admin on public.resource_homepage_placements
  for all using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

select pg_notify('pgrst', 'reload schema');
