create extension if not exists "pgcrypto";

create or replace function public.is_app_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.app_admins admin
    where admin.user_id = coalesce(p_user_id, auth.uid())
  );
$$;

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table if not exists public.resource_user_quotas (
  user_id uuid primary key references auth.users(id) on delete cascade,
  max_active_resources integer not null default 10 check (max_active_resources >= 0),
  max_storage_bytes bigint not null default 262144000 check (max_storage_bytes >= 0),
  max_downloads_per_day integer not null default 15 check (max_downloads_per_day >= 0),
  max_download_bytes_per_day bigint not null default 524288000 check (max_download_bytes_per_day >= 0),
  active_resource_count integer not null default 0 check (active_resource_count >= 0),
  active_storage_bytes bigint not null default 0 check (active_storage_bytes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resource_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resource_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.resource_categories(id) on delete set null,
  title text not null,
  slug text not null unique,
  summary text,
  description text,
  resource_type text not null default 'hosted'
    check (resource_type = any (array['hosted'::text, 'external'::text])),
  status text not null default 'draft'
    check (status = any (array['draft'::text, 'pending'::text, 'approved'::text, 'rejected'::text, 'archived'::text])),
  source_name text,
  source_url text,
  license_name text,
  license_url text,
  estimated_size_bytes bigint check (estimated_size_bytes is null or estimated_size_bytes >= 0),
  price_cents integer not null default 0 check (price_cents >= 0),
  currency_code text not null default 'AUD' check (currency_code ~ '^[A-Z]{3}$'),
  download_count integer not null default 0 check (download_count >= 0),
  is_featured boolean not null default false,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  rejected_at timestamptz,
  rejection_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resources_external_source_check check (
    (resource_type = 'hosted' and source_url is null)
    or (resource_type = 'external' and source_url is not null)
  )
);

create table if not exists public.resource_assets (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  storage_provider text not null default 'supabase',
  bucket_name text not null,
  object_path text not null,
  original_filename text not null,
  file_ext text,
  mime_type text,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
  checksum_sha256 text,
  version_no integer not null default 1 check (version_no > 0),
  is_current boolean not null default true,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bucket_name, object_path)
);

create table if not exists public.resource_tag_links (
  resource_id uuid not null references public.resources(id) on delete cascade,
  tag_id uuid not null references public.resource_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (resource_id, tag_id)
);

create table if not exists public.resource_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  grant_source text not null default 'free'
    check (grant_source = any (array['free'::text, 'purchase'::text, 'request_fulfilment'::text, 'admin'::text, 'owner'::text])),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.resource_download_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  asset_id uuid references public.resource_assets(id) on delete set null,
  access_kind text not null
    check (access_kind = any (array['hosted'::text, 'external'::text])),
  bytes_served bigint not null default 0 check (bytes_served >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.resource_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  fulfiller_user_id uuid references auth.users(id) on delete set null,
  fulfilled_resource_id uuid references public.resources(id) on delete set null,
  title text not null,
  specifications text not null,
  bounty_cents integer not null default 0 check (bounty_cents >= 0),
  currency_code text not null default 'AUD' check (currency_code ~ '^[A-Z]{3}$'),
  status text not null default 'open'
    check (status = any (array['open'::text, 'claimed'::text, 'completed'::text, 'cancelled'::text])),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  claimed_at timestamptz,
  completed_at timestamptz
);

create unique index if not exists idx_resource_categories_name_lower
  on public.resource_categories (lower(name));

create unique index if not exists idx_resource_tags_name_lower
  on public.resource_tags (lower(name));

create index if not exists idx_resources_owner_user_id
  on public.resources (owner_user_id);

create index if not exists idx_resources_status
  on public.resources (status);

create index if not exists idx_resources_type_status
  on public.resources (resource_type, status);

create index if not exists idx_resources_category_id
  on public.resources (category_id);

create index if not exists idx_resource_assets_resource_id
  on public.resource_assets (resource_id);

create unique index if not exists idx_resource_assets_current_per_resource
  on public.resource_assets (resource_id)
  where is_current;

create index if not exists idx_resource_entitlements_user_resource
  on public.resource_entitlements (user_id, resource_id);

create unique index if not exists idx_resource_entitlements_active_unique
  on public.resource_entitlements (user_id, resource_id)
  where revoked_at is null;

create index if not exists idx_resource_download_events_user_created
  on public.resource_download_events (user_id, created_at desc);

