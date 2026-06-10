begin;

-- Talent Hub dummy workers for testing.
-- Safe to rerun: the script upserts core records and replaces seeded roles/experience.
-- It creates auth.users rows only to satisfy the FK chain into user_profiles/workers.

insert into public.working_rights_categories (name, slug, description, position)
values
  ('Australian citizen', 'australian-citizen', 'Australian citizen with unrestricted work rights.', 10),
  ('Permanent resident', 'permanent-resident', 'Permanent resident with unrestricted work rights.', 20),
  ('Full working rights', 'full-working-rights', 'Holds full unrestricted working rights in Australia.', 30),
  ('Temporary skilled visa', 'temporary-skilled-visa', 'Available under an employer-sponsored or similar temporary skilled visa.', 40)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  position = excluded.position;

insert into public.role_categories (
  name,
  slug,
  description,
  position,
  group_name,
  group_slug,
  group_position
)
values
  ('Mine Planning', 'mine-planning', 'Life-of-mine planning, scheduling, and optimisation.', 10, 'Technical', 'technical', 10),
  ('Geology', 'geology', 'Resource geology, grade control, and exploration support.', 20, 'Technical', 'technical', 10),
  ('Drilling & Blasting', 'drilling-blasting', 'Drill-and-blast design, execution, and improvement.', 30, 'Technical', 'technical', 10),
  ('Metallurgy', 'metallurgy', 'Metallurgical testwork, plant performance, and recovery optimisation.', 40, 'Processing', 'processing', 20),
  ('Process Operations', 'process-operations', 'Plant operations, commissioning, and production improvement.', 50, 'Processing', 'processing', 20),
  ('Geotechnical Engineering', 'geotechnical-engineering', 'Pit slope, underground ground support, and geotechnical risk.', 60, 'Technical', 'technical', 10),
  ('Surveying', 'surveying', 'Mine survey, setout, reconciliation, and drone capture.', 70, 'Technical', 'technical', 10),
  ('Environmental & Community', 'environmental-community', 'Approvals, compliance, rehab, water, and community interface.', 80, 'Sustainability', 'sustainability', 30),
  ('Health, Safety & Training', 'health-safety-training', 'Operational safety systems, field leadership, and capability uplift.', 90, 'Operations', 'operations', 40),
  ('Project Controls', 'project-controls', 'Project delivery, controls, contracts, and coordination.', 100, 'Operations', 'operations', 40),
  ('Maintenance & Reliability', 'maintenance-reliability', 'Reliability engineering, shutdowns, and maintenance strategy.', 110, 'Operations', 'operations', 40),
  ('Data & Digital', 'data-digital', 'Data analytics, dashboards, automation, and digital mining systems.', 120, 'Digital', 'digital', 50)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  position = excluded.position,
  group_name = excluded.group_name,
  group_slug = excluded.group_slug,
  group_position = excluded.group_position;

