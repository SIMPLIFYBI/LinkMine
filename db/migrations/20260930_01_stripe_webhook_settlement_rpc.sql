create schema if not exists private;
revoke all on schema private from public;

create table if not exists private.stripe_webhook_settlement_secrets (
  secret_name text primary key,
  secret_hash text not null,
  updated_at timestamptz not null default now()
);

alter table private.stripe_webhook_settlement_secrets enable row level security;
revoke all on table private.stripe_webhook_settlement_secrets from public, anon, authenticated;

create or replace function public.configure_stripe_webhook_settlement_secret(p_secret text)
returns void
language plpgsql
security definer
set search_path = public, private, auth, extensions
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.app_admins where user_id = auth.uid()
  ) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  if length(trim(coalesce(p_secret, ''))) < 24 then
    raise exception 'Webhook secret is invalid.' using errcode = '22023';
  end if;

  insert into private.stripe_webhook_settlement_secrets (secret_name, secret_hash, updated_at)
  values ('stripe_checkout', encode(digest(p_secret, 'sha256'), 'hex'), now())
  on conflict (secret_name) do update
    set secret_hash = excluded.secret_hash,
        updated_at = excluded.updated_at;
end;
$$;

create or replace function public.settle_stripe_resource_order(
  p_order_id uuid,
  p_checkout_session_id text,
  p_payment_intent_id text,
  p_webhook_secret text
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_secret_hash text;
  v_order public.resource_orders%rowtype;
  v_item public.resource_order_items%rowtype;
  v_paid_at timestamptz := now();
begin
  select secret_hash into v_secret_hash
  from private.stripe_webhook_settlement_secrets
  where secret_name = 'stripe_checkout';

  if v_secret_hash is null
    or v_secret_hash <> encode(digest(coalesce(p_webhook_secret, ''), 'sha256'), 'hex') then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  select * into v_order
  from public.resource_orders
  where id = p_order_id
  for update;

  if not found
    or v_order.payment_provider <> 'stripe'
    or v_order.provider_checkout_id <> p_checkout_session_id then
    raise exception 'Checkout Session does not match its resource order.' using errcode = '22023';
  end if;

  if v_order.paid_at is not null then
    return jsonb_build_object('ok', true, 'alreadySettled', true, 'paidAt', v_order.paid_at);
  end if;

  for v_item in
    select * from public.resource_order_items where order_id = v_order.id
  loop
    begin
      insert into public.resource_entitlements (user_id, resource_id, grant_source, revoked_at)
      values (v_order.buyer_user_id, v_item.resource_id, 'purchase', null);
    exception when unique_violation then
      null;
    end;

    update public.resource_order_items
    set order_status = 'paid',
        entitlement_granted_at = coalesce(entitlement_granted_at, v_paid_at)
    where id = v_item.id;

    begin
      insert into public.resource_payout_ledger (
        order_item_id, seller_user_id, entry_type, status, gross_cents,
        platform_fee_cents, net_cents, currency_code, available_at, metadata
      )
      values (
        v_item.id, v_item.seller_user_id, 'earning',
        case when v_item.seller_net_cents > 0 then 'available' else 'pending' end,
        v_item.line_total_cents, v_item.platform_fee_cents, v_item.seller_net_cents,
        v_item.currency_code, v_paid_at,
        jsonb_build_object('orderId', v_order.id, 'resourceId', v_item.resource_id)
      );
    exception when unique_violation then
      null;
    end;
  end loop;

  update public.resource_orders
  set status = 'paid',
      paid_at = v_paid_at,
      provider_payment_intent_id = p_payment_intent_id
  where id = v_order.id;

  begin
    insert into public.resource_payment_attempts (
      order_id, provider, provider_reference, status, amount_cents,
      currency_code, response_payload
    )
    values (
      v_order.id, 'stripe', p_payment_intent_id, 'succeeded', v_order.total_cents,
      v_order.currency_code,
      jsonb_build_object('checkoutSessionId', p_checkout_session_id, 'event', 'checkout_success')
    );
  exception when unique_violation then
    null;
  end;

  return jsonb_build_object('ok', true, 'alreadySettled', false, 'paidAt', v_paid_at);
end;
$$;

revoke all on function public.configure_stripe_webhook_settlement_secret(text) from public;
grant execute on function public.configure_stripe_webhook_settlement_secret(text) to authenticated;

revoke all on function public.settle_stripe_resource_order(uuid, text, text, text) from public;
grant execute on function public.settle_stripe_resource_order(uuid, text, text, text) to anon, authenticated;

select pg_notify('pgrst', 'reload schema');