export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { calculatePlatformFeeCents, RESOURCE_ORDER_SELECT } from "@/lib/resourceCommerce";
import { getResourceAuthContext } from "@/lib/resourceHubServer";
import { siteUrl } from "@/lib/siteUrl";
import { getStripe, stripeV2Request } from "@/lib/stripe";
import { timedRoute } from "@/lib/apiTiming";

function payoutStatus(account) {
  const transfers = account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers;
  if (transfers?.status === "active") return "active";
  if (transfers?.status === "inactive" || account.requirements?.disabled_reason) return "disabled";
  return "pending";
}

async function retrieveStripeAccount(accountId) {
  const query = new URLSearchParams();
  query.append("include", "configuration.recipient");
  query.append("include", "requirements");
  return stripeV2Request(`/v2/core/accounts/${accountId}?${query.toString()}`);
}

export async function POST(req, { params }) {
  return timedRoute("resources.orders.checkout", async () => {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing order id." }, { status: 400 });
    }

    const authorization = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    const sb = await supabaseServerClient({ global: { headers: { Authorization: authorization } } });
    const { userId } = await getResourceAuthContext(sb);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    const { data: order, error: orderError } = await sb
      .from("resource_orders")
      .select(RESOURCE_ORDER_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json({ ok: false, error: orderError.message }, { status: 400 });
    }
    if (!order || order.buyer_user_id !== userId) {
      return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
    }
    if (order.status !== "draft") {
      return NextResponse.json({ ok: false, error: "Only draft orders can start Checkout." }, { status: 400 });
    }

    const items = order.resource_order_items || [];
    if (!items.length || Number(order.total_cents) <= 0) {
      return NextResponse.json({ ok: false, error: "Only paid orders can use Stripe Checkout." }, { status: 400 });
    }

    const sellerIds = Array.from(new Set(items.map((item) => item.seller_user_id).filter(Boolean)));
    if (sellerIds.length !== 1) {
      return NextResponse.json({ ok: false, error: "An order must contain resources from one seller." }, { status: 400 });
    }

    const subtotalCents = items.reduce((sum, item) => sum + Number(item.line_total_cents || 0), 0);
    const platformFeeCents = items.reduce(
      (sum, item) => sum + calculatePlatformFeeCents(item.line_total_cents),
      0
    );
    if (subtotalCents !== Number(order.total_cents) || platformFeeCents !== Number(order.platform_fee_cents)) {
      return NextResponse.json({ ok: false, error: "Order totals are invalid. Create a new order and try again." }, { status: 400 });
    }

    const { data: payoutAccount, error: payoutError } = await sb
      .from("resource_payout_accounts")
      .select("id, provider_account_id, status")
      .eq("user_id", sellerIds[0])
      .eq("provider", "stripe")
      .maybeSingle();

    if (payoutError) {
      return NextResponse.json({ ok: false, error: payoutError.message }, { status: 400 });
    }
    if (!payoutAccount) {
      return NextResponse.json({ ok: false, error: "The seller has not connected Stripe payouts." }, { status: 400 });
    }

    const stripeAccount = await retrieveStripeAccount(payoutAccount.provider_account_id);
    if (payoutStatus(stripeAccount) !== "active") {
      return NextResponse.json({ ok: false, error: "The seller's Stripe account is not ready to receive transfers." }, { status: 400 });
    }

    if (payoutAccount.status !== "active") {
          const { error: updatePayoutError } = await sb
        .from("resource_payout_accounts")
        .update({ status: "active" })
        .eq("id", payoutAccount.id);
      if (updatePayoutError) {
        return NextResponse.json({ ok: false, error: updatePayoutError.message }, { status: 400 });
      }
    }

    const currency = String(order.currency_code || "AUD").toLowerCase();
    const resourceId = items[0]?.resource_id;
    if (!resourceId) {
      return NextResponse.json({ ok: false, error: "Order is missing its resource." }, { status: 400 });
    }
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: items.map((item) => ({
        price_data: {
          currency,
          product_data: { name: item.resources?.title || "Vault resource" },
          unit_amount: Number(item.unit_price_cents),
        },
        quantity: Number(item.quantity || 1),
      })),
      payment_intent_data: {
        application_fee_amount: platformFeeCents,
        transfer_data: { destination: payoutAccount.provider_account_id },
        metadata: { resource_order_id: order.id, seller_user_id: sellerIds[0] },
      },
      metadata: { resource_order_id: order.id, seller_user_id: sellerIds[0] },
      client_reference_id: order.id,
      success_url: siteUrl(`/vault/${encodeURIComponent(resourceId)}?checkout=success&order_id=${encodeURIComponent(order.id)}&session_id={CHECKOUT_SESSION_ID}`, req),
      cancel_url: siteUrl(`/vault/${encodeURIComponent(resourceId)}?checkout=cancelled&order_id=${encodeURIComponent(order.id)}`, req),
    });

    if (!session.url) {
      return NextResponse.json({ ok: false, error: "Stripe did not return a Checkout URL." }, { status: 400 });
    }

    const { error: updateOrderError } = await sb
      .from("resource_orders")
      .update({
        status: "pending",
        payment_provider: "stripe",
        provider_checkout_id: session.id,
      })
      .eq("id", order.id);

    if (updateOrderError) {
      return NextResponse.json({ ok: false, error: updateOrderError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, checkoutSessionId: session.id, url: session.url });
  });
}