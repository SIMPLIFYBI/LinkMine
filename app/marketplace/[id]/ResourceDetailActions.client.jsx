"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

async function readJson(response) {
  const raw = await response.text();
  let body = {};
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      body = {};
    }
  }
  if (!response.ok) {
    throw new Error(body?.error || body?.message || raw || `Request failed (${response.status}).`);
  }
  return body;
}

async function apiSend(path, method, payload) {
  const response = await fetch(path, {
    method,
    headers: payload == null ? undefined : { "Content-Type": "application/json" },
    body: payload == null ? undefined : JSON.stringify(payload),
  });
  return readJson(response);
}

async function apiGet(path) {
  const response = await fetch(path, { cache: "no-store" });
  return readJson(response);
}

function formatPrice(resource) {
  const amount = Number(resource?.priceCents || 0) / 100;
  const currency = String(resource?.currencyCode || "AUD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export default function ResourceDetailActions({ resource, requiresAuth = false, hasAccess = false }) {
  const [busy, startBusy] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [checkoutStarting, setCheckoutStarting] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const checkoutStartRef = useRef(false);
  const confirmedOrderIdRef = useRef("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const isHosted = resource?.resourceType === "hosted";
  const isPaid = Number(resource?.priceCents || 0) > 0;
  const primaryLabel = hasAccess
    ? (isHosted ? "Download file" : "Open resource")
    : isPaid
      ? `Buy for ${formatPrice(resource)}`
      : "Add to vault";

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const orderId = searchParams.get("order_id");
    if (checkout !== "success" || !orderId) return undefined;

    let cancelled = false;
    let retryTimer = null;
    let attempts = 0;

    async function confirmPayment() {
      try {
        const result = await apiGet(`/api/resources/orders/${encodeURIComponent(orderId)}`);
        if (cancelled) return;

        if (result.order?.status === "paid") {
          setPaymentPending(false);
          setSuccess("Purchase confirmed. This resource is now in your vault.");
          if (confirmedOrderIdRef.current !== orderId) {
            confirmedOrderIdRef.current = orderId;
            router.refresh();
          }
          return;
        }

        setPaymentPending(true);
        attempts += 1;
        if (attempts < 6) retryTimer = window.setTimeout(confirmPayment, 2000);
      } catch (nextError) {
        if (!cancelled) setError(nextError.message || "Unable to confirm your purchase yet.");
      }
    }

    void confirmPayment();
    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, [router, searchParams]);

  if (requiresAuth) {
    return (
      <div className="space-y-3">
        <div className="text-sm leading-7 text-slate-300">Sign in to download this resource and add it to your vault library.</div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/login?redirect=${encodeURIComponent(`/vault/${resource.id}`)}`} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
            Sign in to access
          </Link>
        </div>
      </div>
    );
  }

  function handlePrimary() {
    if (checkoutStartRef.current || busy || checkoutStarting) return;
    setError("");
    setSuccess("");

    startBusy(async () => {
      try {
        if (!hasAccess) {
          if (isPaid) {
            checkoutStartRef.current = true;
            setCheckoutStarting(true);
            const orderResult = await apiSend("/api/resources/orders", "POST", { resourceIds: [resource.id] });
            const orderId = orderResult.order?.id;
            if (!orderId) throw new Error("Order creation did not return an order ID.");

            const checkoutResult = await apiSend(`/api/resources/orders/${orderId}/checkout`, "POST");
            if (!checkoutResult.url) throw new Error("Stripe did not return a Checkout URL.");
            window.location.assign(checkoutResult.url);
            return;
          }

          const orderResult = await apiSend("/api/resources/orders", "POST", { resourceIds: [resource.id] });
          if (orderResult.order?.status !== "paid") throw new Error("Free resource access was not confirmed.");
          setSuccess("Added to your vault.");
          router.refresh();
          return;
        }

        const result = await apiSend(`/api/resources/${resource.id}/access`, "POST", {
          sourceSurface: "resource_detail",
        });
        const targetUrl = result.signedUrl || result.sourceUrl;
        if (!targetUrl) throw new Error("No access URL returned.");

        if (isHosted) {
          const link = document.createElement("a");
          link.href = targetUrl;
          link.rel = "noopener noreferrer";
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setSuccess("Download started.");
          return;
        }

        window.open(targetUrl, "_blank", "noopener,noreferrer");
      } catch (nextError) {
        setError(nextError.message || "Unable to open resource.");
      } finally {
        checkoutStartRef.current = false;
        setCheckoutStarting(false);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handlePrimary}
          disabled={busy || checkoutStarting}
          className="group relative inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-sky-200/45 bg-[linear-gradient(135deg,rgba(56,189,248,0.95),rgba(59,130,246,0.92)_46%,rgba(14,165,233,0.95))] px-6 py-3 text-sm font-semibold tracking-[0.02em] text-white shadow-[0_16px_34px_-16px_rgba(14,165,233,0.95)] ring-1 ring-white/30 transition duration-200 hover:-translate-y-0.5 hover:border-sky-100/60 hover:brightness-105 hover:shadow-[0_20px_42px_-16px_rgba(14,165,233,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.24),transparent_48%)]" aria-hidden="true" />
          <span className="relative">{checkoutStarting ? "Opening secure Checkout..." : busy ? (hasAccess && isHosted ? "Preparing download..." : "Updating your vault...") : primaryLabel}</span>
          {busy ? null : <span className="relative text-base leading-none transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">↗</span>}
        </button>
      </div>
      {busy && hasAccess && isHosted ? <div className="text-xs text-slate-400">Your file is being prepared and should download shortly.</div> : null}
      {paymentPending ? <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">Payment received. Confirming it with the secure payment service...</div> : null}
      {error ? <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{success}</div> : null}
    </div>
  );
}