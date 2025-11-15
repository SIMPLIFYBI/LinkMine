"use client";

import { useEffect, useState } from "react";

export default function ClientFire({ consultantId, force }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fire() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/track/consultant-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultantId, source: "debug", force }),
      });
      const json = await res.json();
      setResult(json);
    } catch (e) {
      setResult({ error: e.message || "Network error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fire(); // auto-fire on load
  }, [consultantId, force]);

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-3">
        <button
            type="button"
            onClick={fire}
            disabled={loading}
            className="rounded-md border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-white/15 disabled:opacity-50"
        >
          {loading ? "Tracking…" : "Track view now"}
        </button>
        <span className="text-xs text-slate-400">
          Auto-fired on load. Force = {force ? "yes" : "no"}.
        </span>
      </div>
      {result ? (
        <pre className="rounded-md bg-black/50 border border-white/10 p-3 text-[11px] overflow-x-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </section>
  );
}