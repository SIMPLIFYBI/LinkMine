create extension if not exists "pgcrypto";

create table if not exists public.resource_orders (
  id uuid primary key default gen_random_uuid(),
  buyer_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft'
    check (status = any (array['draft'::text, 'pending'::text, 'paid'::text, 'failed'::text, 'cancelled'::text, 'refunded'::text])),
  payment_provider text,
  provider_checkout_id text,
  provider_payment_intent_id text,
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  currency_code text not null default 'AUD' check (currency_code ~ '^[A-Z]{3}$'),
  paid_at timestamptz,
  cancelled_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resource_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.resource_orders(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete restrict,
  seller_user_id uuid not null references auth.users(id) on delete restrict,
  order_status text not null default 'pending'
    check (order_status = any (array['pending'::text, 'paid'::text, 'cancelled'::text, 'refunded'::text])),
  quantity integer not null default 1 check (quantity > 0),
  unit_price_cents integer not null default 0 check (unit_price_cents >= 0),
  line_total_cents integer not null default 0 check (line_total_cents >= 0),
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  seller_net_cents integer not null default 0 check (seller_net_cents >= 0),
  currency_code text not null default 'AUD' check (currency_code ~ '^[A-Z]{3}$'),
  entitlement_granted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, resource_id)
);

