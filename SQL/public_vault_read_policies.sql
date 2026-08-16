-- Public browse policies for Vault/Marketplace without service-role key.
-- Apply this in Supabase SQL editor (or your migration process).

begin;

-- Ensure RLS is enabled.
alter table if exists public.resources enable row level security;
alter table if exists public.resource_categories enable row level security;
alter table if exists public.resource_tag_links enable row level security;
alter table if exists public.resource_tags enable row level security;
alter table if exists public.resource_images enable row level security;

-- Public + signed-in users can read approved resources.
drop policy if exists "public_read_approved_resources" on public.resources;
create policy "public_read_approved_resources"
on public.resources
for select
to anon, authenticated
using (status = 'approved');

-- Public + signed-in users can read active categories.
drop policy if exists "public_read_active_resource_categories" on public.resource_categories;
create policy "public_read_active_resource_categories"
on public.resource_categories
for select
to anon, authenticated
using (is_active = true);

-- Public + signed-in users can read tag links for approved resources only.
drop policy if exists "public_read_resource_tag_links_for_approved_resources" on public.resource_tag_links;
create policy "public_read_resource_tag_links_for_approved_resources"
on public.resource_tag_links
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.resources r
    where r.id = resource_tag_links.resource_id
      and r.status = 'approved'
  )
);

-- Public + signed-in users can read tags.
drop policy if exists "public_read_resource_tags" on public.resource_tags;
create policy "public_read_resource_tags"
on public.resource_tags
for select
to anon, authenticated
using (true);

-- Optional but recommended: let public users read preview-image metadata for approved resources.
drop policy if exists "public_read_resource_images_for_approved_resources" on public.resource_images;
create policy "public_read_resource_images_for_approved_resources"
on public.resource_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.resources r
    where r.id = resource_images.resource_id
      and r.status = 'approved'
  )
);

commit;
