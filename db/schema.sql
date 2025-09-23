-- MineLink initial schema + RLS policies for Supabase
-- Run this in Supabase SQL editor (Query editor).

-- enable pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

-- Organizations (clients / businesses)
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  description text,
  website text,
  contact_email text,
  owner uuid references auth.users (id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Consultant profiles (connected to auth.users)
create table if not exists consultants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  display_name text,
  headline text,
  bio text,
  company text,
  location text,
  contact_email text,
  phone text,
  visibility text default 'public', -- public/private/draft
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Services master list
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  description text,
  created_at timestamptz default now()
);

-- Many-to-many: consultant <> service
create table if not exists consultant_services (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid references consultants (id) on delete cascade,
  service_id uuid references services (id) on delete cascade,
  created_at timestamptz default now(),
  unique (consultant_id, service_id)
);

-- Portfolio items for consultants (projects / gallery)
create table if not exists portfolios (
  id uuid primary key default gen_random_uuid(),
  consultant_id uuid references consultants (id) on delete cascade,
  title text not null,
  description text,
  media_urls text[], -- array of image/video URLs
  links text[],      -- optional external links
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Business Listings (client-facing tiles)
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations (id) on delete cascade,
  title text not null,
  short_description text,
  services jsonb default '[]'::jsonb, -- store service ids or names
  contact jsonb default '{}'::jsonb,
  hero_image text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Profile / Listing views for metrics
create table if not exists profile_views (
  id bigserial primary key,
  consultant_id uuid references consultants (id) on delete cascade,
  viewer_id uuid references auth.users (id) on delete set null,
  source text,
  viewed_at timestamptz default now()
);

-- Favorites (users can favorite consultants or listings)
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  consultant_id uuid references consultants (id) on delete cascade,
  listing_id uuid references listings (id) on delete cascade,
  created_at timestamptz default now(),
  constraint only_one_target check (
    (consultant_id is not null)::int + (listing_id is not null)::int = 1
  )
);

-- Indexes to speed up common queries
create index if not exists idx_consultants_user_id on consultants (user_id);
create index if not exists idx_listings_org_id on listings (organization_id);
create index if not exists idx_profile_views_consultant on profile_views (consultant_id);

-- RLS policies (single block; idempotent)

-- Drop existing policies (safe to re-run)
drop policy if exists "Consultant - select public" on consultants;
drop policy if exists "Consultant - insert by owner" on consultants;
drop policy if exists "Consultant - update by owner" on consultants;
drop policy if exists "Consultant - delete by owner" on consultants;

drop policy if exists "Orgs - select public" on organizations;
drop policy if exists "Orgs - insert by auth user" on organizations;
drop policy if exists "Orgs - update owner only" on organizations;
drop policy if exists "Orgs - delete owner only" on organizations;

drop policy if exists "Portfolios - select public" on portfolios;
drop policy if exists "Portfolios - insert if owner" on portfolios;
drop policy if exists "Portfolios - update if owner" on portfolios;
drop policy if exists "Portfolios - delete if owner" on portfolios;

drop policy if exists "Listings - select public" on listings;
drop policy if exists "Listings - insert by org owner" on listings;
drop policy if exists "Listings - update by org owner" on listings;
drop policy if exists "Listings - delete by org owner" on listings;

drop policy if exists "Services - select public" on services;
drop policy if exists "Services - insert authenticated" on services;
drop policy if exists "Services - update authenticated" on services;
drop policy if exists "Services - delete authenticated" on services;

drop policy if exists "consultant_services - insert if consultant owner" on consultant_services;
drop policy if exists "consultant_services - delete if consultant owner" on consultant_services;
drop policy if exists "consultant_services - select public-visible" on consultant_services;

drop policy if exists "favorites - insert authenticated" on favorites;
drop policy if exists "favorites - select owner" on favorites;
drop policy if exists "favorites - delete owner" on favorites;

