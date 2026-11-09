const campaignParameters = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "gclid",
  "dclid",
  "gbraid",
  "wbraid",
]);

export function sendGaEvent(name, parameters = {}) {
  if (typeof window === "undefined") return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("event", name, parameters);
}

export function getGaPageLocation() {
  const url = new URL(window.location.href);
  const campaign = new URLSearchParams();

  for (const [name, value] of url.searchParams) {
    if (campaignParameters.has(name.toLowerCase())) {
      campaign.append(name, value);
    }
  }

  const query = campaign.toString();
  return `${url.origin}${url.pathname}${query ? `?${query}` : ""}`;
}

export function getSignupMethod(user) {
  const provider = user?.app_metadata?.provider;
  if (provider === "google" || provider === "azure") return provider;
  return "email";
}

export async function claimAndTrackSignup(session, method) {
  const accessToken = session?.access_token;
  if (
    !accessToken ||
    typeof window === "undefined" ||
    process.env.NODE_ENV !== "production" ||
    !process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  ) {
    return false;
  }

  const response = await fetch("/api/analytics/signup", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) return false;

  const { shouldTrack } = await response.json();
  if (!shouldTrack) return false;

  sendGaEvent("sign_up", { method });
  return true;
}