with seeded_workers as (
  select *
  from (
    values
      (
        '10000000-0000-4000-8000-000000000001'::uuid,
        'talenthub.seed+01@youmine.test',
        'Emma',
        'Lawson',
        'Lawson Mine Planning',
        'Senior Mine Planner',
        'Emma Lawson',
        'Emma Lawson',
        'Senior mine planner helping mid-tier producers tighten schedules and lift mining rates.',
        'Open-pit planner with twelve years across gold and iron ore operations. Strong in short-term scheduling, haulage productivity, contractor integration, and turning technical plans into shift-ready actions.',
        'Perth, WA',
        'australian-citizen',
        true,
        null::date,
        array['mine-planning', 'project-controls']::text[]
      ),
      (
        '10000000-0000-4000-8000-000000000002'::uuid,
        'talenthub.seed+02@youmine.test',
        'Liam',
        'O''Connor',
        'Underground Geo Services',
        'Underground Geologist',
        'Liam O''Connor',
        'Liam O''Connor',
        'Underground geologist with strong grade-control systems and face mapping discipline.',
        'Underground geologist experienced in narrow-vein gold and base metals. Known for improving ore drive confidence, building practical sampling routines, and lifting communication between geology and production.',
        'Kalgoorlie, WA',
        'permanent-resident',
        false,
        '2026-07-01'::date,
        array['geology', 'drilling-blasting']::text[]
      ),
      (
        '10000000-0000-4000-8000-000000000003'::uuid,
        'talenthub.seed+03@youmine.test',
        'Priya',
        'Nair',
        'Plant Metrics Advisory',
        'Metallurgist',
        'Priya Nair',
        'Priya Nair',
        'Process metallurgist focused on plant stability, recovery, and continuous improvement.',
        'Metallurgist who bridges plant data with day-to-day operations. Experienced in flotation, plant troubleshooting, and turning recovery losses into targeted improvement projects with operators and supervisors.',
        'Brisbane, QLD',
        'full-working-rights',
        true,
        null::date,
        array['metallurgy', 'process-operations', 'data-digital']::text[]
      ),
      (
        '10000000-0000-4000-8000-000000000004'::uuid,
        'talenthub.seed+04@youmine.test',
        'Jackson',
        'Reid',
        'Blast Performance Consulting',
        'Drill & Blast Engineer',
        'Jackson Reid',
        'Jackson Reid',
        'Drill-and-blast engineer improving fragmentation, wall control, and downstream productivity.',
        'Engineer with open-pit drill-and-blast experience in hard rock operations. Strong in powder-factor review, blast diagnostics, contractor management, and tying fragmentation outcomes to crusher performance.',
        'Mackay, QLD',
        'temporary-skilled-visa',
        false,
        '2026-06-20'::date,
        array['drilling-blasting', 'mine-planning']::text[]
      ),
      (
        '10000000-0000-4000-8000-000000000005'::uuid,
        'talenthub.seed+05@youmine.test',
        'Chloe',
        'Bennett',
        'Groundline Environment',
        'Environmental Advisor',
        'Chloe Bennett',
        'Chloe Bennett',
        'Environmental advisor balancing approvals, compliance, and practical site execution.',
        'Environmental professional with strong exposure to mining approvals, field compliance, and stakeholder engagement. Comfortable working with operations teams to keep projects moving while maintaining standards.',
        'Orange, NSW',
        'australian-citizen',
        true,
        null::date,
        array['environmental-community', 'project-controls']::text[]
      ),
      (
        '10000000-0000-4000-8000-000000000006'::uuid,
        'talenthub.seed+06@youmine.test',
        'Mateo',
        'Alvarez',
        'Slope Integrity Solutions',
        'Geotechnical Engineer',
        'Mateo Alvarez',
        'Mateo Alvarez',
        'Geotechnical engineer supporting pit slope decisions and underground ground-support plans.',
        'Geotechnical engineer with experience in slope monitoring, geotechnical models, and underground support recommendations. Strong communicator with mine planning and operations teams during risk reviews.',
        'Adelaide, SA',
        'full-working-rights',
        false,
        '2026-06-24'::date,
        array['geotechnical-engineering', 'geology']::text[]
      ),
      (
        '10000000-0000-4000-8000-000000000007'::uuid,
        'talenthub.seed+07@youmine.test',
        'Sarah',
        'McLean',
        'True North Survey',
        'Mine Surveyor',
        'Sarah McLean',
        'Sarah McLean',
        'Mine surveyor bringing clean data capture, reconciliation, and rapid field support.',
        'Surveyor experienced in surface operations, drone capture, pit setout, and production reconciliation. Delivers clear field support and reliable data that planning and production teams can use immediately.',
        'Singleton, NSW',
        'permanent-resident',
        true,
        null::date,
        array['surveying', 'mine-planning']::text[]
      ),
      (
        '10000000-0000-4000-8000-000000000008'::uuid,
        'talenthub.seed+08@youmine.test',
        'Ben',
        'Walsh',
        'Frontline HSE Partners',
        'HSE Superintendent',
        'Ben Walsh',
        'Ben Walsh',
        'Safety leader focused on field credibility, contractor standards, and practical risk control.',
        'HSE superintendent with experience across construction, shutdowns, and mining operations. Known for lifting field engagement, simplifying safety systems, and helping line leaders own critical controls.',
        'Perth, WA',
        'australian-citizen',
        false,
        '2026-07-10'::date,
        array['health-safety-training', 'project-controls']::text[]
      ),
      (
        '10000000-0000-4000-8000-000000000009'::uuid,
        'talenthub.seed+09@youmine.test',
        'Olivia',
        'Chen',
        'Reliability Works',
        'Maintenance Reliability Engineer',
        'Olivia Chen',
        'Olivia Chen',
        'Reliability engineer reducing downtime through better work scopes, planning, and defect elimination.',
        'Maintenance and reliability engineer with experience in mobile and fixed plant environments. Strong in failure analysis, shutdown preparation, and partnering with planners and trades to reduce repeat breakdowns.',
        'Newman, WA',
        'australian-citizen',
        true,
        null::date,
        array['maintenance-reliability', 'process-operations']::text[]
      ),
      (
        '10000000-0000-4000-8000-000000000010'::uuid,
        'talenthub.seed+10@youmine.test',
        'Noah',
        'Singh',
        'North Process Operations',
        'Processing Superintendent',
        'Noah Singh',
        'Noah Singh',
        'Processing superintendent with a strong track record in throughput, team leadership, and plant discipline.',
        'Operational leader from multi-shift processing plants. Comfortable stabilising performance, coaching supervisors, and driving practical improvement projects in crushing, grinding, flotation, and dewatering.',
        'Townsville, QLD',
        'temporary-skilled-visa',
        false,
        '2026-06-28'::date,
        array['process-operations', 'metallurgy']::text[]
      ),
      (
        '10000000-0000-4000-8000-000000000011'::uuid,
        'talenthub.seed+11@youmine.test',
        'Zoe',
        'Hart',
        'Tailings Water Projects',
        'Tailings & Water Engineer',
        'Zoe Hart',
        'Zoe Hart',
        'Tailings and water engineer supporting storage facilities, monitoring, and compliance reporting.',
        'Engineer with experience in tailings management, water balance review, field inspections, and coordinating consultants, sites, and regulators on practical risk-based actions.',
        'Brisbane, QLD',
        'permanent-resident',
        true,
        null::date,
        array['environmental-community', 'geotechnical-engineering', 'project-controls']::text[]
      ),
      (
        '10000000-0000-4000-8000-000000000012'::uuid,
        'talenthub.seed+12@youmine.test',
        'Daniel',
        'Brooks',
        'Orebody Delivery Controls',
        'Project Controls Lead',
        'Daniel Brooks',
        'Daniel Brooks',
        'Project controls lead aligning scope, schedule, and cost visibility for mining delivery teams.',
        'Project controls professional experienced in site expansion, sustaining capital, and brownfield improvement work. Strong in reporting cadence, contractor alignment, and decision-ready project visibility.',
        'Perth, WA',
        'full-working-rights',
        false,
        '2026-07-15'::date,
        array['project-controls', 'data-digital']::text[]
      ),
      (
        '10000000-0000-4000-8000-000000000013'::uuid,
        'talenthub.seed+13@youmine.test',
        'Hannah',
        'Price',
        'Red Centre Exploration',
        'Exploration Geologist',
        'Hannah Price',
        'Hannah Price',
        'Exploration geologist experienced in field programs, target generation, and contractor coordination.',
        'Exploration geologist with strong field capability across drilling campaigns, logging, mapping, and program support. Works well in lean teams where communication and execution speed matter.',
        'Alice Springs, NT',
        'full-working-rights',
        true,
        null::date,
        array['geology', 'drilling-blasting']::text[]
      ),
      (
        '10000000-0000-4000-8000-000000000014'::uuid,
        'talenthub.seed+14@youmine.test',
        'Ethan',
        'Murphy',
        'Mine Data Labs',
        'Automation & Data Analyst',
        'Ethan Murphy',
        'Ethan Murphy',
        'Data and automation analyst building tools that connect mine planning, operations, and reporting.',
        'Analytics and digital specialist with experience in Power BI, operational dashboards, data cleanup, and small automations that remove manual admin from technical and site teams.',
        'Perth, WA',
        'australian-citizen',
        true,
        null::date,
        array['data-digital', 'process-operations']::text[]
      ),
      (
        '10000000-0000-4000-8000-000000000015'::uuid,
        'talenthub.seed+15@youmine.test',
        'Grace',
        'Kim',
        'Rehab & Closure Advisory',
        'Closure & Rehabilitation Specialist',
        'Grace Kim',
        'Grace Kim',
        'Closure specialist helping sites turn rehabilitation obligations into executable field programs.',
        'Closure and rehabilitation specialist experienced in mine closure planning, rehabilitation delivery, landform outcomes, and practical coordination between environment, operations, and contractors.',
        'Bendigo, VIC',
        'permanent-resident',
        false,
        '2026-07-05'::date,
        array['environmental-community', 'project-controls']::text[]
      )
  ) as seed (
    id,
    email,
    first_name,
    last_name,
    organisation_name,
    profession,
    display_name,
    public_profile_name,
    headline,
    bio,
    location,
    working_rights_slug,
    available_now,
    available_from,
    role_slugs
  )
),
upsert_auth_users as (
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  select
    sw.id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'authenticated',
    'authenticated',
    sw.email,
    crypt('DummyWorker123!', gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    jsonb_build_object('first_name', sw.first_name, 'last_name', sw.last_name),
    now(),
    now(),
    '',
    '',
    '',
    ''
  from seeded_workers sw
  on conflict (id) do update
  set
    email = excluded.email,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now()
),
upsert_profiles as (
  insert into public.user_profiles (
    id,
    user_type,
    organisation_size,
    organisation_name,
    profession,
    first_name,
    last_name,
    created_at,
    updated_at
  )
  select
    sw.id,
    'consultant',
    'individual',
    sw.organisation_name,
    sw.profession,
    sw.first_name,
    sw.last_name,
    now(),
    now()
  from seeded_workers sw
  on conflict (id) do update
  set
    organisation_name = excluded.organisation_name,
    profession = excluded.profession,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    updated_at = now()
),
upsert_workers as (
  insert into public.workers (
    id,
    display_name,
    public_profile_name,
    headline,
    bio,
    location,
    visibility,
    status,
    working_rights_slug,
    created_at,
    updated_at
  )
  select
    sw.id,
    sw.display_name,
    sw.public_profile_name,
    sw.headline,
    sw.bio,
    sw.location,
    'public',
    'approved',
    sw.working_rights_slug,
    now(),
    now()
  from seeded_workers sw
  on conflict (id) do update
  set
    display_name = excluded.display_name,
    public_profile_name = excluded.public_profile_name,
    headline = excluded.headline,
    bio = excluded.bio,
    location = excluded.location,
    visibility = excluded.visibility,
    status = excluded.status,
    working_rights_slug = excluded.working_rights_slug,
    updated_at = now()
),
upsert_availability as (
  insert into public.worker_availability (
    worker_id,
    available_now,
    available_from,
    created_at,
    updated_at
  )
  select
    sw.id,
    sw.available_now,
    sw.available_from,
    now(),
    now()
  from seeded_workers sw
  on conflict (worker_id) do update
  set
    available_now = excluded.available_now,
    available_from = excluded.available_from,
    updated_at = now()
)
select count(*) as seeded_worker_count
from seeded_workers;

delete from public.worker_roles
where worker_id in (
  '10000000-0000-4000-8000-000000000001'::uuid,
  '10000000-0000-4000-8000-000000000002'::uuid,
  '10000000-0000-4000-8000-000000000003'::uuid,
  '10000000-0000-4000-8000-000000000004'::uuid,
  '10000000-0000-4000-8000-000000000005'::uuid,
  '10000000-0000-4000-8000-000000000006'::uuid,
  '10000000-0000-4000-8000-000000000007'::uuid,
  '10000000-0000-4000-8000-000000000008'::uuid,
  '10000000-0000-4000-8000-000000000009'::uuid,
  '10000000-0000-4000-8000-000000000010'::uuid,
  '10000000-0000-4000-8000-000000000011'::uuid,
  '10000000-0000-4000-8000-000000000012'::uuid,
  '10000000-0000-4000-8000-000000000013'::uuid,
  '10000000-0000-4000-8000-000000000014'::uuid,
  '10000000-0000-4000-8000-000000000015'::uuid
);

with seeded_workers as (
  select *
  from (
    values
      ('10000000-0000-4000-8000-000000000001'::uuid, array['mine-planning', 'project-controls']::text[]),
      ('10000000-0000-4000-8000-000000000002'::uuid, array['geology', 'drilling-blasting']::text[]),
      ('10000000-0000-4000-8000-000000000003'::uuid, array['metallurgy', 'process-operations', 'data-digital']::text[]),
      ('10000000-0000-4000-8000-000000000004'::uuid, array['drilling-blasting', 'mine-planning']::text[]),
      ('10000000-0000-4000-8000-000000000005'::uuid, array['environmental-community', 'project-controls']::text[]),
      ('10000000-0000-4000-8000-000000000006'::uuid, array['geotechnical-engineering', 'geology']::text[]),
      ('10000000-0000-4000-8000-000000000007'::uuid, array['surveying', 'mine-planning']::text[]),
      ('10000000-0000-4000-8000-000000000008'::uuid, array['health-safety-training', 'project-controls']::text[]),
      ('10000000-0000-4000-8000-000000000009'::uuid, array['maintenance-reliability', 'process-operations']::text[]),
      ('10000000-0000-4000-8000-000000000010'::uuid, array['process-operations', 'metallurgy']::text[]),
      ('10000000-0000-4000-8000-000000000011'::uuid, array['environmental-community', 'geotechnical-engineering', 'project-controls']::text[]),
      ('10000000-0000-4000-8000-000000000012'::uuid, array['project-controls', 'data-digital']::text[]),
      ('10000000-0000-4000-8000-000000000013'::uuid, array['geology', 'drilling-blasting']::text[]),
      ('10000000-0000-4000-8000-000000000014'::uuid, array['data-digital', 'process-operations']::text[]),
      ('10000000-0000-4000-8000-000000000015'::uuid, array['environmental-community', 'project-controls']::text[])
  ) as seed (worker_id, role_slugs)
)
insert into public.worker_roles (worker_id, role_category_id, created_at)
select
  sw.worker_id,
  rc.id,
  now()
from seeded_workers sw
cross join lateral unnest(sw.role_slugs) as role_slug
join public.role_categories rc
  on rc.slug = role_slug
on conflict (worker_id, role_category_id) do nothing;

delete from public.worker_experiences
where worker_id in (
  '10000000-0000-4000-8000-000000000001'::uuid,
  '10000000-0000-4000-8000-000000000002'::uuid,
  '10000000-0000-4000-8000-000000000003'::uuid,
  '10000000-0000-4000-8000-000000000004'::uuid,
  '10000000-0000-4000-8000-000000000005'::uuid,
  '10000000-0000-4000-8000-000000000006'::uuid,
  '10000000-0000-4000-8000-000000000007'::uuid,
  '10000000-0000-4000-8000-000000000008'::uuid,
  '10000000-0000-4000-8000-000000000009'::uuid,
  '10000000-0000-4000-8000-000000000010'::uuid,
  '10000000-0000-4000-8000-000000000011'::uuid,
  '10000000-0000-4000-8000-000000000012'::uuid,
  '10000000-0000-4000-8000-000000000013'::uuid,
  '10000000-0000-4000-8000-000000000014'::uuid,
  '10000000-0000-4000-8000-000000000015'::uuid
);

insert into public.worker_experiences (
  worker_id,
  role_title,
  company,
  description,
  location,
  start_date,
  end_date,
  is_current,
  achievements,
  position,
  created_at,
  updated_at
)
values
  ('10000000-0000-4000-8000-000000000001'::uuid, 'Senior Mine Planner', 'Red Ridge Gold', 'Owned short-term schedule updates, contractor sequence logic, and weekly mine-to-mill planning inputs.', 'Perth, WA', '2022-02-01', null, true, '["Reduced schedule rework through tighter planning cadence","Improved drill-and-blast to dig alignment"]'::jsonb, 0, now(), now()),
  ('10000000-0000-4000-8000-000000000001'::uuid, 'Mining Engineer', 'Pilbara Ore Services', 'Supported monthly planning, haulage reviews, and productivity improvement studies.', 'Perth, WA', '2018-06-01', '2022-01-31', false, '["Built production reporting packs for site leadership"]'::jsonb, 1, now(), now()),

  ('10000000-0000-4000-8000-000000000002'::uuid, 'Underground Geologist', 'Golden Span Mining', 'Managed face mapping, ore drive interpretations, and shift-by-shift geological communication.', 'Kalgoorlie, WA', '2021-03-01', null, true, '["Improved ore/waste confidence in active headings"]'::jsonb, 0, now(), now()),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'Project Geologist', 'Northwest Base Metals', 'Delivered drill program logging, QAQC review, and resource support workflows.', 'Kalgoorlie, WA', '2017-05-01', '2021-02-28', false, '["Lifted logging consistency across contract geologists"]'::jsonb, 1, now(), now()),

  ('10000000-0000-4000-8000-000000000003'::uuid, 'Senior Metallurgist', 'Copper Plains Operations', 'Led plant improvement trials focused on flotation stability and recovery uplift.', 'Brisbane, QLD', '2023-01-01', null, true, '["Delivered recovery gains through reagent and control reviews"]'::jsonb, 0, now(), now()),
  ('10000000-0000-4000-8000-000000000003'::uuid, 'Process Metallurgist', 'Central Minerals', 'Supported plant troubleshooting, survey campaigns, and metallurgical accounting.', 'Brisbane, QLD', '2019-04-01', '2022-12-31', false, '["Introduced clearer daily plant KPI reporting"]'::jsonb, 1, now(), now()),

  ('10000000-0000-4000-8000-000000000004'::uuid, 'Drill & Blast Engineer', 'Iron Crest Mining', 'Optimised blast designs and fragmentation outcomes for high-volume open-pit production.', 'Mackay, QLD', '2022-07-01', null, true, '["Cut oversize frequency in crusher feed"]'::jsonb, 0, now(), now()),
  ('10000000-0000-4000-8000-000000000004'::uuid, 'Mining Engineer', 'Peak Rock Resources', 'Supported pit staging plans and drill pattern reviews.', 'Mackay, QLD', '2018-08-01', '2022-06-30', false, '["Improved blast review turnaround with standard templates"]'::jsonb, 1, now(), now()),

  ('10000000-0000-4000-8000-000000000005'::uuid, 'Environmental Advisor', 'Central West Resources', 'Owned site compliance routines, regulator reporting support, and field inspections.', 'Orange, NSW', '2021-09-01', null, true, '["Built practical inspection routines with operations leaders"]'::jsonb, 0, now(), now()),
  ('10000000-0000-4000-8000-000000000005'::uuid, 'Rehabilitation Coordinator', 'Southern Goldfields', 'Coordinated rehab works, contractor scopes, and completion reporting.', 'Orange, NSW', '2018-02-01', '2021-08-31', false, '["Improved rehab evidence capture for audits"]'::jsonb, 1, now(), now()),

  ('10000000-0000-4000-8000-000000000006'::uuid, 'Geotechnical Engineer', 'South Range Mining', 'Managed pit wall risk reviews, monitoring triggers, and geotechnical communication to operations.', 'Adelaide, SA', '2022-01-01', null, true, '["Tightened slope risk escalation thresholds"]'::jsonb, 0, now(), now()),
  ('10000000-0000-4000-8000-000000000006'::uuid, 'Graduate Geotechnical Engineer', 'Outback Metals', 'Supported core logging, structural interpretation, and geotechnical database updates.', 'Adelaide, SA', '2019-03-01', '2021-12-31', false, '["Built cleaner geotechnical data capture routines"]'::jsonb, 1, now(), now()),

  ('10000000-0000-4000-8000-000000000007'::uuid, 'Mine Surveyor', 'Hunter Coal Operations', 'Delivered setout, pit pickups, and reconciliation support for daily mining execution.', 'Singleton, NSW', '2021-04-01', null, true, '["Improved pickup turnaround for shift planning"]'::jsonb, 0, now(), now()),
  ('10000000-0000-4000-8000-000000000007'::uuid, 'Survey Technician', 'East Basin Mining', 'Supported drone surveys, stockpile volumes, and end-of-month surveys.', 'Singleton, NSW', '2017-07-01', '2021-03-31', false, '["Expanded drone capture use for field verification"]'::jsonb, 1, now(), now()),

  ('10000000-0000-4000-8000-000000000008'::uuid, 'HSE Superintendent', 'Pilbara Contract Mining', 'Led contractor safety systems, field coaching, and incident prevention reviews.', 'Perth, WA', '2022-05-01', null, true, '["Raised supervisor engagement with critical controls"]'::jsonb, 0, now(), now()),
  ('10000000-0000-4000-8000-000000000008'::uuid, 'Safety Advisor', 'Westline Shutdowns', 'Supported shutdown planning, field inspections, and permit-to-work coordination.', 'Perth, WA', '2018-09-01', '2022-04-30', false, '["Simplified pre-start safety pack content"]'::jsonb, 1, now(), now()),

  ('10000000-0000-4000-8000-000000000009'::uuid, 'Reliability Engineer', 'Oreflow Processing', 'Drove defect elimination and shutdown scope quality for fixed plant assets.', 'Newman, WA', '2023-02-01', null, true, '["Reduced repeat equipment failures through RCA actions"]'::jsonb, 0, now(), now()),
  ('10000000-0000-4000-8000-000000000009'::uuid, 'Maintenance Planner', 'Northwest Minerals', 'Built work packs, outage scopes, and weekly planning rhythm for maintenance teams.', 'Newman, WA', '2019-06-01', '2023-01-31', false, '["Lifted planned-work percentage during shutdown windows"]'::jsonb, 1, now(), now()),

  ('10000000-0000-4000-8000-000000000010'::uuid, 'Processing Superintendent', 'Tropic Copper', 'Led plant production teams through throughput and recovery improvement programs.', 'Townsville, QLD', '2022-08-01', null, true, '["Stabilised plant performance across multi-shift operations"]'::jsonb, 0, now(), now()),
  ('10000000-0000-4000-8000-000000000010'::uuid, 'Production Metallurgist', 'Northern Concentrates', 'Supported operations with daily metal accounting, testwork, and process review.', 'Townsville, QLD', '2018-01-01', '2022-07-31', false, '["Improved shift-to-shift visibility on recovery losses"]'::jsonb, 1, now(), now()),

  ('10000000-0000-4000-8000-000000000011'::uuid, 'Tailings & Water Engineer', 'Delta Resources', 'Supported dam surveillance, water management planning, and compliance reporting.', 'Brisbane, QLD', '2021-11-01', null, true, '["Improved action tracking for TSF inspections"]'::jsonb, 0, now(), now()),
  ('10000000-0000-4000-8000-000000000011'::uuid, 'Environmental Engineer', 'Greenstone Mining', 'Worked on water balance updates, rehabilitation inputs, and approvals support.', 'Brisbane, QLD', '2017-04-01', '2021-10-31', false, '["Streamlined reporting packs for site and consultant teams"]'::jsonb, 1, now(), now()),

  ('10000000-0000-4000-8000-000000000012'::uuid, 'Project Controls Lead', 'Orebody Projects', 'Owned schedule, reporting, change control, and leadership reporting for sustaining capital.', 'Perth, WA', '2023-03-01', null, true, '["Improved schedule confidence and reporting cadence"]'::jsonb, 0, now(), now()),
  ('10000000-0000-4000-8000-000000000012'::uuid, 'Project Planner', 'Pilbara Delivery Group', 'Supported integrated project schedules and progress reporting.', 'Perth, WA', '2019-05-01', '2023-02-28', false, '["Reduced manual reporting through dashboard automation"]'::jsonb, 1, now(), now()),

  ('10000000-0000-4000-8000-000000000013'::uuid, 'Exploration Geologist', 'Desert Range Exploration', 'Ran field mapping, drill logging, and target refinement for greenfields programs.', 'Alice Springs, NT', '2022-06-01', null, true, '["Improved contractor handover quality across drill campaigns"]'::jsonb, 0, now(), now()),
  ('10000000-0000-4000-8000-000000000013'::uuid, 'Field Geologist', 'Frontier Minerals', 'Supported RC and diamond drilling programs in remote exploration settings.', 'Alice Springs, NT', '2018-10-01', '2022-05-31', false, '["Built clear daily geology summaries for exploration leads"]'::jsonb, 1, now(), now()),

  ('10000000-0000-4000-8000-000000000014'::uuid, 'Automation & Data Analyst', 'Digital Ore Systems', 'Built reporting tools and lightweight automations for technical and site teams.', 'Perth, WA', '2023-01-01', null, true, '["Removed manual reporting steps with automated dashboards"]'::jsonb, 0, now(), now()),
  ('10000000-0000-4000-8000-000000000014'::uuid, 'Business Intelligence Analyst', 'Mine Metrics Co', 'Delivered operational dashboards, KPI definitions, and data cleanup projects.', 'Perth, WA', '2019-02-01', '2022-12-31', false, '["Lifted trust in operational reporting through better data QA"]'::jsonb, 1, now(), now()),

  ('10000000-0000-4000-8000-000000000015'::uuid, 'Closure & Rehabilitation Specialist', 'Regional Rehab Advisory', 'Supported closure planning, rehab scopes, and practical handover into field delivery.', 'Bendigo, VIC', '2022-04-01', null, true, '["Improved closure action tracking across workstreams"]'::jsonb, 0, now(), now()),
  ('10000000-0000-4000-8000-000000000015'::uuid, 'Environmental Planner', 'Victorian Gold Projects', 'Worked across rehab commitments, landform planning, and stakeholder inputs.', 'Bendigo, VIC', '2018-06-01', '2022-03-31', false, '["Made rehab scopes easier for operations teams to execute"]'::jsonb, 1, now(), now());

