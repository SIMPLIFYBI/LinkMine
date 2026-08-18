-- Allow hosted resource pack storage without using the service-role key.
-- Scope is restricted to pack paths under users/<owner>/resources/<resource_id>/<filename>.

drop policy if exists resource_assets_storage_select on storage.objects;
create policy resource_assets_storage_select on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'resources'
    and exists (
      select 1
      from public.resource_assets ra
      join public.resources r on r.id = ra.resource_id
      where ra.bucket_name = storage.objects.bucket_id
        and ra.object_path = storage.objects.name
        and (
          r.status = 'approved'
          or r.owner_user_id = auth.uid()
          or public.is_app_admin(auth.uid())
        )
    )
  );

drop policy if exists resource_assets_storage_insert_owner_or_admin on storage.objects;
create policy resource_assets_storage_insert_owner_or_admin on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'resources'
    and storage.objects.name ~ '^users/[0-9a-fA-F-]{36}/resources/[0-9a-fA-F-]{36}/[^/]+$'
    and split_part(storage.objects.name, '/', 5) <> 'images'
    and (
      split_part(storage.objects.name, '/', 2) = auth.uid()::text
      or public.is_app_admin(auth.uid())
    )
    and exists (
      select 1
      from public.resources r
      where r.id::text = split_part(storage.objects.name, '/', 4)
        and r.resource_type = 'hosted'
        and (
          r.owner_user_id = auth.uid()
          or public.is_app_admin(auth.uid())
        )
    )
  );

drop policy if exists resource_assets_storage_delete_owner_or_admin on storage.objects;
create policy resource_assets_storage_delete_owner_or_admin on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'resources'
    and exists (
      select 1
      from public.resource_assets ra
      join public.resources r on r.id = ra.resource_id
      where ra.bucket_name = storage.objects.bucket_id
        and ra.object_path = storage.objects.name
        and (
          r.owner_user_id = auth.uid()
          or public.is_app_admin(auth.uid())
        )
    )
  );

select pg_notify('pgrst', 'reload schema');