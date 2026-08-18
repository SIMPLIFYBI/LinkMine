"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

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

export default function ResourceDetailActions({ resource, requiresAuth = false }) {
  const [busy, startBusy] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const isHosted = resource?.resourceType === "hosted";
  const primaryLabel = isHosted ? "Download resource" : "Open resource";

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
    setError("");
    setSuccess("");

    startBusy(async () => {
      try {
        const result = await apiSend(`/api/resources/${resource.id}/access`, "POST", {
          sourceSurface: "resource_detail",
        });
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
          className="group relative inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-sky-200/45 bg-[linear-gradient(135deg,rgba(56,189,248,0.95),rgba(59,130,246,0.92)_46%,rgba(14,165,233,0.95))] px-6 py-3 text-sm font-semibold tracking-[0.02em] text-white shadow-[0_16px_34px_-16px_rgba(14,165,233,0.95)] ring-1 ring-white/30 transition duration-200 hover:-translate-y-0.5 hover:border-sky-100/60 hover:brightness-105 hover:shadow-[0_20px_42px_-16px_rgba(14,165,233,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.24),transparent_48%)]" aria-hidden="true" />
          <span className="relative">{busy ? "Working..." : primaryLabel}</span>
          {busy ? null : <span className="relative text-base leading-none transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">↗</span>}
        </button>
      </div>
      {error ? <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
      {success ? <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">{success}</div> : null}
    </div>
  );
}