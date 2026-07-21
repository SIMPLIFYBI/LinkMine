alter table public.resources
  add column if not exists consultant_id uuid references public.consultants(id) on delete set null;

with owner_consultants as (
  select
    r.id as resource_id,
    (
      select c.id
      from public.consultants c
      where c.status = 'approved'
        and (
          c.claimed_by = r.owner_user_id
          or c.user_id = r.owner_user_id
        )
      order by c.updated_at desc nulls last, c.created_at desc nulls last
      limit 1
    ) as consultant_id
  from public.resources r
  where r.consultant_id is null
)
update public.resources r
set consultant_id = owner_consultants.consultant_id
from owner_consultants
where owner_consultants.resource_id = r.id
  and owner_consultants.consultant_id is not null;

create index if not exists idx_resources_consultant_id
  on public.resources (consultant_id);

select pg_notify('pgrst', 'reload schema');
