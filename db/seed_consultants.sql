-- Run in Supabase SQL editor (service role bypasses RLS)

-- Ensure columns (safe if already present)
alter table public.consultants
  add column if not exists slug text,
  add column if not exists company text,
  add column if not exists headline text,
  add column if not exists bio text,
  add column if not exists location text,
  add column if not exists contact_email text,
  add column if not exists phone text,
  add column if not exists visibility text default 'public';

-- Unique slug for upsert
create unique index if not exists idx_consultants_slug on public.consultants (slug);

insert into public.consultants
  (slug, display_name, company, headline, bio, location, contact_email, phone, visibility)
values
  ('orelogy', 'Orelogy', 'Orelogy', 'Mine planning specialists',
   'Open pit & UG mine design, LOM scheduling, optimisation, studies.',
   'Perth, WA', 'info@orelogy.com', '+61 8 9318 5333', 'public'),

  ('entech', 'Entech', 'Entech Mining', 'Mining engineering, geology & geotech',
   'Concept → DFS studies, mine design & scheduling, ops support.',
   'West Perth, WA', 'admin_au@entechmining.com', '+61 8 6189 1800', 'public'),

  ('mining-plus', 'Mining Plus', 'Mining Plus', 'Full-suite mining engineering',
   'Mine planning, studies, design & optimisation across methods.',
   'Perth, WA', 'info@mining-plus.com', '+61 8 9213 2600', 'public'),

  ('amc-consultants', 'AMC Consultants', 'AMC Consultants', 'Global mining engineering',
   'Mine planning & studies; Perth consulting team.',
   'West Perth, WA', 'perth@amcconsultants.com', '+61 8 6330 1100', 'public'),

  ('srk-consulting', 'SRK Consulting', 'SRK Consulting (Australasia)', 'Mine design & planning',
   'Open‑pit/UG planning, reserves, optimisation, studies.',
   'West Perth, WA', 'australia@srk.com', '+61 8 9288 2000', 'public'),

  ('deswik-consulting', 'Deswik (Consulting)', 'Deswik', 'Mine design & scheduling consulting',
   'Strategic → short‑term planning, design & scheduling advisory.',
   'Perth, WA', 'info.perth@deswik.com', '+61 8 9488 8100', 'public'),

  ('rpmglobal', 'RPMGlobal', 'RPMGlobal', 'Planning & optimisation advisory',
   'Mine planning optimisation and advisory services.',
   'Perth, WA', null, '+61 8 9482 0700', 'public'),

  ('palaris', 'Palaris', 'Palaris', 'Advisory & studies',
   'Project studies, planning and operational improvement.',
   'Perth, WA', 'australia@palaris.com', '+61 2 4926 1500', 'public'),

  ('auralia-mining-consulting', 'Auralia Mining Consulting', 'Auralia', 'Mine engineering & planning',
   'Mine design, scheduling, feasibility studies.',
   'West Perth, WA', 'enquiries@auralia.net.au', '+61 8 6365 3290', 'public'),

  ('cube-consulting', 'Cube Consulting', 'Cube Consulting', 'Resources & mine planning',
   'Resource modelling, geostatistics, mine planning support.',
   'West Perth, WA', 'info@cubeconsulting.com', '+61 8 9423 5300', 'public'),

  ('go-engineering', 'Go Engineering', 'Go Engineering Pty Ltd', 'Mining engineering & ops support',
   'Studies, planning, technical services for operations.',
   'Perth, WA', 'info@goengineering.com.au', '+61 8 6316 6000', 'public'),

  ('demc', 'DEMC', 'Deep Earth Mining Consultants (DEMC)', 'Open‑cut mining engineering',
   'Mine planning & scheduling, studies, ops support.',
   'Perth, WA', 'admin@demcmining.com', '+61 8 6277 5168', 'public'),

  ('galt-mining-solutions', 'Galt Mining Solutions', 'Galt Mining Solutions', 'Mine planning & optimisation',
   'LOM scheduling, design, drill‑and‑blast & improvement.',
   'Perth, WA', 'admin@galtminingsolutions.com.au', null, 'public'),

  ('mining-one', 'Mining One', 'Mining One Pty Ltd', 'Mining engineering, geotech & planning',
   'Planning, studies, project management across methods.',
   'Perth, WA', 'info@miningone.com.au', '+61 3 9600 3588', 'public'),

  ('xenith-consulting', 'Xenith Consulting', 'Xenith', 'Mine planning & studies',
   'Feasibility studies, planning, optimisation (Perth team).',
   'Perth, WA', 'info@xenith.com.au', null, 'public'),

  ('minegeotech', 'MineGeoTech', 'MineGeoTech (MGT)', 'Geotech & mine planning support',
   'Geotechnical engineering, slope design, rockfall & planning input.',
   'Perth, WA', 'info@mgtgeotech.com', null, 'public'),

  ('rapallo', 'Rapallo', 'Rapallo', 'Engineering & projects for resources',
   'Engineering, projects and operational support to miners.',
   'Perth, WA', 'enquiries@rapallo.com.au', '+61 1300 782 255', 'public'),

  ('lycopodium', 'Lycopodium', 'Lycopodium', 'Studies & engineering',
   'Scoping/PFS/FS, engineering for resources projects.',
   'West Perth, WA', 'enquiries@lycopodium.com', '+61 8 6210 5222', 'public'),

  ('dra-global', 'DRA Global', 'DRA Global', 'Mining & process engineering',
   'Studies, engineering and project delivery for mines.',
   'Perth, WA', 'enquiries@draglobal.com', '+61 8 6163 5900', 'public'),

  ('ausenco', 'Ausenco', 'Ausenco', 'Studies & mine project engineering',
   'Concept → feasibility studies, engineering & delivery.',
   'Perth, WA', 'perth@ausenco.com', '+61 8 6211 1900', 'public'),

  ('wsp-perth', 'WSP (Perth)', 'WSP Australia', 'Engineering & mine studies',
   'Multi‑disciplinary engineering incl. mining sector support.',
   'Perth, WA', null, null, 'public'),

  ('csa-global-erm', 'CSA Global (ERM)', 'CSA Global (an ERM group company)', 'Resources & mining advisory',
   'Mining engineering, resource modelling, planning & studies.',
   'West Perth, WA', 'info@csaglobal.com', '+61 8 9355 1677', 'public'),

  ('minescope-services', 'MineScope Services', 'MineScope Services', 'Independent mining consultancy',
   'Studies (Scoping→DFS), planning support & ops improvement.',
   'Mount Pleasant (Perth), WA', 'info@minescopeservices.com.au', '+61 8 9288 1745', 'public'),

  ('perth-mining-consultants', 'Perth Mining Consultants', 'Perth Mining Consultants', 'Mine planning & engineering',
   'Planning, studies and operations support for WA miners.',
   'Perth, WA', 'admin@pmcts.com.au', '+61 8 6263 446', 'public')
on conflict (slug) do update
set
  display_name = excluded.display_name,
  company       = excluded.company,
  headline      = excluded.headline,
  bio           = excluded.bio,
  location      = excluded.location,
  contact_email = excluded.contact_email,
  phone         = excluded.phone,
  visibility    = excluded.visibility;

-- Refresh PostgREST cache
select pg_notify('pgrst', 'reload schema');