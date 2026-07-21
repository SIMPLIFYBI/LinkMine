export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { mapOrderRow, mapPayoutAccountRow, mapPayoutLedgerRow, RESOURCE_ORDER_SELECT } from "@/lib/resourceCommerce";
import {
  buildResourceRoutePayload,
  DEFAULT_RESOURCE_SELECT,
  getResourceAuthContext,
  parsePaginationParams,
} from "@/lib/resourceHubServer";
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
  return timedRoute("resources.account", async () => {
    const sb = await supabaseServerClient();
    const { userId, isAdmin } = await getResourceAuthContext(sb);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    const requestUrl = new URL(req.url);
    const incomingParams = requestUrl.searchParams;

    function sectionLimit(name, defaultLimit, maxLimit) {
      const sectionUrl = new URL("http://localhost");
      const value = incomingParams.get(`${name}Limit`);
      if (value) {
        sectionUrl.searchParams.set("limit", value);
      }
      return parsePaginationParams(sectionUrl, { defaultLimit, maxLimit }).limit;
    }

    const libraryLimit = sectionLimit("library", 80, 200);
    const createdLimit = sectionLimit("created", 80, 200);
    const ordersLimit = sectionLimit("orders", 80, 200);
    const payoutLedgerLimit = sectionLimit("payoutLedger", 120, 300);
    const tagsLimit = sectionLimit("tags", 80, 200);

    const entitlementQuery = sb
      .from("resource_entitlements")
      .select("resource_id")
      .eq("user_id", userId)
      .is("revoked_at", null);

    const ownedResourcesQuery = sb
      .from("resources")
      .select(LIBRARY_SELECT)
      .eq("owner_user_id", userId)
      .neq("status", "archived")
      .order("updated_at", { ascending: false })
      .limit(libraryLimit + 1);

    const myResourcesQuery = sb
      .from("resources")
      .select(DEFAULT_RESOURCE_SELECT)
      .eq("owner_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(createdLimit + 1);

    let ordersQuery = sb
      .from("resource_orders")
      .select(RESOURCE_ORDER_SELECT)
      .order("created_at", { ascending: false })
      .limit(ordersLimit + 1);
    if (!isAdmin) {
      ordersQuery = ordersQuery.eq("buyer_user_id", userId);
    }

    const payoutAccountQuery = sb
      .from("resource_payout_accounts")
      .select("id, user_id, provider, provider_account_id, status, country_code, currency_code, details, created_at, updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    const payoutLedgerQuery = sb
      .from("resource_payout_ledger")
      .select("id, order_item_id, seller_user_id, payout_account_id, entry_type, status, gross_cents, platform_fee_cents, net_cents, currency_code, available_at, paid_at, metadata, created_at, updated_at")
      .eq("seller_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(payoutLedgerLimit + 1);

    const tagsQuery = sb
      .from("resource_tags")
      .select("id, name, slug")
      .order("name", { ascending: true })
      .limit(tagsLimit + 1);

    const [
      entitlementResult,
      ownedResourcesResult,
      myResourcesResult,
      ordersResult,
      payoutAccountResult,
      payoutLedgerResult,
      tagsResult,
    ] = await Promise.all([
      entitlementQuery,
      ownedResourcesQuery,
      myResourcesQuery,
      ordersQuery,
      payoutAccountQuery,
      payoutLedgerQuery,
      tagsQuery,
    ]);

    if (entitlementResult.error) {
      return NextResponse.json({ ok: false, error: entitlementResult.error.message }, { status: 400 });
    }
    if (ownedResourcesResult.error) {
      return NextResponse.json({ ok: false, error: ownedResourcesResult.error.message }, { status: 400 });
    }
    if (myResourcesResult.error) {
      return NextResponse.json({ ok: false, error: myResourcesResult.error.message }, { status: 400 });
    }
    if (ordersResult.error) {
      return NextResponse.json({ ok: false, error: ordersResult.error.message }, { status: 400 });
    }
    if (payoutAccountResult.error) {
      return NextResponse.json({ ok: false, error: payoutAccountResult.error.message }, { status: 400 });
    }
    if (payoutLedgerResult.error) {
      return NextResponse.json({ ok: false, error: payoutLedgerResult.error.message }, { status: 400 });
    }
    if (tagsResult.error) {
      return NextResponse.json({ ok: false, error: tagsResult.error.message }, { status: 400 });
    }

    const entitledIds = Array.from(new Set((entitlementResult.data || []).map((row) => row.resource_id).filter(Boolean)));
    const entitledIdSet = new Set(entitledIds);

    let entitledResources = [];
    if (entitledIds.length) {
      const entitledResult = await sb
        .from("resources")
        .select(LIBRARY_SELECT)
        .in("id", entitledIds)
        .eq("status", "approved")
        .order("updated_at", { ascending: false })
        .limit(libraryLimit + 1);

      if (entitledResult.error) {
        return NextResponse.json({ ok: false, error: entitledResult.error.message }, { status: 400 });
      }

      entitledResources = entitledResult.data || [];
    }

    const byId = new Map();
    for (const row of [...(ownedResourcesResult.data || []), ...entitledResources]) {
      byId.set(row.id, row);
    }

    const mergedLibrary = Array.from(byId.values())
      .sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime());
    const libraryHasMore = mergedLibrary.length > libraryLimit;
    const libraryRows = libraryHasMore ? mergedLibrary.slice(0, libraryLimit) : mergedLibrary;

    const myResourcesRows = myResourcesResult.data || [];
    const ordersRows = ordersResult.data || [];
    const payoutLedgerRows = payoutLedgerResult.data || [];
    const tagsRows = tagsResult.data || [];

    const myResourcesHasMore = myResourcesRows.length > createdLimit;
    const ordersHasMore = ordersRows.length > ordersLimit;
    const payoutLedgerHasMore = payoutLedgerRows.length > payoutLedgerLimit;
    const tagsHasMore = tagsRows.length > tagsLimit;

    return NextResponse.json({
      ok: true,
      library: libraryRows.map((row) => ({
        ...buildResourceRoutePayload(row, row.resource_tag_links || []),
        currentAsset: Array.isArray(row.resource_assets)
          ? row.resource_assets.find((asset) => asset.is_current) || null
          : null,
        ownedByUser: row.owner_user_id === userId,
        entitledByUser: entitledIdSet.has(row.id) || row.owner_user_id === userId,
      })),
      myResources: (myResourcesHasMore ? myResourcesRows.slice(0, createdLimit) : myResourcesRows)
        .map((row) => buildResourceRoutePayload(row, row.resource_tag_links || [])),
      orders: (ordersHasMore ? ordersRows.slice(0, ordersLimit) : ordersRows).map(mapOrderRow),
      payoutAccount: payoutAccountResult.data ? mapPayoutAccountRow(payoutAccountResult.data) : null,
      payoutLedger: (payoutLedgerHasMore ? payoutLedgerRows.slice(0, payoutLedgerLimit) : payoutLedgerRows)
        .map(mapPayoutLedgerRow),
      tags: tagsHasMore ? tagsRows.slice(0, tagsLimit) : tagsRows,
      paging: {
        library: { limit: libraryLimit, hasMore: libraryHasMore },
        created: { limit: createdLimit, hasMore: myResourcesHasMore },
        orders: { limit: ordersLimit, hasMore: ordersHasMore },
        payoutLedger: { limit: payoutLedgerLimit, hasMore: payoutLedgerHasMore },
        tags: { limit: tagsLimit, hasMore: tagsHasMore },
      },
    });
  });
}
