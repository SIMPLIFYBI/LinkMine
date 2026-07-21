export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import {
  cleanNullableText,
  cleanText,
  getResourceAuthContext,
  isValidResourceRequestStatus,
  parsePaginationParams,
} from "@/lib/resourceHubServer";
import { timedRoute } from "@/lib/apiTiming";

function mapRequestRow(row) {
  return {
    id: row.id,
    requesterUserId: row.requester_user_id,
    fulfillerUserId: row.fulfiller_user_id,
    fulfilledResourceId: row.fulfilled_resource_id,
    title: row.title,
    specifications: row.specifications,
    bountyCents: row.bounty_cents,
    currencyCode: row.currency_code,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    claimedAt: row.claimed_at,
    completedAt: row.completed_at,
  };
}

export async function GET(req) {
  return timedRoute("resources.requests.list", async () => {
    const sb = await supabaseServerClient();
    const { user, userId } = await getResourceAuthContext(sb);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(req.url);
    const mineOnly = url.searchParams.get("mine") === "1";
    const status = cleanText(url.searchParams.get("status"));
    const { page, limit, rangeStart, rangeEnd } = parsePaginationParams(url, {
      defaultLimit: 80,
      maxLimit: 200,
    });

    let query = sb
      .from("resource_requests")
      .select("id, requester_user_id, fulfiller_user_id, fulfilled_resource_id, title, specifications, bounty_cents, currency_code, status, created_at, updated_at, claimed_at, completed_at")
      .order("created_at", { ascending: false })
      .range(rangeStart, rangeEnd);

    if (mineOnly) {
      query = query.or(`requester_user_id.eq.${userId},fulfiller_user_id.eq.${userId}`);
    }

    if (isValidResourceRequestStatus(status)) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    const rows = data || [];
    const hasMore = rows.length > limit;

    return NextResponse.json({
      ok: true,
      requests: (hasMore ? rows.slice(0, limit) : rows).map(mapRequestRow),
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
  const title = cleanText(payload.title);
  const specifications = cleanText(payload.specifications);
  const bountyCents = Number.isFinite(Number(payload.bountyCents)) && Number(payload.bountyCents) >= 0
    ? Math.trunc(Number(payload.bountyCents))
    : 0;
  const currencyCode = cleanText(payload.currencyCode || "AUD").toUpperCase() || "AUD";

  if (!title) {
    return NextResponse.json({ ok: false, error: "Title is required." }, { status: 400 });
  }

  if (!specifications) {
    return NextResponse.json({ ok: false, error: "Specifications are required." }, { status: 400 });
  }

  const { data, error } = await sb
    .from("resource_requests")
    .insert({
      requester_user_id: userId,
      title,
      specifications,
      bounty_cents: bountyCents,
      currency_code: currencyCode,
      status: "open",
    })
    .select("id, requester_user_id, fulfiller_user_id, fulfilled_resource_id, title, specifications, bounty_cents, currency_code, status, created_at, updated_at, claimed_at, completed_at")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, request: mapRequestRow(data) }, { status: 201 });
}
