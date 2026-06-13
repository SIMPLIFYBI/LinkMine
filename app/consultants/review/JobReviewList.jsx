"use client";

import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

function formatDate(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "—";
  }
}

function StatusPill({ status }) {
  const map = {
    pending: "bg-amber-500/20 text-amber-200",
    open: "bg-emerald-500/20 text-emerald-200",
    paused: "bg-slate-500/20 text-slate-200",
    closed: "bg-slate-700/40 text-slate-200",
  };
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${map[status] || "bg-white/10 text-slate-200"}`}>
      {status || "unknown"}
    </span>
  );
}

export default function JobReviewList({ initialJobs }) {
  const [items, setItems] = useState(initialJobs ?? []);
  const [busyKey, setBusyKey] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [requestInfoJob, setRequestInfoJob] = useState(null);
  const [requestInfoNote, setRequestInfoNote] = useState("");

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const aPending = a.status === "pending" ? 0 : 1;
      const bPending = b.status === "pending" ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;
      return String(b.created_at || "").localeCompare(String(a.created_at || ""));
    });
  }, [items]);

  async function updateStatus(id, status) {
    setError("");
    setSuccess("");
    setBusyKey(`${id}:${status}`);
    try {
      const sb = supabaseBrowser();
      const {
        data: { session },
        error: sessionError,
      } = await sb.auth.getSession();

      if (sessionError) throw new Error(sessionError.message);

      const response = await fetch(`/api/jobs/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || body?.ok === false) {
        throw new Error(body?.error || "Failed to update job status.");
      }

      if (status === "deleted") {
        setItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: body.job.status } : item)));
      }
    } catch (err) {
      setError(err.message || "Unable to update job status.");
    } finally {
      setBusyKey(null);
    }
  }

  async function sendRequestInfo(job) {
    setError("");
    setSuccess("");
    setBusyKey(`${job.id}:request-info`);

    try {
      const sb = supabaseBrowser();
      const {
        data: { session },
        error: sessionError,
      } = await sb.auth.getSession();

      if (sessionError) throw new Error(sessionError.message);

      const response = await fetch(`/api/jobs/${job.id}/request-info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ note: requestInfoNote }),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || body?.ok === false) {
        throw new Error(body?.error || "Failed to send the request for more information.");
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === job.id
            ? {
                ...item,
                status: body?.job?.status || item.status,
              }
            : item
        )
      );
      setRequestInfoJob(null);
      setRequestInfoNote("");
      setSuccess("Request for more information sent.");
    } catch (err) {
      setError(err.message || "Unable to send the request for more information.");
    } finally {
      setBusyKey(null);
    }
  }

  if (!sorted.length) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-300">
        No jobs currently need review.
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
      {success && (
        <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {success}
        </div>
      )}

      {sorted.map((job) => {
        const nextToggle = job.status === "paused" ? "open" : "paused";
        return (
          <article
            key={job.id}
            className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-slate-100 shadow-lg ring-1 ring-white/5"
          >
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">{job.title}</h2>
                <p className="text-sm text-slate-300">Submitted {formatDate(job.created_at)}</p>
              </div>
              <StatusPill status={job.status} />
            </header>

            <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              <Info label="Job ID" value={job.id} />
              <Info label="Company" value={job.company || "—"} />
              <Info label="Location" value={job.location || "—"} />
              <Info label="Listing type" value={job.listing_type || "—"} />
              <Info label="Close date" value={job.close_date ? formatDate(job.close_date) : "—"} />
              <Info label="Contact email" value={job.contact_email || "—"} />
            </dl>

            {job.description ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                {job.description}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3 sm:justify-end">
              <button
                type="button"
                disabled={busyKey === `${job.id}:request-info`}
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setRequestInfoJob(job);
                  setRequestInfoNote("");
                }}
                className="inline-flex items-center justify-center rounded-full border border-sky-400/40 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:border-sky-300 hover:text-sky-100 disabled:opacity-60"
              >
                {busyKey === `${job.id}:request-info` ? "Sending…" : "Request more info"}
              </button>
              {job.status === "pending" ? (
                <button
                  type="button"
                  disabled={busyKey === `${job.id}:open`}
                  onClick={() => updateStatus(job.id, "open")}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-sky-500 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg transition hover:from-emerald-300 hover:to-sky-400 disabled:opacity-60"
                >
                  {busyKey === `${job.id}:open` ? "Approving…" : "Approve"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={busyKey === `${job.id}:${nextToggle}`}
                  onClick={() => updateStatus(job.id, nextToggle)}
                  className="inline-flex items-center justify-center rounded-full border border-amber-400/40 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:border-amber-300 hover:text-amber-100 disabled:opacity-60"
                >
                  {busyKey === `${job.id}:${nextToggle}` ? "Saving…" : job.status === "paused" ? "Reopen" : "Suspend"}
                </button>
              )}
              <button
                type="button"
                disabled={busyKey === `${job.id}:deleted`}
                onClick={() => updateStatus(job.id, "deleted")}
                className="inline-flex items-center justify-center rounded-full border border-rose-400/40 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:border-rose-300 hover:text-rose-100 disabled:opacity-60"
              >
                {busyKey === `${job.id}:deleted` ? "Deleting…" : job.status === "pending" ? "Reject / delete" : "Delete"}
              </button>
            </div>
          </article>
        );
      })}

      {requestInfoJob ? (
        <RequestInfoDialog
          job={requestInfoJob}
          note={requestInfoNote}
          onChangeNote={setRequestInfoNote}
          onClose={() => {
            if (busyKey === `${requestInfoJob.id}:request-info`) return;
            setRequestInfoJob(null);
            setRequestInfoNote("");
          }}
          onSubmit={() => sendRequestInfo(requestInfoJob)}
          submitting={busyKey === `${requestInfoJob.id}:request-info`}
        />
      ) : null}
    </div>
  );
}

function RequestInfoDialog({ job, note, onChangeNote, onClose, onSubmit, submitting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950 p-6 text-slate-100 shadow-2xl ring-1 ring-white/10">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">Request more information</h3>
          <p className="text-sm text-slate-300">
            This sends a due-diligence email to the job contact and places the listing on hold while additional details are reviewed.
          </p>
          <p className="text-sm text-slate-400">
            Recipient: {job.contact_email || "No contact email on file"}
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-semibold text-white">{job.title}</div>
          <div className="mt-1 text-sm text-slate-300">{job.company || "No company provided"}</div>
        </div>

        <label className="mt-5 block text-sm font-medium text-slate-200">
          Optional note to include in the email
          <textarea
            value={note}
            onChange={(event) => onChangeNote(event.target.value)}
            rows={5}
            placeholder="Example: Please include a little more detail on project scope, delivery timing, or any site-specific requirements that would help us complete the review."
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-400/60"
          />
        </label>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:text-white disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg transition hover:from-sky-300 hover:to-cyan-300 disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Send request"}
          </button>
        </div>
      </div>
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