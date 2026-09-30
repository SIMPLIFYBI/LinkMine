export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import {
  mapOrderRow,
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
  const { userId } = await getResourceAuthContext(sb);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const payload = await req.json().catch(() => ({}));
  const resourceIds = Array.from(new Set(Array.isArray(payload.resourceIds) ? payload.resourceIds.filter(Boolean) : []));

  if (!resourceIds.length) {
    return NextResponse.json({ ok: false, error: "resourceIds is required." }, { status: 400 });
  }

  const { data: orderId, error: createError } = await sb.rpc("create_resource_order", {
    p_resource_ids: resourceIds,
  });

  if (createError || !orderId) {
    return NextResponse.json({ ok: false, error: createError?.message || "Unable to create order." }, { status: 400 });
  }

  const { data, error } = await sb
    .from("resource_orders")
    .select(RESOURCE_ORDER_SELECT)
    .eq("id", orderId)
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, order: mapOrderRow(data) }, { status: 201 });
}