drop policy if exists "profile_views - insert authenticated or anon" on profile_views;
drop policy if exists "profile_views - select admin" on profile_views;

-- Enable RLS
alter table consultants enable row level security;
alter table organizations enable row level security;
alter table portfolios enable row level security;
alter table listings enable row level security;
alter table services enable row level security;
alter table consultant_services enable row level security;
alter table favorites enable row level security;
alter table profile_views enable row level security;

-- Create policies
create policy "Consultant - select public" on consultants
  for select using (visibility = 'public' OR auth.role() = 'authenticated' and user_id = auth.uid());
create policy "Consultant - insert by owner" on consultants
  for insert with check (auth.role() = 'authenticated' and user_id = auth.uid());
create policy "Consultant - update by owner" on consultants
  for update using (auth.role() = 'authenticated' and user_id = auth.uid())
  with check (auth.role() = 'authenticated' and user_id = auth.uid());
create policy "Consultant - delete by owner" on consultants
  for delete using (auth.role() = 'authenticated' and user_id = auth.uid());

create policy "Orgs - select public" on organizations for select using (true);
create policy "Orgs - insert by auth user" on organizations
  for insert with check (auth.role() = 'authenticated' and (owner = auth.uid() OR owner is null));
create policy "Orgs - update owner only" on organizations
  for update using (auth.role() = 'authenticated' and owner = auth.uid())
  with check (auth.role() = 'authenticated' and owner = auth.uid());
create policy "Orgs - delete owner only" on organizations
  for delete using (auth.role() = 'authenticated' and owner = auth.uid());

create policy "Portfolios - select public" on portfolios for select using (true);
create policy "Portfolios - insert if owner" on portfolios
  for insert with check (
    auth.role() = 'authenticated' and
    exists (select 1 from consultants c where c.id = consultant_id and c.user_id = auth.uid())
  );
create policy "Portfolios - update if owner" on portfolios
  for update using (
    auth.role() = 'authenticated' and
    exists (select 1 from consultants c where c.id = consultant_id and c.user_id = auth.uid())
  )
  with check (
    auth.role() = 'authenticated' and
    exists (select 1 from consultants c where c.id = consultant_id and c.user_id = auth.uid())
  );
create policy "Portfolios - delete if owner" on portfolios
  for delete using (
    auth.role() = 'authenticated' and
    exists (select 1 from consultants c where c.id = consultant_id and c.user_id = auth.uid())
  );

create policy "Listings - select public" on listings for select using (true);
create policy "Listings - insert by org owner" on listings
  for insert with check (
    auth.role() = 'authenticated' and
    exists (select 1 from organizations o where o.id = organization_id and o.owner = auth.uid())
  );
create policy "Listings - update by org owner" on listings
  for update using (
    auth.role() = 'authenticated' and
    exists (select 1 from organizations o where o.id = organization_id and o.owner = auth.uid())
  )
  with check (
    auth.role() = 'authenticated' and
    exists (select 1 from organizations o where o.id = organization_id and o.owner = auth.uid())
  );
create policy "Listings - delete by org owner" on listings
  for delete using (
    auth.role() = 'authenticated' and
    exists (select 1 from organizations o where o.id = organization_id and o.owner = auth.uid())
  );

create policy "Services - select public" on services for select using (true);
create policy "Services - insert authenticated" on services
  for insert with check (auth.role() = 'authenticated');
create policy "Services - update authenticated" on services
  for update using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Services - delete authenticated" on services
  for delete using (auth.role() = 'authenticated');

create policy "consultant_services - insert if consultant owner" on consultant_services
  for insert with check (
    auth.role() = 'authenticated' and
    exists (select 1 from consultants c where c.id = consultant_id and c.user_id = auth.uid())
  );
create policy "consultant_services - delete if consultant owner" on consultant_services
  for delete using (
    auth.role() = 'authenticated' and
    exists (select 1 from consultants c where c.id = consultant_id and c.user_id = auth.uid())
  );
