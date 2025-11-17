"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

function StatusPill({ status }) {
  const s = (status || "").toLowerCase();
  const map = {
    open: {
      cls: "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
      label: "Open",
    },
    paused: {
      cls: "border-amber-400/40 bg-amber-500/10 text-amber-100",
      label: "Paused",
    },
    closed: {
      cls: "border-slate-400/40 bg-slate-500/10 text-slate-100",
      label: "Closed",
    },
  };
  const cfg = map[s] || { cls: "border-white/20 bg-white/10 text-slate-100", label: status || "—" };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export default function JobsRequestedTable() {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // job being edited
  const [busyId, setBusyId] = useState(null);   // for delete action feedback

  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getUser().then(({ data }) => {
      const current = data?.user ?? null;
      setUser(current);

      if (current?.id) {
        setStatus("loading");
        sb
          .from("jobs")
          .select(
            `
              id,
              title,
              listing_type,
              preferred_payment_type,
              urgency,
              company,
              location,
              close_date,
              status,
              service:services(name),
              recipient_ids,
              created_at
            `
          )
          .eq("created_by", current.id)
          .neq("status", "deleted") // hide soft-deleted jobs
          .order("created_at", { ascending: false })
          .then(({ data, error }) => {
            if (error) {
              setError(error.message);
              setJobs([]);
            } else {
              setJobs(data ?? []);
            }
            setStatus("idle");
          });
      } else {
        setStatus("idle");
      }
    });
  }, []);

  const rows = useMemo(() => {
    return jobs.map((job) => ({
      id: job.id,
      title: job.title,
      listing: job.listing_type,
      serviceName: job.service?.name ?? "—",
      recipients:
        Array.isArray(job.recipient_ids) && job.recipient_ids.length
          ? job.recipient_ids.length
          : 0,
      payment: job.preferred_payment_type || "—",
      urgency: job.urgency || "—",
      company: job.company || "—",
      location: job.location || "—",
      status: job.status || "open",
      closeDate: job.close_date ? formatDate(job.close_date) : "—",
      createdAt: job.created_at ? new Date(job.created_at).toLocaleDateString() : "—",
      raw: job,
    }));
  }, [jobs]);

  function refreshRow(updated) {
    setJobs((prev) =>
      prev
        .map((j) => (j.id === updated.id ? { ...j, ...updated } : j))
        .filter((j) => j.status !== "deleted")
    );
  }

  async function softDelete(id) {
    if (!confirm("Delete this job?")) return; // simplified message
    setBusyId(id);
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: "DELETE", credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Failed (${res.status})`);
      setJobs((prev) => prev.filter((j) => j.id !== id)); // hide immediately
    } catch (e) {
      alert(e.message || String(e));
    } finally {
      setBusyId(null);
    }
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-16 text-center text-sm text-slate-300">
        Sign in to view the jobs you’ve requested.
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-16 text-center text-sm text-slate-300">
        Loading your jobs…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-16 text-center text-sm text-rose-100">
        {error}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-16 text-center text-sm text-slate-300">
        You haven’t requested any jobs yet.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 shadow-lg ring-1 ring-white/5">
        <table className="min-w-full divide-y divide-white/10 text-sm text-slate-200">
          <thead className="bg-white/10 text-xs uppercase tracking-wide text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Listing</th>
              <th className="px-4 py-3 text-left">Service</th>
              <th className="px-4 py-3 text-center">Invited</th>
              <th className="px-4 py-3 text-center">Payment</th>
              <th className="px-4 py-3 text-center">Urgency</th>
              <th className="px-4 py-3 text-center">Close</th>
              <th className="px-4 py-3 text-center">Created</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-white/10">
                <td className="px-4 py-3 font-semibold text-slate-50">
                  {row.title}
                </td>
                <td className="px-4 py-3">{row.listing}</td>
                <td className="px-4 py-3">{row.serviceName}</td>
                <td className="px-4 py-3 text-center tabular-nums">{row.recipients}</td>
                <td className="px-4 py-3 text-center">{row.payment}</td>
                <td className="px-4 py-3 text-center">{row.urgency}</td>
                <td className="px-4 py-3 text-center">{row.closeDate}</td>
                <td className="px-4 py-3 text-center">{row.createdAt}</td>
                <td className="px-4 py-3 text-center">
                  <StatusPill status={row.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(row.raw)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-sky-400/40 bg-sky-500/10 text-sky-100 hover:bg-sky-500/20"
                      title="Edit"
                      aria-label="Edit"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => softDelete(row.id)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-400/40 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                      title={busyId === row.id ? "Deleting…" : "Delete"}
                      aria-label="Delete"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditJobModal
          job={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            refreshRow(updated);
            setEditing(null);
          }}
        />
      )}
    </>
  );
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso || "—";
  }
}

function EditJobModal({ job, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: job.title || "",
    location: job.location || "",
    company: job.company || "",
    preferred_payment_type: job.preferred_payment_type || "",
    urgency: job.urgency || "",
    listing_type: job.listing_type || "Public",
    close_date: job.close_date || "",
    description: job.description || "",
    contact_name: job.contact_name || "",
    contact_email: job.contact_email || "",
    status: job.status || "open", // NEW
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Failed (${res.status})`);
      onSaved(json.job);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  // Quick duration chips to adjust close_date
  const durations = [
    { label: "1w", days: 7 },
    { label: "2w", days: 14 },
    { label: "1m", days: 30 },
    { label: "2m", days: 60 },
  ];
  function applyDuration(days) {
    const dt = new Date(Date.now() + days * 86400000);
    setField("close_date", dt.toISOString());
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h3 className="text-lg font-semibold text-slate-100">Edit job</h3>
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1 text-sm text-slate-200 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="grid gap-3 px-5 py-5">
          {error && (
            <div className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {error}
            </div>
          )}

          <label className="grid gap-1">
            <span className="text-sm">Title</span>
            <input
              className="rounded border border-white/10 bg-white/10 px-3 py-2"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              required
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-sm">Location</span>
              <input
                className="rounded border border-white/10 bg-white/10 px-3 py-2"
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm">Company</span>
              <input
                className="rounded border border-white/10 bg-white/10 px-3 py-2"
                value={form.company}
                onChange={(e) => setField("company", e.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1">
              <span className="text-sm">Payment type</span>
              <select
                className="rounded-lg border border-white/15 bg-slate-900/70 pl-3 pr-10 py-2 text-sm text-slate-100 shadow-inner outline-none transition"
                value={form.preferred_payment_type}
                onChange={(e) => setField("preferred_payment_type", e.target.value)}
              >
                <option value="">Select</option>
                <option value="Ongoing Hourly">Ongoing Hourly</option>
                <option value="Fixed-Term Hourly">Fixed-Term Hourly</option>
                <option value="Fixed Budget">Fixed Budget</option>
                <option value="Cost Plus">Cost Plus</option>
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-sm">Urgency</span>
              <select
                className="rounded-lg border border-white/15 bg-slate-900/70 pl-3 pr-10 py-2 text-sm text-slate-100 shadow-inner outline-none transition"
                value={form.urgency}
                onChange={(e) => setField("urgency", e.target.value)}
              >
                <option value="">Select urgency</option>
                <option value="Immediately">Immediately</option>
                <option value="Within Weeks">Within Weeks</option>
                <option value="Within Months">Within Months</option>
                <option value="Exploring Options">Exploring Options</option>
              </select>
            </label>
          </div>

          <div className="grid gap-1">
            <span className="text-sm">Close date</span>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="datetime-local"
                className="rounded border border-white/10 bg-white/10 px-3 py-2 text-sm"
                value={toLocalInputValue(form.close_date)}
                onChange={(e) => setField("close_date", toIsoFromLocal(e.target.value))}
              />
              <div className="flex items-center gap-2">
                {durations.map((d) => (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => applyDuration(d.days)}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-100 hover:bg-sky-500/20"
                  >
                    +{d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="grid gap-1">
            <span className="text-sm">Description</span>
            <textarea
              className="rounded border border-white/10 bg-white/10 px-3 py-2"
              rows={4}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm">Status</span>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "open", label: "Open" },
                { value: "paused", label: "Paused" },
                { value: "closed", label: "Closed" },
              ].map((opt) => {
                const active = form.status === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setField("status", opt.value)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "bg-sky-500 text-slate-900 shadow-sm"
                        : "bg-white/10 text-slate-100 hover:bg-sky-500/20"
                    }`}
                    aria-pressed={active}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-400">
              Open: visible. Paused: hidden from public board. Closed: archived (still viewable).
            </p>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              type="button"
              className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-slate-100 hover:bg-white/20"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              type="button"
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-sky-500 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helpers to handle datetime-local <-> ISO
function toLocalInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
function toIsoFromLocal(local) {
  if (!local) return "";
  const d = new Date(local);
  return d.toISOString();
}