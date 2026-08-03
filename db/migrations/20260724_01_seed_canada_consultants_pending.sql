begin;

create unique index if not exists idx_consultants_slug on public.consultants (slug);

with consultant_seed as (
  select *
  from (
    values
      ('4m-mining-consulting', '4M Mining Consulting', '4M Mining Consulting Inc.', 'Mining engineering and project-management consultants', 'Sudbury-based consultancy providing mine design, engineering, project management and operational support to mineral producers and developers.', 'Greater Sudbury, Ontario', 'info@4mminingconsulting.ca', 'https://www.4mminingconsulting.ca', 'mining', 'Ontario', 'CA', 'https://www.4mminingconsulting.ca/about-us/', 'high'),
      ('apex-geoscience', 'APEX Geoscience', 'APEX Geoscience Ltd.', 'Mineral exploration and geological consulting', 'Independent geological consultancy supporting mineral exploration, property evaluation, resource modelling, technical reporting and project management.', 'Edmonton, Alberta', 'info@apexgeoscience.com', 'https://apexgeoscience.com', 'mining', 'Alberta', 'CA', 'https://apexgeoscience.com/', 'medium'),
      ('archer-cathro', 'Archer Cathro', 'Archer, Cathro & Associates (1981) Limited', 'Northern Canada mineral-exploration consultants', 'Geological consulting firm specializing in mineral exploration, field-program management and project generation across Yukon and northern Canada.', 'Whitehorse, Yukon', null, 'https://www.archercathro.com', 'mining', 'Yukon', 'CA', 'https://www.archercathro.com/', 'low'),
      ('aurora-geosciences', 'Aurora Geosciences', 'Aurora Geosciences Ltd.', 'Northern geoscience and exploration specialists', 'Employee-owned geoscience consultancy providing geological, geophysical, logistical and exploration-program services in northern and western Canada.', 'Yellowknife, Northwest Territories', 'info@aurorageosciences.com', 'https://www.aurorageosciences.com', 'mining', 'Northwest Territories', 'CA', 'https://www.aurorageosciences.com/', 'medium'),
      ('belloy-petroleum-consulting', 'Belloy Petroleum Consulting', 'Belloy Petroleum Consulting Ltd.', 'Wellsite geology and petroleum consulting', 'Calgary consultancy delivering wellsite geology, real-time drilling guidance, geological interpretation and petroleum project support.', 'Calgary, Alberta', 'contact@belloy.ca', 'https://belloygeologists.ca', 'oil_gas', 'Alberta', 'CA', 'https://belloygeologists.ca/about/', 'high'),
      ('benchmark-engineering', 'Benchmark Engineering', 'Benchmark Engineering Inc.', 'Oilfield drilling and completions engineering', 'Independent consultancy providing engineering, project management and field supervision for drilling and completion programs in Alberta and Saskatchewan.', 'Calgary, Alberta', null, 'https://benchmarkeng.ca', 'oil_gas', 'Alberta', 'CA', 'https://benchmarkeng.ca/', 'medium'),
      ('blue-coast-research', 'Blue Coast Research', 'Blue Coast Research Ltd.', 'Mineral-processing research and metallurgical consulting', 'Specialist laboratory and consultancy conducting mineral processing, hydrometallurgical testing, flowsheet development and metallurgical research.', 'Parksville, British Columbia', 'info@bluecoastresearch.com', 'https://bluecoastresearch.com', 'mining', 'British Columbia', 'CA', 'https://bluecoastresearch.com/', 'medium'),
      ('canenco-consulting', 'Canenco Consulting', 'Canenco Consulting Corp.', 'Mineral-processing and project-development consultants', 'Engineering consultancy supporting mineral processing, metallurgical test programs, flowsheet design, feasibility work and project execution.', 'Vancouver, British Columbia', null, 'https://canenco.com', 'mining', 'British Columbia', 'CA', 'https://canenco.com/', 'low'),
      ('caracle-creek', 'Caracle Creek', 'Caracle Creek International Consulting Inc.', 'Geological and mineral-exploration consulting', 'Canadian geoscience consultancy providing exploration management, geological modelling, resource estimation and technical-reporting services.', 'Sudbury, Ontario', 'info@caraclecreek.com', 'https://caraclecreek.com', 'mining', 'Ontario', 'CA', 'https://caraclecreek.com/', 'medium'),
      ('chinook-consulting-services', 'Chinook Consulting Services', 'Chinook Consulting Services Ltd.', 'Wellsite geology and drilling consultants', 'Calgary-based firm supplying wellsite geologists, geosteering specialists, operations geologists and drilling-related technical support.', 'Calgary, Alberta', 'info@chinookpetroleum.com', 'https://chinookpetroleum.com', 'oil_gas', 'Alberta', 'CA', 'https://chinookpetroleum.com/', 'medium'),
      ('coast-mountain-geological', 'Coast Mountain Geological', 'Coast Mountain Geological Ltd.', 'Mineral-exploration program management', 'British Columbia consultancy providing geological field services, exploration management, permitting support, logistics and technical reporting.', 'Vancouver, British Columbia', null, 'https://coastmountaingeological.com', 'mining', 'British Columbia', 'CA', 'https://coastmountaingeological.com/', 'low'),
      ('condor-consulting-canada', 'Condor Consulting Canada', 'Condor North Consulting ULC', 'Exploration geophysics and data interpretation', 'Specialist geophysical consultancy offering airborne and ground-geophysical interpretation, modelling, targeting and exploration-data reviews.', 'Vancouver, British Columbia', null, 'https://www.condorconsult.com', 'mining', 'British Columbia', 'CA', 'https://www.condorconsult.com/', 'low'),
      ('dahrouge-geological-consulting', 'Dahrouge Geological Consulting', 'Dahrouge Geological Consulting Ltd.', 'Mineral-exploration and geological project consultants', 'Geological consultancy managing exploration programs, property evaluations, technical reporting and mineral-project development across Canada.', 'Edmonton, Alberta', 'info@dahrouge.com', 'https://www.dahrouge.com', 'mining', 'Alberta', 'CA', 'https://www.dahrouge.com/', 'medium'),
      ('dark-horse-energy-consultants', 'Dark Horse Energy Consultants', 'Dark Horse Energy Consultants Ltd.', 'Upstream oil-and-gas engineering consultants', 'Privately owned Calgary firm providing operational project management and engineering consulting to upstream oil-and-gas operators.', 'Calgary, Alberta', null, 'https://dhenergy.ca', 'oil_gas', 'Alberta', 'CA', 'https://dhenergy.ca/about-us/', 'medium'),
      ('discovery-consultants', 'Discovery Consultants', 'Discovery Consultants', 'Mineral-exploration and geological consultants', 'Vernon-based geological consulting practice providing exploration planning, field management, geological evaluation and mineral-property support.', 'Vernon, British Columbia', 'info@discoveryconsultants.com', 'https://discoveryconsultants.com', 'mining', 'British Columbia', 'CA', 'https://discoveryconsultants.com/', 'high'),
      ('earth-signal-processing', 'Earth Signal Processing', 'Earth Signal Processing Ltd.', 'Seismic-data processing consultants', 'Calgary geophysical company providing seismic processing, imaging, interpretation support and technical services for energy exploration.', 'Calgary, Alberta', 'info@earthsignal.com', 'https://earthsignal.com', 'oil_gas', 'Alberta', 'CA', 'https://earthsignal.com/', 'medium'),
      ('equity-exploration', 'Equity Exploration', 'Equity Exploration Consultants Ltd.', 'Mineral-exploration project management', 'Vancouver geological consultancy delivering exploration management, field services, data compilation, targeting and technical-report support.', 'Vancouver, British Columbia', 'info@equityexploration.com', 'https://equityexploration.com', 'mining', 'British Columbia', 'CA', 'https://equityexploration.com/', 'medium'),
      ('exceed-energy', 'Exceed Energy', 'Exceed Energy Inc.', 'Reservoir and production engineering consultants', 'Independent Calgary consultancy providing reservoir engineering, production optimization, reserves support and asset-evaluation services.', 'Calgary, Alberta', null, 'https://exceedenergy.com', 'oil_gas', 'Alberta', 'CA', 'https://exceedenergy.com/', 'low'),
      ('fathom-geophysics', 'Fathom Geophysics', 'Fathom Geophysics Canada Ltd.', 'Exploration targeting and geophysical interpretation', 'Technical consultancy applying geophysical interpretation, structural analysis and integrated targeting workflows to mineral exploration projects.', 'Vancouver, British Columbia', null, 'https://www.fathomgeophysics.com', 'mining', 'British Columbia', 'CA', 'https://www.fathomgeophysics.com/', 'low'),
      ('fladgate-exploration-consulting', 'Fladgate Exploration Consulting', 'Fladgate Exploration Consulting Corporation', 'Mineral exploration and field-program specialists', 'Thunder Bay consultancy providing exploration program management, geological field services, core logging and technical support.', 'Thunder Bay, Ontario', 'info@fladgateexploration.com', 'https://fladgateexploration.com', 'mining', 'Ontario', 'CA', 'https://fladgateexploration.com/', 'medium'),
      ('geominex-consultants', 'Geominex Consultants', 'Geominex Consultants Inc.', 'Geological consulting and mineral-property evaluation', 'Independent geological practice offering mineral-property assessment, exploration planning, due diligence and technical-report preparation.', 'Vancouver, British Columbia', null, 'https://geominex.com', 'mining', 'British Columbia', 'CA', 'https://geominex.com/', 'low'),
      ('geovector-management', 'GeoVector Management', 'GeoVector Management Inc.', 'Exploration management and geological consulting', 'Ottawa-area firm providing geological consulting, mineral-exploration management, resource support and qualified-person services.', 'Ottawa, Ontario', null, 'https://geovector.ca', 'mining', 'Ontario', 'CA', 'https://geovector.ca/', 'low'),
      ('global-mineral-resource-services', 'Global Mineral Resource Services', 'Global Mineral Resource Services Inc.', 'Mineral-resource estimation and technical reporting', 'Independent consultancy specializing in geological modelling, mineral-resource estimation, due diligence and NI 43-101 technical reporting.', 'North Vancouver, British Columbia', null, 'https://gmrs.ca', 'mining', 'British Columbia', 'CA', 'https://gmrs.ca/', 'low'),
      ('groundtruth-exploration', 'GroundTruth Exploration', 'GroundTruth Exploration Inc.', 'Remote mineral-exploration and field services', 'Yukon-based exploration company providing low-impact field programs, geochemical surveys, drilling support, logistics and data collection.', 'Dawson City, Yukon', 'info@groundtruthexploration.com', 'https://groundtruthexploration.com', 'mining', 'Yukon', 'CA', 'https://groundtruthexploration.com/', 'medium'),
      ('hardline-exploration', 'Hardline Exploration', 'Hardline Exploration Corp.', 'Mineral-exploration field services', 'Exploration contractor and consultancy providing geological field crews, project management, logistics, sampling and drill-program support.', 'Smithers, British Columbia', null, 'https://hardlineexploration.com', 'mining', 'British Columbia', 'CA', 'https://hardlineexploration.com/', 'low'),
      ('harmer-environmental', 'Harmer Environmental', 'Harmer Environmental Ltd.', 'Environmental consulting for resource projects', 'Independent environmental consultancy supporting assessment, permitting, monitoring and regulatory compliance for western Canadian resource projects.', 'Calgary, Alberta', null, 'https://harmerenvironmental.com', 'both', 'Alberta', 'CA', 'https://harmerenvironmental.com/', 'low'),
      ('insite-petroleum-consultants', 'InSite Petroleum Consultants', 'InSite Petroleum Consultants Ltd.', 'Reservoir engineering and petroleum advisory', 'Calgary petroleum consultancy delivering reserves evaluations, reservoir studies, asset assessments, economic modelling and expert technical advice.', 'Calgary, Alberta', 'info@insitepc.com', 'https://insitepc.com', 'oil_gas', 'Alberta', 'CA', 'https://insitepc.com/', 'medium'),
      ('integrated-sustainability', 'Integrated Sustainability', 'Integrated Sustainability Consultants Ltd.', 'Water, waste and sustainability engineering', 'Canadian consultancy designing practical water-treatment, waste-management and sustainability solutions for mining and energy developments.', 'Calgary, Alberta', 'info@integratedsustainability.com', 'https://www.integratedsustainability.com', 'both', 'Alberta', 'CA', 'https://www.integratedsustainability.com/industry/mining-engineering/', 'medium'),
      ('iron-mask-exploration-services', 'Iron Mask Exploration Services', 'Iron Mask Exploration Services Inc.', 'Mineral-exploration field and technical services', 'Kamloops-area consultancy supporting geological mapping, prospecting, sampling, project supervision and exploration logistics.', 'Kamloops, British Columbia', null, 'https://ironmask.ca', 'mining', 'British Columbia', 'CA', 'https://ironmask.ca/', 'low'),
      ('jds-energy-mining', 'JDS Energy & Mining', 'JDS Energy & Mining Inc.', 'Mining project development and construction consultants', 'Canadian project-development firm providing engineering, construction management, feasibility studies, mine planning and operational readiness services.', 'Vancouver, British Columbia', 'info@jdsmining.ca', 'https://jdsmining.ca', 'mining', 'British Columbia', 'CA', 'https://jdsmining.ca/', 'medium'),
      ('kcb-consultants', 'KCB Consultants', 'KCB Consultants Ltd.', 'Geotechnical, water and mine-waste consultants', 'Employee-owned engineering consultancy specializing in tailings, mine waste, water management, hydrology and geotechnical engineering.', 'Vancouver, British Columbia', 'info@klohn.com', 'https://www.klohn.com', 'mining', 'British Columbia', 'CA', 'https://www.klohn.com/', 'medium'),
      ('lakehead-geological-services', 'Lakehead Geological Services', 'Lakehead Geological Services Inc.', 'Geological field services for mineral exploration', 'Thunder Bay-area consultancy supplying geological personnel, core logging, exploration supervision and project-support services.', 'Thunder Bay, Ontario', null, 'https://lakeheadgeological.com', 'mining', 'Ontario', 'CA', 'https://lakeheadgeological.com/', 'low'),
      ('magus-engineering', 'Magus Engineering', 'Magus Engineering Limited', 'Oil-and-gas engineering and project services', 'Calgary engineering consultancy providing facility, pipeline, process, mechanical and project-management services to energy-sector clients.', 'Calgary, Alberta', 'magusengineeringlimited@gmail.com', 'https://www.maguseng.com', 'oil_gas', 'Alberta', 'CA', 'https://www.maguseng.com/', 'high'),
      ('maple-geoscience', 'Maple Geoscience', 'Maple Geoscience Inc.', 'Mineral exploration and geoscience consulting', 'Independent Canadian consultancy providing geological interpretation, exploration planning, field-program management and technical documentation.', 'Toronto, Ontario', null, 'https://maplegeoscience.com', 'mining', 'Ontario', 'CA', 'https://maplegeoscience.com/', 'low'),
      ('mercator-geological-services', 'Mercator Geological Services', 'Mercator Geological Services Limited', 'Mineral-resource geology and technical reporting', 'Nova Scotia consultancy offering geological modelling, resource estimation, exploration support, due diligence and NI 43-101 reporting.', 'Dartmouth, Nova Scotia', 'info@mercatorgeo.com', 'https://mercatorgeo.com', 'mining', 'Nova Scotia', 'CA', 'https://mercatorgeo.com/', 'medium'),
      ('micon-international', 'Micon International', 'Micon International Limited', 'Independent mining and mineral-industry consultants', 'Toronto-based consultancy providing geology, resource estimation, metallurgy, mine engineering, valuation, due diligence and technical reports.', 'Toronto, Ontario', 'micon@micon-international.com', 'https://www.micon-international.com', 'mining', 'Ontario', 'CA', 'https://www.micon-international.com/', 'medium'),
      ('moose-mountain-technical-services', 'Moose Mountain Technical Services', 'Moose Mountain Technical Services', 'Mine engineering and project-evaluation consultants', 'Independent Alberta consultancy supporting mine planning, reserve estimation, economic evaluation, technical studies and operational improvement.', 'Calgary, Alberta', 'info@mmts.ca', 'https://www.mmts.ca', 'mining', 'Alberta', 'CA', 'https://www.mmts.ca/', 'medium'),
      ('nordmin-engineering', 'Nordmin Engineering', 'Nordmin Engineering Ltd.', 'Mining engineering and project execution', 'Thunder Bay engineering consultancy providing mine design, process engineering, infrastructure, project management and construction support.', 'Thunder Bay, Ontario', 'info@nordmin.com', 'https://nordmin.com', 'mining', 'Ontario', 'CA', 'https://nordmin.com/', 'medium'),
      ('north-rim-exploration', 'North Rim Exploration', 'North Rim Exploration Ltd.', 'Mineral-exploration and geological field consultants', 'Saskatoon consultancy managing exploration programs, geological mapping, core logging, targeting and field operations across Canada.', 'Saskatoon, Saskatchewan', 'info@northrim.ca', 'https://northrim.ca', 'mining', 'Saskatchewan', 'CA', 'https://northrim.ca/', 'medium'),
      ('northwest-geophysics', 'Northwest Geophysics', 'Northwest Geophysics Ltd.', 'Mineral-exploration geophysical surveys', 'Independent Canadian contractor and consultancy providing ground geophysical surveys, data processing, interpretation and exploration support.', 'Thunder Bay, Ontario', null, 'https://northwestgeophysics.com', 'mining', 'Ontario', 'CA', 'https://northwestgeophysics.com/', 'low'),
      ('odyssey-environmental', 'Odyssey Environmental', 'Odyssey Environmental Ltd.', 'Environmental and regulatory consulting', 'Calgary environmental consultancy supporting impact assessment, remediation, reclamation, permitting and regulatory compliance for energy projects.', 'Calgary, Alberta', null, 'https://odysseyenvironmental.ca', 'oil_gas', 'Alberta', 'CA', 'https://odysseyenvironmental.ca/', 'low'),
      ('orix-geoscience', 'Orix Geoscience', 'Orix Geoscience Corporation', 'Geological data and mineral-exploration consulting', 'Canadian geoscience consultancy providing geological compilation, data digitization, modelling, targeting, field programs and technical services.', 'Toronto, Ontario', 'info@orixgeo.com', 'https://orixgeo.com', 'mining', 'Ontario', 'CA', 'https://orixgeo.com/', 'medium'),
      ('petrokana', 'Petrokana', 'Petrokana Energy & Resources Development Ltd.', 'Upstream petroleum development consultants', 'Privately held Calgary firm offering field-development planning, reservoir management, regulatory, asset-evaluation and operational-performance services.', 'Calgary, Alberta', 'info@petrokana.com', 'https://petrokana.com', 'oil_gas', 'Alberta', 'CA', 'https://petrokana.com/about.php', 'high'),
      ('petrel-robertson-consulting', 'Petrel Robertson Consulting', 'Petrel Robertson Consulting Ltd.', 'Petroleum geoscience and basin-analysis consultants', 'Calgary consultancy providing petroleum geology, geophysics, basin analysis, resource assessment and exploration-strategy services.', 'Calgary, Alberta', 'info@petrelrob.com', 'https://www.petrelrob.com', 'oil_gas', 'Alberta', 'CA', 'https://www.petrelrob.com/', 'medium'),
      ('piteau-associates-canada', 'Piteau Associates Canada', 'Piteau Associates Engineering Ltd.', 'Geotechnical and hydrogeological mining consultants', 'Canadian consultancy specializing in mine hydrogeology, rock mechanics, slope design, dewatering and geotechnical risk management.', 'North Vancouver, British Columbia', null, 'https://www.piteau.com', 'mining', 'British Columbia', 'CA', 'https://www.piteau.com/', 'low'),
      ('precision-geosurveys', 'Precision GeoSurveys', 'Precision GeoSurveys Inc.', 'Airborne geophysical survey consultants', 'British Columbia company providing airborne magnetic, radiometric and electromagnetic surveys plus processing and interpretation for exploration projects.', 'Langley, British Columbia', 'info@precisiongeosurveys.com', 'https://precisiongeosurveys.com', 'mining', 'British Columbia', 'CA', 'https://precisiongeosurveys.com/', 'medium'),
      ('ronacher-mckenzie-geoscience', 'Ronacher McKenzie Geoscience', 'Ronacher McKenzie Geoscience Inc.', 'Structural geology and mineral-exploration consultants', 'Independent consultancy providing structural interpretation, geological modelling, targeting, mapping and technical reviews for mineral projects.', 'Sudbury, Ontario', null, 'https://rmgeoscience.com', 'mining', 'Ontario', 'CA', 'https://rmgeoscience.com/', 'low'),
      ('rpa-canada', 'RPA Canada', 'Roscoe Postle Associates Inc.', 'Mining geology and technical advisory', 'Canadian-origin mining consultancy offering resource estimation, mine engineering, technical studies, valuations and due diligence for mineral projects.', 'Toronto, Ontario', null, 'https://www.rpacan.com', 'mining', 'Ontario', 'CA', 'https://www.rpacan.com/', 'low'),
      ('seabridge-environmental', 'Seabridge Environmental', 'Seabridge Environmental Inc.', 'Environmental assessment and permitting consultants', 'British Columbia consultancy providing environmental assessment, permitting, aquatic studies and regulatory support for resource developments.', 'Vancouver, British Columbia', null, 'https://seabridgeenvironmental.ca', 'both', 'British Columbia', 'CA', 'https://seabridgeenvironmental.ca/', 'low'),
      ('simcoe-geoscience', 'Simcoe Geoscience', 'Simcoe Geoscience Limited', 'Geophysical exploration and earth-modelling consultants', 'Ontario geoscience firm providing geophysical surveys, inversion, geological interpretation and exploration targeting for mineral projects.', 'Stouffville, Ontario', 'info@simcoegeoscience.com', 'https://simcoegeoscience.com', 'mining', 'Ontario', 'CA', 'https://simcoegeoscience.com/', 'medium'),
      ('sgs-geological-services-canada', 'SGS Geological Services Canada', 'SGS Geological Services', 'Exploration geology and mineral-resource support', 'Canadian specialist team providing geological field services, resource modelling, technical reviews and exploration-program support.', 'Toronto, Ontario', null, 'https://www.sgs.com/en-ca', 'mining', 'Ontario', 'CA', 'https://www.sgs.com/en-ca/industry/mining', 'low'),
      ('taiga-consultants', 'Taiga Consultants', 'Taiga Consultants Ltd.', 'Mineral exploration and geological consulting', 'Calgary-based geological consultancy offering project generation, exploration management, field programs, evaluations and technical reporting.', 'Calgary, Alberta', 'info@taigaconsultants.com', 'https://taigaconsultants.com', 'mining', 'Alberta', 'CA', 'https://taigaconsultants.com/', 'medium'),
      ('terrane-geoscience', 'Terrane Geoscience', 'Terrane Geoscience Inc.', 'Structural geology and geotechnical consulting', 'Halifax consultancy providing structural geology, rock mechanics, geotechnical characterization and three-dimensional geological modelling.', 'Halifax, Nova Scotia', 'info@terranegeoscience.com', 'https://terranegeoscience.com', 'mining', 'Nova Scotia', 'CA', 'https://terranegeoscience.com/', 'medium'),
      ('terralog-technologies', 'Terralog Technologies', 'Terralog Technologies Inc.', 'Subsurface engineering and waste-injection consultants', 'Calgary technology consultancy providing geomechanics, reservoir engineering and deep-well injection solutions for energy and resource operations.', 'Calgary, Alberta', 'info@terralog.com', 'https://terralog.com', 'oil_gas', 'Alberta', 'CA', 'https://terralog.com/', 'medium'),
      ('trailmark-systems', 'Trailmark Systems', 'Trailmark Systems Inc.', 'Environmental data and Indigenous-engagement consulting', 'British Columbia consultancy delivering environmental information management, mapping and community-based monitoring for resource-development projects.', 'Victoria, British Columbia', 'info@trailmarksys.com', 'https://trailmarksys.com', 'both', 'British Columbia', 'CA', 'https://trailmarksys.com/', 'medium'),
      ('veracity-energy-services', 'Veracity Energy Services', 'Veracity Energy Services Ltd.', 'Oil-and-gas operations and liability consultants', 'Calgary consultancy providing production operations, asset management, regulatory support and liability-management services.', 'Calgary, Alberta', 'info@veracityenergy.com', 'https://www.veracityenergy.com', 'oil_gas', 'Alberta', 'CA', 'https://www.veracityenergy.com/', 'high'),
      ('vbkom-mining-consultants-canada', 'VBKOM Mining Consultants Canada', 'VBKOM Mining Consultants Canada Ltd.', 'Mining engineering and technical-advisory consultants', 'Sudbury-based consultancy providing mine planning, mineral-resource support, project studies, risk analysis and technical reporting.', 'Greater Sudbury, Ontario', 'jani@vbkom.ca', 'https://vbkom.ca', 'mining', 'Ontario', 'CA', 'https://vbkom.ca/about-us/', 'high'),
      ('watts-griffis-and-mcoaut', 'Watts, Griffis and McOuat', 'Watts, Griffis and McOuat Limited', 'Independent geological and mining consultants', 'Canadian consultancy providing exploration, resource estimation, mine engineering, valuation, due diligence and technical-reporting services.', 'Toronto, Ontario', 'wgm@wgm.ca', 'https://www.wgm.ca', 'mining', 'Ontario', 'CA', 'https://www.wgm.ca/', 'medium'),
      ('western-heritage', 'Western Heritage', 'Western Heritage Services Inc.', 'Heritage and archaeological consultants for resource projects', 'Saskatchewan consultancy conducting archaeological assessments, heritage-resource studies and regulatory support for mining and energy developments.', 'Saskatoon, Saskatchewan', 'info@westernheritage.ca', 'https://westernheritage.ca', 'both', 'Saskatchewan', 'CA', 'https://westernheritage.ca/', 'medium'),
      ('white-gold-geophysical', 'White Gold Geophysical', 'White Gold Geophysical Inc.', 'Mineral-exploration geophysical consulting', 'Yukon geophysical consultancy providing survey design, field acquisition, processing and interpretation for northern mineral-exploration projects.', 'Whitehorse, Yukon', null, 'https://whitegoldgeophysical.com', 'mining', 'Yukon', 'CA', 'https://whitegoldgeophysical.com/', 'low'),
      ('woodland-heritage-services', 'Woodland Heritage Services', 'Woodland Heritage Services Ltd.', 'Environmental and heritage consulting for resource developments', 'Alberta consultancy supporting archaeological, environmental and regulatory requirements associated with oil-and-gas and mining projects.', 'Edmonton, Alberta', null, 'https://woodlandheritage.com', 'both', 'Alberta', 'CA', 'https://woodlandheritage.com/', 'low')
  ) as t(
    slug,
    display_name,
    company,
    headline,
    bio,
    location,
    contact_email,
    website_url,
    services_markets,
    province,
    country_code,
    source_url,
    confidence
  )
)
insert into public.consultants (
  slug,
  display_name,
  company,
  headline,
  bio,
  location,
  contact_email,
  website_url,
  visibility,
  status,
  provider_kind,
  country_code,
  global_region,
  metadata
)
select
  s.slug,
  s.display_name,
  s.company,
  s.headline,
  s.bio,
  s.location,
  s.contact_email,
  s.website_url,
  'public',
  'pending',
  'both'::public.consultant_kind,
  coalesce(nullif(s.country_code, ''), 'CA'),
  'north_america',
  jsonb_build_object(
    'seed_source', 'canada_small_business_consultants.csv',
    'source_url', s.source_url,
    'confidence', s.confidence,
    'province', s.province,
    'services_markets', s.services_markets
  )
from consultant_seed s
on conflict (slug) do update
set
  display_name = excluded.display_name,
  company = excluded.company,
  headline = excluded.headline,
  bio = excluded.bio,
  location = excluded.location,
  contact_email = excluded.contact_email,
  website_url = excluded.website_url,
  visibility = excluded.visibility,
  status = excluded.status,
  provider_kind = excluded.provider_kind,
  country_code = excluded.country_code,
  global_region = excluded.global_region,
  metadata = coalesce(public.consultants.metadata, '{}'::jsonb) || excluded.metadata;

commit;

select pg_notify('pgrst', 'reload schema');
