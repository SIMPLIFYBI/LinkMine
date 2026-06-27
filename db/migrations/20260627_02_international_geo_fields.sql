alter table public.consultants
  add column if not exists country_code text,
  add column if not exists global_region text;

alter table public.jobs
  add column if not exists country_code text,
  add column if not exists global_region text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'consultants_country_code_check'
  ) then
    alter table public.consultants
      add constraint consultants_country_code_check
      check (
        country_code is null
        or country_code ~ '^[A-Z]{2}$'
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'consultants_global_region_check'
  ) then
    alter table public.consultants
      add constraint consultants_global_region_check
      check (
        global_region is null
        or global_region in (
          'africa',
          'asia',
          'europe',
          'middle_east',
          'north_america',
          'oceania',
          'south_america',
          'global'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'jobs_country_code_check'
  ) then
    alter table public.jobs
      add constraint jobs_country_code_check
      check (
        country_code is null
        or country_code ~ '^[A-Z]{2}$'
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'jobs_global_region_check'
  ) then
    alter table public.jobs
      add constraint jobs_global_region_check
      check (
        global_region is null
        or global_region in (
          'africa',
          'asia',
          'europe',
          'middle_east',
          'north_america',
          'oceania',
          'south_america',
          'global'
        )
      );
  end if;
end $$;

create index if not exists idx_consultants_country_code
  on public.consultants (country_code);

create index if not exists idx_consultants_global_region
  on public.consultants (global_region);

create index if not exists idx_jobs_country_code
  on public.jobs (country_code);

create index if not exists idx_jobs_global_region
  on public.jobs (global_region);

comment on column public.consultants.country_code is
  'ISO 3166-1 alpha-2 country code for the consultant base location.';

comment on column public.consultants.global_region is
  'Broad geography for filtering, for example oceania or north_america.';

comment on column public.jobs.country_code is
  'ISO 3166-1 alpha-2 country code for the job location.';

comment on column public.jobs.global_region is
  'Broad geography for filtering, for example oceania or north_america.';

do $$
begin
  if exists (
    select 1
    from pg_attribute
    where attrelid = 'public.consultants'::regclass
      and attname = 'metadata'
      and not attisdropped
  ) then
    update public.consultants
    set country_code = case
      when upper(nullif(trim(coalesce(metadata->>'country_code', '')), '')) ~ '^[A-Z]{2}$'
        then upper(trim(metadata->>'country_code'))
      when lower(nullif(trim(coalesce(metadata->>'country', '')), '')) = 'australia'
        then 'AU'
      when lower(nullif(trim(coalesce(metadata->>'country', '')), '')) = 'new zealand'
        then 'NZ'
      when lower(nullif(trim(coalesce(metadata->>'country', '')), '')) in ('united states', 'united states of america', 'usa')
        then 'US'
      when lower(nullif(trim(coalesce(metadata->>'country', '')), '')) = 'canada'
        then 'CA'
      when lower(nullif(trim(coalesce(metadata->>'country', '')), '')) in ('united kingdom', 'uk', 'great britain')
        then 'GB'
      else null
    end
    where country_code is null;
  end if;

  if exists (
    select 1
    from pg_attribute
    where attrelid = 'public.jobs'::regclass
      and attname = 'metadata'
      and not attisdropped
  ) then
    execute $jobs_country_backfill$
      update public.jobs
      set country_code = case
        when upper(nullif(trim(coalesce(metadata->>'country_code', '')), '')) ~ '^[A-Z]{2}$'
          then upper(trim(metadata->>'country_code'))
        when lower(nullif(trim(coalesce(metadata->>'country', '')), '')) = 'australia'
          then 'AU'
        when lower(nullif(trim(coalesce(metadata->>'country', '')), '')) = 'new zealand'
          then 'NZ'
        when lower(nullif(trim(coalesce(metadata->>'country', '')), '')) in ('united states', 'united states of america', 'usa')
          then 'US'
        when lower(nullif(trim(coalesce(metadata->>'country', '')), '')) = 'canada'
          then 'CA'
        when lower(nullif(trim(coalesce(metadata->>'country', '')), '')) in ('united kingdom', 'uk', 'great britain')
          then 'GB'
        else null
      end
      where country_code is null
    $jobs_country_backfill$;
  end if;
end $$;

update public.consultants
set country_code = case
  when location ~* '(^|[^A-Z])(australia)([^A-Z]|$)' then 'AU'
  when location ~* '(^|[^A-Z])(new zealand)([^A-Z]|$)' then 'NZ'
  when location ~* '(^|[^A-Z])(united states|united states of america|usa)([^A-Z]|$)' then 'US'
  when location ~* '(^|[^A-Z])(canada)([^A-Z]|$)' then 'CA'
  when location ~* '(^|[^A-Z])(united kingdom|great britain|england|scotland|wales|northern ireland)([^A-Z]|$)' then 'GB'
  when location ~* ',\s*(wa|nsw|qld|vic|tas|sa|nt|act)\s*$' then 'AU'
  else country_code
end
where country_code is null
  and coalesce(location, '') <> '';

update public.jobs
set country_code = case
  when location ~* '(^|[^A-Z])(australia)([^A-Z]|$)' then 'AU'
  when location ~* '(^|[^A-Z])(new zealand)([^A-Z]|$)' then 'NZ'
  when location ~* '(^|[^A-Z])(united states|united states of america|usa)([^A-Z]|$)' then 'US'
  when location ~* '(^|[^A-Z])(canada)([^A-Z]|$)' then 'CA'
  when location ~* '(^|[^A-Z])(united kingdom|great britain|england|scotland|wales|northern ireland)([^A-Z]|$)' then 'GB'
  when location ~* ',\s*(wa|nsw|qld|vic|tas|sa|nt|act)\s*$' then 'AU'
  else country_code
end
where country_code is null
  and coalesce(location, '') <> '';

do $$
begin
  if exists (
    select 1
    from pg_attribute
    where attrelid = 'public.consultants'::regclass
      and attname = 'metadata'
      and not attisdropped
  ) then
    update public.consultants
    set global_region = case
      when lower(nullif(trim(coalesce(metadata->>'global_region', metadata->>'region', '')), '')) in ('africa', 'asia', 'europe', 'middle_east', 'north_america', 'oceania', 'south_america', 'global')
        then lower(trim(coalesce(metadata->>'global_region', metadata->>'region')))
      when lower(nullif(trim(coalesce(metadata->>'global_region', metadata->>'region', '')), '')) in ('north america', 'south america', 'middle east')
        then replace(lower(trim(coalesce(metadata->>'global_region', metadata->>'region'))), ' ', '_')
      when country_code in ('AU', 'NZ', 'FJ', 'PG') then 'oceania'
      when country_code in ('US', 'CA', 'MX') then 'north_america'
      when country_code in ('BR', 'AR', 'CL', 'CO', 'PE') then 'south_america'
      when country_code in ('GB', 'IE', 'DE', 'FR', 'ES', 'PT', 'IT', 'NL', 'BE', 'LU', 'CH', 'AT', 'SE', 'NO', 'FI', 'DK', 'PL', 'CZ', 'RO', 'GR') then 'europe'
      when country_code in ('AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'IL', 'JO', 'LB') then 'middle_east'
      when country_code in ('CN', 'JP', 'KR', 'IN', 'SG', 'MY', 'ID', 'TH', 'VN', 'PH') then 'asia'
      when country_code in ('ZA', 'GH', 'BW', 'NA', 'ZM', 'CD', 'EG', 'MA', 'TN') then 'africa'
      else null
    end
    where global_region is null;
  else
    update public.consultants
    set global_region = case
      when country_code in ('AU', 'NZ', 'FJ', 'PG') then 'oceania'
      when country_code in ('US', 'CA', 'MX') then 'north_america'
      when country_code in ('BR', 'AR', 'CL', 'CO', 'PE') then 'south_america'
      when country_code in ('GB', 'IE', 'DE', 'FR', 'ES', 'PT', 'IT', 'NL', 'BE', 'LU', 'CH', 'AT', 'SE', 'NO', 'FI', 'DK', 'PL', 'CZ', 'RO', 'GR') then 'europe'
      when country_code in ('AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'IL', 'JO', 'LB') then 'middle_east'
      when country_code in ('CN', 'JP', 'KR', 'IN', 'SG', 'MY', 'ID', 'TH', 'VN', 'PH') then 'asia'
      when country_code in ('ZA', 'GH', 'BW', 'NA', 'ZM', 'CD', 'EG', 'MA', 'TN') then 'africa'
      else null
    end
    where global_region is null;
  end if;

  if exists (
    select 1
    from pg_attribute
    where attrelid = 'public.jobs'::regclass
      and attname = 'metadata'
      and not attisdropped
  ) then
    execute $jobs_region_backfill$
      update public.jobs
      set global_region = case
        when lower(nullif(trim(coalesce(metadata->>'global_region', metadata->>'region', '')), '')) in ('africa', 'asia', 'europe', 'middle_east', 'north_america', 'oceania', 'south_america', 'global')
          then lower(trim(coalesce(metadata->>'global_region', metadata->>'region')))
        when lower(nullif(trim(coalesce(metadata->>'global_region', metadata->>'region', '')), '')) in ('north america', 'south america', 'middle east')
          then replace(lower(trim(coalesce(metadata->>'global_region', metadata->>'region'))), ' ', '_')
        when country_code in ('AU', 'NZ', 'FJ', 'PG') then 'oceania'
        when country_code in ('US', 'CA', 'MX') then 'north_america'
        when country_code in ('BR', 'AR', 'CL', 'CO', 'PE') then 'south_america'
        when country_code in ('GB', 'IE', 'DE', 'FR', 'ES', 'PT', 'IT', 'NL', 'BE', 'LU', 'CH', 'AT', 'SE', 'NO', 'FI', 'DK', 'PL', 'CZ', 'RO', 'GR') then 'europe'
        when country_code in ('AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'IL', 'JO', 'LB') then 'middle_east'
        when country_code in ('CN', 'JP', 'KR', 'IN', 'SG', 'MY', 'ID', 'TH', 'VN', 'PH') then 'asia'
        when country_code in ('ZA', 'GH', 'BW', 'NA', 'ZM', 'CD', 'EG', 'MA', 'TN') then 'africa'
        else null
      end
      where global_region is null
    $jobs_region_backfill$;
  else
    update public.jobs
    set global_region = case
      when country_code in ('AU', 'NZ', 'FJ', 'PG') then 'oceania'
      when country_code in ('US', 'CA', 'MX') then 'north_america'
      when country_code in ('BR', 'AR', 'CL', 'CO', 'PE') then 'south_america'
      when country_code in ('GB', 'IE', 'DE', 'FR', 'ES', 'PT', 'IT', 'NL', 'BE', 'LU', 'CH', 'AT', 'SE', 'NO', 'FI', 'DK', 'PL', 'CZ', 'RO', 'GR') then 'europe'
      when country_code in ('AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'IL', 'JO', 'LB') then 'middle_east'
      when country_code in ('CN', 'JP', 'KR', 'IN', 'SG', 'MY', 'ID', 'TH', 'VN', 'PH') then 'asia'
      when country_code in ('ZA', 'GH', 'BW', 'NA', 'ZM', 'CD', 'EG', 'MA', 'TN') then 'africa'
      else null
    end
    where global_region is null;
  end if;
end $$;

select pg_notify('pgrst', 'reload schema');