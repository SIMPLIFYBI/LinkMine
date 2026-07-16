alter table public.resource_categories enable row level security;
alter table public.resource_tags enable row level security;
alter table public.resources enable row level security;

drop policy if exists resource_categories_select_authenticated on public.resource_categories;
drop policy if exists resource_categories_select_public on public.resource_categories;
create policy resource_categories_select_public on public.resource_categories
  for select using (is_active = true);

drop policy if exists resource_tags_select_authenticated on public.resource_tags;
drop policy if exists resource_tags_select_public on public.resource_tags;
create policy resource_tags_select_public on public.resource_tags
  for select using (true);

drop policy if exists resources_select_authenticated on public.resources;
drop policy if exists resources_select_public on public.resources;
create policy resources_select_public on public.resources
  for select using (
    status = 'approved'
    or owner_user_id = auth.uid()
    or public.is_app_admin(auth.uid())
  );

select pg_notify('pgrst', 'reload schema');