-- Two-level services taxonomy: service_categories -> services
-- Safe to run multiple times (idempotent). Preserves existing service IDs via slug upsert.

-- Ensure UUID generator
create extension if not exists pgcrypto;

-- 1) Categories table
create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text,
  position int default 0
);

-- 2) Services (sub-services) table
-- If you already have public.services, we add/ensure required columns/constraints.
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  category_id uuid not null references public.service_categories(id) on delete restrict,
  position int default 0
);

-- In case services existed without these columns/constraints, patch them:
alter table public.services add column if not exists slug text;
alter table public.services add column if not exists description text;
alter table public.services add column if not exists category_id uuid;
alter table public.services add column if not exists position int default 0;

-- Backfill FK type/constraint if needed
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'services_category_id_fkey'
      and conrelid = 'public.services'::regclass
  ) then
    alter table public.services
      add constraint services_category_id_fkey
      foreign key (category_id) references public.service_categories(id) on delete restrict;
  end if;
end$$;

-- Unique by slug (global) and also unique within category by (category_id, name)
create unique index if not exists idx_services_slug_unique on public.services (slug);
create index if not exists idx_services_category on public.services (category_id);
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname='public' and indexname='idx_services_category_name_unique'
  ) then
    create unique index idx_services_category_name_unique on public.services (category_id, name);
  end if;
end$$;

