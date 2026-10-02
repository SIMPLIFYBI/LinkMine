export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { mapPayoutAccountRow, normaliseCurrencyCode } from "@/lib/resourceCommerce";
import { cleanNullableText, cleanText, getResourceAuthContext } from "@/lib/resourceHubServer";
import { isValidResourcePayoutAccountStatus } from "@/lib/resourceHub";
import { timedRoute } from "@/lib/apiTiming";
import { stripeV2Request } from "@/lib/stripe";

function payoutStatus(account) {
  const transfers = account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers;
  if (transfers?.status === "active") return "active";
  if (transfers?.status === "inactive" || account.requirements?.disabled_reason) return "disabled";
  return "pending";
}

async function retrieveStripeAccount(accountId) {
  const query = new URLSearchParams();
  query.append("include", "configuration.recipient");
  query.append("include", "requirements");
  return stripeV2Request(`/v2/core/accounts/${accountId}?${query.toString()}`);
}

export async function GET(req) {
  return timedRoute("resources.payout.account.get", async () => {
    const authorization = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    const sb = await supabaseServerClient({ global: { headers: { Authorization: authorization } } });
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

    let payoutAccount = data;
    if (payoutAccount?.provider === "stripe") {
      try {
        const stripeAccount = await retrieveStripeAccount(payoutAccount.provider_account_id);
        const status = payoutStatus(stripeAccount);

        if (status !== payoutAccount.status) {
          const { data: updated, error: updateError } = await sb
            .from("resource_payout_accounts")
            .update({ status })
            .eq("id", payoutAccount.id)
            .select("id, user_id, provider, provider_account_id, status, country_code, currency_code, details, created_at, updated_at")
            .single();

          if (updateError) {
            return NextResponse.json({ ok: false, error: updateError.message }, { status: 400 });
          }
          payoutAccount = updated;
        }
      } catch (stripeError) {
        return NextResponse.json({ ok: false, error: stripeError.message || "Unable to refresh Stripe payout status." }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true, payoutAccount: payoutAccount ? mapPayoutAccountRow(payoutAccount) : null });
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
