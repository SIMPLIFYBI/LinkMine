begin;

with canada_consultants as (
  select
    c.id,
    c.slug,
    lower(
      concat_ws(
        ' ',
        coalesce(c.display_name, ''),
        coalesce(c.company, ''),
        coalesce(c.headline, ''),
        coalesce(c.bio, ''),
        coalesce(c.metadata->>'province', '')
      )
    ) as profile_text,
    lower(coalesce(c.metadata->>'services_markets', 'mining')) as services_market
  from public.consultants c
  where c.metadata->>'seed_source' = 'canada_small_business_consultants.csv'
),
service_lookup as (
  select s.id, s.slug, s.market
  from public.services s
),
rule_map as (
  select *
  from (
    values
      -- Mining-focused matches
      ('geolog|geoscien|explor|resource|ni 43-101|jorc', 'mining', 'exploration-geology-exploration-program-design-management'),
      ('mapping|gis', 'mining', 'exploration-geology-geological-mapping-gis'),
      ('mine planning|mine engineering|open pit|underground|nordmin|vbkom|jds|moose mountain|mmts', 'mining', 'mine-planning-life-of-mine-planning'),
      ('drill|blast', 'mining', 'mine-planning-drill-blast-engineering'),
      ('metallurg|processing|hydromet|flotation|comminution|canenco|blue coast', 'mining', 'processing-metallurgy-process-flowsheet-design-optimisation'),
      ('environment|closure|rehabilit|permitting|esg|sustainab|harmer|odyssey|seabridge|woodland', 'mining', 'environment-safety-environmental-impact-assessment-approvals'),
      ('water|hydrogeolog|dewater|hydrology', 'mining', 'environment-safety-water-management-hydrogeology'),
      ('indigenous|community|heritage|native title|trailmark|western heritage', 'mining', 'indigenous-community-engagement-strategy'),
      ('contract|earthwork|civil|construction|load haul', 'mining', 'contract-mining-civil-works-load-haul-contract-mining'),
      ('finance|cost|economic|valuation|due diligence|project management', 'mining', 'finance-project-project-controls-cost-schedule-risk'),

      -- Oil & gas-focused matches
      ('reservoir|petrophys|subsurface|reserves|decline|insite|exceed|petrel|petrokana', 'oil_gas', 'reservoir-characterisation-modelling'),
      ('field development|fdp|concept select|feasibility', 'oil_gas', 'field-development-plans-fdp'),
      ('wellsite|well planning|drilling|completion|workover|geosteer|chinook|benchmark|belloy', 'oil_gas', 'well-planning-engineering'),
      ('production|facility|process|commissioning|brownfield|magus', 'oil_gas', 'production-operations-support'),
      ('integrity|corrosion|inspection|reliability|turnaround', 'oil_gas', 'asset-integrity-management'),
      ('hse|safety|regulatory|compliance|decommission', 'oil_gas', 'process-safety-risk-assessments'),
      ('commercial|procurement|contracts|stakeholder|logistics|project services', 'oil_gas', 'project-services-planning-controls'),
      ('digital|automation|scada|cyber', 'oil_gas', 'digital-oilfield-data-platforms')
  ) as t(consultant_pattern, service_market, service_slug)
),
default_map as (
  select *
  from (
    values
      ('mining', 'exploration-geology-exploration-program-design-management'),
      ('mining', 'mine-planning-life-of-mine-planning'),
      ('oil_gas', 'reservoir-characterisation-modelling'),
      ('oil_gas', 'well-planning-engineering')
  ) as t(service_market, service_slug)
),
rule_matches as (
  select distinct
    c.id as consultant_id,
    s.id as service_id
  from canada_consultants c
  join rule_map r
    on c.profile_text ~* r.consultant_pattern
  join service_lookup s
    on s.market = r.service_market::public.service_market
   and s.slug = r.service_slug
),
default_matches as (
  select distinct
    c.id as consultant_id,
    s.id as service_id
  from canada_consultants c
  join default_map d
    on (
      (c.services_market = 'both' and d.service_market in ('mining', 'oil_gas'))
      or (c.services_market = 'mining' and d.service_market = 'mining')
      or (c.services_market in ('oil_gas', 'oil-gas') and d.service_market = 'oil_gas')
    )
  join service_lookup s
    on s.market = d.service_market::public.service_market
   and s.slug = d.service_slug
),
all_matches as (
  select consultant_id, service_id from rule_matches
  union
  select consultant_id, service_id from default_matches
)
insert into public.consultant_services (consultant_id, service_id)
select consultant_id, service_id
from all_matches
on conflict (consultant_id, service_id) do nothing;

commit;

select pg_notify('pgrst', 'reload schema');