create table if not exists public.resource_payment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.resource_orders(id) on delete cascade,
  provider text not null,
  provider_reference text,
  status text not null default 'created'
    check (status = any (array['created'::text, 'processing'::text, 'succeeded'::text, 'failed'::text, 'cancelled'::text])),
  amount_cents integer not null default 0 check (amount_cents >= 0),
  currency_code text not null default 'AUD' check (currency_code ~ '^[A-Z]{3}$'),
  failure_reason text,
  response_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resource_payout_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  provider text not null,
  provider_account_id text not null unique,
  status text not null default 'pending'
    check (status = any (array['pending'::text, 'active'::text, 'restricted'::text, 'disabled'::text])),
  country_code text,
  currency_code text not null default 'AUD' check (currency_code ~ '^[A-Z]{3}$'),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resource_payout_ledger (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid references public.resource_order_items(id) on delete set null,
  seller_user_id uuid not null references auth.users(id) on delete cascade,
  payout_account_id uuid references public.resource_payout_accounts(id) on delete set null,
  entry_type text not null
    check (entry_type = any (array['earning'::text, 'refund'::text, 'adjustment'::text, 'payout'::text])),
  status text not null default 'pending'
    check (status = any (array['pending'::text, 'available'::text, 'paid'::text, 'reversed'::text])),
  gross_cents integer not null default 0 check (gross_cents >= 0),
  platform_fee_cents integer not null default 0 check (platform_fee_cents >= 0),
  net_cents integer not null default 0,
  currency_code text not null default 'AUD' check (currency_code ~ '^[A-Z]{3}$'),
  available_at timestamptz,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_resource_orders_buyer_status
  on public.resource_orders (buyer_user_id, status);

create index if not exists idx_resource_orders_created_at
  on public.resource_orders (created_at desc);

create index if not exists idx_resource_order_items_order_id
  on public.resource_order_items (order_id);

create index if not exists idx_resource_order_items_seller_status
  on public.resource_order_items (seller_user_id, order_status);

create index if not exists idx_resource_payment_attempts_order_id
  on public.resource_payment_attempts (order_id, created_at desc);

create index if not exists idx_resource_payout_ledger_seller_status
  on public.resource_payout_ledger (seller_user_id, status, created_at desc);

create or replace function public.resource_commerce_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_resource_orders_updated_at on public.resource_orders;
create trigger trg_resource_orders_updated_at
before update on public.resource_orders
for each row execute function public.resource_commerce_set_updated_at();

drop trigger if exists trg_resource_order_items_updated_at on public.resource_order_items;
create trigger trg_resource_order_items_updated_at
before update on public.resource_order_items
for each row execute function public.resource_commerce_set_updated_at();

drop trigger if exists trg_resource_payment_attempts_updated_at on public.resource_payment_attempts;
create trigger trg_resource_payment_attempts_updated_at
before update on public.resource_payment_attempts
for each row execute function public.resource_commerce_set_updated_at();

drop trigger if exists trg_resource_payout_accounts_updated_at on public.resource_payout_accounts;
create trigger trg_resource_payout_accounts_updated_at
before update on public.resource_payout_accounts
for each row execute function public.resource_commerce_set_updated_at();

drop trigger if exists trg_resource_payout_ledger_updated_at on public.resource_payout_ledger;
create trigger trg_resource_payout_ledger_updated_at
before update on public.resource_payout_ledger
for each row execute function public.resource_commerce_set_updated_at();

alter table public.resource_orders enable row level security;
alter table public.resource_order_items enable row level security;
alter table public.resource_payment_attempts enable row level security;
alter table public.resource_payout_accounts enable row level security;
alter table public.resource_payout_ledger enable row level security;

drop policy if exists resource_orders_select_party on public.resource_orders;
create policy resource_orders_select_party on public.resource_orders
  for select using (
    buyer_user_id = auth.uid()
    or public.is_app_admin(auth.uid())
  );

drop policy if exists resource_orders_insert_buyer on public.resource_orders;
create policy resource_orders_insert_buyer on public.resource_orders
  for insert with check (
    buyer_user_id = auth.uid()
    or public.is_app_admin(auth.uid())
  );

drop policy if exists resource_orders_update_party on public.resource_orders;
create policy resource_orders_update_party on public.resource_orders
  for update using (
    buyer_user_id = auth.uid()
    or public.is_app_admin(auth.uid())
  )
  with check (
    buyer_user_id = auth.uid()
    or public.is_app_admin(auth.uid())
  );

drop policy if exists resource_order_items_select_party on public.resource_order_items;
create policy resource_order_items_select_party on public.resource_order_items
  for select using (
    seller_user_id = auth.uid()
    or exists (
      select 1
      from public.resource_orders o
      where o.id = order_id
        and o.buyer_user_id = auth.uid()
    )
    or public.is_app_admin(auth.uid())
  );

drop policy if exists resource_order_items_insert_admin on public.resource_order_items;
create policy resource_order_items_insert_admin on public.resource_order_items
  for insert with check (public.is_app_admin(auth.uid()));

drop policy if exists resource_order_items_update_admin on public.resource_order_items;
create policy resource_order_items_update_admin on public.resource_order_items
  for update using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

drop policy if exists resource_payment_attempts_select_party on public.resource_payment_attempts;
create policy resource_payment_attempts_select_party on public.resource_payment_attempts
  for select using (
    exists (
      select 1
      from public.resource_orders o
      where o.id = order_id
        and o.buyer_user_id = auth.uid()
    )
    or public.is_app_admin(auth.uid())
  );

drop policy if exists resource_payment_attempts_write_admin on public.resource_payment_attempts;
create policy resource_payment_attempts_write_admin on public.resource_payment_attempts
  for all using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

drop policy if exists resource_payout_accounts_select_owner on public.resource_payout_accounts;
create policy resource_payout_accounts_select_owner on public.resource_payout_accounts
  for select using (user_id = auth.uid() or public.is_app_admin(auth.uid()));

drop policy if exists resource_payout_accounts_insert_owner on public.resource_payout_accounts;
create policy resource_payout_accounts_insert_owner on public.resource_payout_accounts
  for insert with check (user_id = auth.uid() or public.is_app_admin(auth.uid()));

drop policy if exists resource_payout_accounts_update_owner on public.resource_payout_accounts;
create policy resource_payout_accounts_update_owner on public.resource_payout_accounts
  for update using (user_id = auth.uid() or public.is_app_admin(auth.uid()))
  with check (user_id = auth.uid() or public.is_app_admin(auth.uid()));

drop policy if exists resource_payout_ledger_select_party on public.resource_payout_ledger;
create policy resource_payout_ledger_select_party on public.resource_payout_ledger
  for select using (seller_user_id = auth.uid() or public.is_app_admin(auth.uid()));

drop policy if exists resource_payout_ledger_write_admin on public.resource_payout_ledger;
create policy resource_payout_ledger_write_admin on public.resource_payout_ledger
  for all using (public.is_app_admin(auth.uid()))
  with check (public.is_app_admin(auth.uid()));

select pg_notify('pgrst', 'reload schema');
