export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { mapPayoutLedgerRow } from "@/lib/resourceCommerce";
import { cleanText, getResourceAuthContext, parsePaginationParams } from "@/lib/resourceHubServer";
import { isValidResourcePayoutLedgerStatus } from "@/lib/resourceHub";
import { timedRoute } from "@/lib/apiTiming";

export async function GET(req) {
  return timedRoute("resources.payouts.ledger", async () => {
    const sb = await supabaseServerClient();
    const { userId, isAdmin } = await getResourceAuthContext(sb);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(req.url);
    const status = cleanText(url.searchParams.get("status"));
    const sellerUserId = cleanText(url.searchParams.get("sellerUserId"));
    const { page, limit, rangeStart, rangeEnd } = parsePaginationParams(url, {
      defaultLimit: 120,
      maxLimit: 300,
    });

    let query = sb
      .from("resource_payout_ledger")
      .select("id, order_item_id, seller_user_id, payout_account_id, entry_type, status, gross_cents, platform_fee_cents, net_cents, currency_code, available_at, paid_at, metadata, created_at, updated_at")
      .order("created_at", { ascending: false })
      .range(rangeStart, rangeEnd);

    if (isAdmin && sellerUserId) {
      query = query.eq("seller_user_id", sellerUserId);
    } else {
      query = query.eq("seller_user_id", userId);
    }

    if (isValidResourcePayoutLedgerStatus(status)) {
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
      ledger: (hasMore ? rows.slice(0, limit) : rows).map(mapPayoutLedgerRow),
      paging: { page, limit, hasMore },
    });
  });
}
