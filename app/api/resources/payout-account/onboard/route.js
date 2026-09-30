export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { timedRoute } from "@/lib/apiTiming";
import { getResourceAuthContext } from "@/lib/resourceHubServer";
import { mapPayoutAccountRow } from "@/lib/resourceCommerce";
import { siteUrl } from "@/lib/siteUrl";
import { getStripe, stripeV2Request } from "@/lib/stripe";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

function payoutStatus(account) {
  const transfers = account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers;
  if (transfers?.status === "active") return "active";
  if (transfers?.status === "inactive" || account.requirements?.disabled_reason) return "disabled";
  return "pending";
}

function accountDetails(account) {
  const transfers = account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers;
  return {
    accountApiVersion: "v2",
    transfersStatus: transfers?.status || "pending",
    dashboard: account.dashboard || null,
    requirementsDue: account.requirements?.currently_due || [],
  };
}

async function retrieveStripeAccount(accountId) {
  const query = new URLSearchParams();
  query.append("include", "configuration.recipient");
  query.append("include", "requirements");
  return stripeV2Request(`/v2/core/accounts/${accountId}?${query.toString()}`);
}

async function createOnboardingLink(sb, user, req) {
  const { data: existing, error: existingError } = await sb
    .from("resource_payout_accounts")
    .select("id, user_id, provider, provider_account_id, status, country_code, currency_code, details, created_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (existing && existing.provider !== "stripe") {
    throw new Error("A payout account with another provider already exists.");
  }

  const account = existing
    ? await retrieveStripeAccount(existing.provider_account_id)
    : await stripeV2Request("/v2/core/accounts", {
      method: "POST",
      body: {
        contact_email: user.email || undefined,
        dashboard: "express",
        identity: {
          country: "au",
          entity_type: "individual",
        },
        configuration: {
          recipient: {
            capabilities: {
              stripe_balance: {
                stripe_transfers: { requested: true },
              },
            },
          },
        },
        defaults: {
          currency: "aud",
          responsibilities: {
            fees_collector: "application",
            losses_collector: "application",
          },
        },
        metadata: { youmine_user_id: user.id },
        include: ["configuration.recipient", "requirements"],
      },
    });

  const { data: payoutAccount, error: payoutAccountError } = await sb
    .from("resource_payout_accounts")
    .upsert({
      user_id: user.id,
      provider: "stripe",
      provider_account_id: account.id,
      status: payoutStatus(account),
      country_code: account.country || "AU",
      currency_code: (account.default_currency || "aud").toUpperCase(),
      details: accountDetails(account),
    }, { onConflict: "user_id" })
    .select("id, user_id, provider, provider_account_id, status, country_code, currency_code, details, created_at, updated_at")
    .single();

  if (payoutAccountError) throw new Error(payoutAccountError.message);

  const accountLink = await getStripe().accountLinks.create({
    account: account.id,
    type: "account_onboarding",
    return_url: siteUrl("/marketplace?stripe_connect=complete", req),
    refresh_url: siteUrl("/api/resources/payout-account/onboard", req),
    collection_options: { fields: "eventually_due" },
  });

  return { accountLink, payoutAccount };
}

async function getOnboardingContext(req) {
  const sb = await supabaseServerClient();
  const { user } = await getResourceAuthContext(sb);
  if (!user) return { error: NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 }) };

  const result = await createOnboardingLink(sb, user, req);
  return { result };
}

export async function POST(req) {
  return timedRoute("resources.payout.account.onboard", async () => {
    try {
      const { error, result } = await getOnboardingContext(req);
      if (error) return error;

      return NextResponse.json({
        ok: true,
        url: result.accountLink.url,
        payoutAccount: mapPayoutAccountRow(result.payoutAccount),
      });
    } catch (error) {
      console.error("[resources.payout.account.onboard] Failed to create onboarding link", error);
      return NextResponse.json({ ok: false, error: error.message || "Unable to start Stripe onboarding." }, { status: 400 });
    }
  });
}

export async function GET(req) {
  return timedRoute("resources.payout.account.onboard.refresh", async () => {
    try {
      const { error, result } = await getOnboardingContext(req);
      if (error) return error;

      return NextResponse.redirect(result.accountLink.url, 303);
    } catch (error) {
      console.error("[resources.payout.account.onboard.refresh] Failed to refresh onboarding link", error);
      return NextResponse.json({ ok: false, error: error.message || "Unable to refresh Stripe onboarding." }, { status: 400 });
    }
  });
}