alter table public.consultant_portfolio enable row level security;

drop policy if exists "Consultant portfolio is publicly readable" on public.consultant_portfolio;
create policy "Consultant portfolio is publicly readable"
  on public.consultant_portfolio
  for select
  using (true);

drop policy if exists "Consultant portfolio owner or admin can insert" on public.consultant_portfolio;
create policy "Consultant portfolio owner or admin can insert"
  on public.consultant_portfolio
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.consultants consultant
      where consultant.id = consultant_portfolio.consultant_id
        and consultant.claimed_by = auth.uid()
    )
    or exists (
      select 1
      from public.app_admins admin
      where admin.user_id = auth.uid()
    )
  );

drop policy if exists "Consultant portfolio owner or admin can update" on public.consultant_portfolio;
create policy "Consultant portfolio owner or admin can update"
  on public.consultant_portfolio
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.consultants consultant
      where consultant.id = consultant_portfolio.consultant_id
        and consultant.claimed_by = auth.uid()
    )
    or exists (
      select 1
      from public.app_admins admin
      where admin.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.consultants consultant
      where consultant.id = consultant_portfolio.consultant_id
        and consultant.claimed_by = auth.uid()
    )
    or exists (
      select 1
      from public.app_admins admin
      where admin.user_id = auth.uid()
    )
  );

drop policy if exists "Consultant portfolio owner or admin can delete" on public.consultant_portfolio;
create policy "Consultant portfolio owner or admin can delete"
  on public.consultant_portfolio
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.consultants consultant
      where consultant.id = consultant_portfolio.consultant_id
        and consultant.claimed_by = auth.uid()
    )
    or exists (
      select 1
      from public.app_admins admin
      where admin.user_id = auth.uid()
    )
  );