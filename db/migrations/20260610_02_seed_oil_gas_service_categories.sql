insert into public.service_categories (
  market,
  slug,
  name,
  description,
  position
)
values
  ('oil_gas', 'subsurface-reservoir', 'Subsurface & Reservoir', null, 10),
  ('oil_gas', 'field-development-planning', 'Field Development Planning', null, 20),
  ('oil_gas', 'geotechnical-marine-civil', 'Geotechnical, Marine & Civil', null, 30),
  ('oil_gas', 'drilling-wells-field-execution', 'Drilling, Wells & Field Execution', null, 40),
  ('oil_gas', 'production-facilities', 'Production & Facilities', null, 50),
  ('oil_gas', 'asset-integrity-maintenance-reliability', 'Asset Integrity, Maintenance & Reliability', null, 60),
  ('oil_gas', 'digital-automation-operational-technology', 'Digital, Automation & Operational Technology', null, 70),
  ('oil_gas', 'environment-safety-regulatory', 'Environment, Safety & Regulatory', null, 80),
  ('oil_gas', 'commercial-project-stakeholder-services', 'Commercial, Project & Stakeholder Services', null, 90)
on conflict (market, slug) do update
set
  name = excluded.name,
  description = excluded.description,
  position = excluded.position;

select pg_notify('pgrst', 'reload schema');