commit;begin;

-- Seed 15 varied Talent Hub workers for local/demo testing.
-- This patch is designed to be rerunnable.
-- It creates minimal auth users, public user_profiles, workers,
-- availability, roles, and experience rows.

create temporary table tmp_seed_workers (
  worker_id uuid primary key,
  email text not null,
  first_name text not null,
  last_name text not null,
  display_name text not null,
  public_profile_name text not null,
  headline text not null,
  bio text not null,
  location text not null,
  working_rights_slug text not null,
  available_now boolean not null,
  available_from date,
  user_type text not null default 'consultant',
  organisation_size text not null default 'individual',
  organisation_name text,
  profession text not null
) on commit drop;

insert into tmp_seed_workers (
  worker_id,
  email,
  first_name,
  last_name,
  display_name,
  public_profile_name,
  headline,
  bio,
  location,
  working_rights_slug,
  available_now,
  available_from,
  user_type,
  organisation_size,
  organisation_name,
  profession
)
values
  ('8d1d53a9-c07a-4b26-bbb2-100000000001', 'dummy.worker+amelia.hart@youmine.test', 'Amelia', 'Hart', 'Amelia Hart', 'Amelia H.', 'Principal mine planner for open pit growth and life-of-mine studies', 'Principal mining engineer with deep experience in pit optimisation, stage design, contractor scopes, and short-to-long range mine planning for gold and base metals operations.', 'Perth, WA', 'australian-citizen', true, null, 'consultant', 'individual', 'Hart Mining Advisory', 'Principal Mine Planner'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000002', 'dummy.worker+noah.bennett@youmine.test', 'Noah', 'Bennett', 'Noah Bennett', 'Noah B.', 'Exploration geologist focused on greenfields targets and resource growth', 'Exploration geologist specialising in target generation, drilling campaigns, geological interpretation, and junior-to-mid-tier project support across gold, copper, and lithium assets.', 'Kalgoorlie, WA', 'permanent-resident', false, '2026-07-01', 'consultant', 'individual', 'Bennett Exploration', 'Senior Exploration Geologist'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000003', 'dummy.worker+chloe.singh@youmine.test', 'Chloe', 'Singh', 'Chloe Singh', 'Chloe S.', 'Drill and blast engineer supporting production lift and fragmentation control', 'Mining engineer with strong drill and blast capability across production benches, vibration management, powder factor optimisation, and contractor QA on open pit sites.', 'Brisbane, QLD', 'australian-citizen', true, null, 'consultant', 'individual', 'Singh Drill & Blast', 'Drill and Blast Engineer'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000004', 'dummy.worker+liam.oconnell@youmine.test', 'Liam', 'OConnell', 'Liam O''Connell', 'Liam O.', 'Underground supervisor experienced in shift leadership and mine development', 'Underground operations leader with experience across decline development, contractor coordination, ventilation discipline, and frontline crew performance in hard rock environments.', 'Orange, NSW', 'full-work-rights', false, '2026-06-20', 'consultant', 'individual', 'OConnell Underground Services', 'Underground Shift Supervisor'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000005', 'dummy.worker+grace.kim@youmine.test', 'Grace', 'Kim', 'Grace Kim', 'Grace K.', 'Senior metallurgist for plant improvement, troubleshooting, and recovery uplift', 'Process metallurgist supporting flotation, CIL, and concentrator optimisation with a focus on plant stability, metallurgical accounting, and throughput improvement.', 'Adelaide, SA', 'permanent-resident', true, null, 'consultant', 'individual', 'Kim Metallurgy Consulting', 'Senior Metallurgist'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000006', 'dummy.worker+ethan.wallace@youmine.test', 'Ethan', 'Wallace', 'Ethan Wallace', 'Ethan W.', 'Geotechnical engineer covering slope stability, ground support, and risk reviews', 'Geotechnical engineer with experience in pit wall design recommendations, geotechnical inspections, underground ground support reviews, and operational risk communication.', 'Newcastle, NSW', 'australian-citizen', true, null, 'consultant', 'individual', 'Wallace Geotech', 'Geotechnical Engineer'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000007', 'dummy.worker+ruby.lawson@youmine.test', 'Ruby', 'Lawson', 'Ruby Lawson', 'Ruby L.', 'Environmental advisor for approvals, compliance, and rehabilitation delivery', 'Environmental specialist supporting approvals pathways, site compliance systems, monitoring programs, closure obligations, and regulator-ready reporting.', 'Townsville, QLD', 'australian-citizen', false, '2026-07-15', 'consultant', 'individual', 'Lawson Environmental', 'Environmental Advisor'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000008', 'dummy.worker+jack.mercer@youmine.test', 'Jack', 'Mercer', 'Jack Mercer', 'Jack M.', 'Maintenance planner for shutdowns, backlog control, and reliability support', 'Maintenance planner with experience across fixed plant and mobile maintenance planning, weekly scheduling, work order quality, and shutdown scope readiness.', 'Mackay, QLD', 'full-work-rights', true, null, 'consultant', 'individual', 'Mercer Reliability Services', 'Maintenance Planner'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000009', 'dummy.worker+mia.robertson@youmine.test', 'Mia', 'Robertson', 'Mia Robertson', 'Mia R.', 'Project controls lead for studies, execution tracking, and cost visibility', 'Project controls professional covering scheduling, earned value, cost forecasting, reporting packs, and integrated controls for studies and brownfields execution teams.', 'Perth, WA', 'australian-citizen', true, null, 'consultant', '1-8', 'Robertson PMO', 'Project Controls Lead'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000010', 'dummy.worker+oliver.tran@youmine.test', 'Oliver', 'Tran', 'Oliver Tran', 'Oliver T.', 'Mine surveyor and spatial specialist for production and development support', 'Survey and spatial specialist supporting production set-out, drone capture, reconciliation, volume reporting, and mapping workflows for operating sites.', 'Singleton, NSW', 'permanent-resident', false, '2026-06-30', 'consultant', 'individual', 'Tran Spatial Mining', 'Mine Surveyor'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000011', 'dummy.worker+ava.patel@youmine.test', 'Ava', 'Patel', 'Ava Patel', 'Ava P.', 'HSE superintendent supporting systems, critical controls, and field leadership', 'Health and safety leader with strong operational exposure across incident investigation, assurance programs, critical control verification, and frontline coaching.', 'Moranbah, QLD', 'australian-citizen', true, null, 'consultant', 'individual', 'Patel HSE Advisory', 'HSE Superintendent'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000012', 'dummy.worker+benjamin.cole@youmine.test', 'Benjamin', 'Cole', 'Benjamin Cole', 'Ben C.', 'Processing specialist covering plant operations, commissioning, and training', 'Processing operations professional with experience in shift leadership, plant commissioning, operating philosophy rollouts, and operator training for new circuits.', 'Gladstone, QLD', 'full-work-rights', false, '2026-07-10', 'consultant', 'individual', 'Cole Process Support', 'Process Operations Specialist'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000013', 'dummy.worker+zara.thompson@youmine.test', 'Zara', 'Thompson', 'Zara Thompson', 'Zara T.', 'Supply chain lead for procurement, logistics, and site inventory resilience', 'Procurement and logistics lead helping mining sites stabilise critical spares, improve supplier performance, and streamline end-to-end material flow.', 'Perth, WA', 'australian-citizen', true, null, 'consultant', '1-8', 'Thompson Supply Advisory', 'Supply Chain and Procurement Lead'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000014', 'dummy.worker+henry.davies@youmine.test', 'Henry', 'Davies', 'Henry Davies', 'Henry D.', 'Mining data analyst turning operational data into practical site decisions', 'Data analyst focused on mining performance dashboards, production data quality, fleet and plant reporting, and practical analytics for operations and technical teams.', 'Brisbane, QLD', 'sponsorship-required', false, '2026-08-01', 'consultant', 'individual', 'Davies Mining Analytics', 'Mining Data Analyst'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000015', 'dummy.worker+sophie.nguyen@youmine.test', 'Sophie', 'Nguyen', 'Sophie Nguyen', 'Sophie N.', 'Laboratory and sample prep supervisor for QAQC and high-throughput workflows', 'Laboratory supervisor experienced in sample preparation workflow design, QAQC oversight, turnaround optimisation, and contractor laboratory interface management.', 'Mount Isa, QLD', 'permanent-resident', true, null, 'consultant', 'individual', 'Nguyen Lab Services', 'Laboratory Supervisor');

