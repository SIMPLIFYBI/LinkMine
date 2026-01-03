"use client";

import { useEffect, useRef, useState } from "react";
import * as tz from "date-fns-tz";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toZoned(utcIso, timeZone) {
  const fn = tz.toZonedTime ?? tz.utcToZonedTime;
  if (typeof fn !== "function") throw new Error("date-fns-tz missing toZonedTime/utcToZonedTime");
  return fn(new Date(utcIso), timeZone);
}

function fromZoned(dateStr, timeStr, timeZone) {
  const fn = tz.fromZonedTime ?? tz.zonedTimeToUtc;
  if (typeof fn !== "function") throw new Error("date-fns-tz missing fromZonedTime/zonedTimeToUtc");
  const d = fn(`${dateStr} ${timeStr}`, timeZone);
  return d.toISOString();
}

function isoToLocalInputs(utcIso, timeZone) {
  if (!utcIso) return { date: "", time: "" };
  const z = toZoned(utcIso, timeZone || "UTC");
  return {
    date: `${z.getFullYear()}-${pad2(z.getMonth() + 1)}-${pad2(z.getDate())}`,
    time: `${pad2(z.getHours())}:${pad2(z.getMinutes())}`,
  };
}

export default function CourseEditorModal({ open, onClose, courseId, seedMeta }) {
  const overlayRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);
  const [savingSessionId, setSavingSessionId] = useState(null);
  const [error, setError] = useState("");

  const [course, setCourse] = useState(null);
  const [sessions, setSessions] = useState([]);

  // course fields
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [level, setLevel] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [deliveryDefault, setDeliveryDefault] = useState("in_person");
  const [description, setDescription] = useState("");

  // session editor state (single selected session)
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sDate, setSDate] = useState("");
  const [sStart, setSStart] = useState("");
  const [sEnd, setSEnd] = useState("");
  const [sTimezone, setSTimezone] = useState("");
  const [sDelivery, setSDelivery] = useState("in_person");
  const [sLocation, setSLocation] = useState("");
  const [sJoinUrl, setSJoinUrl] = useState("");
  const [sPrice, setSPrice] = useState(""); // dollars
  const [sCurrency, setSCurrency] = useState("AUD");

  async function loadCourse() {
    if (!courseId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/training/courses/${encodeURIComponent(courseId)}`, { cache: "no-store" });
      const ct = res.headers.get("content-type") || "";
      const text = await res.text();
      const json = ct.includes("application/json") ? JSON.parse(text) : null;
      if (!res.ok) throw new Error((json && (json.error || json.message)) || `HTTP ${res.status}: ${text.slice(0, 200)}`);

      // support multiple shapes
      const c = json?.course ?? json?.data ?? json;
      if (!c?.id) throw new Error("Course not found.");

      const sess = (c.sessions || [])
        .slice()
        .sort((a, b) => String(a.starts_at || "").localeCompare(String(b.starts_at || "")));

      setCourse(c);
      setSessions(sess);

      setTitle(c.title || "");
      setSummary(c.summary || "");
      setCategory(c.category || "");
      setTags(Array.isArray(c.tags) ? c.tags.join(",") : (c.tags || ""));
      setLevel(c.level || "");
      setDurationHours(c.duration_hours != null ? String(c.duration_hours) : "");
      setDeliveryDefault(c.delivery_default || "in_person");
      setDescription(c.description || "");

      setActiveSessionId(null);
    } catch (e) {
      setError(e.message || "Failed to load course.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    loadCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, courseId]);

  function selectSession(s) {
    setActiveSessionId(s.id);

    const tzName = s.timezone || (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {
        return "UTC";
      }
    })();

    setSTimezone(tzName);
    setSDelivery(s.delivery_method || "in_person");
    setSLocation(s.location_name || s.location || "");
    setSJoinUrl(s.join_url || "");
    setSPrice(s.price_cents != null ? String((s.price_cents / 100).toFixed(0)) : "");
    setSCurrency(s.currency || "AUD");

    const a = isoToLocalInputs(s.starts_at, tzName);
    const b = isoToLocalInputs(s.ends_at, tzName);
    setSDate(a.date || b.date || "");
    setSStart(a.time || "");
    setSEnd(b.time || "");
  }

  async function saveCourse() {
    setSavingCourse(true);
    setError("");
    try {
      const payload = {
        title: title.trim(),
        summary: summary.trim(),
        description: description.trim(),
        category,
        level,
        duration_hours: durationHours === "" ? null : Number(durationHours),
        delivery_default: deliveryDefault,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const res = await fetch(`/api/training/courses/${encodeURIComponent(courseId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const ct = res.headers.get("content-type") || "";
      const text = await res.text();
      const json = ct.includes("application/json") ? JSON.parse(text) : null;
      if (!res.ok) throw new Error((json && (json.error || json.message)) || `HTTP ${res.status}: ${text.slice(0, 200)}`);

      await loadCourse();
    } catch (e) {
      setError(e.message || "Failed to save course.");
    } finally {
      setSavingCourse(false);
    }
  }

  async function saveSession() {
    if (!activeSessionId) return;
    setSavingSessionId(activeSessionId);
    setError("");
    try {
      if (!sDate || !sStart || !sEnd || !sTimezone) throw new Error("Session date, start, end and timezone are required.");

      const starts_at = fromZoned(sDate, sStart, sTimezone);
      const ends_at = fromZoned(sDate, sEnd, sTimezone);

      const payload = {
        timezone: sTimezone,
        starts_at,
        ends_at,
        delivery_method: sDelivery,
        location_name: sDelivery === "online" ? null : (sLocation || null),
        join_url: sDelivery === "online" || sDelivery === "hybrid" ? (sJoinUrl || null) : null,
        price_cents: sPrice === "" ? null : Math.round(Number(sPrice) * 100),
        currency: sCurrency || "AUD",
      };

      const res = await fetch(`/api/training/sessions/${encodeURIComponent(activeSessionId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const ct = res.headers.get("content-type") || "";
      const text = await res.text();
      const json = ct.includes("application/json") ? JSON.parse(text) : null;
      if (!res.ok) throw new Error((json && (json.error || json.message)) || `HTTP ${res.status}: ${text.slice(0, 200)}`);

      await loadCourse();
    } catch (e) {
      setError(e.message || "Failed to save session.");
    } finally {
      setSavingSessionId(null);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* ✅ always keep padding around modal */}
      <div
        ref={overlayRef}
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose?.();
        }}
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* ✅ center + padding + never overflow viewport */}
      <div className="absolute inset-0 flex items-start justify-center p-4 sm:p-6">
        <aside
          role="dialog"
          aria-modal="true"
          className={`w-full max-w-5xl rounded-xl border border-white/10 bg-slate-950 shadow-2xl ring-1 ring-white/10 transition-all duration-200 ${
            open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          } 
          max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)]
          overflow-hidden flex flex-col`}
        >
          {/* ✅ header stays visible */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {seedMeta?.providerName || "Provider"}
              </div>
              <div className="truncate text-base font-semibold text-white">
                Edit course{seedMeta?.courseTitle ? ` — ${seedMeta.courseTitle}` : ""}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
            >
              Close
            </button>
          </div>

          {/* ✅ modal content scrolls */}
          <div className="flex-1 overflow-y-auto px-4 py-4 overscroll-contain">
            {error ? <div className="mb-3 rounded border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}
            {loading ? (
              <div className="text-sm text-slate-300">Loading…</div>
            ) : (
              <>
                {/* Course editor */}
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 text-sm font-semibold text-white">Course details</div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm text-slate-200">Title</label>
                      <input className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-200">Category</label>
                      <input className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" value={category} onChange={(e) => setCategory(e.target.value)} />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm text-slate-200">Summary</label>
                    <input className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" value={summary} onChange={(e) => setSummary(e.target.value)} />
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm text-slate-200">Level</label>
                      <input className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" value={level} onChange={(e) => setLevel(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-200">Duration (hours)</label>
                      <input type="number" step="0.5" className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" value={durationHours} onChange={(e) => setDurationHours(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-200">Default delivery</label>
                      <select className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" value={deliveryDefault} onChange={(e) => setDeliveryDefault(e.target.value)}>
                        <option value="in_person">In person</option>
                        <option value="online">Online</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm text-slate-200">Tags (comma separated)</label>
                    <input className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" value={tags} onChange={(e) => setTags(e.target.value)} />
                  </div>

                  <div className="mt-3">
                    <label className="block text-sm text-slate-200">Description</label>
                    <textarea rows={4} className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={saveCourse}
                      disabled={savingCourse || !title.trim()}
                      className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
                    >
                      {savingCourse ? "Saving..." : "Save course"}
                    </button>
                  </div>
                </div>

                {/* Sessions */}
                <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 text-sm font-semibold text-white">Sessions</div>

                  {sessions.length ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="overflow-hidden rounded-md border border-white/10">
                        <div className="max-h-[340px] overflow-auto">
                          {sessions.map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => selectSession(s)}
                              className={`block w-full border-b border-white/10 px-3 py-2 text-left hover:bg-white/10 ${
                                activeSessionId === s.id ? "bg-white/10" : "bg-transparent"
                              }`}
                            >
                              <div className="text-sm text-white">{new Date(s.starts_at).toLocaleString()}</div>
                              <div className="text-xs text-slate-400">{s.timezone || "—"} • {s.delivery_method || "—"}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-md border border-white/10 bg-slate-950/40 p-3">
                        {activeSessionId ? (
                          <>
                            <div className="mb-2 text-sm font-semibold text-white">Edit session</div>

                            <div className="grid gap-3 sm:grid-cols-3">
                              <div>
                                <label className="block text-sm text-slate-200">Date</label>
                                <input type="date" className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" value={sDate} onChange={(e) => setSDate(e.target.value)} />
                              </div>
                              <div>
                                <label className="block text-sm text-slate-200">Start</label>
                                <input type="time" className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" value={sStart} onChange={(e) => setSStart(e.target.value)} />
                              </div>
                              <div>
                                <label className="block text-sm text-slate-200">End</label>
                                <input type="time" className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" value={sEnd} onChange={(e) => setSEnd(e.target.value)} />
                              </div>
                            </div>

                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="block text-sm text-slate-200">Timezone</label>
                                <input className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" value={sTimezone} onChange={(e) => setSTimezone(e.target.value)} />
                              </div>
                              <div>
                                <label className="block text-sm text-slate-200">Delivery</label>
                                <select className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" value={sDelivery} onChange={(e) => setSDelivery(e.target.value)}>
                                  <option value="in_person">In person</option>
                                  <option value="online">Online</option>
                                  <option value="hybrid">Hybrid</option>
                                </select>
                              </div>
                            </div>

                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="block text-sm text-slate-200">Location (if not online)</label>
                                <input className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" value={sLocation} onChange={(e) => setSLocation(e.target.value)} disabled={sDelivery === "online"} />
                              </div>
                              <div>
                                <label className="block text-sm text-slate-200">Join URL (online/hybrid)</label>
                                <input className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" value={sJoinUrl} onChange={(e) => setSJoinUrl(e.target.value)} disabled={!(sDelivery === "online" || sDelivery === "hybrid")} />
                              </div>
                            </div>

                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="block text-sm text-slate-200">Price (AUD dollars)</label>
                                <input type="number" min="0" step="1" className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" value={sPrice} onChange={(e) => setSPrice(e.target.value)} />
                              </div>
                              <div>
                                <label className="block text-sm text-slate-200">Currency</label>
                                <input className="mt-1 w-full rounded-md border border-white/10 bg-white/10 p-2 text-white" value={sCurrency} onChange={(e) => setSCurrency(e.target.value)} />
                              </div>
                            </div>

                            <div className="mt-4 flex justify-end">
                              <button
                                onClick={saveSession}
                                disabled={savingSessionId === activeSessionId}
                                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
                              >
                                {savingSessionId === activeSessionId ? "Saving..." : "Save session"}
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-slate-300">Select a session to edit.</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-300">No sessions yet.</div>
                  )}
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}