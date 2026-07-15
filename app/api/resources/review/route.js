export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import {
  buildResourceRoutePayload,
  cleanText,
  DEFAULT_RESOURCE_SELECT,
  getResourceAuthContext,
  isValidResourceStatus,
  isValidResourceType,
} from "@/lib/resourceHubServer";

export async function GET(req) {
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

  let query = sb
    .from("resources")
    .select(DEFAULT_RESOURCE_SELECT)
    .order("submitted_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

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

  return NextResponse.json({
    ok: true,
    resources: (data || []).map((row) => buildResourceRoutePayload(row, row.resource_tag_links || [])),
  });
}