create temporary table tmp_seed_worker_roles (
  worker_id uuid not null,
  role_slug text not null
) on commit drop;

insert into tmp_seed_worker_roles (worker_id, role_slug)
values
  ('8d1d53a9-c07a-4b26-bbb2-100000000001', 'mine-planning'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000001', 'project-controls'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000002', 'exploration-geology'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000002', 'survey-and-spatial'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000003', 'drill-and-blast'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000003', 'mine-planning'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000004', 'underground-operations'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000004', 'safety-and-hse'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000005', 'metallurgy-and-processing'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000005', 'processing-operations'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000006', 'geotechnical-engineering'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000006', 'underground-operations'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000007', 'environmental-approvals'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000007', 'project-controls'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000008', 'maintenance-planning'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000008', 'processing-operations'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000009', 'project-controls'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000009', 'mine-planning'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000010', 'survey-and-spatial'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000010', 'exploration-geology'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000011', 'safety-and-hse'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000011', 'underground-operations'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000012', 'processing-operations'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000012', 'metallurgy-and-processing'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000013', 'procurement-and-logistics'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000013', 'maintenance-planning'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000014', 'data-and-analytics'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000014', 'project-controls'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000015', 'laboratory-and-sampling'),
  ('8d1d53a9-c07a-4b26-bbb2-100000000015', 'metallurgy-and-processing');

