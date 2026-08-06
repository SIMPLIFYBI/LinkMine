-- Allow marketplace preview image storage without using the service-role key.
-- Scope is restricted to image paths under users/<owner>/resources/<resource_id>/images/*.

-- Public and authenticated read for preview images where the resource is approved,
-- or where the current user is the owner/admin.
drop policy if exists resource_preview_images_select on storage.objects;
create policy resource_preview_images_select on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'resources'
    and exists (
      select 1
      from public.resource_images ri
      join public.resources r on r.id = ri.resource_id
      where ri.bucket_name = storage.objects.bucket_id
        and ri.object_path = storage.objects.name
        and (
          r.status = 'approved'
          or r.owner_user_id = auth.uid()
          or public.is_app_admin(auth.uid())
        )
    )
  );

-- Authenticated owners/admins can upload preview images for resources they own.
drop policy if exists resource_preview_images_insert_owner_or_admin on storage.objects;
create policy resource_preview_images_insert_owner_or_admin on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'resources'
    and storage.objects.name ~ '^users/[0-9a-fA-F-]{36}/resources/[0-9a-fA-F-]{36}/images/.+'
    and split_part(storage.objects.name, '/', 2) = auth.uid()::text
    and exists (
      select 1
      from public.resources r
      where r.id::text = split_part(storage.objects.name, '/', 4)
        and (
          r.owner_user_id = auth.uid()
          or public.is_app_admin(auth.uid())
        )
    )
  );

-- Authenticated owners/admins can delete preview images they own/manage.
drop policy if exists resource_preview_images_delete_owner_or_admin on storage.objects;
create policy resource_preview_images_delete_owner_or_admin on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'resources'
    and exists (
      select 1
      from public.resource_images ri
      join public.resources r on r.id = ri.resource_id
      where ri.bucket_name = storage.objects.bucket_id
        and ri.object_path = storage.objects.name
        and (
          r.owner_user_id = auth.uid()
          or public.is_app_admin(auth.uid())
        )
    )
  );

select pg_notify('pgrst', 'reload schema');
