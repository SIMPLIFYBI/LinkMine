"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

async function readJson(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error || body?.message || "Request failed.");
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

export default function ResourceDetailActions({ resource, requiresAuth = false }) {
  const [busy, startBusy] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (requiresAuth) {
    return (
      <div className="space-y-3">
        <div className="text-sm leading-7 text-slate-300">Sign in to download this resource, create an order, or add it to your marketplace library.</div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/login?redirect=${encodeURIComponent(`/marketplace/${resource.id}`)}`} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
            Sign in to access
          </Link>
        </div>
      </div>
    );
  }

  function handlePrimary() {
    setError("");
    setSuccess("");

    startBusy(async () => {
      try {
        if (resource.priceCents > 0) {
          await apiSend("/api/resources/orders", "POST", { resourceIds: [resource.id] });
          setSuccess("Order draft created. You can review it from the marketplace orders tab.");
          return;
        }

        const result = await apiSend(`/api/resources/${resource.id}/access`, "POST");
        const targetUrl = result.signedUrl || result.sourceUrl;
        if (!targetUrl) throw new Error("No access URL returned.");
        window.open(targetUrl, "_blank", "noopener,noreferrer");
      } catch (nextError) {
        setError(nextError.message || "Unable to open resource.");
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handlePrimary}
          disabled={busy}
          className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Working..." : resource.priceCents > 0 ? "Create order draft" : "Open resource"}
        </button>
      </div>
      {error ? <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{success}</div> : null}
    </div>
  );
}