create temporary table tmp_seed_worker_experiences (
  worker_id uuid not null,
  position integer not null,
  role_title text not null,
  company text,
  description text,
  location text,
  start_date date,
  end_date date,
  is_current boolean not null,
  achievements jsonb
) on commit drop;

insert into tmp_seed_worker_experiences (
  worker_id,
  position,
  role_title,
  company,
  description,
  location,
  start_date,
  end_date,
  is_current,
  achievements
)
values
  ('8d1d53a9-c07a-4b26-bbb2-100000000001', 0, 'Principal Mine Planner', 'Hart Mining Advisory', 'Led open pit stage optimisation and life-of-mine planning for a gold expansion study.', 'Perth, WA', '2023-02-01', null, true, '["Built integrated pit and haulage schedules","Improved study confidence for board approval"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000001', 1, 'Senior Mining Engineer', 'Red Crest Resources', 'Supported budget plans, contractor mining scopes, and weekly production replans.', 'Leonora, WA', '2020-01-01', '2023-01-31', false, '["Delivered quarterly budget updates","Aligned planning outputs with contractor fleet strategy"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000002', 0, 'Senior Exploration Geologist', 'Bennett Exploration', 'Managed drill targeting and geological interpretation for emerging gold and lithium prospects.', 'Kalgoorlie, WA', '2022-05-01', null, true, '["Defined multiple near-mine drill targets","Coordinated field mapping and campaign logging"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000002', 1, 'Project Geologist', 'West Arc Minerals', 'Supported RC and diamond drilling programs with structural interpretation and logging QAQC.', 'Laverton, WA', '2019-03-01', '2022-04-30', false, '["Improved geological logging consistency","Helped expand resource confidence in oxide zone"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000003', 0, 'Drill and Blast Engineer', 'Singh Drill & Blast', 'Designed blast patterns, powder factors, and vibration controls for production benches.', 'Brisbane, QLD', '2023-01-01', null, true, '["Reduced oversize generation","Improved blast performance reporting"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000003', 1, 'Mining Engineer', 'Northern Ridge Mining', 'Supported pit design packs and weekly production drill and blast requirements.', 'Bowen Basin, QLD', '2020-02-01', '2022-12-15', false, '["Streamlined blast pack turnaround","Supported production delivery across multiple pits"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000004', 0, 'Underground Shift Supervisor', 'OConnell Underground Services', 'Led crews through development and production cycles with a strong safety and planning focus.', 'Orange, NSW', '2024-01-01', null, true, '["Coordinated multiple contractor crews","Improved shift handover discipline"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000004', 1, 'Mine Captain', 'Deep Reef Operations', 'Managed underground development priorities and frontline operational execution.', 'Cobar, NSW', '2020-08-01', '2023-12-20', false, '["Lifted development metres against plan","Embedded stronger pre-start routines"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000005', 0, 'Senior Metallurgist', 'Kim Metallurgy Consulting', 'Supports plant troubleshooting, metallurgical accounting, and recovery uplift studies.', 'Adelaide, SA', '2022-11-01', null, true, '["Improved gold recovery reporting accuracy","Helped stabilise circuit performance"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000005', 1, 'Process Metallurgist', 'Copper Hill Processing', 'Oversaw sampling campaigns and plant testwork interpretation.', 'Whyalla, SA', '2019-01-01', '2022-10-15', false, '["Supported concentrator optimisation","Developed practical daily plant KPI pack"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000006', 0, 'Geotechnical Engineer', 'Wallace Geotech', 'Provides slope stability assessments and operational geotechnical guidance.', 'Newcastle, NSW', '2023-04-01', null, true, '["Delivered pit wall review packs","Improved operational geotech communication"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000006', 1, 'Ground Control Engineer', 'Stonecut Underground', 'Supported underground ground support reviews and excavation risk management.', 'Parkes, NSW', '2020-01-15', '2023-03-31', false, '["Reviewed support standards","Helped prioritise underground hazard controls"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000007', 0, 'Environmental Advisor', 'Lawson Environmental', 'Manages site approvals support, compliance systems, and rehab planning.', 'Townsville, QLD', '2023-06-01', null, true, '["Prepared regulator-ready reporting packs","Improved monitoring and closure tracking"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000007', 1, 'Approvals Coordinator', 'North Coast Minerals', 'Supported approvals schedules and environmental obligations across multiple projects.', 'Mackay, QLD', '2019-09-01', '2023-05-20', false, '["Reduced approvals bottlenecks","Coordinated multi-disciplinary submissions"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000008', 0, 'Maintenance Planner', 'Mercer Reliability Services', 'Owns maintenance backlog quality, weekly plans, and shutdown readiness across fixed plant assets.', 'Mackay, QLD', '2023-01-01', null, true, '["Improved weekly plan compliance","Tightened shutdown workpack quality"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000008', 1, 'Shutdown Planner', 'Coal Basin Services', 'Built integrated shutdown schedules and material readiness plans.', 'Moranbah, QLD', '2020-03-01', '2022-12-10', false, '["Reduced shutdown overruns","Improved contractor readiness before execution"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000009', 0, 'Project Controls Lead', 'Robertson PMO', 'Leads schedule, cost, and reporting frameworks for study and execution teams.', 'Perth, WA', '2022-07-01', null, true, '["Established integrated controls reporting","Improved monthly forecast accuracy"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000009', 1, 'Planner / Scheduler', 'Westline Projects', 'Managed schedule updates, progress tracking, and stakeholder reporting.', 'Perth, WA', '2019-02-01', '2022-06-30', false, '["Built practical progress reporting pack","Improved schedule handoff to delivery teams"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000010', 0, 'Mine Surveyor', 'Tran Spatial Mining', 'Supports production set-out, drone capture, and operational volume reporting.', 'Singleton, NSW', '2023-08-01', null, true, '["Improved monthly reconciliation workflow","Expanded field use of drone outputs"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000010', 1, 'Survey Technician', 'Hunter Valley Resources', 'Delivered set-out, pickup, and survey QA for active mining areas.', 'Singleton, NSW', '2020-01-01', '2023-07-31', false, '["Reduced survey rework","Improved shift-to-shift map delivery"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000011', 0, 'HSE Superintendent', 'Patel HSE Advisory', 'Leads site safety system improvement, field leadership coaching, and incident response support.', 'Moranbah, QLD', '2024-01-01', null, true, '["Strengthened critical control verification","Lifted field leadership participation"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000011', 1, 'Senior Safety Advisor', 'Black Ridge Energy', 'Managed incident investigation, contractor onboarding, and assurance activities.', 'Moranbah, QLD', '2020-05-01', '2023-12-10', false, '["Improved contractor safety onboarding","Standardised incident learning reviews"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000012', 0, 'Process Operations Specialist', 'Cole Process Support', 'Supports plant commissioning, shift leadership capability, and operating philosophy rollout.', 'Gladstone, QLD', '2023-03-01', null, true, '["Supported successful circuit ramp-up","Built operator training materials"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000012', 1, 'Process Superintendent', 'Harbour Minerals', 'Oversaw daily plant performance, shift teams, and operating discipline.', 'Gladstone, QLD', '2019-07-01', '2023-02-20', false, '["Improved plant stability during high throughput periods","Embedded tighter shift review cadence"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000013', 0, 'Supply Chain and Procurement Lead', 'Thompson Supply Advisory', 'Improves critical spares strategy, supplier performance, and logistics resilience for remote sites.', 'Perth, WA', '2022-09-01', null, true, '["Reduced stockout risk on critical parts","Improved supplier review discipline"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000013', 1, 'Procurement Specialist', 'Pilbara Industrial Services', 'Managed procurement pipelines and site material planning.', 'Port Hedland, WA', '2019-01-01', '2022-08-15', false, '["Tightened PO turnaround times","Improved materials visibility for shutdown scopes"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000014', 0, 'Mining Data Analyst', 'Davies Mining Analytics', 'Builds operational dashboards and cleans production data for practical decision support.', 'Brisbane, QLD', '2023-05-01', null, true, '["Built site-wide production dashboard suite","Improved trust in operational KPIs"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000014', 1, 'Business Intelligence Analyst', 'OreTrack Systems', 'Developed reporting pipelines and operational performance packs for mining clients.', 'Brisbane, QLD', '2020-02-01', '2023-04-20', false, '["Automated recurring site reports","Reduced manual reporting load for engineers"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000015', 0, 'Laboratory Supervisor', 'Nguyen Lab Services', 'Leads sample prep throughput, QAQC oversight, and interface with mine geology teams.', 'Mount Isa, QLD', '2023-01-01', null, true, '["Improved sample turnaround reliability","Strengthened QAQC controls across shifts"]'::jsonb),
  ('8d1d53a9-c07a-4b26-bbb2-100000000015', 1, 'Sample Preparation Lead', 'Northwest Assay Labs', 'Managed sample prep operations and workflow balancing for mining clients.', 'Mount Isa, QLD', '2019-06-01', '2022-12-15', false, '["Lifted throughput without extra headcount","Standardised handoff checks for dispatch"]'::jsonb);

