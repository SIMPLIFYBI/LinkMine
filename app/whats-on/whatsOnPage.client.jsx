"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import WhatsOnDrawer from "./whatsOnDrawer.client.jsx";
import styles from "./whatsOn.module.css";

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}
function endOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
function dayKeyLocal(iso) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
}
function fmtMonthTitle(d) {
  try {
    return d.toLocaleString("en-AU", { month: "long", year: "numeric" });
  } catch {
    return `${d.getFullYear()}-${d.getMonth() + 1}`;
  }
}
function fmtTimeRange(isoA, isoB) {
  try {
    const a = new Date(isoA);
    const b = isoB ? new Date(isoB) : null;
    const t1 = a.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
    if (!b) return t1;
    const t2 = b.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
    return `${t1}–${t2}`;
  } catch {
    return "";
  }
}
function clampText(s, n) {
  if (!s) return "";
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function normalizeLocation({ delivery_method, location_name, suburb, state }) {
  if (delivery_method === "online") return "Online";
  const parts = [location_name, suburb, state].filter(Boolean);
  return parts.length ? parts.join(", ") : "TBA";
}

export default function WhatsOnPage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sidebarRef = useRef(null);

  const calendarRange = useMemo(() => {
    // Month grid: start on Sunday, show 6 weeks (42 days)
    const first = startOfMonth(month);
    const dow = first.getDay(); // 0=Sun
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - dow);

    const gridEnd = new Date(gridStart);
    gridEnd.setDate(gridStart.getDate() + 41);

    return {
      gridStart: startOfDay(gridStart),
      gridEnd: endOfDay(gridEnd),
      days: Array.from({ length: 42 }, (_, i) => {
        const d = new Date(gridStart);
        d.setDate(gridStart.getDate() + i);
        return d;
      }),
    };
  }, [month]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const from = calendarRange.gridStart.toISOString();
        const to = calendarRange.gridEnd.toISOString();

        const [sessRes, evtRes] = await Promise.all([
          fetch(`/api/training/sessions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&includeCompleted=false`, { cache: "no-store" }),
          fetch(`/api/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { cache: "no-store" }),
        ]);

        const sessCt = sessRes.headers.get("content-type") || "";
        const evtCt = evtRes.headers.get("content-type") || "";

        const sessJson = sessCt.includes("application/json") ? await sessRes.json() : null;
        const evtJson = evtCt.includes("application/json") ? await evtRes.json() : null;

        if (!sessRes.ok) throw new Error(sessJson?.error || `Failed to load training sessions (HTTP ${sessRes.status})`);
        if (!evtRes.ok) throw new Error(evtJson?.error || `Failed to load events (HTTP ${evtRes.status})`);

        const sessions = Array.isArray(sessJson?.sessions) ? sessJson.sessions : [];
        const events = Array.isArray(evtJson?.events) ? evtJson.events : [];

        const normalized = [
          ...sessions.map((s) => ({
            type: "training",
            id: `training-${s.id}`,
            source_id: s.id,
            course_id: s.course_id,
            title: s.course || s.course_meta?.title || "Training session",
            starts_at: s.starts_at,
            ends_at: s.ends_at,
            timezone: s.timezone || "UTC",
            delivery_method: s.delivery_method || "in_person",
            locationText: normalizeLocation({
              delivery_method: s.delivery_method,
              location_name: s.location_name,
              suburb: s.suburb,
              state: s.state,
            }),
            join_url: s.join_url || null,
            external_url: null,
            tags: Array.isArray(s.course_meta?.tags) ? s.course_meta.tags : [],
            price_cents: s.price_cents ?? null,
            currency: s.currency || "AUD",
          })),
          ...events.map((e) => ({
            type: "event",
            id: `event-${e.id}`,
            source_id: e.id,
            title: e.title,
            summary: e.summary || "",
            description: e.description || "",
            starts_at: e.starts_at,
            ends_at: e.ends_at,
            timezone: e.timezone || "UTC",
            delivery_method: e.delivery_method || "in_person",
            locationText: normalizeLocation({
              delivery_method: e.delivery_method,
              location_name: e.location_name,
              suburb: e.suburb,
              state: e.state,
            }),
            join_url: e.join_url || null,
            external_url: e.external_url || null,
            organizer_name: e.organizer_name || "",
            organizer_url: e.organizer_url || null,
            tags: Array.isArray(e.tags) ? e.tags : [],
          })),
        ].sort((a, b) => String(a.starts_at).localeCompare(String(b.starts_at)));

        if (!cancelled) setItems(normalized);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [calendarRange.gridStart, calendarRange.gridEnd]);

  const itemsByDay = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      const k = dayKeyLocal(it.starts_at);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(it);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => String(a.starts_at).localeCompare(String(b.starts_at)));
      map.set(k, arr);
    }
    return map;
  }, [items]);

  const monthItemsForSidebar = useMemo(() => {
    // show items for the visible month (not the whole grid)
    const mStart = startOfMonth(month);
    const mEnd = addMonths(mStart, 1);
    return items.filter((it) => {
      const d = new Date(it.starts_at);
      return d >= mStart && d < mEnd;
    });
  }, [items, month]);

  const sidebarGroups = useMemo(() => {
    const groups = new Map();
    for (const it of monthItemsForSidebar) {
      const k = dayKeyLocal(it.starts_at);
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(it);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, arr]) => [k, arr.sort((x, y) => String(x.starts_at).localeCompare(String(y.starts_at)))]);
  }, [monthItemsForSidebar]);

  function openDrawer(it) {
    setSelected(it);
    setDrawerOpen(true);
  }

  function scrollSidebarToDay(k) {
    const el = document.getElementById(`whats-on-day-${k}`);
    if (el && sidebarRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      el.classList.add("ring-2", "ring-sky-400/50");
      window.setTimeout(() => el.classList.remove("ring-2", "ring-sky-400/50"), 700);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold">What’s On</div>
            <div className="text-xs text-slate-400">Training + Events</div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMonth((m) => addMonths(m, -1))}
              className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm hover:bg-white/10"
              aria-label="Previous month"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setMonth(startOfMonth(new Date()))}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-sm hover:bg-white/10"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-sm hover:bg-white/10"
              aria-label="Next month"
            >
              →
            </button>

            <div className="ml-2 hidden sm:block text-sm font-semibold text-slate-100">{fmtMonthTitle(month)}</div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[360px_1fr]">
        {/* Left sidebar */}
        <aside className="rounded-xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 px-4 py-3">
            <div className="text-sm font-semibold">This month</div>
            <div className="text-xs text-slate-400">{fmtMonthTitle(month)}</div>
          </div>

          <div
            ref={sidebarRef}
            className={`max-h-[calc(100vh-140px)] overflow-y-auto px-2 py-2 ${styles.sidebarScroll}`}
          >
            {loading ? <div className="p-3 text-sm text-slate-300">Loading…</div> : null}
            {error ? <div className="m-2 rounded border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}

            {!loading && !error && sidebarGroups.length === 0 ? (
              <div className="p-3 text-sm text-slate-300">No items this month.</div>
            ) : null}

            {!loading && !error
              ? sidebarGroups.map(([k, arr]) => {
                  const d = new Date(`${k}T00:00:00`);
                  const label = d.toLocaleDateString("en-AU", { weekday: "short", day: "2-digit", month: "short" });
                  return (
                    <div key={k} id={`whats-on-day-${k}`} className="mb-3 rounded-lg p-2 transition">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</div>
                      <div className="space-y-1">
                        {arr.map((it) => (
                          <button
                            key={it.id}
                            type="button"
                            onClick={() => openDrawer(it)}
                            className="flex w-full items-start gap-2 rounded-md border border-white/10 bg-slate-950/40 px-2 py-2 text-left hover:bg-white/10"
                          >
                            <span
                              className={`mt-1 inline-block h-2.5 w-2.5 rounded-full ${
                                it.type === "training" ? "bg-indigo-400" : "bg-emerald-400"
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm text-white">{it.title}</div>
                              <div className="mt-0.5 text-xs text-slate-400">
                                {fmtTimeRange(it.starts_at, it.ends_at)} • {clampText(it.locationText, 40)}
                              </div>
                            </div>
                            <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-200">
                              {it.type === "training" ? "Training" : "Event"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              : null}
          </div>
        </aside>

        {/* Calendar */}
        <main className="rounded-xl border border-white/10 bg-white/5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
            <div className="text-sm font-semibold">{fmtMonthTitle(month)}</div>

            {/* ✅ Legend */}
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-400" />
                <span>Training</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span>Event</span>
              </div>

              <div className="hidden sm:block text-xs text-slate-400">Month view</div>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-white/10 text-xs text-slate-300">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="px-3 py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendarRange.days.map((d) => {
              const inMonth = d.getMonth() === month.getMonth();
              const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              const dayItems = itemsByDay.get(dayKey) || [];
              const visible = dayItems.slice(0, 3);
              const extra = Math.max(0, dayItems.length - visible.length);

              return (
                <div
                  key={dayKey}
                  className={`min-h-[120px] border-b border-r border-white/10 p-2 sm:min-h-[140px] ${
                    inMonth ? "bg-transparent" : "bg-slate-950/30"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className={`text-xs font-semibold ${inMonth ? "text-slate-200" : "text-slate-500"}`}>{d.getDate()}</div>
                  </div>

                  <div className="space-y-1">
                    {visible.map((it) => (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => openDrawer(it)}
                        className={`group flex w-full items-center gap-2 rounded-md border border-white/10 px-2 py-1 text-left text-xs hover:bg-white/10 ${
                          it.type === "training" ? "bg-indigo-500/10" : "bg-emerald-500/10"
                        }`}
                        title={it.title}
                      >
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            it.type === "training" ? "bg-indigo-400" : "bg-emerald-400"
                          }`}
                        />
                        <span className="min-w-0 flex-1 truncate text-slate-100">{it.title}</span>
                      </button>
                    ))}

                    {extra > 0 ? (
                      <button
                        type="button"
                        onClick={() => scrollSidebarToDay(dayKey)}
                        className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 text-left text-xs text-slate-200 hover:bg-white/10"
                      >
                        +{extra} more
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      <WhatsOnDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        item={selected}
      />
    </div>
  );
}