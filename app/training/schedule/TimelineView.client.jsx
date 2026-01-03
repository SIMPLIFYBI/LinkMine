"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CourseDrawer from "./CourseDrawer.client.jsx";

const ZOOMS = {
  month: { label: "6 mo", pxPerDay: 24 },
  week: { label: "8 wk", pxPerDay: 64 },
  day: { label: "14 d", pxPerDay: 240 },
};
// Add an explicit zoom order
const ZOOM_ORDER = ["month", "week", "day"];

function classNames(...a) {
  return a.filter(Boolean).join(" ");
}
function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString("en-AU", { month: "short", day: "numeric" });
  } catch {
    return d;
  }
}
function fmtDateShort(d) {
  try {
    return new Date(d).toLocaleDateString("en-AU", { day: "2-digit" });
  } catch {
    return d;
  }
}
function colorForDelivery(m) {
  switch (m) {
    case "online":
      return "from-sky-400/80 to-sky-600/70";
    case "hybrid":
      return "from-violet-400/80 to-indigo-600/70";
    default:
      return "from-emerald-400/80 to-teal-600/70";
  }
}

export default function TimelineView() {
  const [zoom, setZoom] = useState("month");
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7); // a week back
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().slice(0, 10);
  });

  const [q, setQ] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState(new Set()); // e.g. ["in_person","online","hybrid"]
  const [providerFilter, setProviderFilter] = useState("all");
  const [includeCompleted, setIncludeCompleted] = useState(false);

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const scrollRef = useRef(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerCourseId, setDrawerCourseId] = useState(null);
  const [drawerSeed, setDrawerSeed] = useState(null); // { courseTitle, providerName, providerLogoUrl? }

  const range = useMemo(() => {
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T23:59:59`);
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    return { start, end, days };
  }, [from, to]);

  const pxPerDay = ZOOMS[zoom].pxPerDay;
  const timelineWidth = range.days * pxPerDay;

  // Helpers for +/- zoom
  const zIndex = ZOOM_ORDER.indexOf(zoom);
  const canZoomOut = zIndex > 0;
  const canZoomIn = zIndex < ZOOM_ORDER.length - 1;
  function zoomIn() {
    setZoom((z) => ZOOM_ORDER[Math.min(ZOOM_ORDER.length - 1, ZOOM_ORDER.indexOf(z) + 1)]);
  }
  function zoomOut() {
    setZoom((z) => ZOOM_ORDER[Math.max(0, ZOOM_ORDER.indexOf(z) - 1)]);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          from: new Date(`${from}T00:00:00`).toISOString(),
          to: new Date(`${to}T23:59:59`).toISOString(),
          includeCompleted: includeCompleted ? "true" : "false",
        });
        const res = await fetch(`/api/training/sessions?${params.toString()}`, { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) setSessions(json.sessions || []);
      } catch {
        if (!cancelled) setSessions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [from, to, includeCompleted]);

  // Build provider -> courses grouping
  const grouped = useMemo(() => {
    const prov = new Map();
    for (const s of sessions) {
      // Filters (client-side)
      if (providerFilter !== "all" && String(s.provider_id) !== String(providerFilter)) continue;
      if (deliveryFilter.size > 0 && !deliveryFilter.has(s.delivery_method)) continue;
      if (q) {
        const hit =
          s.provider?.toLowerCase().includes(q.toLowerCase()) ||
          s.course?.toLowerCase().includes(q.toLowerCase()) ||
          (s.location || "").toLowerCase().includes(q.toLowerCase());
        if (!hit) continue;
      }

      const pid = s.provider_id || s.provider_slug || s.provider;
      if (!prov.has(pid)) {
        prov.set(pid, {
          id: s.provider_id,
          name: s.provider,
          slug: s.provider_slug,
          courses: new Map(),
        });
      }
      const p = prov.get(pid);
      const ck = s.course_id || s.course_slug || s.course;
      if (!p.courses.has(ck)) {
        p.courses.set(ck, {
          id: s.course_id,
          title: s.course,
          sessions: [],
        });
      }
      p.courses.get(ck).sessions.push(s);
    }
    // sort sessions in each course
    for (const p of prov.values()) {
      for (const c of p.courses.values()) {
        c.sessions.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
      }
    }
    return prov;
  }, [sessions, providerFilter, deliveryFilter, q]);

  const providers = useMemo(() => Array.from(grouped.values()), [grouped]);
  const allProviders = useMemo(() => {
    const m = new Map();
    for (const s of sessions) {
      const pid = s.provider_id || s.provider_slug || s.provider;
      if (!m.has(pid)) m.set(pid, { id: s.provider_id, name: s.provider });
    }
    return Array.from(m.values());
  }, [sessions]);

  // Axis ticks (days)
  const ticks = useMemo(() => {
    const list = [];
    const d = new Date(range.start);
    for (let i = 0; i < range.days; i++) {
      const x = i * pxPerDay;
      list.push({
        x,
        date: new Date(d),
        isMonthStart: d.getDate() === 1,
        label: fmtDate(d),
        dayLabel: fmtDateShort(d),
      });
      d.setDate(d.getDate() + 1);
    }
    return list;
  }, [range, pxPerDay]);

  function xFor(date) {
    const ms = new Date(date) - range.start;
    return Math.max(0, (ms / (1000 * 60 * 60 * 24)) * pxPerDay);
  }
  function wFor(start, end) {
    const ms = new Date(end) - new Date(start);
    return Math.max(pxPerDay * 0.25, (ms / (1000 * 60 * 60 * 24)) * pxPerDay);
  }

  return (
    <div className="space-y-4">
      {/* Filters & controls */}
      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1">
            <span className="text-xs text-slate-300">Zoom</span>
            {Object.keys(ZOOMS).map((k) => (
              <button
                key={k}
                className={`rounded-md px-2 py-1 text-xs font-medium ${zoom === k ? "bg-white/90 text-slate-900" : "text-slate-200 hover:bg-white/10"}`}
                onClick={() => setZoom(k)}
                type="button"
              >
                {k}
              </button>
            ))}
            {/* New +/- zoom buttons */}
            <div className="ml-1 flex items-center gap-1">
              <button
                type="button"
                aria-label="Zoom out"
                onClick={zoomOut}
                disabled={!canZoomOut}
                className={`h-7 w-7 rounded-md border border-white/10 text-sm font-bold ${canZoomOut ? "text-slate-200 hover:bg-white/10" : "cursor-not-allowed opacity-40"}`}
              >
                −
              </button>
              <button
                type="button"
                aria-label="Zoom in"
                onClick={zoomIn}
                disabled={!canZoomIn}
                className={`h-7 w-7 rounded-md border border-white/10 text-sm font-bold ${canZoomIn ? "text-slate-200 hover:bg-white/10" : "cursor-not-allowed opacity-40"}`}
              >
                +
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1">
            <span className="text-xs text-slate-300">From</span>
            <input
              type="date"
              className="rounded bg-transparent px-1 text-xs text-white outline-none"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <span className="text-xs text-slate-300">To</span>
            <input
              type="date"
              className="rounded bg-transparent px-1 text-xs text-white outline-none"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1">
            <span className="text-xs text-slate-300">Delivery</span>
            {["in_person", "online", "hybrid"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() =>
                  setDeliveryFilter((cur) => {
                    const next = new Set(cur);
                    if (next.has(m)) next.delete(m);
                    else next.add(m);
                    return next;
                  })
                }
                className={classNames(
                  "rounded-md px-2 py-1 text-xs font-medium capitalize",
                  deliveryFilter.has(m) ? "bg-white/90 text-slate-900" : "text-slate-200 hover:bg-white/10"
                )}
              >
                {m.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1">
            <span className="text-xs text-slate-300">Provider</span>
            <select
              className="rounded bg-transparent px-1 text-xs text-white outline-none"
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
            >
              <option value="all">All</option>
              {allProviders.map((p, idx) => {
                const id = p.id ?? p.consultant_id ?? p.slug ?? "";
                const name = p.name ?? p.display_name ?? "Provider";
                return (
                  <option key={`${id || name}-${idx}`} value={id || name}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>

          <label className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200">
            <input
              type="checkbox"
              className="h-3.5 w-3.5"
              checked={includeCompleted}
              onChange={(e) => setIncludeCompleted(e.target.checked)}
            />
            Include completed
          </label>

          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1">
            <span className="text-xs text-slate-300">Search</span>
            <input
              className="w-48 rounded bg-transparent px-1 text-xs text-white outline-none"
              placeholder="Course, provider or location"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="text-xs text-slate-400">
          {loading ? "Loading…" : `${sessions.length} sessions`}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border border-white/10 bg-gradient-to-b from-slate-900/40 to-slate-900/10">
        <div className="flex">
          {/* Left fixed pane (always visible) */}
          <div className="w-64 shrink-0">
            {/* Sticky left header */}
            <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/80 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60">
              Provider / Course
            </div>

            {/* Left body: providers + courses */}
            {providers.length === 0 && (
              <div className="p-6 text-sm text-slate-400">No sessions in this range.</div>
            )}
            {providers.map((p) => {
              const courses = Array.from(p.courses.values());
              return (
                <div key={p.id || p.slug || p.name} className="border-b border-white/10">
                  {/* Provider row (parent shading) */}
                  <div className="bg-white/10 px-3 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/10">
                    {p.name}
                  </div>
                  {/* Courses (indented) */}
                  {courses.map((c) => (
                    <div
                      key={c.id || c.title}
                      className="relative border-t border-white/5 px-3 py-2 pl-6 hover:bg-white/[0.03] cursor-pointer"
                      onClick={() => {
                        if (!c.id) return;
                        setDrawerCourseId(c.id);
                        setDrawerSeed({ courseTitle: c.title, providerName: p.name });
                        setDrawerOpen(true);
                      }}
                      title="View course details"
                    >
                      <span className="pointer-events-none absolute left-2 top-0 bottom-0 border-l border-white/10" />
                      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-sky-300/80 ring-1 ring-white/30" />
                      <div className="truncate text-sm font-medium text-white">{c.title}</div>
                      <div className="text-xs text-slate-400">{(c.sessions || []).length} dates</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Right scrollable pane (single horizontal scroller for header + body) */}
          <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain">
            {/* Sticky header scale inside the scroller */}
            <div className="sticky top-0 z-10 border-b border-white/10 bg-slate-900/70 backdrop-blur supports-[backdrop-filter]:bg-slate-900/50">
              <div className="relative h-10" style={{ width: timelineWidth }}>
                {/* Month/day gutters */}
                <div className="absolute inset-0">
                  {ticks.map((t, i) => (
                    <div
                      key={i}
                      className={`absolute top-0 h-full border-r ${t.isMonthStart ? "border-white/20" : "border-white/5"}`}
                      style={{ left: t.x, width: 1 }}
                    />
                  ))}
                </div>
                {/* Labels */}
                <div className="absolute inset-x-0 top-0 flex h-full items-center">
                  {ticks
                    .filter((_, i) => (zoom === "day" ? true : zoom === "week" ? i % 2 === 0 : i % 7 === 0))
                    .map((t, i) => (
                      <div
                        key={i}
                        className="absolute top-0 translate-x-1/2 text-[10px] text-slate-300"
                        style={{ left: t.x }}
                      >
                        {t.label}
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Right body timeline rows; width strictly equals the timeline range */}
            <div className="relative" style={{ width: timelineWidth }}>
              {providers.map((p) => {
                const courses = Array.from(p.courses.values());
                return (
                  <div key={p.id || p.slug || p.name} className="border-b border-white/10">
                    {/* Provider spacer row to match left height */}
                    <div className="h-10" />

                    {/* Course rows with bars */}
                    {courses.map((c) => (
                      <div key={c.id || c.title} className="relative h-12 border-t border-white/5">
                        {/* Grid lines */}
                        {ticks.map((t, i) => (
                          <div key={i} className="absolute inset-y-0 border-r border-white/[0.04]" style={{ left: t.x, width: 1 }} />
                        ))}
                        {/* Bars */}
                        {(c.sessions || []).map((s) => {
                          const left = xFor(s.starts_at);
                          const width = wFor(s.starts_at, s.ends_at);
                          return (
                            <button
                              type="button"
                              key={s.id}
                              onClick={() => {
                                if (!c.id) return;
                                setDrawerCourseId(c.id);
                                setDrawerSeed({ courseTitle: c.title, providerName: p.name });
                                setDrawerOpen(true);
                              }}
                              className={`${"group absolute top-1 h-8 rounded-md bg-gradient-to-r shadow-[0_6px_20px_-8px_rgba(0,0,0,0.6)] ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400/60"} ${s.delivery_method === "online" ? "from-sky-400/80 to-sky-600/70" : s.delivery_method === "hybrid" ? "from-violet-400/80 to-indigo-600/70" : "from-emerald-400/80 to-teal-600/70"}`}
                              style={{ left, width }}
                              title={`${c.title} • ${p.name}\n${new Date(s.starts_at).toLocaleString()} → ${new Date(s.ends_at).toLocaleString()}`}
                            >
                              <span className="pointer-events-none absolute inset-0 rounded-md ring-1 ring-inset ring-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                              <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900/90 px-2 py-1 text-[10px] text-white shadow ring-1 ring-white/10 group-hover:block">
                                {s.delivery_method === "online" ? "Online" : s.location || "TBA"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Drawer mount */}
      <CourseDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        courseId={drawerCourseId}
        seedMeta={drawerSeed}
      />
    </div>
  );
}