"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import WhatsOnDrawer from "./whatsOnDrawer.client.jsx";
import SubmitEventModal from "./SubmitEventModal.client.jsx";
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

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!parts.length) return "?";
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

function extractProviderFromCourse(course) {
  const meta = course?.metadata ?? course?.course?.metadata ?? {};
  const consultant = course?.consultant ?? course?.course?.consultant ?? null;

  const provider_name =
    consultant?.display_name ||
    consultant?.name ||
    meta?.providerName ||
    meta?.provider_name ||
    "";

  const provider_logo_url =
    consultant?.logo_url ||
    consultant?.thumbnail_url ||
    meta?.providerLogoUrl ||
    meta?.provider_logo_url ||
    meta?.logo_url ||
    null;

  return { provider_name, provider_logo_url };
}

function buildCalendarUrl({ from, to, types, region }) {
  const sp = new URLSearchParams();
  sp.set("from", from);
  sp.set("to", to);
  sp.set("types", (types || []).join(","));
  sp.set("region", region || "ALL");
  return `/api/calendar?${sp.toString()}`;
}

function SegGroup({ children, label }) {
  return (
    <div className="flex items-center gap-2">
      {label ? <div className="text-[11px] font-medium text-slate-400">{label}</div> : null}
      <div className="inline-flex items-center rounded-xl border border-white/10 bg-slate-950/30 p-1 shadow-sm backdrop-blur">
        {children}
      </div>
    </div>
  );
}

function uiButtonClass({ pressed = false, size = "sm" } = {}) {
  const base =
    "relative inline-flex items-center justify-center select-none whitespace-nowrap " +
    "transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60 " +
    "active:scale-[0.98]";

  const sizing =
    size === "icon"
      ? "h-8 w-8 rounded-lg text-sm"
      : "rounded-lg px-3 py-1.5 text-xs font-semibold";

  const off =
    "text-slate-200 border border-transparent hover:bg-white/8 hover:text-white";

  const on =
    "text-white bg-gradient-to-b from-white/18 to-white/8 " +
    "border border-white/20 ring-1 ring-white/15 " +
    "shadow-[0_10px_25px_-12px_rgba(255,255,255,0.35)] " +
    "after:absolute after:inset-0 after:rounded-lg after:content-[''] " +
    "after:shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]";

  return [base, sizing, pressed ? on : off].join(" ");
}

function SegButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={uiButtonClass({ pressed: !!active, size: "sm" })}
    >
      {children}
    </button>
  );
}

