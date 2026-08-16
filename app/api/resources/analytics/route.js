export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { getResourceAuthContext } from "@/lib/resourceHubServer";

function toPositiveInt(value, fallback, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(max, Math.trunc(parsed));
}

export async function GET(req) {
  const sb = await supabaseServerClient();
  const { userId, isAdmin } = await getResourceAuthContext(sb);

  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const limit = toPositiveInt(url.searchParams.get("limit"), 10, 50);
  const days = toPositiveInt(url.searchParams.get("days"), 30, 365);
  const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data: topRows, error: topError } = await sb
    .from("resources")
    .select("id, title, slug, status, open_count")
    .eq("status", "approved")
    .order("open_count", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (topError) {
    return NextResponse.json({ ok: false, error: topError.message }, { status: 400 });
  }

  const resourceIds = (topRows || []).map((row) => row.id).filter(Boolean);

  let uniqueByResource = new Map();
  if (resourceIds.length) {
    const { data: recentEvents, error: eventsError } = await sb
      .from("resource_open_events")
      .select("resource_id, user_id")
      .in("resource_id", resourceIds)
      .gte("opened_at", sinceIso);

    if (eventsError) {
      return NextResponse.json({ ok: false, error: eventsError.message }, { status: 400 });
    }

    const distinctMap = new Map();
    (recentEvents || []).forEach((row) => {
      const resourceId = row?.resource_id;
      const userIdValue = row?.user_id;
      if (!resourceId || !userIdValue) return;
      if (!distinctMap.has(resourceId)) distinctMap.set(resourceId, new Set());
      distinctMap.get(resourceId).add(userIdValue);
    });

    uniqueByResource = new Map(Array.from(distinctMap.entries()).map(([resourceId, set]) => [resourceId, set.size]));
  }

  const { count: totalEventsCount, error: totalEventsError } = await sb
    .from("resource_open_events")
    .select("id", { count: "exact", head: true });

  if (totalEventsError) {
    return NextResponse.json({ ok: false, error: totalEventsError.message }, { status: 400 });
  }

  const { data: globalRecentEvents, error: globalRecentError } = await sb
    .from("resource_open_events")
    .select("user_id")
    .gte("opened_at", sinceIso);

  if (globalRecentError) {
    return NextResponse.json({ ok: false, error: globalRecentError.message }, { status: 400 });
  }

  const uniqueOpenersWindow = new Set((globalRecentEvents || []).map((row) => row?.user_id).filter(Boolean)).size;

  return NextResponse.json({
    ok: true,
    windowDays: days,
    totals: {
      totalOpenEvents: Number(totalEventsCount || 0),
      uniqueOpenersInWindow: uniqueOpenersWindow,
      openEventsInWindow: (globalRecentEvents || []).length,
    },
    leaderboard: (topRows || []).map((row, index) => ({
      rank: index + 1,
      resourceId: row.id,
      title: row.title,
      slug: row.slug,
      status: row.status,
      totalOpens: Number(row.open_count || 0),
      uniqueOpenersInWindow: Number(uniqueByResource.get(row.id) || 0),
    })),
  });
}
