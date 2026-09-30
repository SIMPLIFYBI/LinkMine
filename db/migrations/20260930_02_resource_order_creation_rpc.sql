create or replace function public.create_resource_order(p_resource_ids uuid[])
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_buyer_id uuid := auth.uid();
  v_resource_ids uuid[];
  v_requested_count integer;
  v_found_count integer;
  v_currency_count integer;
  v_currency_code text;
  v_total_cents integer;
  v_platform_fee_cents integer;
  v_order_id uuid;
  v_resource record;
  v_line_fee_cents integer;
begin
  if v_buyer_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select array_agg(distinct resource_id)
  into v_resource_ids
  from unnest(coalesce(p_resource_ids, '{}'::uuid[])) as resource_id
  where resource_id is not null;

  v_requested_count := coalesce(array_length(v_resource_ids, 1), 0);
  if v_requested_count = 0 then
    raise exception 'resourceIds is required.' using errcode = '22023';
  end if;

  select count(*), count(distinct upper(coalesce(currency_code, 'AUD'))),
    min(upper(coalesce(currency_code, 'AUD'))), coalesce(sum(price_cents), 0)
  into v_found_count, v_currency_count, v_currency_code, v_total_cents
  from public.resources
  where id = any(v_resource_ids)
    and status = 'approved';

  if v_found_count <> v_requested_count then
    raise exception 'One or more resources are unavailable.' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.resources
    where id = any(v_resource_ids) and owner_user_id = v_buyer_id
  ) then
    raise exception 'You cannot create an order for your own resource.' using errcode = '22023';
  end if;

  if v_currency_count <> 1 then
    raise exception 'All resources in an order must use the same currency.' using errcode = '22023';
  end if;

  select coalesce(sum(round((price_cents * 1500) / 10000.0)::integer), 0)
  into v_platform_fee_cents
  from public.resources
  where id = any(v_resource_ids);

  insert into public.resource_orders (
    buyer_user_id, status, subtotal_cents, platform_fee_cents, total_cents, currency_code, paid_at
  ) values (
    v_buyer_id,
    case when v_total_cents = 0 then 'paid' else 'draft' end,
    v_total_cents, v_platform_fee_cents, v_total_cents, v_currency_code,
    case when v_total_cents = 0 then now() else null end
  ) returning id into v_order_id;

  for v_resource in
    select id, owner_user_id, price_cents, upper(coalesce(currency_code, 'AUD')) as currency_code
    from public.resources
    where id = any(v_resource_ids)
  loop
    v_line_fee_cents := round((v_resource.price_cents * 1500) / 10000.0)::integer;
    insert into public.resource_order_items (
      order_id, resource_id, seller_user_id, order_status, quantity,
      unit_price_cents, line_total_cents, platform_fee_cents, seller_net_cents,
      currency_code, entitlement_granted_at
    ) values (
      v_order_id, v_resource.id, v_resource.owner_user_id,
      case when v_resource.price_cents = 0 then 'paid' else 'pending' end,
      1, v_resource.price_cents, v_resource.price_cents, v_line_fee_cents,
      v_resource.price_cents - v_line_fee_cents, v_resource.currency_code,
      case when v_resource.price_cents = 0 then now() else null end
    );

    if v_resource.price_cents = 0 then
      insert into public.resource_entitlements (user_id, resource_id, grant_source, revoked_at)
      values (v_buyer_id, v_resource.id, 'free', null)
      on conflict (user_id, resource_id) where revoked_at is null do nothing;
    end if;
  end loop;

  return v_order_id;
end;
$$;

revoke all on function public.create_resource_order(uuid[]) from public;
grant execute on function public.create_resource_order(uuid[]) to authenticated;

select pg_notify('pgrst', 'reload schema');