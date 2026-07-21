export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import {
  calculatePlatformFeeCents,
  calculateSellerNetCents,
  mapOrderRow,
  normaliseCurrencyCode,
  RESOURCE_ORDER_SELECT,
} from "@/lib/resourceCommerce";
import { getResourceAuthContext, parsePaginationParams } from "@/lib/resourceHubServer";
import { timedRoute } from "@/lib/apiTiming";

export async function GET(req) {
  return timedRoute("resources.orders.list", async () => {
    const sb = await supabaseServerClient();
    const { userId, isAdmin } = await getResourceAuthContext(sb);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(req.url);
    const { page, limit, rangeStart, rangeEnd } = parsePaginationParams(url, {
      defaultLimit: 80,
      maxLimit: 200,
    });

    let query = sb
      .from("resource_orders")
      .select(RESOURCE_ORDER_SELECT)
      .order("created_at", { ascending: false })
      .range(rangeStart, rangeEnd);

    if (!isAdmin) {
      query = query.eq("buyer_user_id", userId);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    const rows = data || [];
    const hasMore = rows.length > limit;

    return NextResponse.json({
      ok: true,
      orders: (hasMore ? rows.slice(0, limit) : rows).map(mapOrderRow),
      paging: { page, limit, hasMore },
    });
  });
}

export async function POST(req) {
  const sb = await supabaseServerClient();
  const adminSb = supabaseAdminClient();
  const { userId } = await getResourceAuthContext(sb);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const payload = await req.json().catch(() => ({}));
  const resourceIds = Array.from(new Set(Array.isArray(payload.resourceIds) ? payload.resourceIds.filter(Boolean) : []));

  if (!resourceIds.length) {
    return NextResponse.json({ ok: false, error: "resourceIds is required." }, { status: 400 });
  }

  const { data: resources, error: resourceError } = await adminSb
    .from("resources")
    .select("id, owner_user_id, title, slug, status, currency_code, price_cents")
    .in("id", resourceIds)
    .eq("status", "approved");

  if (resourceError) {
    return NextResponse.json({ ok: false, error: resourceError.message }, { status: 400 });
  }

  if (!resources || resources.length !== resourceIds.length) {
    return NextResponse.json({ ok: false, error: "One or more resources are unavailable." }, { status: 400 });
  }

  if (resources.some((resource) => resource.owner_user_id === userId)) {
    return NextResponse.json({ ok: false, error: "You cannot create an order for your own resource." }, { status: 400 });
  }

  const currencyCode = normaliseCurrencyCode(resources[0]?.currency_code);
  if (resources.some((resource) => normaliseCurrencyCode(resource.currency_code) !== currencyCode)) {
    return NextResponse.json({ ok: false, error: "All resources in an order must use the same currency." }, { status: 400 });
  }

  const items = resources.map((resource) => {
    const unitPriceCents = Number(resource.price_cents || 0);
    const lineTotalCents = unitPriceCents;
    const platformFeeCents = calculatePlatformFeeCents(lineTotalCents);
    const sellerNetCents = calculateSellerNetCents(lineTotalCents, platformFeeCents);
    return {
      resource_id: resource.id,
      seller_user_id: resource.owner_user_id,
      order_status: unitPriceCents > 0 ? "pending" : "paid",
      quantity: 1,
      unit_price_cents: unitPriceCents,
      line_total_cents: lineTotalCents,
      platform_fee_cents: platformFeeCents,
      seller_net_cents: sellerNetCents,
      currency_code: currencyCode,
    };
  });

  const subtotalCents = items.reduce((sum, item) => sum + item.line_total_cents, 0);
  const platformFeeCents = items.reduce((sum, item) => sum + item.platform_fee_cents, 0);
  const totalCents = subtotalCents;
  const isFreeOrder = totalCents === 0;

  const { data: order, error: orderError } = await adminSb
    .from("resource_orders")
    .insert({
      buyer_user_id: userId,
      status: isFreeOrder ? "paid" : "draft",
      subtotal_cents: subtotalCents,
      platform_fee_cents: platformFeeCents,
      total_cents: totalCents,
      currency_code: currencyCode,
      paid_at: isFreeOrder ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (orderError) {
    return NextResponse.json({ ok: false, error: orderError.message }, { status: 400 });
  }

  const { error: itemError } = await adminSb
    .from("resource_order_items")
    .insert(items.map((item) => ({ ...item, order_id: order.id, entitlement_granted_at: isFreeOrder ? new Date().toISOString() : null })));

  if (itemError) {
    return NextResponse.json({ ok: false, error: itemError.message }, { status: 400 });
  }

  if (isFreeOrder) {
    for (const item of items) {
      const { error: entitlementError } = await adminSb
        .from("resource_entitlements")
        .insert({
          user_id: userId,
          resource_id: item.resource_id,
          grant_source: "free",
          revoked_at: null,
        });

      if (entitlementError && entitlementError.code !== "23505") {
        return NextResponse.json({ ok: false, error: entitlementError.message }, { status: 400 });
      }
    }
  }

  const { data, error } = await adminSb
    .from("resource_orders")
    .select(RESOURCE_ORDER_SELECT)
    .eq("id", order.id)
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, order: mapOrderRow(data) }, { status: 201 });
}
