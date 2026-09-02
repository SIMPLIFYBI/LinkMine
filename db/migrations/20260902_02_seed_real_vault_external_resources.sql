-- Seed real external Vault resources and matching claim-target consultant profiles.

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
    raise notice 'Skipping real Vault seed: no auth users found.';
    return;
  end if;

  insert into public.consultants (
    display_name,
    company,
    headline,
    contact_email,
    slug,
    status,
    visibility,
    profile_type,
    claimed_by,
    claimed_at
  )
  select
    c.display_name,
    c.company,
    c.headline,
    c.claim_email,
    c.slug,
    'approved',
    'public',
    'creator',
    null,
    null
  from (
    values
      ('Mithril Consulting', 'Mithril Consulting', 'Digital resource publisher', 'hello@mithrilconsulting.io', 'mithril-consulting-resources'),
      ('ROCK-IT', 'ROCK-IT', 'Digital resource publisher', 'hello@rock-it.cloud', 'rock-it-resources'),
      ('Geologize', 'Geologize', 'Digital resource publisher', 'contact@geologize.org', 'geologize-resources'),
      ('Connected Mine', 'Connected Mine', 'Digital resource publisher', 'admin@voartechs.com.au', 'connected-mine-resources'),
      ('CoreTrack', 'Anunova', 'Digital resource publisher', 'support@anunova.com', 'coretrack-resources'),
      ('SMARTMINE X', 'SMARTMINE X', 'Digital resource publisher', 'info@smartminex.co.zw', 'smartmine-x-resources'),
      ('HME Solutions', 'HME Solutions', 'Digital resource publisher', 'info@hmesolutions.com.au', 'hme-solutions-resources'),
      ('ge-SIGMA', 'ge-SIGMA', 'Digital resource publisher', 'info@ge-sigma.com', 'ge-sigma-resources'),
      ('FastGeo', 'FastGeo Technologies', 'Digital resource publisher', 'sales@fastgeo.com', 'fastgeo-resources'),
      ('Eigenform', 'Eigenform', 'Digital resource publisher', 'alex@send.eigenform.ai', 'eigenform-resources'),
      ('RadiXplore', 'RadiXplore', 'Digital resource publisher', 'contactus@radixplore.com', 'radixplore-resources'),
      ('Gigworth', 'Gigworth', 'Digital resource publisher', 'contact@gigworth.com.au', 'gigworth-resources'),
      ('SMP 365', 'SMP 365', 'Digital resource publisher', 'support@smp365.com', 'smp365-resources'),
      ('WorkMine', 'WorkMine', 'Digital resource publisher', 'james@simplifybi.com', 'workmine-resources')
  ) as c(display_name, company, headline, claim_email, slug)
  on conflict (slug) do update
  set
    display_name = excluded.display_name,
    company = excluded.company,
    headline = excluded.headline,
    contact_email = excluded.contact_email,
    status = 'approved',
    visibility = 'public',
    profile_type = case
      when public.consultants.profile_type in ('creator', 'both') then public.consultants.profile_type
      else 'creator'
    end,
    claimed_by = null,
    claimed_at = null;

  insert into public.resources (
    owner_user_id,
    consultant_id,
    title,
    slug,
    summary,
    description,
    resource_type,
    resource_format,
    status,
    source_name,
    source_url,
    claim_contact_email,
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
    cc.id,
    r.title,
    r.slug,
    r.summary,
    r.description,
    'external',
    r.resource_format,
    'approved',
    r.source_name,
    r.source_url,
    r.claim_contact_email,
    0,
    'AUD',
    0,
    false,
    now(),
    now(),
    v_owner_user_id
  from (
    values
      (
        'DelvePath Directional Borehole Survey Calculator',
        'mithril-delvepath-directional-survey-calculator',
        'Directional survey calculator demo with Minimum Curvature path reconstruction and 3D wellbore views.',
        'Engineering prototype for directional survey calculations with plan, profile, and 3D visualisation workflows.',
        'app',
        'Mithril Consulting',
        'https://mithrilconsulting.io/delvepath/',
        'hello@mithrilconsulting.io'
      ),
      (
        'ROCK-IT Field Operations Data Platform',
        'rock-it-field-operations-data-platform',
        'All-in-one field operations data workspace for mining, drilling, and exploration teams.',
        'Platform for field data capture, analytics, integrations, and operational reporting across mining workflows.',
        'app',
        'ROCK-IT',
        'https://rock-it.cloud/',
        'hello@rock-it.cloud'
      ),
      (
        'Practical Geocommunication Training Bundle',
        'geologize-practical-geocommunication-training-bundle',
        'Geoscience communication training bundle for industry and academic professionals.',
        'Online course bundle focused on communication strategy, stakeholder engagement, and outreach in geoscience.',
        'website',
        'Geologize',
        'https://training.geologize.org/bundles/geocomms',
        'contact@geologize.org'
      ),
      (
        'Connected Mine Real-Time Operations Dashboard',
        'connected-mine-real-time-operations-dashboard',
        'Mining operations dashboards that unify physical, spatial, and fleet reporting in real time.',
        'Data integration and reporting platform that replaces fragmented workflows with a single source of operational truth.',
        'app',
        'Connected Mine',
        'https://connectedmine.com.au/',
        'admin@voartechs.com.au'
      ),
      (
        'CoreTrack Digital Core Tracking Platform',
        'coretrack-digital-core-tracking-platform',
        'Core yard tracking platform with live status, audit trails, and team coordination workflows.',
        'Cloud platform for drill hole and core process tracking across geology, technical, and supervisory teams.',
        'app',
        'CoreTrack',
        'https://coretrack.anunova.com/',
        'support@anunova.com'
      ),
      (
        'SmartMine X Intelligent Mining Operating System',
        'smartmine-x-intelligent-mining-operating-system',
        'Enterprise mining platform for production, workforce, safety, and AI-powered operational insights.',
        'Integrated mining intelligence system with module-based workflows, automation, and secure deployment options.',
        'app',
        'SMARTMINE X',
        'https://smartminex.co.zw/',
        'info@smartminex.co.zw'
      ),
      (
        'FMS Live Open Pit Fleet Management Platform',
        'fms-live-open-pit-fleet-management-platform',
        'Fleet management solution for open-pit mining with visibility into dispatch, cycle, and utilisation performance.',
        'Digital mining operations platform focused on fleet control, productivity optimisation, and integrated reporting.',
        'app',
        'HME Solutions',
        'https://www.hmesolutions.com.au/fmsenterprisebrochure',
        'info@hmesolutions.com.au'
      ),
      (
        'ge-SIGMA Integrated Geosciences Services',
        'ge-sigma-integrated-geosciences-services',
        'Integrative geoscience and mineral exploration advisory services for industry and government projects.',
        'Consulting and knowledge development services across generative support, technical reviews, and exploration strategy.',
        'website',
        'ge-SIGMA',
        'https://ge-sigma.com/',
        'info@ge-sigma.com'
      ),
      (
        'FastGeo AI Geological Logging Platform',
        'fastgeo-ai-geological-logging-platform',
        'Visual-first geological logging platform combining imagery, sensors, and AI-assisted analysis.',
        'Mining and exploration data platform that links core photos, sensor streams, and collaborative workflows.',
        'app',
        'FastGeo',
        'https://www.fastgeo.com/',
        'sales@fastgeo.com'
      ),
      (
        'Eigenform Recursive AI Discovery Platform',
        'eigenform-recursive-ai-discovery-platform',
        'Empirically grounded AI infrastructure for recursive model improvement and exploration intelligence.',
        'AI research and deployment platform focused on auditable reasoning traces and real-world model validation.',
        'app',
        'Eigenform',
        'https://www.eigenform.ai/',
        'alex@send.eigenform.ai'
      ),
      (
        'RadiXplore AI Mineral Exploration Intelligence',
        'radixplore-ai-mineral-exploration-intelligence',
        'AI platform that unifies historical geology, market signals, and modern datasets for discovery decisions.',
        'Mineral exploration intelligence workspace for project screening, de-risking, and opportunity identification.',
        'app',
        'RadiXplore',
        'https://radixplore.com/',
        'contactus@radixplore.com'
      ),
      (
        'MineMage Short Interval Control Platform',
        'minemage-short-interval-control-platform',
        'Short Interval Control software for open-pit and underground mining with near real-time operational insights.',
        'Operational analytics and reporting platform for cycle tracking, payload performance, and compliance to plan.',
        'app',
        'Gigworth',
        'https://www.gigworth.com.au/',
        'contact@gigworth.com.au'
      ),
      (
        'SMP 365 Safety Management Platform',
        'smp-365-safety-management-platform',
        'Microsoft-native safety platform connecting incidents, risk, audits, actions, and compliance workflows.',
        'Connected safety intelligence system for field and management teams with governed reporting and decision support.',
        'app',
        'SMP 365',
        'https://www.smp365.com/',
        'support@smp365.com'
      ),
      (
        'WorkMine Connected Mine Operations Platform',
        'workmine-connected-mine-operations-platform',
        'Unified workspace for planning, tracking, and executing daily mine operations.',
        'Platform for drillhole planning, field workflows, consumables tracking, and shift handover coordination.',
        'app',
        'WorkMine',
        'https://www.workmine.io/',
        'james@simplifybi.com'
      )
  ) as r(
    title,
    slug,
    summary,
    description,
    resource_format,
    source_name,
    source_url,
    claim_contact_email
  )
  left join lateral (
    select c.id
    from public.consultants c
    where lower(trim(c.contact_email)) = lower(trim(r.claim_contact_email))
    order by (c.claimed_by is null) desc, c.created_at desc nulls last
    limit 1
  ) cc on true
  on conflict (slug) do update
  set
    owner_user_id = excluded.owner_user_id,
    consultant_id = excluded.consultant_id,
    title = excluded.title,
    summary = excluded.summary,
    description = excluded.description,
    resource_type = excluded.resource_type,
    resource_format = excluded.resource_format,
    status = excluded.status,
    source_name = excluded.source_name,
    source_url = excluded.source_url,
    claim_contact_email = excluded.claim_contact_email,
    price_cents = excluded.price_cents,
    currency_code = excluded.currency_code,
    download_count = excluded.download_count,
    is_featured = excluded.is_featured,
    submitted_at = excluded.submitted_at,
    approved_at = excluded.approved_at,
    approved_by = excluded.approved_by,
    updated_at = now();
end
$$;