create policy "consultant_services - select public-visible" on consultant_services
  for select using (
    exists (select 1 from consultants c where c.id = consultant_id and c.visibility = 'public')
  );

create policy "favorites - insert authenticated" on favorites
  for insert with check (auth.role() = 'authenticated' and user_id = auth.uid());
create policy "favorites - select owner" on favorites
  for select using (auth.role() = 'authenticated' and user_id = auth.uid());
create policy "favorites - delete owner" on favorites
  for delete using (auth.role() = 'authenticated' and user_id = auth.uid());

create policy "profile_views - insert authenticated or anon" on profile_views
  for insert with check (true);
create policy "profile_views - select admin" on profile_views
  for select using (auth.role() = 'authenticated');

-- Insert initial services data
insert into services (name, slug, description) values
  ('Exploration Drilling', 'exploration-drilling', 'Greenfields and brownfields exploration drilling programs.'),
  ('Reverse Circulation (RC) Drilling', 'rc-drilling', 'High‑production RC drilling for chips and grade control.'),
  ('Diamond Core Drilling', 'diamond-core-drilling', 'HQ/NQ/PQ core drilling for structural and metallurgical data.'),
  ('Blast Hole Drilling', 'blast-hole-drilling', 'Production blast hole drilling for open pit and quarry operations.'),
  ('Geophysical Surveys', 'geophysical-surveys', 'Ground and downhole geophysics: IP, EM, magnetics, gravity.'),
  ('Geological Mapping & Modelling', 'geological-mapping-modelling', 'Field mapping and 3D geological modelling.'),
  ('Core Logging & Sampling', 'core-logging-sampling', 'Core handling, lith/structural logging, sampling, QA/QC.'),
  ('Sample Preparation & Assay', 'sample-prep-assay', 'Crushing, pulverising, and laboratory assay management.'),
  ('Mine Surveying', 'mine-surveying', 'Open pit and underground surveying, drone/LiDAR capture.'),
  ('Geotechnical Engineering', 'geotechnical-engineering', 'Slope stability, rock mechanics, ground support design.'),
  ('Environmental Monitoring & Compliance', 'environmental-monitoring-compliance', 'Baseline studies, monitoring, and approvals support.'),
  ('Mine Planning & Design', 'mine-planning-design', 'Short to long‑term scheduling, pit/UG design, optimisation.'),
  ('Ventilation Engineering', 'ventilation-engineering', 'UG ventilation design, monitoring and controls.'),
  ('Tailings Storage & Water Management', 'tailings-water-management', 'TSF design, deposition planning, water balance.'),
  ('Mine Dewatering', 'mine-dewatering', 'Hydro studies, pit/UG dewatering systems and operations.'),
  ('Crushing & Screening', 'crushing-screening', 'Contract crushing, screening and ROM management.'),
  ('Mobile Equipment Maintenance', 'mobile-equipment-maintenance', 'Field and workshop maintenance for mobile fleets.'),
  ('Haulage & Logistics', 'haulage-logistics', 'Ore/waste haulage, road train operations and logistics.'),
  ('Safety Training & Compliance', 'safety-training-compliance', 'Inductions, competency training, and HSE systems.'),
  ('Remote Operations & Fleet Management', 'remote-operations-fleet-management', 'Ops centres, dispatch, and telemetry for fleets.')
on conflict (slug) do update
  set name = excluded.name,
      description = excluded.description;

-- End of migration

-- Run in Supabase SQL Editor (service role bypasses RLS)
-- Creates 3 consultants, maps services by slug, and adds sample portfolio items.

