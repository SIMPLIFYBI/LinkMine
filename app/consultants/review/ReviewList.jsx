"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return "—";
  }
}

export default function ReviewList({ initialConsultants }) {
  const [items, setItems] = useState(initialConsultants ?? []);
  const [submittingId, setSubmittingId] = useState(null);
  const [error, setError] = useState("");

  async function updateStatus(id, status, reviewerNotes = "") {
    setError("");
    setSubmittingId(id);
    try {
      const sb = supabaseBrowser();
      const {
        data: { session },
      } = await sb.auth.getSession();

      const token = session?.access_token;
      if (!token) {
        throw new Error("You must be signed in to approve requests.");
      }

      const res = await fetch(`/api/consultants/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, reviewerNotes }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        throw new Error(body.error || "Failed to update status.");
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.message || "Unable to update consultancy status.");
    } finally {
      setSubmittingId(null);
    }
  }

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-300">
        No pending consultant submissions.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      {items.map((consultant) => (
        <article
          key={consultant.id}
          className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-slate-100 shadow-lg ring-1 ring-white/5"
        >
          <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {consultant.display_name}
              </h2>
              <p className="text-sm text-slate-300">
                Submitted {formatDate(consultant.created_at)}
              </p>
            </div>
            <span className="mt-2 inline-flex w-fit rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200 sm:mt-0">
              Pending approval
            </span>
          </header>

          <dl className="mt-5 grid gap-4 sm:grid-cols-2 text-sm">
            <Info label="Company" value={consultant.company || "—"} />
            <Info label="Headline" value={consultant.headline || "—"} />
            <Info label="Location" value={consultant.location || "—"} />
            <Info label="Contact email" value={consultant.contact_email || "—"} />
          </dl>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              disabled={submittingId === consultant.id}
              onClick={() => {
                const notes = window.prompt(
                  "Optional: add reviewer notes for rejection (leave blank to skip)."
                );
                updateStatus(consultant.id, "rejected", notes || "");
              }}
              className="inline-flex items-center justify-center rounded-full border border-rose-400/40 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:border-rose-300 hover:text-rose-100 disabled:opacity-60"
            >
              Reject
            </button>
            <button
              type="button"
              disabled={submittingId === consultant.id}
              onClick={() => updateStatus(consultant.id, "approved")}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-sky-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg transition hover:from-emerald-300 hover:to-sky-400 disabled:opacity-60"
            >
              {submittingId === consultant.id ? "Saving…" : "Approve"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm text-white">{value}</dd>
    </div>
  );
}