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

export default function EventReviewList({ initialEvents }) {
  const [items, setItems] = useState(initialEvents ?? []);
  const [submittingId, setSubmittingId] = useState(null);
  const [error, setError] = useState("");

  async function updateStatus(id, status, reviewNotes = "") {
    setError("");
    setSubmittingId(id);

    try {
      const sb = supabaseBrowser();
      const {
        data: { session },
        error: sessionError,
      } = await sb.auth.getSession();

      if (sessionError) throw new Error(sessionError.message);

      const response = await fetch(`/api/event-submissions/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ status, review_notes: reviewNotes }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || body?.ok === false) {
        throw new Error(body?.error || "Failed to update status.");
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err?.message || "Unable to update event submission.");
    } finally {
      setSubmittingId(null);
    }
  }

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-300">
        No pending event submissions.
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

      {items.map((ev) => (
        <article
          key={ev.id}
          className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-slate-100 shadow-lg ring-1 ring-white/5"
        >
          <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">{ev.title}</h2>
              <p className="text-sm text-slate-300">
                Submitted {formatDate(ev.submitted_at)} • Starts {formatDate(ev.starts_at)}
              </p>
            </div>
            <span className="mt-2 inline-flex w-fit rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200 sm:mt-0">
              Pending approval
            </span>
          </header>

          <dl className="mt-5 grid gap-4 sm:grid-cols-2 text-sm">
            <Info label="Delivery" value={ev.delivery_method || "—"} />
            <Info label="Timezone" value={ev.timezone || "—"} />
            <Info label="Location" value={ev.location_name || [ev.suburb, ev.state, ev.country].filter(Boolean).join(", ") || "—"} />
            <Info label="Join URL" value={ev.join_url || "—"} />
            <Info label="External URL" value={ev.external_url || "—"} />
            <Info label="Organizer" value={ev.organizer_name || "—"} />
          </dl>

          {ev.summary ? <p className="mt-4 text-sm text-slate-200">{ev.summary}</p> : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              disabled={submittingId === ev.id}
              onClick={() => {
                const notes = window.prompt("Optional: add review notes for denial (leave blank to skip).");
                updateStatus(ev.id, "denied", notes || "");
              }}
              className="inline-flex items-center justify-center rounded-full border border-rose-400/40 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:border-rose-300 hover:text-rose-100 disabled:opacity-60"
            >
              Deny
            </button>
            <button
              type="button"
              disabled={submittingId === ev.id}
              onClick={() => updateStatus(ev.id, "approved")}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-sky-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg transition hover:from-emerald-300 hover:to-sky-400 disabled:opacity-60"
            >
              {submittingId === ev.id ? "Saving…" : "Approve"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function Info({ label, value }) {
  const isUrl = typeof value === "string" && /^https?:\/\//i.test(value);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm text-white break-words">
        {isUrl ? (
          <a className="underline underline-offset-2 hover:text-white" href={value} target="_blank" rel="noreferrer">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}