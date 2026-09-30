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
import { settlePaidResourceOrder } from "@/lib/resourceOrderSettlement";

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
      const paidAt = await settlePaidResourceOrder(adminSb, existing);
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
