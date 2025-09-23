-- Run in Supabase SQL Editor (service role bypasses RLS)

-- Ensure columns exist (idempotent)
alter table public.listings
  add column if not exists description text,
  add column if not exists status text default 'active',
  add column if not exists job_type public.listing_job_type;  -- enum created by migration

-- Upsert 10 organizations
with orgs as (
  insert into public.organizations (name, slug, description, website, contact_email, owner, metadata)
  values
    ('PitPro Services', 'pit-pro-services', 'Open pit mining services and geotechnical support.', 'https://pitpro.example', 'contact@pitpro.example', null, '{}'::jsonb),
    ('Aurora Mining Co', 'aurora-mining-co', 'Gold and base metals producer with projects across APAC.', 'https://aurora-mining.example', 'hello@aurora-mining.example', null, '{}'::jsonb),
    ('Frontier Geotech', 'frontier-geotech', 'Geotechnical investigations and slope stability.', 'https://frontier-geotech.example', 'info@frontier-geotech.example', null, '{}'::jsonb),
    ('BlueRidge Minerals', 'blueridge-minerals', 'Underground metals exploration and development.', 'https://blueridge-minerals.example', 'hr@blueridge-minerals.example', null, '{}'::jsonb),
    ('DesertCore Drilling', 'desertcore-drilling', 'RC and diamond core drilling specialists.', 'https://desertcore.example', 'jobs@desertcore.example', null, '{}'::jsonb),
    ('GreenEarth Environmental', 'greenearth-environmental', 'Environmental monitoring and compliance for mining.', 'https://greenearth-env.example', 'team@greenearth-env.example', null, '{}'::jsonb),
    ('Northern Survey Group', 'northern-survey-group', 'Mine survey, drone and LiDAR capture.', 'https://northern-survey.example', 'contact@northern-survey.example', null, '{}'::jsonb),
    ('Atlas Mine Planning', 'atlas-mine-planning', 'Mine planning, schedules and optimisation.', 'https://atlas-planning.example', 'ops@atlas-planning.example', null, '{}'::jsonb),
    ('HydroFlow Dewatering', 'hydroflow-dewatering', 'Dewatering systems and hydrogeology services.', 'https://hydroflow.example', 'support@hydroflow.example', null, '{}'::jsonb),
    ('Vector Logistics', 'vector-logistics', 'Mining logistics and haulage solutions.', 'https://vector-logistics.example', 'admin@vector-logistics.example', null, '{}'::jsonb)
  on conflict (slug) do update
    set name = excluded.name,
        description = excluded.description,
        website = excluded.website,
        contact_email = excluded.contact_email
  returning id, slug
)

