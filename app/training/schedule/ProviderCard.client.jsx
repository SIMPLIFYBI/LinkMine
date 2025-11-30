"use client";

import { useState } from "react";
import AddCourseForm from "./AddCourseForm.client.jsx";

function fmtDT(iso) {
  try {
    return new Date(iso).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}
function fmtPrice(cents, currency = "AUD") {
  if (cents == null) return "TBA";
  try {
    return (cents / 100).toLocaleString("en-AU", { style: "currency", currency, minimumFractionDigits: 0 });
  } catch {
    return `$${(cents / 100).toFixed(0)} ${currency}`;
  }
}

export default function ProviderCard({ provider, canManage }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          {provider.slug ? (
            <a
              href={`/consultants/${encodeURIComponent(provider.slug)}`}
              className="text-lg font-semibold text-white hover:underline"
            >
              {provider.name}
            </a>
          ) : (
            <div className="text-lg font-semibold text-white">{provider.name}</div>
          )}
          <div className="text-slate-400 text-sm">Courses offered</div>
        </div>
        {canManage && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md border border-sky-400/30 bg-sky-500/10 px-3 py-1.5 text-sm font-semibold text-sky-100 hover:bg-sky-500/20"
          >
            {showForm ? "Close" : "+ Add course"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-4 rounded-lg border border-white/10 bg-white/10 p-4">
          <AddCourseForm consultantId={provider.id} onDone={() => setShowForm(false)} />
        </div>
      )}

      <div className="space-y-2">
        {provider.courses.map((c) => (
          <details key={c.slug || c.title} className="rounded border border-white/10 bg-white/0">
            <summary className="cursor-pointer list-none px-3 py-2 text-white hover:bg-white/5">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{c.title}</span>
                <span className="text-xs text-slate-400">
                  {c.sessions?.[0] ? fmtDT(c.sessions[0].starts_at) : "No dates"}
                </span>
              </div>
            </summary>
            <div className="px-3 pb-3 pt-1">
              {c.summary && <p className="mb-3 text-sm text-slate-300">{c.summary}</p>}
              <ul className="space-y-2">
                {c.sessions.map((s) => (
                  <li key={s.id} className="rounded-md border border-white/10 bg-white/5 p-3">
                    <div className="text-sm text-white">
                      {fmtDT(s.starts_at)} — {fmtDT(s.ends_at)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {s.delivery_method === "online" ? "Online" : s.location || "TBA"} • {fmtPrice(s.price_cents, s.currency)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}