export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import {
  buildResourceRoutePayload,
  cleanText,
  DEFAULT_RESOURCE_SELECT,
  getResourceAuthContext,
  parsePaginationParams,
  RESOURCE_CARD_SELECT,
  isValidResourceStatus,
  isValidResourceType,
} from "@/lib/resourceHubServer";
import { timedRoute } from "@/lib/apiTiming";

export async function GET(req) {
  return timedRoute("resources.review.list", async () => {
    const sb = await supabaseServerClient();
    const { user, isAdmin } = await getResourceAuthContext(sb);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const status = cleanText(url.searchParams.get("status")) || "pending";
    const resourceType = cleanText(url.searchParams.get("type"));
    const view = cleanText(url.searchParams.get("view"));
    const { page, limit, rangeStart, rangeEnd } = parsePaginationParams(url, {
      defaultLimit: 80,
      maxLimit: 200,
    });

    let query = sb
      .from("resources")
      .select(view === "card" ? RESOURCE_CARD_SELECT : DEFAULT_RESOURCE_SELECT)
      .order("submitted_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })
      .range(rangeStart, rangeEnd);

    if (isValidResourceStatus(status)) {
      query = query.eq("status", status);
    }

    if (isValidResourceType(resourceType)) {
      query = query.eq("resource_type", resourceType);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    const rows = data || [];
    const hasMore = rows.length > limit;

    return NextResponse.json({
      ok: true,
      resources: (hasMore ? rows.slice(0, limit) : rows)
        .map((row) => buildResourceRoutePayload(row, row.resource_tag_links || [])),
      paging: { page, limit, hasMore },
    });
  });
}