-- Insert 10 active listings tied to those orgs
insert into public.listings (
  organization_id,
  title,
  short_description,
  description,
  location,
  status,
  services,
  contact,
  hero_image,
  metadata
)
values
  (
    (select id from orgs where slug = 'pit-pro-services'),
    'Geotechnical Engineer (Open Pit)',
    'Slope stability review for mid-size open pit.',
    'Conduct stability analysis, review pit wall designs and implement monitoring recommendations.',
    'Kalgoorlie, WA',
    'active',
    '["geotechnical-engineering","mine-planning-design"]'::jsonb,
    '{"email":"jobs@pitpro.example","apply_url":"https://pitpro.example/jobs/geo-open-pit"}'::jsonb,
    'https://images.unsplash.com/photo-1581094651181-3592e61f5a5b?auto=format&fit=crop&w=1200&q=60',
    '{"employment":"contract","duration":"3 months"}'::jsonb
  ),
  (
    (select id from orgs where slug = 'aurora-mining-co'),
    'Short-term Mine Scheduler',
    'Build weekly schedules for open pit operation.',
    'Develop short-term mine schedules, coordinate with ops and geology for deliverables.',
    'Mount Isa, QLD',
    'active',
    '["mine-planning-design","remote-operations-fleet-management"]'::jsonb,
    '{"email":"hello@aurora-mining.example"}'::jsonb,
    'https://images.unsplash.com/photo-1500496733677-44cbb4602071?auto=format&fit=crop&w=1200&q=60',
    '{"employment":"contract","work_mode":"hybrid"}'::jsonb
  ),
  (
    (select id from orgs where slug = 'frontier-geotech'),
    'Pit Slope Monitoring Program',
    'Design and implement slope monitoring.',
    'Set up prism and radar monitoring; deliver trigger action response plans (TARPs).',
    'Pilbara, WA',
    'active',
    '["geotechnical-engineering"]'::jsonb,
    '{"email":"info@frontier-geotech.example"}'::jsonb,
    'https://images.unsplash.com/photo-1537498425277-c283d32ef9db?auto=format&fit=crop&w=1200&q=60',
    '{"deliverables":["TARP","monitoring plan"]}'::jsonb
  ),
  (
    (select id from orgs where slug = 'blueridge-minerals'),
    'UG Ventilation Review',
    'Audit underground ventilation and controls.',
    'Assess current ventilation circuit and propose improvements for airflow and gas management.',
    'Ballarat, VIC',
    'active',
    '["ventilation-engineering"]'::jsonb,
    '{"email":"hr@blueridge-minerals.example"}'::jsonb,
    'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=60',
    '{"employment":"contract","duration":"6 weeks"}'::jsonb
  ),
  (
    (select id from orgs where slug = 'desertcore-drilling'),
    'RC Grade Control Program',
    'High‑throughput RC drilling campaign.',
    'Plan and execute grade control drilling; manage sampling and QA/QC workflows.',
    'Laverton, WA',
    'active',
    '["rc-drilling","core-logging-sampling","sample-prep-assay"]'::jsonb,
    '{"email":"jobs@desertcore.example"}'::jsonb,
    'https://images.unsplash.com/photo-1516302350523-4c12573a5a97?auto=format&fit=crop&w=1200&q=60',
    '{"fleet":"Schramm","shifts":"2/1"}'::jsonb
  ),
  (
    (select id from orgs where slug = 'greenearth-environmental'),
    'Baseline Environmental Studies',
    'Flora/fauna, noise and dust baseline.',
    'Undertake baseline studies and compile reports for approvals and compliance.',
    'Newcastle, NSW',
    'active',
    '["environmental-monitoring-compliance"]'::jsonb,
    '{"email":"team@greenearth-env.example"}'::jsonb,
    'https://images.unsplash.com/photo-1492496913980-501348b61469?auto=format&fit=crop&w=1200&q=60',
    '{"phase":"pre-approval"}'::jsonb
  ),
  (
    (select id from orgs where slug = 'northern-survey-group'),
    'Mine Survey and Drone Capture',
    'Monthly drone survey and volume calc.',
    'Perform monthly drone flights, process point clouds and generate volumetrics.',
    'Townsville, QLD',
    'active',
    '["mine-surveying"]'::jsonb,
    '{"email":"contact@northern-survey.example"}'::jsonb,
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1200&q=60',
    '{"deliverables":["orthomosaic","DSM","volumes"]}'::jsonb
  ),
  (
    (select id from orgs where slug = 'atlas-mine-planning'),
    'LTP Mine Optimisation',
    'Long-term planning and optimisation.',
    'Run pit optimisations, phases and LOM schedule with scenario analysis.',
    'Perth, WA',
    'active',
    '["mine-planning-design"]'::jsonb,
    '{"email":"ops@atlas-planning.example"}'::jsonb,
    'https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=1200&q=60',
    '{"software":["Whittle","Deswik"],"horizon":"10 years"}'::jsonb
  ),
  (
    (select id from orgs where slug = 'hydroflow-dewatering'),
    'Pit Dewatering System Upgrade',
    'Hydro study and pump sizing.',
    'Develop hydrogeology model and upgrade pit dewatering system for wet season.',
    'Mackay, QLD',
    'active',
    '["mine-dewatering"]'::jsonb,
    '{"email":"support@hydroflow.example"}'::jsonb,
    'https://images.unsplash.com/photo-1515549832467-8783363e19b6?auto=format&fit=crop&w=1200&q=60',
    '{"pumps":"diesel electric hybrid"}'::jsonb
  ),
  (
    (select id from orgs where slug = 'vector-logistics'),
    'Road Train Haulage Contract',
    'Bulk ore haulage and logistics.',
    'Provide road train fleet and logistics management for ROM to port haulage.',
    'Port Hedland, WA',
    'active',
    '["haulage-logistics"]'::jsonb,
    '{"email":"admin@vector-logistics.example"}'::jsonb,
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=60',
    '{"term":"12 months","tonnage":"2 Mtpa"}'::jsonb
  )
on conflict do nothing;

-- Make sure public view is available
grant select on public.listings_public to anon, authenticated;
select pg_notify('pgrst', 'reload schema');