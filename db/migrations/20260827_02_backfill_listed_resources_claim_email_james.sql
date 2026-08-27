-- Mark currently listed vault resources as unclaimed for profile-linking,
-- and route ownership claim mapping to james@simplifybi.com.
--
-- Note: resources.owner_user_id is NOT NULL in this schema, so this patch
-- intentionally keeps owner_user_id intact and clears consultant_id instead.

update public.resources
set
  consultant_id = null,
  claim_contact_email = 'james@simplifybi.com'
where status = 'approved';
