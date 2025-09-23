"use client";

import { useEffect, useState } from "react";

export default function JobsTable() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (res.ok) setJobs(json.jobs || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const onRefresh = () => load();
    window.addEventListener("jobs:refresh", onRefresh);
    return () => window.removeEventListener("jobs:refresh", onRefresh);
  }, []);

  async function setStatus(id, status) {
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
  }

  async function del(id) {
    if (!confirm("Delete this job?")) return;
    const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My jobs</h2>
        <button onClick={load} className="text-sm text-slate-300 hover:text-white">Refresh</button>
      </div>

      <div className="mt-3 overflow-auto rounded-lg border border-white/10">
        <table className="min-w-[720px] w-full text-sm">
          <thead className="bg-white/5 text-slate-300">
            <tr>
              <th className="text-left px-3 py-2">Title</th>
              <th className="text-left px-3 py-2">Service</th>
              <th className="text-left px-3 py-2">Location</th>
              <th className="text-left px-3 py-2">Created</th>
              <th className="text-left px-3 py-2">Status</th>
              <th className="text-left px-3 py-2">Recipients</th>
              <th className="text-right px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-3 text-slate-400" colSpan={7}>Loading…</td></tr>
            ) : jobs.length === 0 ? (
              <tr><td className="px-3 py-3 text-slate-400" colSpan={7}>No jobs yet.</td></tr>
            ) : (
              jobs.map((j) => (
                <tr key={j.id} className="border-t border-white/10">
                  <td className="px-3 py-2">{j.title}</td>
                  <td className="px-3 py-2">{j.service_slug}</td>
                  <td className="px-3 py-2">{j.location || "—"}</td>
                  <td className="px-3 py-2">{new Date(j.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 capitalize">{j.status}</td>
                  <td className="px-3 py-2">{Array.isArray(j.consultant_ids) ? j.consultant_ids.length : 0}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="px-2 py-1 rounded-md border border-white/10 hover:bg-white/10"
                        onClick={() => setStatus(j.id, "open")}
                        title="Amend"
                      >
                        Amend
                      </button>
                      <button
                        className="px-2 py-1 rounded-md border border-emerald-700/40 bg-emerald-600/20 hover:bg-emerald-600/30"
                        onClick={() => setStatus(j.id, "fulfilled")}
                        title="Mark as fulfilled"
                      >
                        Fulfilled
                      </button>
                      <button
                        className="px-2 py-1 rounded-md border border-red-700/40 bg-red-600/20 hover:bg-red-600/30"
                        onClick={() => del(j.id)}
                        title="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}