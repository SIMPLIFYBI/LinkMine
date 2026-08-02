create table if not exists public.resource_images (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  bucket_name text not null,
  object_path text not null,
  original_filename text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 5242880),
  sort_order smallint not null check (sort_order >= 0 and sort_order <= 2),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bucket_name, object_path),
  unique (resource_id, sort_order)
);

create index if not exists idx_resource_images_resource_id
  on public.resource_images (resource_id);

alter table public.resource_images enable row level security;

drop policy if exists resource_images_select_public on public.resource_images;
create policy resource_images_select_public on public.resource_images
  for select using (
    exists (
      select 1
      from public.resources r
      where r.id = resource_id
        and (
          r.status = 'approved'
          or r.owner_user_id = auth.uid()
          or public.is_app_admin(auth.uid())
        )
    )
  );

drop policy if exists resource_images_write_owner_or_admin on public.resource_images;
create policy resource_images_write_owner_or_admin on public.resource_images
  for all using (
    exists (
      select 1
      from public.resources r
      where r.id = resource_id
        and (
          r.owner_user_id = auth.uid()
          or public.is_app_admin(auth.uid())
        )
    )
  )
  with check (
    exists (
      select 1
      from public.resources r
      where r.id = resource_id
        and (
          r.owner_user_id = auth.uid()
          or public.is_app_admin(auth.uid())
        )
    )
  );

select pg_notify('pgrst', 'reload schema');
