import {
  isValidResourceOrderItemStatus,
  isValidResourceOrderStatus,
  isValidResourcePaymentAttemptStatus,
  isValidResourcePayoutAccountStatus,
  isValidResourcePayoutLedgerStatus,
} from "@/lib/resourceHub";

export const RESOURCE_PLATFORM_FEE_BPS = 1500;

export const RESOURCE_ORDER_SELECT = `
  id,
  buyer_user_id,
  status,
  payment_provider,
  provider_checkout_id,
  provider_payment_intent_id,
  subtotal_cents,
  platform_fee_cents,
  total_cents,
  currency_code,
  paid_at,
  cancelled_at,
  refunded_at,
  created_at,
  updated_at,
  resource_order_items (
    id,
    order_id,
    resource_id,
    seller_user_id,
    order_status,
    quantity,
    unit_price_cents,
    line_total_cents,
    platform_fee_cents,
    seller_net_cents,
    currency_code,
    entitlement_granted_at,
    created_at,
    updated_at,
    resources (
      id,
      title,
      slug,
      resource_type,
      status
    )
  )
`;

export function calculatePlatformFeeCents(amountCents, feeBps = RESOURCE_PLATFORM_FEE_BPS) {
  const value = Number(amountCents || 0);
  return Math.max(0, Math.round((value * feeBps) / 10000));
}

export function calculateSellerNetCents(amountCents, feeCents) {
  return Math.max(0, Number(amountCents || 0) - Number(feeCents || 0));
}

export function normaliseCurrencyCode(value, fallback = "AUD") {
  const cleaned = typeof value === "string" ? value.trim().toUpperCase() : "";
  return /^[A-Z]{3}$/.test(cleaned) ? cleaned : fallback;
}

export function mapOrderItemRow(row) {
  return {
    id: row.id,
    orderId: row.order_id,
    resourceId: row.resource_id,
    sellerUserId: row.seller_user_id,
    orderStatus: row.order_status,
    quantity: row.quantity,
    unitPriceCents: row.unit_price_cents,
    lineTotalCents: row.line_total_cents,
    platformFeeCents: row.platform_fee_cents,
    sellerNetCents: row.seller_net_cents,
    currencyCode: row.currency_code,
    entitlementGrantedAt: row.entitlement_granted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resource: row.resources
      ? {
          id: row.resources.id,
          title: row.resources.title,
          slug: row.resources.slug,
          resourceType: row.resources.resource_type,
          status: row.resources.status,
        }
      : null,
  };
}

export function mapOrderRow(row) {
  return {
    id: row.id,
    buyerUserId: row.buyer_user_id,
    status: row.status,
    paymentProvider: row.payment_provider,
    providerCheckoutId: row.provider_checkout_id,
    providerPaymentIntentId: row.provider_payment_intent_id,
    subtotalCents: row.subtotal_cents,
    platformFeeCents: row.platform_fee_cents,
    totalCents: row.total_cents,
    currencyCode: row.currency_code,
    paidAt: row.paid_at,
    cancelledAt: row.cancelled_at,
    refundedAt: row.refunded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: Array.isArray(row.resource_order_items)
      ? row.resource_order_items.map(mapOrderItemRow)
      : [],
  };
}

export function mapPayoutAccountRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider,
    providerAccountId: row.provider_account_id,
    status: row.status,
    countryCode: row.country_code,
    currencyCode: row.currency_code,
    details: row.details || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPayoutLedgerRow(row) {
  return {
    id: row.id,
    orderItemId: row.order_item_id,
    sellerUserId: row.seller_user_id,
    payoutAccountId: row.payout_account_id,
    entryType: row.entry_type,
    status: row.status,
    grossCents: row.gross_cents,
    platformFeeCents: row.platform_fee_cents,
    netCents: row.net_cents,
    currencyCode: row.currency_code,
    availableAt: row.available_at,
    paidAt: row.paid_at,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function canBuyerEditOrder(status) {
  return status === "draft" || status === "pending";
}

export function canAdminSetOrderStatus(status) {
  return isValidResourceOrderStatus(status);
}

export function isValidCommerceState(value, kind) {
  if (kind === "order") return isValidResourceOrderStatus(value);
  if (kind === "order_item") return isValidResourceOrderItemStatus(value);
  if (kind === "payment_attempt") return isValidResourcePaymentAttemptStatus(value);
  if (kind === "payout_account") return isValidResourcePayoutAccountStatus(value);
  if (kind === "payout_ledger") return isValidResourcePayoutLedgerStatus(value);
  return false;
}
