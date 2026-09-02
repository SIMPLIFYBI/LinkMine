-- Ensure real Vault seed resources are approved and discoverable in admin placements.

do $$
declare
  v_admin_user_id uuid;
begin
  select coalesce(
    (select admin.user_id from public.app_admins admin limit 1),
    (select usr.id from auth.users usr order by usr.created_at asc limit 1)
  ) into v_admin_user_id;

  update public.resources
  set
    status = 'approved',
    submitted_at = coalesce(submitted_at, now()),
    approved_at = now(),
    approved_by = coalesce(v_admin_user_id, approved_by),
    rejected_at = null,
    rejection_notes = null,
    updated_at = now()
  where slug in (
    'mithril-delvepath-directional-survey-calculator',
    'rock-it-field-operations-data-platform',
    'geologize-practical-geocommunication-training-bundle',
    'connected-mine-real-time-operations-dashboard',
    'coretrack-digital-core-tracking-platform',
    'smartmine-x-intelligent-mining-operating-system',
    'fms-live-open-pit-fleet-management-platform',
    'ge-sigma-integrated-geosciences-services',
    'fastgeo-ai-geological-logging-platform',
    'eigenform-recursive-ai-discovery-platform',
    'radixplore-ai-mineral-exploration-intelligence',
    'minemage-short-interval-control-platform',
    'smp-365-safety-management-platform',
    'workmine-connected-mine-operations-platform'
  );
end
$$;
