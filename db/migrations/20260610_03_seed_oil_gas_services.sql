with category_map as (
  select id, slug
  from public.service_categories
  where market = 'oil_gas'::public.service_market
), seeded_services as (
  insert into public.services (
    market,
    slug,
    name,
    description,
    category_id,
    position
  )
  values
    ('oil_gas', 'reservoir-characterisation-modelling', 'Reservoir Characterisation & Modelling', null, (select id from category_map where slug = 'subsurface-reservoir'), 10),
    ('oil_gas', 'static-dynamic-reservoir-studies', 'Static & Dynamic Reservoir Studies', null, (select id from category_map where slug = 'subsurface-reservoir'), 20),
    ('oil_gas', 'petrophysics-formation-evaluation', 'Petrophysics & Formation Evaluation', null, (select id from category_map where slug = 'subsurface-reservoir'), 30),
    ('oil_gas', 'reserve-certification-audits', 'Reserve Certification & Audits', null, (select id from category_map where slug = 'subsurface-reservoir'), 40),
    ('oil_gas', 'production-forecasting-decline-analysis', 'Production Forecasting & Decline Analysis', null, (select id from category_map where slug = 'subsurface-reservoir'), 50),

    ('oil_gas', 'concept-select-feasibility-studies', 'Concept Select & Feasibility Studies', null, (select id from category_map where slug = 'field-development-planning'), 10),
    ('oil_gas', 'field-development-plans-fdp', 'Field Development Plans (FDP)', null, (select id from category_map where slug = 'field-development-planning'), 20),
    ('oil_gas', 'well-spacing-drainage-strategy', 'Well Spacing & Drainage Strategy', null, (select id from category_map where slug = 'field-development-planning'), 30),
    ('oil_gas', 'surface-subsurface-integration', 'Surface and Subsurface Integration', null, (select id from category_map where slug = 'field-development-planning'), 40),
    ('oil_gas', 'development-economics-screening', 'Development Economics & Screening', null, (select id from category_map where slug = 'field-development-planning'), 50),

    ('oil_gas', 'site-investigations-geotechnical-surveys', 'Site Investigations & Geotechnical Surveys', null, (select id from category_map where slug = 'geotechnical-marine-civil'), 10),
    ('oil_gas', 'marine-foundations-nearshore-civil', 'Marine Foundations & Nearshore Civil', null, (select id from category_map where slug = 'geotechnical-marine-civil'), 20),
    ('oil_gas', 'pipelines-landfall-crossing-design', 'Pipelines, Landfall & Crossing Design', null, (select id from category_map where slug = 'geotechnical-marine-civil'), 30),
    ('oil_gas', 'offshore-geohazard-assessments', 'Offshore Geohazard Assessments', null, (select id from category_map where slug = 'geotechnical-marine-civil'), 40),
    ('oil_gas', 'earthworks-access-civil-infrastructure', 'Earthworks, Access & Civil Infrastructure', null, (select id from category_map where slug = 'geotechnical-marine-civil'), 50),

    ('oil_gas', 'well-planning-engineering', 'Well Planning & Engineering', null, (select id from category_map where slug = 'drilling-wells-field-execution'), 10),
    ('oil_gas', 'drilling-campaign-management', 'Drilling Campaign Management', null, (select id from category_map where slug = 'drilling-wells-field-execution'), 20),
    ('oil_gas', 'completion-workover-design', 'Completion & Workover Design', null, (select id from category_map where slug = 'drilling-wells-field-execution'), 30),
    ('oil_gas', 'rig-site-supervision-wellsite-support', 'Rig Site Supervision & Wellsite Support', null, (select id from category_map where slug = 'drilling-wells-field-execution'), 40),
    ('oil_gas', 'intervention-stimulation-programs', 'Intervention & Stimulation Programs', null, (select id from category_map where slug = 'drilling-wells-field-execution'), 50),

    ('oil_gas', 'production-operations-support', 'Production Operations Support', null, (select id from category_map where slug = 'production-facilities'), 10),
    ('oil_gas', 'process-facility-optimisation', 'Process & Facility Optimisation', null, (select id from category_map where slug = 'production-facilities'), 20),
    ('oil_gas', 'brownfield-modifications-debottlenecking', 'Brownfield Modifications & Debottlenecking', null, (select id from category_map where slug = 'production-facilities'), 30),
    ('oil_gas', 'commissioning-startup-readiness', 'Commissioning & Startup Readiness', null, (select id from category_map where slug = 'production-facilities'), 40),
    ('oil_gas', 'flow-assurance-chemical-systems', 'Flow Assurance & Chemical Systems', null, (select id from category_map where slug = 'production-facilities'), 50),

    ('oil_gas', 'asset-integrity-management', 'Asset Integrity Management', null, (select id from category_map where slug = 'asset-integrity-maintenance-reliability'), 10),
    ('oil_gas', 'inspection-ndt-corrosion-programs', 'Inspection, NDT & Corrosion Programs', null, (select id from category_map where slug = 'asset-integrity-maintenance-reliability'), 20),
    ('oil_gas', 'reliability-centred-maintenance', 'Reliability Centred Maintenance', null, (select id from category_map where slug = 'asset-integrity-maintenance-reliability'), 30),
    ('oil_gas', 'shutdown-turnaround-planning', 'Shutdown & Turnaround Planning', null, (select id from category_map where slug = 'asset-integrity-maintenance-reliability'), 40),
    ('oil_gas', 'critical-equipment-performance', 'Critical Equipment Performance', null, (select id from category_map where slug = 'asset-integrity-maintenance-reliability'), 50),

    ('oil_gas', 'scada-hmi-industrial-systems', 'SCADA, HMI & Industrial Systems', null, (select id from category_map where slug = 'digital-automation-operational-technology'), 10),
    ('oil_gas', 'digital-oilfield-data-platforms', 'Digital Oilfield & Data Platforms', null, (select id from category_map where slug = 'digital-automation-operational-technology'), 20),
    ('oil_gas', 'production-reporting-analytics', 'Production Reporting & Analytics', null, (select id from category_map where slug = 'digital-automation-operational-technology'), 30),
    ('oil_gas', 'automation-control-system-upgrades', 'Automation & Control System Upgrades', null, (select id from category_map where slug = 'digital-automation-operational-technology'), 40),
    ('oil_gas', 'operational-technology-cybersecurity', 'Operational Technology Cybersecurity', null, (select id from category_map where slug = 'digital-automation-operational-technology'), 50),

    ('oil_gas', 'environmental-approvals-permitting', 'Environmental Approvals & Permitting', null, (select id from category_map where slug = 'environment-safety-regulatory'), 10),
    ('oil_gas', 'process-safety-risk-assessments', 'Process Safety & Risk Assessments', null, (select id from category_map where slug = 'environment-safety-regulatory'), 20),
    ('oil_gas', 'hse-management-systems-assurance', 'HSE Management Systems & Assurance', null, (select id from category_map where slug = 'environment-safety-regulatory'), 30),
    ('oil_gas', 'regulatory-compliance-reporting', 'Regulatory Compliance & Reporting', null, (select id from category_map where slug = 'environment-safety-regulatory'), 40),
    ('oil_gas', 'decommissioning-closure-support', 'Decommissioning & Closure Support', null, (select id from category_map where slug = 'environment-safety-regulatory'), 50),

    ('oil_gas', 'project-services-planning-controls', 'Project Services, Planning & Controls', null, (select id from category_map where slug = 'commercial-project-stakeholder-services'), 10),
    ('oil_gas', 'commercial-contracts-procurement', 'Commercial, Contracts & Procurement', null, (select id from category_map where slug = 'commercial-project-stakeholder-services'), 20),
    ('oil_gas', 'supply-chain-logistics-support', 'Supply Chain & Logistics Support', null, (select id from category_map where slug = 'commercial-project-stakeholder-services'), 30),
    ('oil_gas', 'stakeholder-engagement-land-access', 'Stakeholder Engagement & Land Access', null, (select id from category_map where slug = 'commercial-project-stakeholder-services'), 40),
    ('oil_gas', 'cost-estimating-project-commercial-analysis', 'Cost Estimating & Project Commercial Analysis', null, (select id from category_map where slug = 'commercial-project-stakeholder-services'), 50)
  on conflict (market, slug) do update
  set
    name = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    position = excluded.position
  returning id
)
select count(*) as seeded_service_count
from seeded_services;

select pg_notify('pgrst', 'reload schema');