export default function WhatsOnPage() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);

  // ✅ Filters (apply to BOTH sidebar + calendar)
  const [types, setTypes] = useState(["event", "training"]); // "event" | "training"
  const [region, setRegion] = useState("ALL"); // "ALL" | "AU" | "INTL"

  const sidebarRef = useRef(null);
  const courseProviderCacheRef = useRef(new Map()); // courseId -> { provider_name, provider_logo_url }

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

        const url = buildCalendarUrl({ from, to, types, region });
        const res = await fetch(url, { cache: "no-store" });

        const ct = res.headers.get("content-type") || "";
        const json = ct.includes("application/json") ? await res.json() : null;

        if (!res.ok) throw new Error(json?.error || `Failed to load calendar items (HTTP ${res.status})`);

        const apiItems = Array.isArray(json?.items) ? json.items : [];

        // Map API items to the shape your UI already expects
        const normalized = apiItems
          .map((it) => {
            if (it?.type === "training") {
              return {
                type: "training",
                id: it.id, // "training-<uuid>"
                source_id: it.session_id,
                course_id: it.course_id,
                title: it.title || "Training session",
                starts_at: it.starts_at,
                ends_at: it.ends_at,
                timezone: it.timezone || "UTC",
                delivery_method: it.delivery_method || "in_person",
                locationText: normalizeLocation({
                  delivery_method: it.delivery_method,
                  location_name: it.location_name,
                  suburb: it.suburb,
                  state: it.state,
                }),
                join_url: it.join_url || null,
                external_url: null,
                tags: Array.isArray(it.tags) ? it.tags : [],
                price_cents: it.price_cents ?? null,
                currency: it.currency || "AUD",

                // provider enrichment will fill these if missing
                provider_name: it.provider_name || "",
                provider_logo_url: it.provider_logo_url || null,

                // optional: not provided by /api/calendar currently
                course_meta: null,
              };
            }

            if (it?.type === "event") {
              return {
                type: "event",
                id: it.id, // "event-<uuid>"
                source_id: it.event_id,
                title: it.title,
                summary: it.summary || "",
                description: it.description || "",
                starts_at: it.starts_at,
                ends_at: it.ends_at,
                timezone: it.timezone || "UTC",
                delivery_method: it.delivery_method || "in_person",
                locationText: normalizeLocation({
                  delivery_method: it.delivery_method,
                  location_name: it.location_name,
                  suburb: it.suburb,
                  state: it.state,
                }),
                join_url: it.join_url || null,
                external_url: it.external_url || null,
                organizer_name: it.organizer_name || "",
                organizer_url: it.organizer_url || null,
                tags: Array.isArray(it.tags) ? it.tags : [],
              };
            }

            return null;
          })
          .filter(Boolean)
          .sort((a, b) => String(a.starts_at).localeCompare(String(b.starts_at)));

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
  }, [calendarRange.gridStart, calendarRange.gridEnd, types, region]);

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

  // ✅ After items load, lazy-fetch provider logo/name for training rows that are missing it
  useEffect(() => {
    let cancelled = false;

    async function enrichTrainingProviders() {
      const missingCourseIds = Array.from(
        new Set(
          items
            .filter(
              (it) =>
                it?.type === "training" &&
                it?.course_id &&
                (!it.provider_logo_url || !it.provider_name)
            )
            .map((it) => it.course_id)
        )
      ).filter((courseId) => !courseProviderCacheRef.current.has(courseId));

      if (missingCourseIds.length === 0) return;

      const results = await Promise.allSettled(
        missingCourseIds.map(async (courseId) => {
          const res = await fetch(`/api/training/courses/${encodeURIComponent(courseId)}`, { cache: "no-store" });
          const ct = res.headers.get("content-type") || "";
          const json = ct.includes("application/json") ? await res.json() : null;
          if (!res.ok) throw new Error(json?.error || `Failed to load course ${courseId} (HTTP ${res.status})`);

          const { provider_name, provider_logo_url } = extractProviderFromCourse(json);
          courseProviderCacheRef.current.set(courseId, { provider_name, provider_logo_url });
          return { courseId, provider_name, provider_logo_url };
        })
      );

      if (cancelled) return;

      const updates = new Map();
      for (const r of results) {
        if (r.status === "fulfilled") {
          updates.set(r.value.courseId, {
            provider_name: r.value.provider_name,
            provider_logo_url: r.value.provider_logo_url,
          });
        }
      }

      if (updates.size === 0) return;

      setItems((prev) =>
        prev.map((it) => {
          if (it?.type !== "training" || !it?.course_id) return it;
          const u = updates.get(it.course_id);
          if (!u) return it;
          return {
            ...it,
            provider_name: it.provider_name || u.provider_name,
            provider_logo_url: it.provider_logo_url || u.provider_logo_url,
          };
        })
      );
    }

    enrichTrainingProviders();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const typeKey =
    types.includes("event") && types.includes("training")
      ? "ALL"
      : types.includes("event")
        ? "EVENT"
        : "TRAINING";

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
            {/* ✅ Add an Event */}
            <button
              type="button"
              onClick={() => setSubmitOpen(true)}
              className="hidden sm:inline-flex rounded-md bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-500"
            >
              Add an Event
            </button>

            <button
              type="button"
              className={uiButtonClass({ size: "icon" })}
              onClick={() => setMonth((m) => addMonths(m, -1))}
              aria-label="Previous month"
            >
              ‹
            </button>
            <button
              type="button"
              className={uiButtonClass({ pressed: true })}
              onClick={() => setMonth(startOfMonth(new Date()))}
            >
              Today
            </button>
            <button
              type="button"
              className={uiButtonClass({ size: "icon" })}
              onClick={() => setMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
            >
              ›
            </button>

            <div className="ml-2 hidden sm:block text-sm font-semibold text-slate-100">{fmtMonthTitle(month)}</div>
          </div>
        </div>

        {/* ✅ mobile placement */}
        <div className="mx-auto w-full max-w-7xl px-4 pb-3 sm:hidden">
          <button
            type="button"
            onClick={() => setSubmitOpen(true)}
            className="w-full rounded-md bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500"
          >
            Add an Event
          </button>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[360px_1fr]">
        {/* Left sidebar */}
        <aside className="rounded-xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 px-4 py-3">
            <div className="text-sm font-semibold">This month</div>
            <div className="text-xs text-slate-400">{fmtMonthTitle(month)}</div>

            {/* ✅ Filters live at the top of the gallery container */}
            <div className="mt-3 flex flex-col gap-2">
              {/* Type */}
              <SegGroup label="Type">
                <SegButton active={typeKey === "ALL"} onClick={() => setTypes(["event", "training"])}>
                  All
                </SegButton>
                <SegButton active={typeKey === "TRAINING"} onClick={() => setTypes(["training"])}>
                  Training
                </SegButton>
                <SegButton active={typeKey === "EVENT"} onClick={() => setTypes(["event"])}>
                  Events
                </SegButton>
              </SegGroup>

              {/* Region */}
              <SegGroup label="Region">
                <SegButton active={region === "ALL"} onClick={() => setRegion("ALL")}>
                  All
                </SegButton>
                <SegButton active={region === "AU"} onClick={() => setRegion("AU")}>
                  Australia
                </SegButton>
                <SegButton active={region === "INTL"} onClick={() => setRegion("INTL")}>
                  International
                </SegButton>
              </SegGroup>
            </div>
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
                            {it.type === "training" ? (
                              <span className="mt-0.5 h-8 w-8 shrink-0 overflow-hidden ring-1 ring-white/10">
                                {it.provider_logo_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={it.provider_logo_url}
                                    alt={it.provider_name || "Provider"}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                      // if it fails, hide the img so the fallback below can show next render
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-500/60 to-indigo-600/60 text-xs font-bold text-white">
                                    {(it.provider_name || "?").slice(0, 1).toUpperCase()}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
                            )}

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

      <WhatsOnDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} item={selected} />

      {/* ✅ submit modal */}
      <SubmitEventModal open={submitOpen} onClose={() => setSubmitOpen(false)} />
    </div>
  );
}