export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { mapPayoutAccountRow, normaliseCurrencyCode } from "@/lib/resourceCommerce";
import { cleanNullableText, cleanText, getResourceAuthContext } from "@/lib/resourceHubServer";
import { isValidResourcePayoutAccountStatus } from "@/lib/resourceHub";
import { timedRoute } from "@/lib/apiTiming";

export async function GET() {
  return timedRoute("resources.payout.account.get", async () => {
    const sb = await supabaseServerClient();
    const { userId } = await getResourceAuthContext(sb);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    const { data, error } = await sb
      .from("resource_payout_accounts")
      .select("id, user_id, provider, provider_account_id, status, country_code, currency_code, details, created_at, updated_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, payoutAccount: data ? mapPayoutAccountRow(data) : null });
  });
}

export async function PUT(req) {
  return timedRoute("resources.payout.account.put", async () => {
    const sb = await supabaseServerClient();
    const { userId, isAdmin } = await getResourceAuthContext(sb);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    const payload = await req.json().catch(() => ({}));
    const provider = cleanText(payload.provider);
    const providerAccountId = cleanText(payload.providerAccountId);
    const countryCode = cleanNullableText(payload.countryCode);
    const currencyCode = normaliseCurrencyCode(payload.currencyCode || "AUD");
    const details = payload.details && typeof payload.details === "object" && !Array.isArray(payload.details)
      ? payload.details
      : {};
    const status = cleanText(payload.status) || "pending";

    if (!provider) {
      return NextResponse.json({ ok: false, error: "provider is required." }, { status: 400 });
    }

    if (!providerAccountId) {
      return NextResponse.json({ ok: false, error: "providerAccountId is required." }, { status: 400 });
    }

    if (!isValidResourcePayoutAccountStatus(status)) {
      return NextResponse.json({ ok: false, error: "Invalid payout account status." }, { status: 400 });
    }

    const row = {
      user_id: userId,
      provider,
      provider_account_id: providerAccountId,
      status: isAdmin ? status : "pending",
      country_code: countryCode,
      currency_code: currencyCode,
      details,
    };

    const { data, error } = await sb
      .from("resource_payout_accounts")
      .upsert(row, { onConflict: "user_id" })
      .select("id, user_id, provider, provider_account_id, status, country_code, currency_code, details, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, payoutAccount: mapPayoutAccountRow(data) });
  });
}
