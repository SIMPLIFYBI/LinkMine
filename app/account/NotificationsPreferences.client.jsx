"use client";

import { useEffect, useState, useCallback } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser"; // If you have supabaseBrowser; else import supabase from supabaseClient
import { supabase } from "@/lib/supabaseClient"; // Fallback direct import

// Choose whichever is defined; prefer supabaseBrowser if available
function getClient() {
  try {
    return supabaseBrowser();
  } catch {
    return supabase;
  }
}

export default function NotificationsPreferences({ userId }) {
  const sb = getClient();
  const [categories, setCategories] = useState([]);
  const [subs, setSubs] = useState(new Set());
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [busyIds, setBusyIds] = useState(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [banner, setBanner] = useState(null);

  // Load categories + subscriptions
  useEffect(() => {
    let mounted = true;
    async function load() {
      setStatus("loading");
      setError("");
      try {
        const [catsRes, subsRes] = await Promise.all([
          sb
            .from("service_categories")
            .select("id,name,slug,description,position")
            .order("position", { ascending: true }),
          sb
            .from("job_category_subscriptions")
            .select("category_id")
            .eq("user_id", userId),
        ]);

        if (!mounted) return;

        if (catsRes.error) {
          setError(catsRes.error.message);
          setStatus("error");
          return;
        }
        if (subsRes.error) {
          setError(subsRes.error.message);
          setStatus("error");
          return;
        }

        setCategories(
          (catsRes.data ?? []).map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description,
            position: c.position,
          }))
        );
        setSubs(new Set((subsRes.data ?? []).map((r) => r.category_id)));
        setStatus("ready");
      } catch (e) {
        if (!mounted) return;
        setError(e.message || String(e));
        setStatus("error");
      }
    }
    if (userId) load();
    return () => {
      mounted = false;
    };
  }, [sb, userId]);

  const toggle = useCallback(
    async (categoryId) => {
      if (!userId) return;
      // Optimistic
      setBusyIds((prev) => new Set(prev).add(categoryId));
      const isSubscribed = subs.has(categoryId);
      const nextSubs = new Set(subs);
      if (isSubscribed) nextSubs.delete(categoryId);
      else nextSubs.add(categoryId);
      setSubs(nextSubs);

      let failed = false;
      try {
        if (isSubscribed) {
          const { error: delErr } = await sb
            .from("job_category_subscriptions")
            .delete()
            .eq("user_id", userId)
            .eq("category_id", categoryId);
          if (delErr) throw new Error(delErr.message);
        } else {
          const { error: insErr } = await sb
            .from("job_category_subscriptions")
            .insert({ user_id: userId, category_id: categoryId });
          if (insErr) throw new Error(insErr.message);
        }
      } catch (e) {
        failed = true;
        setBanner({
          type: "error",
          message:
            (isSubscribed
              ? "Failed to unsubscribe: "
              : "Failed to subscribe: ") + (e.message || String(e)),
        });
        // Rollback
        setSubs(subs);
      } finally {
        setBusyIds((prev) => {
          const next = new Set(prev);
          next.delete(categoryId);
          return next;
        });
        if (!failed) {
          setBanner({
            type: "success",
            message: isSubscribed
              ? "Unsubscribed from category."
              : "Subscribed to category.",
          });
        }
      }
    },
    [sb, subs, userId]
  );

  async function subscribeAll() {
    if (!userId || categories.length === 0) return;
    setBulkBusy(true);
    const allIds = categories.map((c) => c.id);
    // Optimistic
    setSubs(new Set(allIds));
    try {
      const rows = allIds.map((id) => ({ user_id: userId, category_id: id }));
      const { error: err } = await sb
        .from("job_category_subscriptions")
        .insert(rows, { upsert: true });
      if (err) throw new Error(err.message);
      setBanner({ type: "success", message: "Subscribed to all categories." });
    } catch (e) {
      setBanner({
        type: "error",
        message: "Failed bulk subscribe: " + (e.message || String(e)),
      });
    } finally {
      setBulkBusy(false);
    }
  }

  async function clearAll() {
    if (!userId) return;
    setBulkBusy(true);
    // Optimistic
    const prev = new Set(subs);
    setSubs(new Set());
    try {
      const { error: err } = await sb
        .from("job_category_subscriptions")
        .delete()
        .eq("user_id", userId);
      if (err) throw new Error(err.message);
      setBanner({ type: "success", message: "Cleared all subscriptions." });
    } catch (e) {
      setBanner({
        type: "error",
        message: "Failed to clear: " + (e.message || String(e)),
      });
      // Rollback
      setSubs(prev);
    } finally {
      setBulkBusy(false);
    }
  }

  // Auto-dismiss banner
  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 3600);
    return () => clearTimeout(t);
  }, [banner]);

  if (status === "loading") {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm">
        Loading categories…
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-300">
        {error || "Failed to load"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">
            Job Notifications
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={subscribeAll}
              disabled={bulkBusy || categories.length === 0}
              className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-sky-500/30 transition hover:from-sky-400 hover:to-indigo-400 disabled:opacity-40"
            >
              {bulkBusy ? "Working…" : "Subscribe All"}
            </button>
            <button
              onClick={clearAll}
              disabled={bulkBusy || subs.size === 0}
              className="rounded-full bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-2 text-xs font-semibold text-slate-100 ring-1 ring-white/10 transition hover:from-slate-600 hover:to-slate-700 disabled:opacity-40"
            >
              {bulkBusy ? "Working…" : "Clear All"}
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-300/80 leading-relaxed">
          Choose which service categories you want job postings emailed for.
          Your changes save instantly. We’ll only send one notification per job.
        </p>
      </header>

      {banner && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            banner.type === "success"
              ? "border-green-400/40 bg-green-500/15 text-green-200"
              : "border-red-400/40 bg-red-500/15 text-red-200"
          }`}
        >
          {banner.message}
        </div>
      )}

      {categories.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-300/70">
          No categories available.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((c) => {
            const subscribed = subs.has(c.id);
            const busy = busyIds.has(c.id);
            return (
              <li
                key={c.id}
                className={`group relative overflow-hidden rounded-2xl border p-[1px] transition ${
                  subscribed
                    ? "border-sky-400/60 bg-gradient-to-br from-sky-500/30 via-indigo-500/25 to-fuchsia-500/30"
                    : "border-white/10 bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-900/50"
                }`}
              >
                <div className="flex h-full flex-col rounded-[15px] bg-slate-900/70 p-4 backdrop-blur-xl backdrop-saturate-150">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold leading-snug text-slate-100">
                      {c.name}
                    </h3>
                    <button
                      onClick={() => toggle(c.id)}
                      disabled={busy}
                      aria-pressed={subscribed}
                      className={`relative inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${
                        subscribed
                          ? "border-sky-300/50 bg-sky-500/20 text-sky-200 hover:bg-sky-500/30"
                          : "border-white/15 bg-white/5 text-slate-200 hover:border-sky-300/40 hover:bg-sky-500/10"
                      } disabled:opacity-40`}
                    >
                      {busy ? (
                        <span className="flex items-center gap-1">
                          <svg
                            className="h-3 w-3 animate-spin"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            fill="none"
                          >
                            <path
                              strokeLinecap="round"
                              d="M12 3a9 9 0 0 1 9 9 9 9 0 0 1-9 9 9 9 0 0 1-9-9"
                            />
                          </svg>
                          …
                        </span>
                      ) : subscribed ? "Subscribed" : "Subscribe"}
                    </button>
                  </div>
                  {c.description && (
                    <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-slate-300/80">
                      {c.description}
                    </p>
                  )}
                  <div className="mt-auto pt-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium tracking-wide ${
                        subscribed
                          ? "bg-sky-500/25 text-sky-100 border border-sky-400/40"
                          : "bg-white/5 text-slate-300 border border-white/10"
                      }`}
                    >
                      {subscribed ? "Will notify" : "Muted"}
                    </span>
                  </div>
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-20">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,248,0.4),transparent_60%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(129,140,248,0.35),transparent_65%)]" />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}