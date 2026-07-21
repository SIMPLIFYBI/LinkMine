do $$
declare
  v_owner_user_id uuid;
begin
  select coalesce(
    (select admin.user_id from public.app_admins admin limit 1),
    (select usr.id from auth.users usr order by usr.created_at asc limit 1)
  )
  into v_owner_user_id;

  if v_owner_user_id is null then
    raise notice 'Skipping dummy marketplace resource seed: no auth users found.';
    return;
  end if;

  insert into public.resources (
    owner_user_id,
    category_id,
    title,
    slug,
    summary,
    description,
    resource_type,
    resource_format,
    status,
    source_name,
    source_url,
    license_name,
    license_url,
    estimated_size_bytes,
    price_cents,
    currency_code,
    download_count,
    is_featured,
    submitted_at,
    approved_at,
    approved_by
  )
  select
    v_owner_user_id,
    categories.id,
    seed.title,
    seed.slug,
    seed.summary,
    seed.description,
    'external',
    seed.resource_format,
    'approved',
    seed.source_name,
    seed.source_url,
    seed.license_name,
    seed.license_url,
    seed.estimated_size_bytes,
    seed.price_cents,
    'AUD',
    seed.download_count,
    seed.is_featured,
    now(),
    now(),
    v_owner_user_id
  from (
    values
      (
        'Mine Safety Portal Toolkit',
        'dummy-marketplace-website-01',
        'HSE website bundle with public operating checklists and audit templates.',
        'Reference website content for HSE teams.',
        'website',
        'hse',
        'SafeOps Knowledge Hub',
        'https://example.com/resources/safeops-toolkit',
        0::bigint,
        0,
        132,
        true,
        'Community Use',
        'https://example.com/licenses/community-use'
      ),
      (
        'Geology Open Scripts Repository',
        'dummy-marketplace-repository-01',
        'Repository of lithology helpers, logging parsers, and QC checks.',
        'Open scripts and examples hosted in a versioned repository.',
        'repository',
        'geology',
        'GeoLabs Open Source',
        'https://github.com/example/geology-open-scripts',
        0::bigint,
        0,
        286,
        true,
        'MIT',
        'https://opensource.org/licenses/MIT'
      ),
      (
        'Production KPI Workbook',
        'dummy-marketplace-excel-01',
        'Excel workbook template for weekly production KPIs and variance tracking.',
        'Spreadsheet-ready structure for reporting and planning handovers.',
        'excel',
        'mine_planning',
        'OpsDocs Library',
        'https://example.com/resources/production-kpi-workbook',
        284576::bigint,
        4900,
        74,
        false,
        'Standard Internal License',
        'https://example.com/licenses/internal-standard'
      ),
      (
        'Ground Support Inspection Guide',
        'dummy-marketplace-word-01',
        'Word document pack for underground and open pit ground support checks.',
        'Structured document with editable inspection and sign-off sections.',
        'word',
        'hse',
        'FieldDocs Online',
        'https://example.com/resources/ground-support-inspection-guide',
        194560::bigint,
        2900,
        61,
        false,
        'Standard Internal License',
        'https://example.com/licenses/internal-standard'
      ),
      (
        'Leadership Prestart Slide Deck',
        'dummy-marketplace-powerpoint-01',
        'PowerPoint pack for daily prestarts and weekly toolbox leadership topics.',
        'Presentation template for operational communication and safety focus.',
        'powerpoint',
        'training',
        'Workforce Learning Hub',
        'https://example.com/resources/prestart-leadership-deck',
        405504::bigint,
        3900,
        48,
        false,
        'Team Learning License',
        'https://example.com/licenses/team-learning'
      ),
      (
        'Survey Data Cleaning Script Pack',
        'dummy-marketplace-script-01',
        'Automation scripts for cleaning and normalizing survey exports.',
        'Script examples for CSV preprocessing and QA checks.',
        'script',
        'scripts_automation',
        'Spatial Automation Works',
        'https://example.com/resources/survey-cleaning-scripts',
        126976::bigint,
        0,
        155,
        true,
        'Apache-2.0',
        'https://opensource.org/license/apache-2-0'
      ),
      (
        'Blast Sequencing Companion App',
        'dummy-marketplace-app-01',
        'Companion app package with guidance content for blast sequencing checks.',
        'Mobile companion material and setup guidance.',
        'app',
        'drill_blast',
        'BlastOps Digital',
        'https://example.com/resources/blast-sequencing-app',
        7340032::bigint,
        11900,
        23,
        false,
        'Commercial License',
        'https://example.com/licenses/commercial'
      ),
      (
        'Tailings Governance Handbook',
        'dummy-marketplace-pdf-01',
        'PDF handbook covering governance controls and review cadence.',
        'Reference PDF for governance teams and reporting cycles.',
        'pdf',
        'processing',
        'Process Excellence Library',
        'https://example.com/resources/tailings-governance-handbook.pdf',
        612352::bigint,
        5900,
        37,
        false,
        'Editorial License',
        'https://example.com/licenses/editorial'
      ),
      (
        'Maintenance Field Template Bundle',
        'dummy-marketplace-generic-01',
        'Generic bundle of maintenance forms and field-ready templates.',
        'Mixed-format package for maintenance planning and shift handovers.',
        'generic',
        'maintenance',
        'Maintenance Resource Exchange',
        'https://example.com/resources/maintenance-template-bundle',
        512000::bigint,
        4500,
        66,
        false,
        'Standard Internal License',
        'https://example.com/licenses/internal-standard'
      ),
      (
        'Open Pit Mapping Starter Kit',
        'dummy-marketplace-website-02',
        'Web-based starter kit for map conventions, legends, and pit naming.',
        'Practical mapping baseline for teams onboarding to new pits.',
        'website',
        'gis_spatial',
        'PitMap Academy',
        'https://example.com/resources/open-pit-mapping-starter-kit',
        0::bigint,
        1900,
        91,
        true,
        'Community Use',
        'https://example.com/licenses/community-use'
      )
  ) as seed(
    title,
    slug,
    summary,
    description,
    resource_format,
    category_slug,
    source_name,
    source_url,
    estimated_size_bytes,
    price_cents,
    download_count,
    is_featured,
    license_name,
    license_url
  )
  left join public.resource_categories categories
    on categories.slug = seed.category_slug
  on conflict (slug) do update
  set
    owner_user_id = excluded.owner_user_id,
    category_id = excluded.category_id,
    title = excluded.title,
    summary = excluded.summary,
    description = excluded.description,
    resource_type = excluded.resource_type,
    resource_format = excluded.resource_format,
    status = excluded.status,
    source_name = excluded.source_name,
    source_url = excluded.source_url,
    license_name = excluded.license_name,
    license_url = excluded.license_url,
    estimated_size_bytes = excluded.estimated_size_bytes,
    price_cents = excluded.price_cents,
    currency_code = excluded.currency_code,
    download_count = excluded.download_count,
    is_featured = excluded.is_featured,
    submitted_at = excluded.submitted_at,
    approved_at = excluded.approved_at,
    approved_by = excluded.approved_by,
    updated_at = now();
end;
$$;

select pg_notify('pgrst', 'reload schema');
