-- Ensure seeded real Vault resources are free and set featured flags.

update public.resources
set
  price_cents = 0,
  currency_code = 'AUD',
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

update public.resources
set
  is_featured = case
    when slug in (
      'minemage-short-interval-control-platform',
      'smp-365-safety-management-platform',
      'workmine-connected-mine-operations-platform'
    ) then true
    else false
  end,
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
