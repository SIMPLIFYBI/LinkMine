with ranked_creator_matches as (
  select
    resource.id as resource_id,
    consultant.id as consultant_id,
    row_number() over (
      partition by resource.id
      order by
        case
          when nullif(lower(trim(resource.claim_contact_email)), '') = nullif(lower(trim(consultant.contact_email)), '') then 0
          else 1
        end,
        consultant.created_at desc nulls last
    ) as match_rank
  from public.resources as resource
  join public.consultants as consultant
    on (
      (
        nullif(lower(trim(resource.claim_contact_email)), '') is not null
        and nullif(lower(trim(resource.claim_contact_email)), '') = nullif(lower(trim(consultant.contact_email)), '')
      )
      or (
        nullif(lower(trim(resource.source_name)), '') is not null
        and nullif(lower(trim(resource.source_name)), '') = nullif(lower(trim(consultant.display_name)), '')
      )
    )
  where resource.consultant_id is null
    and resource.status = 'approved'
    and consultant.visibility = 'public'
    and consultant.status = 'approved'
    and consultant.profile_type in ('creator', 'both')
)
update public.resources as resource
set consultant_id = creator_match.consultant_id,
    updated_at = now()
from ranked_creator_matches as creator_match
where resource.id = creator_match.resource_id
  and creator_match.match_rank = 1;