-- SRK Consulting
with srk_ins as (
  insert into consultants (
    user_id, display_name, headline, bio, company, location, contact_email, phone, visibility, metadata
  )
  select
    null,
    'SRK Consulting',
    'Geology, geotechnical, environmental and mining advisory',
    'Global consultancy providing geology, geotech, environmental and mining engineering services across the project lifecycle.',
    'SRK Consulting',
    'Global (offices worldwide)',
    'info@srk.com',
    null,
    'public',
    jsonb_build_object('website','https://www.srk.com')
  where not exists (select 1 from consultants where display_name = 'SRK Consulting')
  returning id
),
srk as (
  -- get the id whether we just inserted or it already existed
  select id from srk_ins
  union all
  select id from consultants where display_name = 'SRK Consulting' limit 1
)
insert into consultant_services (consultant_id, service_id)
select (select id from srk), s.id
from services s
where s.slug in (
  'geotechnical-engineering',
  'geological-mapping-modelling',
  'environmental-monitoring-compliance',
  'mine-planning-design',
  'tailings-water-management'
)
on conflict (consultant_id, service_id) do nothing;

-- SRK portfolio example
with c as (
  select id from consultants where display_name = 'SRK Consulting' limit 1
)
insert into portfolios (consultant_id, title, description, media_urls, links, metadata)
select c.id,
  'Open pit slope stability study',
  'Geotechnical assessment and slope design recommendations for an open pit operation.',
  array[]::text[],
  array['https://www.srk.com'],
  jsonb_build_object('sector','Open Pit','region','APAC')
from c
where not exists (
  select 1 from portfolios p where p.consultant_id = c.id and p.title = 'Open pit slope stability study'
);

-- Golder (now part of WSP)
with golder_ins as (
  insert into consultants (
    user_id, display_name, headline, bio, company, location, contact_email, phone, visibility, metadata
  )
  select
    null,
    'Golder',
    'Geotechnical, environmental and tailings specialists',
    'Engineering and environmental services with expertise in geotech, tailings and water for mining.',
    'Golder',
    'Global (offices worldwide)',
    'info@golder.com',
    null,
    'public',
    jsonb_build_object('website','https://www.golder.com')
  where not exists (select 1 from consultants where display_name = 'Golder')
  returning id
),
golder as (
  select id from golder_ins
  union all
  select id from consultants where display_name = 'Golder' limit 1
)
insert into consultant_services (consultant_id, service_id)
select (select id from golder), s.id
from services s
where s.slug in (
  'geotechnical-engineering',
  'environmental-monitoring-compliance',
  'tailings-water-management',
  'mine-dewatering',
  'mine-surveying'
)
on conflict (consultant_id, service_id) do nothing;

-- Golder portfolio example
with c as (
  select id from consultants where display_name = 'Golder' limit 1
)
insert into portfolios (consultant_id, title, description, media_urls, links, metadata)
select c.id,
  'TSF design and compliance audit',
  'Design review and compliance audit for a tailings storage facility (TSF).',
  array[]::text[],
  array['https://www.golder.com'],
  jsonb_build_object('discipline','Tailings','region','Global')
from c
where not exists (
  select 1 from portfolios p where p.consultant_id = c.id and p.title = 'TSF design and compliance audit'
);

-- Deswik (note: spelled “Deswik”)
with deswik_ins as (
  insert into consultants (
    user_id, display_name, headline, bio, company, location, contact_email, phone, visibility, metadata
  )
  select
    null,
    'Deswik',
    'Mine planning, scheduling and optimization (software + consulting)',
    'Provider of mine planning software and consulting services: scheduling, design and operational optimization.',
    'Deswik',
    'Global (HQ Brisbane, AU)',
    'info@deswik.com',
    null,
    'public',
    jsonb_build_object('website','https://www.deswik.com')
  where not exists (select 1 from consultants where display_name = 'Deswik')
  returning id
),
deswik as (
  select id from deswik_ins
  union all
  select id from consultants where display_name = 'Deswik' limit 1
)
insert into consultant_services (consultant_id, service_id)
select (select id from deswik), s.id
from services s
where s.slug in (
  'mine-planning-design',
  'geological-mapping-modelling',
  'remote-operations-fleet-management',
  'safety-training-compliance'
)
on conflict (consultant_id, service_id) do nothing;

