"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function JobsRequestedTable() {
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

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
              service:services(name),
              recipient_ids,
              created_at
            `
          )
          .eq("created_by", current.id)
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
      createdAt: job.created_at
        ? new Date(job.created_at).toLocaleDateString()
        : "—",
    }));
  }, [jobs]);

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
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 shadow-lg ring-1 ring-white/5">
      <table className="min-w-full divide-y divide-white/10 text-sm text-slate-200">
        <thead className="bg-white/10 text-xs uppercase tracking-wide text-slate-300">
          <tr>
            <th className="px-4 py-3 text-left">Title</th>
            <th className="px-4 py-3 text-left">Listing type</th>
            <th className="px-4 py-3 text-left">Service</th>
            <th className="px-4 py-3 text-left">Consultants invited</th>
            <th className="px-4 py-3 text-left">Payment</th>
            <th className="px-4 py-3 text-left">Urgency</th>
            <th className="px-4 py-3 text-left">Created</th>
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
              <td className="px-4 py-3">{row.recipients}</td>
              <td className="px-4 py-3">{row.payment}</td>
              <td className="px-4 py-3">{row.urgency}</td>
              <td className="px-4 py-3">{row.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}