create unique index if not exists idx_resource_payout_ledger_earning_order_item
  on public.resource_payout_ledger (order_item_id)
  where entry_type = 'earning';

create unique index if not exists idx_resource_payment_attempts_provider_reference
  on public.resource_payment_attempts (provider, provider_reference)
  where provider_reference is not null;