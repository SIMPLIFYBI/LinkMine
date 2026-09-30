export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { calculatePlatformFeeCents, calculateSellerNetCents } from "@/lib/resourceCommerce";

const SANDBOX = {
  slug: "dev-stripe-checkout-sandbox-resource",
  sourceUrl: "https://example.com/dev-stripe-checkout-sandbox",
  title: "DEV Stripe Checkout Test Resource",
  priceCents: 100,
};

async function getAdminContext(req) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  const sb = await supabaseServerClient({ global: { headers: { Authorization: authHeader || "" } } });
  let user = null;

  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const { data } = await sb.auth.getUser(authHeader.slice(7).trim());
    user = data?.user || null;
  }
  if (!user) {
    const { data } = await sb.auth.getUser();
    user = data?.user || null;
  }
  if (!user) return { ok: false, status: 401, error: "Not authenticated" };

  const [{ data: adminRow }, email] = await Promise.all([
    sb.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    Promise.resolve(user.email?.toLowerCase() || ""),
  ]);
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (!adminRow && !adminEmails.includes(email)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  return { ok: true, user, sb };
}

export async function POST(req) {
  try {
    const adminCheck = await getAdminContext(req);
    if (!adminCheck.ok) {
      return NextResponse.json({ ok: false, error: adminCheck.error }, { status: adminCheck.status });
    }

    const { user, sb } = adminCheck;
    const { data: payoutAccount, error: payoutError } = await sb
      .from("resource_payout_accounts")
      .select("id")
      .eq("user_id", user.id)
      .eq("provider", "stripe")
      .eq("status", "active")
      .maybeSingle();

    if (payoutError) throw new Error(payoutError.message || "Could not load Stripe payout status.");
    if (!payoutAccount) {
      return NextResponse.json({ ok: false, error: "Connect and activate Stripe payouts before creating a Checkout test." }, { status: 400 });
    }

    const { data: existingResource, error: resourceLookupError } = await sb
      .from("resources")
      .select("id, owner_user_id, source_url")
      .eq("slug", SANDBOX.slug)
      .maybeSingle();
    if (resourceLookupError) throw new Error(resourceLookupError.message || "Could not load Checkout sandbox resource.");
    if (existingResource && existingResource.source_url !== SANDBOX.sourceUrl) {
      return NextResponse.json({ ok: false, error: "The Checkout sandbox slug is already used by a non-sandbox resource." }, { status: 409 });
    }

    const resourcePayload = {
      owner_user_id: user.id,
      title: SANDBOX.title,
      slug: SANDBOX.slug,
      summary: "Developer-only paid listing used to test Stripe Checkout and webhook settlement.",
      description: "This sandbox listing is managed by Dev Tools and must not be used as marketplace content.",
      resource_type: "external",
      resource_format: "website",
      status: "approved",
      source_name: "YouMine Dev Tools",
      source_url: SANDBOX.sourceUrl,
      price_cents: SANDBOX.priceCents,
      currency_code: "AUD",
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    };
    const { data: resource, error: resourceError } = await sb
      .from("resources")
      .upsert(resourcePayload, { onConflict: "slug" })
      .select("id")
      .single();
    if (resourceError || !resource?.id) throw new Error(resourceError?.message || "Could not create Checkout sandbox resource.");

    const platformFeeCents = calculatePlatformFeeCents(SANDBOX.priceCents);
    const sellerNetCents = calculateSellerNetCents(SANDBOX.priceCents, platformFeeCents);
    const { data: order, error: orderError } = await sb
      .from("resource_orders")
      .insert({
        buyer_user_id: user.id,
        status: "draft",
        subtotal_cents: SANDBOX.priceCents,
        platform_fee_cents: platformFeeCents,
        total_cents: SANDBOX.priceCents,
        currency_code: "AUD",
      })
      .select("id")
      .single();
    if (orderError || !order?.id) throw new Error(orderError?.message || "Could not create Checkout sandbox order.");

    const { error: itemError } = await sb.from("resource_order_items").insert({
      order_id: order.id,
      resource_id: resource.id,
      seller_user_id: user.id,
      order_status: "pending",
      quantity: 1,
      unit_price_cents: SANDBOX.priceCents,
      line_total_cents: SANDBOX.priceCents,
      platform_fee_cents: platformFeeCents,
      seller_net_cents: sellerNetCents,
      currency_code: "AUD",
    });
    if (itemError) throw new Error(itemError.message || "Could not create Checkout sandbox order item.");

    return NextResponse.json({ ok: true, resourceId: resource.id, orderId: order.id });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error?.message || "Unable to set up Stripe Checkout sandbox." }, { status: 500 });
  }
}