-- Deswik portfolio example
with c as (
  select id from consultants where display_name = 'Deswik' limit 1
)
insert into portfolios (consultant_id, title, description, media_urls, links, metadata)
select c.id,
  'Short- to long-term mine schedule',
  'Development of integrated mine schedules and optimisation using Deswik suite.',
  array[]::text[],
  array['https://www.deswik.com'],
  jsonb_build_object('discipline','Planning','region','APAC')
from c
where not exists (
  select 1 from portfolios p where p.consultant_id = c.id and p.title = 'Short- to long-term mine schedule'
);

-- Expose only safe fields to the public via a view
create or replace view public.listings_public as
select
  l.id,
  l.title,
  left(coalesce(nullif(l.description, ''), nullif(l.short_description, ''), l.title), 300) as excerpt,
  l.location,
  coalesce(l.status, 'active') as status,
  l.created_at
from public.listings l
where coalesce(l.status, 'active') = 'active';

-- Policies on base table
alter table public.listings enable row level security;

-- Drop old public select policy if it exists
drop policy if exists "Listings - select public" on public.listings;

-- Allow owners to select their own base rows (full detail)
drop policy if exists "Listings - select by org owner" on public.listings;
create policy "Listings - select by org owner" on public.listings
for select using (
  auth.role() = 'authenticated'
  and exists (
    select 1
    from public.organizations o
    where o.id = listings.organization_id
      and o.owner = auth.uid()
  )
);

-- Keep your existing insert/update/delete owner policies, or:
drop policy if exists "Listings - insert by org owner" on public.listings;
create policy "Listings - insert by org owner" on public.listings
for insert with check (
  auth.role() = 'authenticated'
  and exists (
    select 1 from public.organizations o
    where o.id = listings.organization_id and o.owner = auth.uid()
  )
);

drop policy if exists "Listings - update by org owner" on public.listings;
create policy "Listings - update by org owner" on public.listings
for update using (
  auth.role() = 'authenticated'
  and exists (
    select 1 from public.organizations o
    where o.id = listings.organization_id and o.owner = auth.uid()
  )
) with check (
  auth.role() = 'authenticated'
  and exists (
    select 1 from public.organizations o
    where o.id = listings.organization_id and o.owner = auth.uid()
  )
);

drop policy if exists "Listings - delete by org owner" on public.listings;
create policy "Listings - delete by org owner" on public.listings
for delete using (
  auth.role() = 'authenticated'
  and exists (
    select 1 from public.organizations o
    where o.id = listings.organization_id and o.owner = auth.uid()
  )
);

-- Privileges: base table readable only by authenticated (RLS still applies)
revoke select on public.listings from anon;
grant select on public.listings to authenticated;

-- View is readable by everyone (RLS of base still enforced underneath)
grant select on public.listings_public to anon, authenticated;

-- Refresh PostgREST cache
select pg_notify('pgrst', 'reload schema');

-- Add a text description if it's missing
alter table public.listings add column if not exists description text;

-- Add columns the UI/view expects
alter table public.listings
  add column if not exists description text,
  add column if not exists location text,
  add column if not exists status text default 'active';

-- Recreate the anonymous public view (single source of truth)
create or replace view public.listings_public as
select
  l.id,
  l.title,
  left(coalesce(nullif(l.description, ''), nullif(l.short_description, ''), l.title), 300) as excerpt,
  l.location,
  coalesce(l.status, 'active') as status,
  l.created_at
from public.listings l
where coalesce(l.status, 'active') = 'active';

grant select on public.listings_public to anon, authenticated;

-- Refresh PostgREST cache so the new columns/view are visible to the API
select pg_notify('pgrst', 'reload schema');

-- Google Places linkage for consultants
alter table public.consultants add column if not exists place_id text unique;
create index if not exists idx_consultants_place_id on public.consultants (place_id);