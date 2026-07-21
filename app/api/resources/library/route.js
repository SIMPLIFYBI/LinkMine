export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { buildResourceRoutePayload, getResourceAuthContext, parsePaginationParams } from "@/lib/resourceHubServer";
import { timedRoute } from "@/lib/apiTiming";

const LIBRARY_SELECT = `
  id,
  owner_user_id,
  category_id,
  title,
  slug,
  summary,
  description,
  resource_type,
  status,
  source_name,
  source_url,
  license_name,
  license_url,
  estimated_size_bytes,
  price_cents,
  currency_code,
  download_count,
  is_featured,
  submitted_at,
  approved_at,
  approved_by,
  rejected_at,
  rejection_notes,
  created_at,
  updated_at,
  resource_categories ( id, name, slug ),
  resource_tag_links ( resource_tags ( id, name, slug ) ),
  resource_assets ( id, bucket_name, object_path, original_filename, file_ext, mime_type, size_bytes, version_no, is_current, created_at )
`;

export async function GET(req) {
  return timedRoute("resources.library.list", async () => {
    const sb = await supabaseServerClient();
    const { userId } = await getResourceAuthContext(sb);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(req.url);
    const { page, limit } = parsePaginationParams(url, {
      defaultLimit: 100,
      maxLimit: 250,
    });

    const { data: entitlementRows, error: entitlementError } = await sb
      .from("resource_entitlements")
      .select("resource_id")
      .eq("user_id", userId)
      .is("revoked_at", null);

    if (entitlementError) {
      return NextResponse.json({ ok: false, error: entitlementError.message }, { status: 400 });
    }

    const entitledIds = Array.from(new Set((entitlementRows || []).map((row) => row.resource_id).filter(Boolean)));

    const ownedQuery = sb
      .from("resources")
      .select(LIBRARY_SELECT)
      .eq("owner_user_id", userId)
      .neq("status", "archived")
      .order("updated_at", { ascending: false })
      .limit(limit + 1);

    const entitledQuery = entitledIds.length
      ? sb
        .from("resources")
        .select(LIBRARY_SELECT)
        .in("id", entitledIds)
        .eq("status", "approved")
        .order("updated_at", { ascending: false })
        .limit(limit + 1)
      : Promise.resolve({ data: [], error: null });

    const [ownedResult, entitledResult] = await Promise.all([ownedQuery, entitledQuery]);

    if (ownedResult.error) {
      return NextResponse.json({ ok: false, error: ownedResult.error.message }, { status: 400 });
    }

    if (entitledResult.error) {
      return NextResponse.json({ ok: false, error: entitledResult.error.message }, { status: 400 });
    }

    const byId = new Map();
    for (const row of [...(ownedResult.data || []), ...(entitledResult.data || [])]) {
      byId.set(row.id, row);
    }

    const entitledIdSet = new Set(entitledIds);
    const merged = Array.from(byId.values())
      .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime());
    const hasMore = merged.length > limit;
    const rows = hasMore ? merged.slice(0, limit) : merged;

    const resources = rows.map((row) => ({
      ...buildResourceRoutePayload(row, row.resource_tag_links || []),
      currentAsset: Array.isArray(row.resource_assets)
        ? row.resource_assets.find((asset) => asset.is_current) || null
        : null,
      ownedByUser: row.owner_user_id === userId,
      entitledByUser: entitledIdSet.has(row.id) || row.owner_user_id === userId,
    }));

    return NextResponse.json({ ok: true, resources, paging: { page, limit, hasMore } });
  });
}
