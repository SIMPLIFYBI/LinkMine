import Stripe from "stripe";

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing Stripe configuration. Set STRIPE_SECRET_KEY.");
  }

  return new Stripe(secretKey);
}

export async function stripeV2Request(path, { method = "GET", body } = {}) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing Stripe configuration. Set STRIPE_SECRET_KEY.");
  }

  const response = await fetch(`https://api.stripe.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
      "Stripe-Version": "2026-08-26.dahlia",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.error?.message || "Stripe Accounts v2 request failed.");
  }

  return payload;
}