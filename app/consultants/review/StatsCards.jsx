"use client";

import { useEffect, useState } from "react";

export default function StatsCards() {
  const [counts, setCounts] = useState({ consultants: 0, users: 0, pageViews: 0 });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch("/api/stats/counts");
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch counts");
        }
        const data = await res.json();
        setCounts(data);
      } catch (err) {
        console.error("[StatsCards] fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      {/* Total Consultants Card */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <div className="text-sm font-medium text-slate-400">Total Consultants</div>
        <div className="mt-2 text-3xl font-bold text-white">
          {loading ? "—" : counts.consultants}
        </div>
      </div>

      {/* Total Users Card */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <div className="text-sm font-medium text-slate-400">Total Users</div>
        <div className="mt-2 text-3xl font-bold text-white">
          {loading ? "—" : counts.users}
        </div>
      </div>

      {/* Total Page Views Card */}
      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <div className="text-sm font-medium text-slate-400">Total Page Views</div>
        <div className="mt-2 text-3xl font-bold text-white">
          {loading ? "—" : counts.pageViews}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="col-span-3 rounded bg-red-500/10 p-3 text-xs text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}