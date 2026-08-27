-- Ensure there is a claim-target profile for resource claims routed to
-- james@simplifybi.com.
--
-- Resource claim UI resolves against consultants.contact_email. If no profile
-- exists for the claim email, the claim button cannot render.

do $$
declare
  v_claim_email text := 'james@simplifybi.com';
  v_consultant_id uuid;
begin
  select c.id
  into v_consultant_id
  from public.consultants c
  where lower(trim(c.contact_email)) = v_claim_email
  order by (c.claimed_by is null) desc, c.created_at desc nulls last
  limit 1;

  if v_consultant_id is not null then
    update public.consultants
    set
      contact_email = v_claim_email,
      claimed_by = null,
      claimed_at = null,
      status = 'approved',
      visibility = 'public',
      profile_type = case
        when profile_type in ('creator', 'both') then profile_type
        else 'creator'
      end
    where id = v_consultant_id;
  else
    insert into public.consultants (
      display_name,
      company,
      headline,
      location,
      country_code,
      global_region,
      contact_email,
      slug,
      status,
      visibility,
      profile_type,
      claimed_by,
      claimed_at
    )
    values (
      'SimplifyBI Digital Resources',
      'SimplifyBI',
      'Digital resource publisher',
      'Australia',
      'AU',
      'oceania',
      v_claim_email,
      'simplifybi-digital-resources',
      'approved',
      'public',
      'creator',
      null,
      null
    )
    on conflict (slug) do update
    set
      contact_email = excluded.contact_email,
      claimed_by = null,
      claimed_at = null,
      status = 'approved',
      visibility = 'public',
      profile_type = case
        when public.consultants.profile_type in ('creator', 'both') then public.consultants.profile_type
        else 'creator'
      end;
  end if;
end
$$;
