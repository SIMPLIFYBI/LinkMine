begin;

create unique index if not exists idx_consultants_slug on public.consultants (slug);

with consultant_seed as (
  select *
  from (
    values
      (
        'atteris',
        'Atteris',
        'Atteris',
        'Subsea, pipelines and integrity engineering consultancy',
        'Independent engineering and management consultancy focused on subsea field development, subsea and onshore pipelines, integrity management, construction support and decommissioning.',
        'Perth, WA',
        'info@atteris.com',
        '+61 8 9322 7922',
        'https://atteris.com/',
        'https://www.businessnews.com.au/Company/Atteris',
        'Public email surfaced in workbook research; services and Perth office confirmed on company website.',
        'https://www.linkedin.com/company/atteris/',
        array['pipelines-landfall-crossing-design', 'asset-integrity-management']::text[]
      ),
      (
        'nobleseas-engineering',
        'Nobleseas Engineering',
        'Nobleseas Engineering',
        'Offshore, marine and subsea engineering specialists',
        'Perth-based independent engineering provider specialising in offshore structural engineering, hydrodynamics, naval architecture, marine systems design, retrofit and subsea consulting.',
        'Perth, WA',
        'info@nobleseas.com.au',
        '+61 8 6557 8722',
        'https://nobleseas.com.au/',
        'https://nobleseas.com.au/contact/',
        'Published generic email and Perth office details on official contact page.',
        null,
        array['marine-foundations-nearshore-civil', 'pipelines-landfall-crossing-design']::text[]
      ),
      (
        'enscope',
        'Enscope',
        'Enscope',
        'Energy infrastructure development, EPCM and commissioning',
        'Project development, project management, engineering, construction and commissioning partner supporting oil and gas, pipelines, storage, refinery and broader energy infrastructure delivery.',
        'West Leederville, WA',
        'info@enscope.com.au',
        '+61 8 6229 6500',
        'https://enscope.com.au/',
        'https://enscope.com.au/contact-us/',
        'Published generic email, phone and office details on official site.',
        'https://www.linkedin.com/company/enscope-pty-ltd/',
        array['commissioning-startup-readiness', 'project-services-planning-controls']::text[]
      ),
      (
        'edg-australia',
        'EDG Australia',
        'EDG Australia',
        'Engineering, design and LNG operations support',
        'Engineering, design and consulting team serving upstream, midstream and downstream energy projects with strong LNG operations support from Perth.',
        'Perth, WA',
        'edgau.admin@edg.net',
        '+61 8 6163 2600',
        'https://www.edg.net/australia/',
        'https://www.edg.net/australia/',
        'Published Australia admin email, phone and Perth office details on official page.',
        'https://www.linkedin.com/company/edg/',
        array['production-operations-support', 'brownfield-modifications-debottlenecking']::text[]
      ),
      (
        'risc-advisory',
        'RISC Advisory',
        'RISC Advisory',
        'Independent technical and commercial energy advisory',
        'Independent advisory firm providing technical and commercial advice across the energy project lifecycle for operators, investors, banks and private equity clients.',
        'West Perth, WA',
        'admin@riscadvisory.com',
        '+61 8 9420 6660',
        'https://riscadvisory.com/',
        'https://riscadvisory.com/contact-us/',
        'Published generic email, phone and West Perth office details on official site.',
        'https://www.linkedin.com/company/risc/',
        array['reserve-certification-audits', 'development-economics-screening']::text[]
      ),
      (
        'opes-international',
        'OPES International',
        'OPES International',
        'Petroleum engineering, reservoir and economic analysis advisory',
        'Perth petroleum engineering consultancy covering geoscience, reservoir, production and facility engineering, economic analysis, decarbonisation and carbon capture support.',
        'Perth, WA',
        'enquiries@opes.com.au',
        '+61 8 9221 3909',
        'https://www.opes.com.au/',
        'https://www.opes.com.au/index.html',
        'Published generic email and Perth office details on official site.',
        'https://www.linkedin.com/company/opes-international',
        array['static-dynamic-reservoir-studies', 'field-development-plans-fdp']::text[]
      ),
      (
        'cube-offshore',
        'Cube Offshore',
        'Cube Offshore',
        'Offshore and subsea project management and engineering',
        'Australian engineering and project management consultancy with deep offshore and subsea experience spanning design, fabrication, transport, installation, intervention and operations.',
        'Perth, WA',
        'cube.admin@cubeoffshore.com.au',
        '+61 8 9321 7004',
        'https://www.cubeoffshore.com.au/',
        'https://www.cubeoffshore.com.au/contact/',
        'Published admin email, phone and Perth office details on official site.',
        'https://www.linkedin.com/company/cube-offshore-pty-ltd',
        array['marine-foundations-nearshore-civil', 'asset-integrity-management']::text[]
      ),
      (
        'infinity-offshore',
        'Infinity Offshore',
        'Infinity Offshore',
        'Offshore engineering and project management solutions',
        'Independent offshore engineering and management consultancy delivering bespoke solutions for construction, subsea and upstream oil and gas projects.',
        'Subiaco, WA',
        'info@infinityoffshore.com.au',
        null,
        'https://infinityoffshore.com.au/',
        'https://infinityoffshore.com.au/contact/',
        'Published generic email and Subiaco office details on official site.',
        null,
        array['asset-integrity-management', 'project-services-planning-controls']::text[]
      ),
      (
        'tfa-project-group',
        'TFA Project Group',
        'TFA Project Group',
        'Energy project services across downstream fuels and transition assets',
        'Multi-disciplinary engineering and project solutions firm with strong downstream oil, hazardous storage, fuel infrastructure and energy transition project delivery experience.',
        'East Perth, WA',
        'enquiry@tfa.com.au',
        '+61 8 6165 8855',
        'https://www.tfa.com.au/',
        'https://www.tfa.com.au/',
        'Public email confirmed via directory listing; Perth office and phone confirmed on official site.',
        'https://www.linkedin.com/company/tfa-project-group/',
        array['project-services-planning-controls', 'cost-estimating-project-commercial-analysis']::text[]
      ),
      (
        'aurora-offshore-engineering',
        'Aurora Offshore Engineering',
        'Aurora Offshore Engineering',
        'Offshore engineering and project delivery support',
        'Subiaco-based offshore engineering consultancy supporting operators with practical engineering, project delivery and offshore asset solutions.',
        'Subiaco, WA',
        'aurora@aurora-oe.com',
        '+61 435 513 060',
        'https://aurora-oe.com/',
        'https://aurora-oe.com/get-in-touch/',
        'Published email, phone and office details on official site.',
        'https://www.linkedin.com/company/aurora-offshore-engineering-pty-ltd/',
        array['marine-foundations-nearshore-civil', 'project-services-planning-controls']::text[]
      ),
      (
        'tamboritha-consultants',
        'Tamboritha Consultants',
        'Tamboritha Consultants',
        'Integrated subsea services, rig support and asset maintenance',
        'Provider of integrated subsea services spanning project management, engineering, fabrication, subsea asset maintenance, rig support and marine survey supply.',
        'Henderson, WA',
        'office@tamboritha.com.au',
        '+61 8 6498 9060',
        'https://tamboritha.com.au/',
        'https://tamboritha.com.au/contact/',
        'Published office email, phone and Henderson office details on official site.',
        'https://www.linkedin.com/company/tamboritha',
        array['asset-integrity-management', 'shutdown-turnaround-planning']::text[]
      ),
      (
        'vysus-group-australia',
        'Vysus Group Australia',
        'Vysus Group Australia',
        'Asset performance, risk and project management expertise',
        'Specialist consultancy helping energy and industrial clients manage risk and maximise performance across major assets with project and asset performance expertise.',
        'Australia',
        'sales.consulting@vysusgroup.com',
        null,
        'https://www.vysusgroup.com/',
        'https://www.vysusgroup.com/contact',
        'Published consulting sales email; Australian regional presence indicated but office email and phone were not exposed in quick public sources.',
        'https://www.linkedin.com/company/vysus-group/',
        array['process-safety-risk-assessments', 'asset-integrity-management']::text[]
      ),
      (
        'gexcon-australia',
        'Gexcon Australia',
        'Gexcon Australia Pty. Ltd.',
        'Process safety, risk and fire and explosion consulting',
        'Specialist safety consultancy helping energy and industrial operators identify, assess and mitigate process risk through advanced studies, testing and training.',
        'Perth, WA',
        'australia@gexcon.com',
        '+61 419 982 160',
        'https://www.gexcon.com/locations/australia/',
        'https://www.gexcon.com/locations/australia/',
        'Published Australia contact email, consulting enquiries phone and Perth office details on official site.',
        'https://www.linkedin.com/company/gexcon-as/',
        array['process-safety-risk-assessments', 'hse-management-systems-assurance']::text[]
      )
  ) as t(
    slug,
    display_name,
    company,
    headline,
    bio,
    location,
    contact_email,
    phone,
    website_url,
    source_url,
    confidence_note,
    linkedin_url,
    service_slugs
  )
), upserted_consultants as (
  insert into public.consultants (
    slug,
    display_name,
    company,
    headline,
    bio,
    location,
    contact_email,
    phone,
    visibility,
    status,
    provider_kind,
    linkedin_url,
    metadata
  )
  select
    slug,
    display_name,
    company,
    headline,
    bio,
    location,
    contact_email,
    phone,
    'public',
    'approved',
    'both',
    linkedin_url,
    jsonb_build_object(
      'website_url', website_url,
      'source_url', source_url,
      'seed_market', 'oil_gas',
      'seed_source', 'oil_gas_contacts_yasmine.xlsx',
      'confidence_note', confidence_note
    )
  from consultant_seed
  on conflict (slug) do update
  set
    display_name = excluded.display_name,
    company = excluded.company,
    headline = excluded.headline,
    bio = excluded.bio,
    location = excluded.location,
    contact_email = excluded.contact_email,
    phone = excluded.phone,
    visibility = excluded.visibility,
    status = excluded.status,
    provider_kind = excluded.provider_kind,
    linkedin_url = excluded.linkedin_url,
    metadata = coalesce(public.consultants.metadata, '{}'::jsonb) || excluded.metadata
  returning id, slug
), seeded_consultants as (
  select u.id, s.slug, s.service_slugs
  from upserted_consultants u
  join consultant_seed s using (slug)
), cleared_oil_gas_links as (
  delete from public.consultant_services cs
  using seeded_consultants sc
  join public.services svc
    on svc.market = 'oil_gas'::public.service_market
  where cs.consultant_id = sc.id
    and cs.service_id = svc.id
  returning cs.id
)
insert into public.consultant_services (
  consultant_id,
  service_id
)
select distinct
  sc.id,
  svc.id
from seeded_consultants sc
cross join lateral unnest(sc.service_slugs) as seeded_slug(service_slug)
join public.services svc
  on svc.market = 'oil_gas'::public.service_market
 and svc.slug = seeded_slug.service_slug
on conflict (consultant_id, service_id) do nothing;

select pg_notify('pgrst', 'reload schema');

commit;