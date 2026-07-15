export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import {
  canAdminSetOrderStatus,
  canBuyerEditOrder,
  mapOrderRow,
  mapOrderItemRow,
  RESOURCE_ORDER_SELECT,
} from "@/lib/resourceCommerce";
import { cleanText, getResourceAuthContext } from "@/lib/resourceHubServer";

async function grantPaidOrderEntitlements(adminSb, order) {
  const paidAt = new Date().toISOString();

  for (const item of order.resource_order_items || []) {
    const { error: entitlementError } = await adminSb
      .from("resource_entitlements")
      .insert({
        user_id: order.buyer_user_id,
        resource_id: item.resource_id,
        grant_source: "purchase",
        revoked_at: null,
      });

    if (entitlementError && entitlementError.code !== "23505") {
      throw new Error(entitlementError.message || "Failed to grant entitlement.");
    }

    await adminSb
      .from("resource_order_items")
      .update({
        order_status: "paid",
        entitlement_granted_at: item.entitlement_granted_at || paidAt,
      })
      .eq("id", item.id);

    const { error: payoutError } = await adminSb
      .from("resource_payout_ledger")
      .insert({
        order_item_id: item.id,
        seller_user_id: item.seller_user_id,
        entry_type: "earning",
        status: item.seller_net_cents > 0 ? "available" : "pending",
        gross_cents: item.line_total_cents,
        platform_fee_cents: item.platform_fee_cents,
        net_cents: item.seller_net_cents,
        currency_code: item.currency_code,
        available_at: paidAt,
        metadata: { orderId: order.id, resourceId: item.resource_id },
      });

    if (payoutError && payoutError.code !== "23505") {
      throw new Error(payoutError.message || "Failed to create payout ledger entry.");
    }
  }

  return paidAt;
}

export async function GET(_req, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing order id." }, { status: 400 });
  }

  const sb = await supabaseServerClient();
  const { userId, isAdmin } = await getResourceAuthContext(sb);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  let query = sb.from("resource_orders").select(RESOURCE_ORDER_SELECT).eq("id", id);
  if (!isAdmin) {
    query = query.eq("buyer_user_id", userId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, order: mapOrderRow(data) });
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing order id." }, { status: 400 });
  }

  const sb = await supabaseServerClient();
  const adminSb = supabaseAdminClient();
  const { userId, isAdmin } = await getResourceAuthContext(sb);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const { data: existing, error: existingError } = await adminSb
    .from("resource_orders")
    .select(RESOURCE_ORDER_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ ok: false, error: existingError.message }, { status: 400 });
  }

  if (!existing) {
    return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
  }

  if (existing.buyer_user_id !== userId && !isAdmin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const payload = await req.json().catch(() => ({}));
  const nextStatus = cleanText(payload.status);
  const provider = cleanText(payload.paymentProvider) || null;
  const checkoutId = cleanText(payload.providerCheckoutId) || null;
  const paymentIntentId = cleanText(payload.providerPaymentIntentId) || null;

  const update = {};

  if (nextStatus) {
    if (isAdmin) {
      if (!canAdminSetOrderStatus(nextStatus)) {
        return NextResponse.json({ ok: false, error: "Invalid order status." }, { status: 400 });
      }
      update.status = nextStatus;
    } else {
      if (!canBuyerEditOrder(existing.status) || !["cancelled", "pending"].includes(nextStatus)) {
        return NextResponse.json({ ok: false, error: "Buyer cannot set that order status." }, { status: 403 });
      }
      update.status = nextStatus;
    }
  }

  if (provider !== null && isAdmin) update.payment_provider = provider;
  if (checkoutId !== null && isAdmin) update.provider_checkout_id = checkoutId;
  if (paymentIntentId !== null && isAdmin) update.provider_payment_intent_id = paymentIntentId;

  if (update.status === "paid" && !existing.paid_at) {
    try {
      const paidAt = await grantPaidOrderEntitlements(adminSb, existing);
      update.paid_at = paidAt;
      await adminSb
        .from("resource_payment_attempts")
        .insert({
          order_id: existing.id,
          provider: provider || existing.payment_provider || "manual",
          provider_reference: paymentIntentId || existing.provider_payment_intent_id || checkoutId || existing.provider_checkout_id || existing.id,
          status: "succeeded",
          amount_cents: existing.total_cents,
          currency_code: existing.currency_code,
          response_payload: { source: "manual-status-update" },
        });
    } catch (error) {
      return NextResponse.json({ ok: false, error: error.message || "Failed to settle order." }, { status: 400 });
    }
  }

  if (update.status === "cancelled") {
    update.cancelled_at = new Date().toISOString();
  }

  if (update.status === "refunded") {
    update.refunded_at = new Date().toISOString();
  }

  if (!Object.keys(update).length) {
    return NextResponse.json({ ok: false, error: "No changes provided." }, { status: 400 });
  }

  const { data, error } = await adminSb
    .from("resource_orders")
    .update(update)
    .eq("id", id)
    .select(RESOURCE_ORDER_SELECT)
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, order: mapOrderRow(data) });
}
