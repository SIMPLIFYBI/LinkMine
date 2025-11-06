"use client";

import { useMemo, useState } from "react";

function formatAbn(abn) {
  const d = String(abn || "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
}
function formatAcn(acn) {
  const d = String(acn || "").replace(/\D/g, "").slice(0, 9);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}
function cleanDigits(s) {
  return String(s || "").replace(/\D/g, "");
}

export default function AbnSection({
  consultantId,
  initial = {
    abn: "",
    acn: "",
    abn_verified: false,
    abn_entity_name: "",
    abn_entity_type: "",
    abn_status: "",
    abn_gst_registered_from: null,
    abn_last_checked: null,
  },
}) {
  const [abn, setAbn] = useState(formatAbn(initial.abn));
  const [acn, setAcn] = useState(formatAcn(initial.acn));
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    verified: Boolean(initial.abn_verified),
    entityName: initial.abn_entity_name || "",
    entityType: initial.abn_entity_type || "",
    status: initial.abn_status || "",
    abn: initial.abn || "",
    acn: initial.acn || "",
    gstRegisteredFrom: initial.abn_gst_registered_from || null,
    lastChecked: initial.abn_last_checked || null,
    source: null,
  });
  const [msg, setMsg] = useState("");

  const canVerify = useMemo(() => {
    return cleanDigits(abn).length === 11 || cleanDigits(acn).length === 9;
  }, [abn, acn]);

  async function onVerify() {
    if (!canVerify || loading) return;
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/abn/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          consultantId,
          abn: cleanDigits(abn) || undefined,
          acn: cleanDigits(acn) || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Failed (${res.status})`);

      const s = data?.summary || {};
      setSummary({
        verified: Boolean(s.verified),
        entityName: s.entityName || "",
        entityType: s.entityType || "",
        status: s.status || "",
        abn: s.abn || cleanDigits(abn),
        acn: s.acn || cleanDigits(acn),
        gstRegisteredFrom: s.gstRegisteredFrom || null,
        lastChecked: new Date().toISOString(),
        source: data?.source || null,
      });
      if (s.verified) {
        setMsg("ABN verified and saved.");
      } else {
        setMsg("Details saved. ABN not active or not found.");
      }
      // Normalise the displayed inputs with any server-normalised values
      if (s.abn) setAbn(formatAbn(s.abn));
      if (s.acn) setAcn(formatAcn(s.acn));
    } catch (e) {
      setMsg(e.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10 space-y-3">
      <h2 className="text-lg font-semibold text-slate-100">Business registration (optional)</h2>
      <p className="text-sm text-slate-400">
        Add your ABN and/or ACN to display a verified badge on your public profile. This is optional—but recommended.
      </p>

      {/* inputs */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 ring-1 ring-white/10">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-300">ABN</span>
            <input
              inputMode="numeric"
              autoComplete="off"
              placeholder="12 345 678 901"
              value={abn}
              onChange={(e) => setAbn(formatAbn(e.target.value))}
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-slate-100 placeholder:text-slate-400 outline-none focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/30"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-300">ACN</span>
            <input
              inputMode="numeric"
              autoComplete="off"
              placeholder="123 456 789"
              value={acn}
              onChange={(e) => setAcn(formatAcn(e.target.value))}
              className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-slate-100 placeholder:text-slate-400 outline-none focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/30"
            />
          </label>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onVerify}
            disabled={!canVerify || loading}
            className="inline-flex items-center rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Verify ABN/ACN"}
          </button>
          {msg ? (
            <span
              className={`text-sm ${
                summary.verified ? "text-emerald-300" : "text-slate-300"
              }`}
            >
              {msg}
            </span>
          ) : null}
        </div>

        {/* positive-only display */}
        {summary.verified ? (
          <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-emerald-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-emerald-400/50 bg-emerald-500/20 px-3 py-1 text-xs font-semibold">
                ✓ ABN verified
              </span>
              <span className="text-sm">
                {summary.entityName ? <strong>{summary.entityName}</strong> : null}
                {summary.entityType ? <> • {summary.entityType}</> : null}
                {summary.abn ? <> • ABN {formatAbn(summary.abn)}</> : null}
                {summary.acn ? <> • ACN {formatAcn(summary.acn)}</> : null}
                {summary.gstRegisteredFrom ? <> • GST from {new Date(summary.gstRegisteredFrom).toLocaleDateString()}</> : null}
              </span>
            </div>
            <div className="mt-1 text-xs text-emerald-200/80">
              Data sourced from ABN Lookup.{" "}
              {summary.abn ? (
                <a
                  href={`https://abr.business.gov.au/ABN/View?abn=${summary.abn}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  View on ABN Lookup
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}