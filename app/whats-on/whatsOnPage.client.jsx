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

function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function fmtDayHeader(d) {
  // Example: "Tue 7"
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
}

function Dot({ className }) {
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${className}`} />;
}

function MobileMonthCalendar({
  month,
  setMonth,
  calendarDays, // 42-day grid
  countsByDayKey, // Map(dayKey -> { eventCount, trainingCount, total })
  selectedDayKey,
  setSelectedDayKey,
}) {
  const monthTitle = fmtMonthTitle(month);

  return (
    <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/40 backdrop-blur">
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            className={uiButtonClass({ size: "icon" })}
            onClick={() => setMonth(addMonths(month, -1))}
            aria-label="Previous month"
          >
            ‹
          </button>

          <div className="text-sm font-semibold">{monthTitle}</div>

          <button
            type="button"
            className={uiButtonClass({ size: "icon" })}
            onClick={() => setMonth(addMonths(month, 1))}
            aria-label="Next month"
          >
            ›
          </button>
        </div>

        {/* ✅ Match your grid (Sunday-first) */}
        <div className="mt-2 grid grid-cols-7 text-[11px] text-slate-400">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="py-1 text-center">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1 pb-2">
          {calendarDays.map((d) => {
            const dayKey = d.toISOString().slice(0, 10);
            const localKey = dayKeyLocal(d.toISOString());
            const inMonth = isSameMonth(d, month);

            const counts = countsByDayKey.get(localKey) || {
              eventCount: 0,
              trainingCount: 0,
              total: 0,
            };

            const shownDots =
              (counts.eventCount > 0 ? 1 : 0) + (counts.trainingCount > 0 ? 1 : 0);
            const overflow = Math.max(0, counts.total - shownDots);

            const selected = selectedDayKey === localKey;

            return (
              <button
                key={dayKey}
                type="button"
                onClick={() => setSelectedDayKey(selected ? null : localKey)}
                className={[
                  "mx-auto flex h-10 w-10 flex-col items-center justify-center rounded-xl",
                  "transition-colors",
                  selected ? "bg-white/12 ring-1 ring-white/15" : "hover:bg-white/8",
                  inMonth ? "text-white" : "text-slate-500",
                ].join(" ")}
                aria-pressed={selected}
                aria-label={d.toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              >
                <div className="text-sm leading-none">{d.getDate()}</div>

                <div className="mt-1 flex items-center gap-1">
                  {counts.eventCount > 0 ? <Dot className="bg-orange-400" /> : null}
                  {counts.trainingCount > 0 ? <Dot className="bg-sky-400" /> : null}
                  {overflow > 0 ? (
                    <span className="text-[10px] font-semibold text-slate-300">
                      +{overflow}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        {selectedDayKey ? (
          <div className="pb-2">
            <button
              type="button"
              className={uiButtonClass()}
              onClick={() => setSelectedDayKey(null)}
            >
              Clear day filter
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FiltersPanel({
  typeKey,
  setTypes,
  region,
  setRegion,
  variant = "desktop", // "desktop" | "mobile"
}) {
  const isMobile = variant === "mobile";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-4">
      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* ✅ Desktop only heading */}
          {!isMobile ? (
            <div className="min-w-0">
              <div className="text-sm font-semibold">Filters</div>
              <div className="text-xs text-slate-400">Refine Training + Events</div>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            {/* ✅ Mobile keeps ONLY this one filter */}
            <SegGroup label={isMobile ? null : "Type"}>
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

            {/* ✅ Desktop only region filter */}
            {!isMobile ? (
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
            ) : null}
          </div>
        </div>
      </div>
    </div>
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

  // ✅ Mobile day selection (filters agenda list)
  const [selectedDayKey, setSelectedDayKey] = useState(null);

  // ✅ Filters (apply to BOTH sidebar + calendar)
  const [types, setTypes] = useState(["event", "training"]);
  const [region, setRegion] = useState("ALL");

  const sidebarRef = useRef(null);
  const courseProviderCacheRef = useRef(new Map());

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
                consultant_id: it.consultant_id ?? null, // ✅ add this

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

  const typeKey =
    types.includes("event") && types.includes("training")
      ? "ALL"
      : types.includes("event")
        ? "EVENT"
        : "TRAINING";

  useEffect(() => {
    if (!selectedDayKey) return;
    const selectedDate = new Date(`${selectedDayKey}T00:00:00`);
    if (!isSameMonth(selectedDate, month)) setSelectedDayKey(null);
  }, [month, selectedDayKey]);

  // Build day lookup for dots + agenda grouping (uses currently fetched/filtered items)
  const itemsByDayKey = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      const k = dayKeyLocal(it.starts_at); // "YYYY-MM-DD" (local)
      if (!map.has(k)) map.set(k, { eventCount: 0, trainingCount: 0, total: 0, items: [] });
      const entry = map.get(k);
      entry.items.push(it);
      entry.total += 1;
      if (it.type === "event") entry.eventCount += 1;
      if (it.type === "training") entry.trainingCount += 1;
    }
    for (const v of map.values()) {
      v.items.sort((a, b) => String(a.starts_at).localeCompare(String(b.starts_at)));
    }
    return map;
  }, [items]);

  const countsByDayKey = itemsByDayKey;

  // ✅ Desktop calendar expects Map<dayKey, item[]>
  const itemsByDay = useMemo(() => {
    const map = new Map();
    for (const [k, v] of itemsByDayKey.entries()) {
      map.set(k, v.items);
    }
    return map;
  }, [itemsByDayKey]);

  // ✅ Sidebar groups for "This month" (desktop) and agenda groups (mobile)
  const sidebarGroups = useMemo(() => {
    const y = month.getFullYear();
    const m = month.getMonth() + 1; // 1-12

    const groups = [];
    for (const [k, v] of itemsByDayKey.entries()) {
      // k = "YYYY-MM-DD"
      const [yy, mm] = k.split("-").map((n) => Number(n));
      if (yy !== y || mm !== m) continue;
      if (!v?.items?.length) continue;
      groups.push([k, v.items]);
    }

    // sort by day key
    groups.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    return groups;
  }, [itemsByDayKey, month]);

  // ✅ Mobile groups: month by default, day-filtered when a date is selected
  const mobileGroups = useMemo(() => {
    if (!selectedDayKey) return sidebarGroups;
    return sidebarGroups.filter(([k]) => k === selectedDayKey);
  }, [sidebarGroups, selectedDayKey]);

  const openDrawer = (it) => {
    setSelected(it);
    setDrawerOpen(true);
  };

  const scrollSidebarToDay = (dayKey) => {
    const el = document.getElementById(`whats-on-day-${dayKey}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

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
            {/* ✅ Single button for all breakpoints */}
            <button
              type="button"
              onClick={() => setSubmitOpen(true)}
              className={[
                "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold",
                "text-white",
                "bg-gradient-to-b from-sky-500/90 to-indigo-600/90",
                "ring-1 ring-white/15 shadow-[0_12px_28px_-16px_rgba(56,189,248,0.55)]",
                "hover:from-sky-400/90 hover:to-indigo-500/90",
                "active:scale-[0.98]",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60",
              ].join(" ")}
              aria-label="Add Event"
              title="Add Event"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/15">
                +
              </span>
              <span className="leading-none">Add Event</span>
            </button>

            {/* ❌ Removed the desktop-only "Add an Event" button */}
          </div>
        </div>
      </div>

      {/* ✅ Desktop filters */}
      <div className="hidden lg:block">
        <FiltersPanel
          variant="desktop"
          typeKey={typeKey}
          setTypes={setTypes}
          region={region}
          setRegion={setRegion}
        />
      </div>

      {/* ✅ Mobile filters (no heading, type only) */}
      <div className="lg:hidden">
        <FiltersPanel
          variant="mobile"
          typeKey={typeKey}
          setTypes={setTypes}
          region={region}
          setRegion={setRegion}
        />
      </div>

      {/* ✅ Mobile: month calendar on top + agenda below */}
      <div className="lg:hidden">
        <MobileMonthCalendar
          month={month}
          setMonth={setMonth}
          calendarDays={calendarRange.days}
          countsByDayKey={countsByDayKey}
          selectedDayKey={selectedDayKey}
          setSelectedDayKey={setSelectedDayKey}
        />

        {/* Agenda list */}
        <div className="px-4 pb-8">
          {loading ? <div className="p-3 text-sm text-slate-300">Loading…</div> : null}
          {error ? (
            <div className="mb-3 rounded border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          {!loading && !error && mobileGroups.length === 0 ? (
            <div className="p-3 text-sm text-slate-300">
              {selectedDayKey ? "No items on this day." : "No items this month."}
            </div>
          ) : null}

          {!loading && !error
            ? mobileGroups.map(([k, arr]) => {
                const d = new Date(`${k}T00:00:00`);
                const label = d.toLocaleDateString("en-AU", {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                });

                return (
                  <div key={k} className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {label}
                    </div>

                    <div className="space-y-2">
                      {arr.map((it) => (
                        <button
                          key={it.id}
                          type="button"
                          onClick={() => openDrawer(it)}
                          className="flex w-full items-start gap-2 rounded-md border border-white/10 bg-slate-950/40 px-3 py-3 text-left hover:bg-white/10"
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
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-500/60 to-indigo-600/60 text-xs font-bold text-white">
                                  {initials(it.provider_name || it.title)}
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
      </div>

      {/* ✅ Desktop: your existing 2-column layout (hide on mobile) */}
      <div className="mx-auto hidden w-full max-w-7xl gap-4 px-4 py-4 lg:grid lg:grid-cols-[360px_1fr]">
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
                                    {initials(it.provider_name || it.title)}
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
        <main className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] ring-1 ring-white/10">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-slate-950/25 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={uiButtonClass({ size: "icon" })}
                onClick={() => setMonth((m) => addMonths(m, -1))}
                aria-label="Previous month"
              >
                ‹
              </button>

              <div className="text-sm font-semibold text-white">{fmtMonthTitle(month)}</div>

              <button
                type="button"
                className={uiButtonClass({ size: "icon" })}
                onClick={() => setMonth((m) => addMonths(m, 1))}
                aria-label="Next month"
              >
                ›
              </button>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-sky-400" />
                <span>Training</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span>Event</span>
              </div>

              <div className="hidden sm:block text-xs text-slate-300/80">Month view</div>
            </div>
          </div>

          <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.04] text-[11px] font-semibold text-slate-200/90">
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
                  className={[

                    "min-h-[128px] border-b border-r border-white/10 p-2 sm:min-h-[148px]",
                    "transition-colors",
                    inMonth ? "bg-white/[0.03] hover:bg-white/[0.05]" : "bg-slate-950/35",
                  ].join(" ")}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div
                      className={[

                        "inline-flex h-6 w-6 items-center justify-center rounded-lg text-xs font-bold",
                        inMonth ? "bg-white/10 text-white ring-1 ring-white/10" : "bg-white/5 text-slate-400",
                      ].join(" ")}
                    >
                      {d.getDate()}
                    </div>

                    {dayItems.length ? (
                      <div className="text-[11px] font-semibold text-slate-200/70">{dayItems.length}</div>
                    ) : null}
                  </div>

                  <div className="space-y-1">
                    {visible.map((it) => (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => openDrawer(it)}
                        className={[

                          "group flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs",
                          "backdrop-blur transition",
                          "hover:bg-white/10",
                          it.type === "training"
                            ? "border-sky-400/20 bg-sky-400/10 text-slate-50"
                            : "border-emerald-400/20 bg-emerald-400/10 text-slate-50",
                        ].join(" ")}
                        title={it.title}
                      >
                        <span
                          className={[

                            "inline-block h-2 w-2 rounded-full",
                            it.type === "training" ? "bg-sky-400" : "bg-emerald-400",
                          ].join(" ")}
                        />
                        <span className="min-w-0 flex-1 truncate">{it.title}</span>
                      </button>
                    ))}

                    {extra > 0 ? (
                      <button
                        type="button"
                        onClick={() => scrollSidebarToDay(dayKey)}
                        className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-left text-xs font-semibold text-slate-100 hover:bg-white/[0.08]"
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
      <SubmitEventModal open={submitOpen} onClose={() => setSubmitOpen(false)} />
    </div>
  );
}