insert into public.working_rights_categories (name, slug, description, position)
values
  ('Australian Citizen', 'australian-citizen', 'Citizen with unrestricted working rights in Australia.', 10),
  ('Permanent Resident', 'permanent-resident', 'Permanent resident with unrestricted working rights in Australia.', 20),
  ('Full Work Rights', 'full-work-rights', 'Worker has full rights to work in Australia.', 30),
  ('Sponsorship Required', 'sponsorship-required', 'Worker may require visa sponsorship for some roles.', 40)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  position = excluded.position;

insert into public.role_categories (name, slug, description, position, group_name, group_slug, group_position)
values
  ('Mine Planning', 'mine-planning', 'Open pit and underground mine planning, scheduling, and optimisation.', 10, 'Technical Services', 'technical-services', 10),
  ('Exploration Geology', 'exploration-geology', 'Exploration geology, target generation, and drilling support.', 20, 'Geoscience', 'geoscience', 20),
  ('Drill and Blast', 'drill-and-blast', 'Drill and blast design, execution support, and fragmentation improvement.', 30, 'Operations', 'operations', 30),
  ('Underground Operations', 'underground-operations', 'Underground development, production, and frontline leadership.', 40, 'Operations', 'operations', 30),
  ('Metallurgy and Processing', 'metallurgy-and-processing', 'Metallurgy, testwork interpretation, and process optimisation.', 50, 'Processing', 'processing', 40),
  ('Geotechnical Engineering', 'geotechnical-engineering', 'Ground control, pit wall stability, and geotechnical reviews.', 60, 'Technical Services', 'technical-services', 10),
  ('Environmental Approvals', 'environmental-approvals', 'Approvals, compliance, monitoring, and closure support.', 70, 'Environment and Community', 'environment-and-community', 50),
  ('Maintenance Planning', 'maintenance-planning', 'Shutdown planning, backlog control, and reliability support.', 80, 'Asset Management', 'asset-management', 60),
  ('Project Controls', 'project-controls', 'Scheduling, cost control, reporting, and study controls.', 90, 'Projects', 'projects', 70),
  ('Survey and Spatial', 'survey-and-spatial', 'Mine survey, drone capture, mapping, and spatial data.', 100, 'Geoscience', 'geoscience', 20),
  ('Safety and HSE', 'safety-and-hse', 'Safety systems, assurance, and frontline HSE leadership.', 110, 'Leadership and Risk', 'leadership-and-risk', 80),
  ('Processing Operations', 'processing-operations', 'Plant operations, commissioning, and shift leadership.', 120, 'Processing', 'processing', 40),
  ('Procurement and Logistics', 'procurement-and-logistics', 'Procurement, warehousing, logistics, and critical spares.', 130, 'Commercial', 'commercial', 90),
  ('Data and Analytics', 'data-and-analytics', 'Operational dashboards, reporting, BI, and data analysis.', 140, 'Digital', 'digital', 100),
  ('Laboratory and Sampling', 'laboratory-and-sampling', 'Sample preparation, laboratory operations, and QAQC.', 150, 'Processing', 'processing', 40)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  position = excluded.position,
  group_name = excluded.group_name,
  group_slug = excluded.group_slug,
  group_position = excluded.group_position;

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  sw.worker_id,
  'authenticated',
  'authenticated',
  sw.email,
  crypt('DummyWorker123!', gen_salt('bf')),
  now(),
  jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
  jsonb_build_object('first_name', sw.first_name, 'last_name', sw.last_name),
  now(),
  now(),
  '',
  '',
  '',
  ''
