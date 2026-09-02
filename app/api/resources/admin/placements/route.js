export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { cleanText, getResourceAuthContext } from "@/lib/resourceHubServer";

const MAX_FEATURED_RESOURCES = 3;
const PLACEMENT_KEY = "vault_home";

function normalizeIdArray(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const ids = [];
  for (const raw of value) {
    const id = cleanText(raw);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

async function listPlacementRows(sb) {
  const { data, error } = await sb
    .from("resources")
    .select("id, title, slug, summary, resource_format, status, is_featured, updated_at")
    .eq("status", "approved")
    .order("is_featured", { ascending: false })
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("title", { ascending: true });

  if (error) {
    throw new Error(error.message || "Unable to load resources.");
  }

  let homeBannerResourceId = null;
  const { data: placementData, error: placementError } = await sb
    .from("resource_homepage_placements")
    .select("hero_resource_id")
    .eq("placement_key", PLACEMENT_KEY)
    .maybeSingle();

  if (placementError) {
    throw new Error(placementError.message || "Unable to load placement settings.");
  }

  homeBannerResourceId = placementData?.hero_resource_id || null;

  return {
    resources: (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      summary: row.summary,
      resourceFormat: row.resource_format,
      isFeatured: Boolean(row.is_featured),
      updatedAt: row.updated_at,
    })),
    homeBannerResourceId,
  };
}

export async function GET() {
  const sb = await supabaseServerClient();
  const { user, isAdmin } = await getResourceAuthContext(sb);

  if (!user) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const payload = await listPlacementRows(sb);
    return NextResponse.json({ ok: true, ...payload });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || "Unable to load placement settings." }, { status: 400 });
  }
}

export async function PUT(req) {
  const sb = await supabaseServerClient();
  const { userId, isAdmin } = await getResourceAuthContext(sb);

  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const featuredResourceIds = normalizeIdArray(body?.featuredResourceIds);
  const homeBannerResourceId = cleanText(body?.homeBannerResourceId) || null;

  if (featuredResourceIds.length > MAX_FEATURED_RESOURCES) {
    return NextResponse.json(
      { ok: false, error: `You can feature up to ${MAX_FEATURED_RESOURCES} resources.` },
      { status: 400 }
    );
  }

  const requestedIds = Array.from(new Set([
    ...featuredResourceIds,
    ...(homeBannerResourceId ? [homeBannerResourceId] : []),
  ]));

  if (requestedIds.length) {
    const { data: approvedRows, error: approvedError } = await sb
      .from("resources")
      .select("id")
      .eq("status", "approved")
      .in("id", requestedIds);

    if (approvedError) {
      return NextResponse.json({ ok: false, error: approvedError.message }, { status: 400 });
    }

    const approvedIds = new Set((approvedRows || []).map((row) => row.id));
    const invalidId = requestedIds.find((id) => !approvedIds.has(id));
    if (invalidId) {
      return NextResponse.json({ ok: false, error: "Selected resources must be approved before placement." }, { status: 400 });
    }
  }

  const nowIso = new Date().toISOString();

  const { error: clearFeaturedError } = await sb
    .from("resources")
    .update({ is_featured: false, updated_at: nowIso })
    .eq("status", "approved");

  if (clearFeaturedError) {
    return NextResponse.json({ ok: false, error: clearFeaturedError.message }, { status: 400 });
  }

  if (featuredResourceIds.length) {
    const { error: setFeaturedError } = await sb
      .from("resources")
      .update({ is_featured: true, updated_at: nowIso })
      .in("id", featuredResourceIds)
      .eq("status", "approved");

    if (setFeaturedError) {
      return NextResponse.json({ ok: false, error: setFeaturedError.message }, { status: 400 });
    }
  }

  const { error: placementError } = await sb
    .from("resource_homepage_placements")
    .upsert({
      placement_key: PLACEMENT_KEY,
      hero_resource_id: homeBannerResourceId,
      updated_by: userId,
      updated_at: nowIso,
    }, { onConflict: "placement_key" });

  if (placementError) {
    return NextResponse.json({ ok: false, error: placementError.message }, { status: 400 });
  }

  try {
    const payload = await listPlacementRows(sb);
    return NextResponse.json({ ok: true, ...payload });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || "Unable to load placement settings." }, { status: 400 });
  }
}