create index if not exists idx_resource_download_events_resource_created
  on public.resource_download_events (resource_id, created_at desc);

create index if not exists idx_resource_requests_requester_status
  on public.resource_requests (requester_user_id, status);

create index if not exists idx_resource_requests_fulfiller_status
  on public.resource_requests (fulfiller_user_id, status);

create or replace function public.ensure_resource_user_quota_row(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    return;
  end if;

  insert into public.resource_user_quotas (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;
end;
$$;

create or replace function public.sync_resource_user_quota(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_active_resource_count integer := 0;
  v_active_storage_bytes bigint := 0;
begin
  if p_user_id is null then
    return;
  end if;

  perform public.ensure_resource_user_quota_row(p_user_id);

  select
    count(*)::integer,
    coalesce(sum(a.size_bytes), 0)::bigint
  into v_active_resource_count, v_active_storage_bytes
  from public.resources r
  left join public.resource_assets a
    on a.resource_id = r.id
   and a.is_current
  where r.owner_user_id = p_user_id
    and r.resource_type = 'hosted'
    and r.status <> 'archived';

  update public.resource_user_quotas quota
  set active_resource_count = v_active_resource_count,
      active_storage_bytes = v_active_storage_bytes,
      updated_at = now()
  where quota.user_id = p_user_id;
end;
$$;

create or replace function public.enforce_resource_user_quota(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quota public.resource_user_quotas%rowtype;
begin
  if p_user_id is null then
    return;
  end if;

  perform public.sync_resource_user_quota(p_user_id);

  select *
  into v_quota
  from public.resource_user_quotas
  where user_id = p_user_id;

  if v_quota.active_resource_count > v_quota.max_active_resources then
    raise exception 'Hosted resource limit exceeded for user %', p_user_id
      using errcode = 'P0001',
            detail = format('User has %s active hosted resources but the limit is %s.', v_quota.active_resource_count, v_quota.max_active_resources);
  end if;

  if v_quota.active_storage_bytes > v_quota.max_storage_bytes then
    raise exception 'Hosted storage limit exceeded for user %', p_user_id
      using errcode = 'P0001',
            detail = format('User has %s bytes of active hosted storage but the limit is %s bytes.', v_quota.active_storage_bytes, v_quota.max_storage_bytes);
  end if;
end;
$$;

create or replace function public.resource_assets_validate_hosted_parent()
returns trigger
language plpgsql
as $$
declare
  v_resource_type text;
begin
  select resource_type
  into v_resource_type
  from public.resources
  where id = new.resource_id;

  if v_resource_type is null then
    raise exception 'Resource % does not exist', new.resource_id;
  end if;

  if v_resource_type <> 'hosted' then
    raise exception 'Assets can only be attached to hosted resources';
  end if;

  return new;
end;
$$;

create or replace function public.resources_enforce_external_rules()
returns trigger
language plpgsql
as $$
declare
  v_asset_count integer;
begin
  if new.resource_type = 'external' then
    select count(*)::integer
    into v_asset_count
    from public.resource_assets
    where resource_id = new.id;

    if v_asset_count > 0 then
      raise exception 'External resources cannot keep hosted assets attached';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.resources_sync_owner_quota_trigger()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.enforce_resource_user_quota(old.owner_user_id);
    return old;
  end if;

  perform public.enforce_resource_user_quota(new.owner_user_id);

  if tg_op = 'UPDATE' and old.owner_user_id is distinct from new.owner_user_id then
    perform public.enforce_resource_user_quota(old.owner_user_id);
  end if;

  return new;
end;
$$;

create or replace function public.resource_assets_sync_owner_quota_trigger()
returns trigger
language plpgsql
as $$
declare
  v_new_owner uuid;
  v_old_owner uuid;
begin
  if tg_op <> 'DELETE' then
    select owner_user_id
    into v_new_owner
    from public.resources
    where id = new.resource_id;
  end if;

  if tg_op <> 'INSERT' then
    select owner_user_id
    into v_old_owner
    from public.resources
    where id = old.resource_id;
  end if;

  if v_new_owner is not null then
    perform public.enforce_resource_user_quota(v_new_owner);
  end if;

  if v_old_owner is not null and v_old_owner is distinct from v_new_owner then
    perform public.enforce_resource_user_quota(v_old_owner);
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_resource_user_quotas_updated_at on public.resource_user_quotas;
create trigger trg_resource_user_quotas_updated_at
before update on public.resource_user_quotas
for each row execute function public.set_row_updated_at();

drop trigger if exists trg_resource_categories_updated_at on public.resource_categories;
create trigger trg_resource_categories_updated_at
before update on public.resource_categories
for each row execute function public.set_row_updated_at();

drop trigger if exists trg_resource_tags_updated_at on public.resource_tags;
create trigger trg_resource_tags_updated_at
before update on public.resource_tags
for each row execute function public.set_row_updated_at();

drop trigger if exists trg_resources_updated_at on public.resources;
create trigger trg_resources_updated_at
before update on public.resources
for each row execute function public.set_row_updated_at();

drop trigger if exists trg_resource_requests_updated_at on public.resource_requests;
create trigger trg_resource_requests_updated_at
before update on public.resource_requests
for each row execute function public.set_row_updated_at();

drop trigger if exists trg_resource_assets_validate_hosted_parent on public.resource_assets;
create trigger trg_resource_assets_validate_hosted_parent
before insert or update on public.resource_assets
for each row execute function public.resource_assets_validate_hosted_parent();

drop trigger if exists trg_resources_enforce_external_rules on public.resources;
create trigger trg_resources_enforce_external_rules
before update on public.resources
for each row execute function public.resources_enforce_external_rules();

drop trigger if exists trg_resources_sync_owner_quota on public.resources;
create trigger trg_resources_sync_owner_quota
after insert or update or delete on public.resources
for each row execute function public.resources_sync_owner_quota_trigger();

drop trigger if exists trg_resource_assets_sync_owner_quota on public.resource_assets;
create trigger trg_resource_assets_sync_owner_quota
after insert or update or delete on public.resource_assets
for each row execute function public.resource_assets_sync_owner_quota_trigger();

insert into public.resource_categories (name, slug, description, sort_order)
values
  ('HSE', 'hse', 'Safety, health, environment, and compliance resources.', 10),
  ('Mine Planning', 'mine_planning', 'Planning templates, schedules, and operational tools.', 20),
  ('Geology', 'geology', 'Geology workflows, logging templates, and data packs.', 30),
  ('GIS & Spatial', 'gis_spatial', 'Hosted GIS packs and external public spatial data references.', 40),
  ('Drill & Blast', 'drill_blast', 'Drill, blast, and production support resources.', 50),
  ('Processing', 'processing', 'Processing, metallurgy, and plant support resources.', 60),
  ('Maintenance', 'maintenance', 'Maintenance planning, reliability, and asset templates.', 70),
  ('Training', 'training', 'Training documents, SOPs, and learning resources.', 80),
  ('Templates', 'templates', 'Reusable forms, checklists, and document packs.', 90),
  ('Scripts & Automation', 'scripts_automation', 'Scripts, macros, and automation helpers.', 100)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

alter table public.resource_user_quotas enable row level security;
alter table public.resource_categories enable row level security;
alter table public.resource_tags enable row level security;
alter table public.resources enable row level security;
alter table public.resource_assets enable row level security;
alter table public.resource_tag_links enable row level security;
alter table public.resource_entitlements enable row level security;
alter table public.resource_download_events enable row level security;
alter table public.resource_requests enable row level security;

drop policy if exists resource_user_quotas_select_own on public.resource_user_quotas;
create policy resource_user_quotas_select_own on public.resource_user_quotas
  for select using (auth.uid() = user_id or public.is_app_admin(auth.uid()));

drop policy if exists resource_user_quotas_insert_own on public.resource_user_quotas;
create policy resource_user_quotas_insert_own on public.resource_user_quotas
  for insert with check (auth.uid() = user_id or public.is_app_admin(auth.uid()));

drop policy if exists resource_user_quotas_update_admin on public.resource_user_quotas;
create policy resource_user_quotas_update_admin on public.resource_user_quotas
  for update using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

drop policy if exists resource_categories_select_authenticated on public.resource_categories;
create policy resource_categories_select_authenticated on public.resource_categories
  for select using (auth.role() = 'authenticated');

drop policy if exists resource_categories_admin_write on public.resource_categories;
create policy resource_categories_admin_write on public.resource_categories
  for all using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

drop policy if exists resource_tags_select_authenticated on public.resource_tags;
create policy resource_tags_select_authenticated on public.resource_tags
  for select using (auth.role() = 'authenticated');

drop policy if exists resource_tags_admin_write on public.resource_tags;
create policy resource_tags_admin_write on public.resource_tags
  for all using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

drop policy if exists resources_select_authenticated on public.resources;
create policy resources_select_authenticated on public.resources
  for select using (
    auth.role() = 'authenticated'
    and (
      status = 'approved'
      or owner_user_id = auth.uid()
      or public.is_app_admin(auth.uid())
    )
  );

drop policy if exists resources_insert_owner on public.resources;
create policy resources_insert_owner on public.resources
  for insert with check (
    auth.role() = 'authenticated'
    and (
      owner_user_id = auth.uid()
      or public.is_app_admin(auth.uid())
    )
  );

drop policy if exists resources_update_owner_or_admin on public.resources;
create policy resources_update_owner_or_admin on public.resources
  for update using (
    auth.role() = 'authenticated'
    and (
      owner_user_id = auth.uid()
      or public.is_app_admin(auth.uid())
    )
  )
  with check (
    auth.role() = 'authenticated'
    and (
      owner_user_id = auth.uid()
      or public.is_app_admin(auth.uid())
    )
  );

drop policy if exists resources_delete_owner_or_admin on public.resources;
create policy resources_delete_owner_or_admin on public.resources
  for delete using (
    auth.role() = 'authenticated'
    and (
      owner_user_id = auth.uid()
      or public.is_app_admin(auth.uid())
    )
  );

drop policy if exists resource_assets_select_owner_or_admin on public.resource_assets;
create policy resource_assets_select_owner_or_admin on public.resource_assets
  for select using (
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

drop policy if exists resource_assets_write_owner_or_admin on public.resource_assets;
create policy resource_assets_write_owner_or_admin on public.resource_assets
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

drop policy if exists resource_tag_links_select_authenticated on public.resource_tag_links;
create policy resource_tag_links_select_authenticated on public.resource_tag_links
  for select using (
    exists (
      select 1
      from public.resources r
      where r.id = resource_id
        and auth.role() = 'authenticated'
        and (
          r.status = 'approved'
          or r.owner_user_id = auth.uid()
          or public.is_app_admin(auth.uid())
        )
    )
  );

drop policy if exists resource_tag_links_write_owner_or_admin on public.resource_tag_links;
create policy resource_tag_links_write_owner_or_admin on public.resource_tag_links
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

drop policy if exists resource_entitlements_select_own on public.resource_entitlements;
create policy resource_entitlements_select_own on public.resource_entitlements
  for select using (user_id = auth.uid() or public.is_app_admin(auth.uid()));

drop policy if exists resource_entitlements_insert_own_or_admin on public.resource_entitlements;
create policy resource_entitlements_insert_own_or_admin on public.resource_entitlements
  for insert with check (user_id = auth.uid() or public.is_app_admin(auth.uid()));

drop policy if exists resource_entitlements_update_admin on public.resource_entitlements;
create policy resource_entitlements_update_admin on public.resource_entitlements
  for update using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

drop policy if exists resource_download_events_select_own on public.resource_download_events;
create policy resource_download_events_select_own on public.resource_download_events
  for select using (user_id = auth.uid() or public.is_app_admin(auth.uid()));

drop policy if exists resource_download_events_insert_own_or_admin on public.resource_download_events;
create policy resource_download_events_insert_own_or_admin on public.resource_download_events
  for insert with check (user_id = auth.uid() or public.is_app_admin(auth.uid()));

drop policy if exists resource_requests_select_authenticated on public.resource_requests;
create policy resource_requests_select_authenticated on public.resource_requests
  for select using (
    auth.role() = 'authenticated'
    and (
      status = 'open'
      or requester_user_id = auth.uid()
      or fulfiller_user_id = auth.uid()
      or public.is_app_admin(auth.uid())
    )
  );

drop policy if exists resource_requests_insert_requester on public.resource_requests;
create policy resource_requests_insert_requester on public.resource_requests
  for insert with check (
    auth.role() = 'authenticated'
    and requester_user_id = auth.uid()
  );

drop policy if exists resource_requests_update_parties on public.resource_requests;
create policy resource_requests_update_parties on public.resource_requests
  for update using (
    auth.role() = 'authenticated'
    and (
      requester_user_id = auth.uid()
      or fulfiller_user_id = auth.uid()
      or public.is_app_admin(auth.uid())
    )
  )
  with check (
    auth.role() = 'authenticated'
    and (
      requester_user_id = auth.uid()
      or fulfiller_user_id = auth.uid()
      or public.is_app_admin(auth.uid())
    )
  );

select pg_notify('pgrst', 'reload schema');