from tmp_seed_workers sw
where not exists (
  select 1
  from auth.users au
  where au.id = sw.worker_id
     or lower(au.email) = lower(sw.email)
);

create temporary table tmp_valid_seed_workers as
select sw.*
from tmp_seed_workers sw
join auth.users au
  on au.id = sw.worker_id;

insert into public.user_profiles (
  id,
  user_type,
  organisation_size,
  organisation_name,
  profession,
  first_name,
  last_name,
  updated_at
)
select
  worker_id,
  user_type,
  organisation_size,
  organisation_name,
  profession,
  first_name,
  last_name,
  now()
from tmp_valid_seed_workers
on conflict (id) do update
set
  user_type = excluded.user_type,
  organisation_size = excluded.organisation_size,
  organisation_name = excluded.organisation_name,
  profession = excluded.profession,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  updated_at = now();

insert into public.workers (
  id,
  display_name,
  public_profile_name,
  headline,
  bio,
  location,
  visibility,
  status,
  working_rights_slug,
  updated_at
)
select
  worker_id,
  display_name,
  public_profile_name,
  headline,
  bio,
  location,
  'public',
  'approved',
  working_rights_slug,
  now()
from tmp_valid_seed_workers
on conflict (id) do update
set
  display_name = excluded.display_name,
  public_profile_name = excluded.public_profile_name,
  headline = excluded.headline,
  bio = excluded.bio,
  location = excluded.location,
  visibility = excluded.visibility,
  status = excluded.status,
  working_rights_slug = excluded.working_rights_slug,
  updated_at = now();