-- 3) Seed categories
with c as (
  insert into public.service_categories (slug, name, description, position)
  values
    ('exploration-geology',            'Exploration & Geology',            null, 10),
    ('mining-engineering-planning',    'Mining Engineering & Planning',    null, 20),
    ('drilling-geotechnical-services', 'Drilling & Geotechnical Services', null, 30),
    ('environmental-hydrogeology',     'Environmental & Hydrogeology',     null, 40),
    ('processing-metallurgy',          'Processing & Metallurgy',          null, 50),
    ('contract-mining-civil-works',    'Contract Mining & Civil Works',    null, 60),
    ('indigenous-specialist-services', 'Indigenous & Specialist Services', null, 70)
  on conflict (slug) do update
    set name = excluded.name,
        description = excluded.description,
        position = excluded.position
  returning id, slug
),
-- 4) Seed services (sub-services) with category linkage by slug
s as (
  insert into public.services (slug, name, category_id, position)
  values
    -- 1. Exploration & Geology
    ('geological-mapping-interpretation',              'Geological mapping & interpretation',              (select id from c where slug='exploration-geology'), 10),
    ('resource-estimation-modelling',                  'Resource estimation & modelling',                  (select id from c where slug='exploration-geology'), 20),
    ('grade-control-services',                         'Grade control services',                           (select id from c where slug='exploration-geology'), 30),
    ('core-logging-sampling',                          'Core logging & sampling',                          (select id from c where slug='exploration-geology'), 40),
    ('geophysical-surveys-seismic-magnetic-em',        'Geophysical surveys (seismic, magnetic, EM)',      (select id from c where slug='exploration-geology'), 50),
    ('geochemical-analysis-soil-sampling',             'Geochemical analysis & soil sampling',             (select id from c where slug='exploration-geology'), 60),
    ('tenement-exploration-compliance-reporting',      'Tenement & exploration compliance reporting',      (select id from c where slug='exploration-geology'), 70),

    -- 2. Mining Engineering & Planning
    ('mine-design-open-pit-underground',               'Mine design (open pit & underground)',             (select id from c where slug='mining-engineering-planning'), 10),
    ('life-of-mine-scheduling',                        'Life-of-mine scheduling',                          (select id from c where slug='mining-engineering-planning'), 20),
    ('pit-stope-optimisation',                         'Pit & stope optimisation',                         (select id from c where slug='mining-engineering-planning'), 30),
    ('drill-blast-design',                             'Drill & blast design',                             (select id from c where slug='mining-engineering-planning'), 40),
    ('ventilation-mine-services-planning',             'Ventilation & mine services planning',             (select id from c where slug='mining-engineering-planning'), 50),
    ('equipment-selection-fleet-optimisation',         'Equipment selection & fleet optimisation',         (select id from c where slug='mining-engineering-planning'), 60),
    ('cost-modelling-feasibility-studies',             'Cost modelling & feasibility studies',             (select id from c where slug='mining-engineering-planning'), 70),

    -- 3. Drilling & Geotechnical Services
    ('reverse-circulation-rc-drilling',                'Reverse circulation (RC) drilling',                (select id from c where slug='drilling-geotechnical-services'), 10),
    ('diamond-drilling-core-drilling',                 'Diamond drilling (core drilling)',                 (select id from c where slug='drilling-geotechnical-services'), 20),
    ('aircore-drilling',                               'Aircore drilling',                                 (select id from c where slug='drilling-geotechnical-services'), 30),
    ('geotechnical-investigations',                    'Geotechnical investigations',                      (select id from c where slug='drilling-geotechnical-services'), 40),
    ('rock-mechanics-analysis',                        'Rock mechanics analysis',                          (select id from c where slug='drilling-geotechnical-services'), 50),
    ('ground-support-design',                          'Ground support design',                            (select id from c where slug='drilling-geotechnical-services'), 60),
    ('slope-stability-studies',                        'Slope stability studies',                          (select id from c where slug='drilling-geotechnical-services'), 70),

    -- 4. Environmental & Hydrogeology
    ('environmental-impact-assessments-eia-eis',       'Environmental impact assessments (EIA/EIS)',       (select id from c where slug='environmental-hydrogeology'), 10),
    ('mine-closure-rehabilitation-planning',           'Mine closure & rehabilitation planning',           (select id from c where slug='environmental-hydrogeology'), 20),
    ('flora-fauna-surveys',                            'Flora & fauna surveys',                            (select id from c where slug='environmental-hydrogeology'), 30),
    ('hydrogeological-modelling',                      'Hydrogeological modelling',                        (select id from c where slug='environmental-hydrogeology'), 40),
    ('groundwater-monitoring-dewatering-design',       'Groundwater monitoring & dewatering design',       (select id from c where slug='environmental-hydrogeology'), 50),
    ('water-balance-studies',                          'Water balance studies',                            (select id from c where slug='environmental-hydrogeology'), 60),
    ('tsf-design-support',                             'Tailings storage facility (TSF) design support',   (select id from c where slug='environmental-hydrogeology'), 70),

    -- 5. Processing & Metallurgy
    ('metallurgical-test-work-lab-pilot',              'Metallurgical test work (lab & pilot scale)',      (select id from c where slug='processing-metallurgy'), 10),
    ('process-flowsheet-development',                  'Process flow sheet development',                   (select id from c where slug='processing-metallurgy'), 20),
    ('plant-design-commissioning',                     'Plant design & commissioning',                     (select id from c where slug='processing-metallurgy'), 30),
    ('process-optimisation-throughput-recovery',       'Process optimisation (throughput/recovery)',       (select id from c where slug='processing-metallurgy'), 40),
    ('sampling-assay-qaqc',                            'Sampling & assay QA/QC',                           (select id from c where slug='processing-metallurgy'), 50),
    ('ore-characterisation-variability-studies',       'Ore characterisation & variability studies',       (select id from c where slug='processing-metallurgy'), 60),
    ('tailings-waste-management',                      'Tailings & waste management',                      (select id from c where slug='processing-metallurgy'), 70),

    -- 6. Contract Mining & Civil Works
    ('open-pit-mining-load-haul',                      'Open pit mining (load & haul)',                    (select id from c where slug='contract-mining-civil-works'), 10),
    ('underground-mining-development-stoping',         'Underground mining (development & stoping)',       (select id from c where slug='contract-mining-civil-works'), 20),
    ('drill-blast-contract-services',                  'Drill & blast contract services',                  (select id from c where slug='contract-mining-civil-works'), 30),
    ('earthmoving-bulk-earthworks',                    'Earthmoving & bulk earthworks',                    (select id from c where slug='contract-mining-civil-works'), 40),
    ('road-haul-road-construction',                    'Road & haul road construction',                    (select id from c where slug='contract-mining-civil-works'), 50),
    ('camp-site-establishment',                        'Camp & site establishment',                        (select id from c where slug='contract-mining-civil-works'), 60),
    ('civil-works-dams-pads-drainage',                 'Civil works (dams, pads, drainage)',               (select id from c where slug='contract-mining-civil-works'), 70),

    -- 7. Indigenous & Specialist Services
    ('indigenous-owned-contractor-services',           'Indigenous-owned contractor services',             (select id from c where slug='indigenous-specialist-services'), 10),
    ('cultural-heritage-surveys',                      'Cultural heritage surveys',                         (select id from c where slug='indigenous-specialist-services'), 20),
    ('safety-training-compliance',                     'Safety training & compliance',                      (select id from c where slug='indigenous-specialist-services'), 30),
    ('labour-hire-workforce-supply',                   'Labour hire & workforce supply',                    (select id from c where slug='indigenous-specialist-services'), 40),
    ('rehabilitation-contracting',                     'Rehabilitation contracting',                        (select id from c where slug='indigenous-specialist-services'), 50),
    ('specialist-consulting-automation-data-tech',     'Specialist consulting (automation, data, tech)',    (select id from c where slug='indigenous-specialist-services'), 60),
    ('community-engagement-services',                  'Community engagement services',                     (select id from c where slug='indigenous-specialist-services'), 70)
  on conflict (slug) do update
    set name = excluded.name,
        category_id = excluded.category_id,
        position = excluded.position
  returning id
)
select count(*) as upserted from s;

-- Optional: helper view for easy consumption
create or replace view public.services_with_categories as
select
  s.id,
  s.slug,
  s.name,
  s.description,
  s.position,
  c.id   as category_id,
  c.slug as category_slug,
  c.name as category_name,
  c.position as category_position
from public.services s
join public.service_categories c on c.id = s.category_id
order by c.position, s.position, s.name;

-- Optional: back-compat view to expose services as JSON arrays per category
create or replace view public.service_categories_with_children as
select
  c.id,
  c.slug,
  c.name,
  c.description,
  c.position,
  coalesce(
    jsonb_agg(jsonb_build_object(
      'id', s.id, 'slug', s.slug, 'name', s.name, 'position', s.position
    ) order by s.position, s.name) filter (where s.id is not null), '[]'::jsonb
  ) as services
from public.service_categories c
left join public.services s on s.category_id = c.id
group by c.id
order by c.position, c.name;

-- Refresh PostgREST schema cache (Supabase)
select pg_notify('pgrst', 'reload schema');