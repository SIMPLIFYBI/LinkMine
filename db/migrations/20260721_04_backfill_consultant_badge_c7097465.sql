do $$
declare
  v_consultant_id uuid := 'c7097465-8fca-49bb-80d1-a6af466073cf';
  v_user_id uuid;
  v_claimed_by uuid;
begin
  select c.user_id, c.claimed_by
  into v_user_id, v_claimed_by
  from public.consultants c
  where c.id = v_consultant_id
  limit 1;

  if v_user_id is null and v_claimed_by is null then
    raise notice 'Skipping consultant badge backfill: consultant % has no linked user_id or claimed_by.', v_consultant_id;
    return;
  end if;

  update public.resources r
  set consultant_id = v_consultant_id,
      updated_at = now()
  where r.owner_user_id in (v_user_id, v_claimed_by)
    and r.consultant_id is null;

  raise notice 'Backfilled consultant badge using consultant % (user_id %, claimed_by %).', v_consultant_id, v_user_id, v_claimed_by;
end;
$$;

select pg_notify('pgrst', 'reload schema');