insert into public.worker_availability (
  worker_id,
  available_now,
  available_from,
  updated_at
)
select
  worker_id,
  available_now,
  available_from,
  now()
from tmp_valid_seed_workers
on conflict (worker_id) do update
set
  available_now = excluded.available_now,
  available_from = excluded.available_from,
  updated_at = now();

delete from public.worker_roles
where worker_id in (select worker_id from tmp_valid_seed_workers);

insert into public.worker_roles (worker_id, role_category_id)
select
  wr.worker_id,
  rc.id
from tmp_seed_worker_roles wr
join tmp_valid_seed_workers sw
  on sw.worker_id = wr.worker_id
join public.role_categories rc
  on rc.slug = wr.role_slug;

delete from public.worker_experiences
where worker_id in (select worker_id from tmp_valid_seed_workers);

insert into public.worker_experiences (
  worker_id,
  role_title,
  company,
  description,
  location,
  start_date,
  end_date,
  is_current,
  achievements,
  position,
  updated_at
)
select
  we.worker_id,
  we.role_title,
  we.company,
  we.description,
  we.location,
  we.start_date,
  we.end_date,
  we.is_current,
  we.achievements,
  we.position,
  now()
from tmp_seed_worker_experiences we
join tmp_valid_seed_workers sw
  on sw.worker_id = we.worker_id;

commit;

-- Optional verification:
-- select count(*) as seeded_workers
-- from public.workers
-- where id in (
--   '8d1d53a9-c07a-4b26-bbb2-100000000001',
--   '8d1d53a9-c07a-4b26-bbb2-100000000002',
--   '8d1d53a9-c07a-4b26-bbb2-100000000003',
--   '8d1d53a9-c07a-4b26-bbb2-100000000004',
--   '8d1d53a9-c07a-4b26-bbb2-100000000005',
--   '8d1d53a9-c07a-4b26-bbb2-100000000006',
--   '8d1d53a9-c07a-4b26-bbb2-100000000007',
--   '8d1d53a9-c07a-4b26-bbb2-100000000008',
--   '8d1d53a9-c07a-4b26-bbb2-100000000009',
--   '8d1d53a9-c07a-4b26-bbb2-100000000010',
--   '8d1d53a9-c07a-4b26-bbb2-100000000011',
--   '8d1d53a9-c07a-4b26-bbb2-100000000012',
--   '8d1d53a9-c07a-4b26-bbb2-100000000013',
--   '8d1d53a9-c07a-4b26-bbb2-100000000014',
--   '8d1d53a9-c07a-4b26-bbb2-100000000015'
-- );