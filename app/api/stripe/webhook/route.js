export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { getStripe } from "@/lib/stripe";

async function settleCheckoutSession(session) {
  if (session.payment_status !== "paid") return;

  const orderId = session.metadata?.resource_order_id;
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!orderId || !paymentIntentId) {
    throw new Error("Checkout Session is missing resource order payment metadata.");
  }

  const sb = await supabaseServerClient();
  const { error } = await sb.rpc("settle_stripe_resource_order", {
    p_order_id: orderId,
    p_checkout_session_id: session.id,
    p_payment_intent_id: paymentIntentId,
    p_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
  });
  if (error) throw new Error(error.message || "Failed to settle Stripe payment.");
}

export async function POST(req) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ ok: false, error: "Stripe webhook configuration is missing." }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(await req.text(), signature, webhookSecret);
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || "Invalid Stripe signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await settleCheckoutSession(event.data.object);
    }
  } catch (error) {
    console.error("[stripe.webhook] Checkout settlement failed", { eventId: event.id, error });
    return NextResponse.json({ ok: false, error: "Unable to settle Stripe Checkout payment." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}