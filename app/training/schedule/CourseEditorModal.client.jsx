"use client";

import AddCourseForm from "@/app/training/schedule/AddCourseForm.client.jsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

function classNames(...parts) {
  return parts.filter(Boolean).join(" ");
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toZoned(utcIso, timeZone) {
  return toZonedTime(new Date(utcIso), timeZone);
}

function fromZoned(dateStr, timeStr, timeZone) {
  const d = fromZonedTime(`${dateStr} ${timeStr}`, timeZone);
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

function getDefaultTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function formatMoment(iso, timeZone) {
  if (!iso) return "To be confirmed";
  try {
    return new Intl.DateTimeFormat("en-AU", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timeZone || "UTC",
    }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
  }
}

function bookingBadgeClass(status) {
  if (status === "pending") return "border-amber-300/25 bg-amber-400/10 text-amber-100";
  if (status === "waitlisted") return "border-fuchsia-300/25 bg-fuchsia-400/10 text-fuchsia-100";
  if (status === "cancelled") return "border-red-300/25 bg-red-400/10 text-red-100";
  return "border-cyan-300/20 bg-cyan-400/10 text-cyan-100";
}

function CourseListCard({ course, active, onSelect }) {
  const nextSession = Array.isArray(course?.sessions) ? course.sessions[0] : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={classNames(
        "block w-full rounded-2xl border px-4 py-3 text-left transition",
        active
          ? "border-sky-300/35 bg-sky-500/10 shadow-[0_16px_40px_rgba(14,165,233,0.10)]"
          : "border-white/10 bg-slate-950/40 hover:border-white/20 hover:bg-white/[0.06]"
      )}
    >
      <div className="text-sm font-semibold text-white">{course?.title || "Untitled course"}</div>
      <div className="mt-1 text-xs text-slate-400">{course?.category || course?.level || "Training course"}</div>
      <div className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">
        {nextSession ? formatMoment(nextSession.starts_at, nextSession.timezone) : "No session scheduled"}
      </div>
    </button>
  );
}

export default function CourseEditorModal({
  open,
  onClose,
  courseId,
  seedMeta,
  canManage = false,
  onChanged,
  onDeleted,
  onCreated,
}) {
  const defaultTab = "courses";
  const router = useRouter();
  const overlayRef = useRef(null);
  const consultantId = seedMeta?.consultantId || null;

  const [loadingCourses, setLoadingCourses] = useState(false);
  const [savingCourse, setSavingCourse] = useState(false);
  const [savingSessionId, setSavingSessionId] = useState(null);
  const [bookingActionId, setBookingActionId] = useState(null);
  const [loadingSessionBookings, setLoadingSessionBookings] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showCreateCourseForm, setShowCreateCourseForm] = useState(false);

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(courseId || null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessionBookings, setSessionBookings] = useState([]);
  const [sessionBookingCounts, setSessionBookingCounts] = useState(null);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [level, setLevel] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [deliveryDefault, setDeliveryDefault] = useState("in_person");
  const [description, setDescription] = useState("");

  const [sDate, setSDate] = useState("");
  const [sStart, setSStart] = useState("");
  const [sEnd, setSEnd] = useState("");
  const [sTimezone, setSTimezone] = useState("");
  const [sDelivery, setSDelivery] = useState("in_person");
  const [sLocation, setSLocation] = useState("");
  const [sJoinUrl, setSJoinUrl] = useState("");
  const [sBookingUrl, setSBookingUrl] = useState("");
  const [sCapacity, setSCapacity] = useState("");
  const [sBookingsEnabled, setSBookingsEnabled] = useState(false);
  const [sAvailabilityDisplay, setSAvailabilityDisplay] = useState("remaining_places");
  const [sPrice, setSPrice] = useState("");
  const [sCurrency, setSCurrency] = useState("AUD");

  const [deletingCourse, setDeletingCourse] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);

  const [nDate, setNDate] = useState("");
  const [nStart, setNStart] = useState("");
  const [nEnd, setNEnd] = useState("");
  const [nTimezone, setNTimezone] = useState(() => getDefaultTimeZone());
  const [nDelivery, setNDelivery] = useState("in_person");
  const [nLocation, setNLocation] = useState("");
  const [nJoinUrl, setNJoinUrl] = useState("");
  const [nBookingUrl, setNBookingUrl] = useState("");
  const [nCapacity, setNCapacity] = useState("");
  const [nBookingsEnabled, setNBookingsEnabled] = useState(false);
  const [nAvailabilityDisplay, setNAvailabilityDisplay] = useState("remaining_places");
  const [nPrice, setNPrice] = useState("");
  const [nCurrency, setNCurrency] = useState("AUD");

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );
  const sessions = selectedCourse?.sessions || [];
  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) || null,
    [sessions, activeSessionId]
  );

  const stats = useMemo(() => {
    const nextSession = sessions[0] || null;
    return {
      courseCount: courses.length,
      sessionCount: sessions.length,
      nextSession,
      pendingCount: Number(sessionBookingCounts?.pending || 0),
    };
  }, [courses.length, sessions, sessionBookingCounts]);

  function resetNewSessionForm() {
    setNDate("");
    setNStart("");
    setNEnd("");
    setNTimezone(getDefaultTimeZone());
    setNDelivery("in_person");
    setNLocation("");
    setNJoinUrl("");
    setNBookingUrl("");
    setNCapacity("");
    setNBookingsEnabled(false);
    setNAvailabilityDisplay("remaining_places");
    setNPrice("");
    setNCurrency("AUD");
  }

  function clearSessionEditor() {
    setSDate("");
    setSStart("");
    setSEnd("");
    setSTimezone("");
    setSDelivery("in_person");
    setSLocation("");
    setSJoinUrl("");
    setSBookingUrl("");
    setSCapacity("");
    setSBookingsEnabled(false);
    setSAvailabilityDisplay("remaining_places");
    setSPrice("");
    setSCurrency("AUD");
  }

  function selectSession(session) {
    if (!session) {
      setActiveSessionId(null);
      clearSessionEditor();
      return;
    }

    setActiveSessionId(session.id);

    const tzName = session.timezone || getDefaultTimeZone();
    const start = isoToLocalInputs(session.starts_at, tzName);
    const end = isoToLocalInputs(session.ends_at, tzName);

    setSTimezone(tzName);
    setSDelivery(session.delivery_method || "in_person");
    setSLocation(session.location_name || session.location || "");
    setSJoinUrl(session.join_url || "");
    setSBookingUrl(session.booking_url || "");
    setSCapacity(session.capacity != null ? String(session.capacity) : "");
    setSBookingsEnabled(Boolean(session.bookings_enabled));
    setSAvailabilityDisplay(session.availability_display || "remaining_places");
    setSPrice(session.price_cents != null ? String((session.price_cents / 100).toFixed(0)) : "");
    setSCurrency(session.currency || "AUD");
    setSDate(start.date || end.date || "");
    setSStart(start.time || "");
    setSEnd(end.time || "");
  }

  async function loadCourses(preferredCourseId) {
    if (!consultantId) {
      setCourses([]);
      setSelectedCourseId(null);
      setError("Missing consultant context for the training manager.");
      return;
    }

    setLoadingCourses(true);
    setError("");

    try {
      const res = await fetch(`/api/consultants/${encodeURIComponent(consultantId)}/courses`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to load training.");

      const nextCourses = Array.isArray(json?.courses) ? json.courses : [];
      const desiredId = preferredCourseId || selectedCourseId || courseId || nextCourses[0]?.id || null;
      const resolvedId = nextCourses.some((course) => course.id === desiredId) ? desiredId : nextCourses[0]?.id || null;

      setCourses(nextCourses);
      setSelectedCourseId(resolvedId);

      if (!resolvedId) {
        setActiveSessionId(null);
        setSessionBookings([]);
        setSessionBookingCounts(null);
      }
    } catch (e) {
      setError(e.message || "Failed to load training.");
    } finally {
      setLoadingCourses(false);
    }
  }

  async function loadSessionBookingsFor(sessionId) {
    if (!sessionId || !canManage) {
      setSessionBookings([]);
      setSessionBookingCounts(null);
      return;
    }

    setLoadingSessionBookings(true);
    try {
      const res = await fetch(`/api/training/sessions/${encodeURIComponent(sessionId)}/bookings`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to load attendees.");
      setSessionBookings(Array.isArray(json?.bookings) ? json.bookings : []);
      setSessionBookingCounts(json?.counts || null);
    } catch (e) {
      setError(e.message || "Failed to load attendees.");
      setSessionBookings([]);
      setSessionBookingCounts(null);
    } finally {
      setLoadingSessionBookings(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    setActiveTab(defaultTab);
    setSelectedCourseId(courseId || null);
    setShowNewSessionForm(false);
    setShowCreateCourseForm(Boolean(!courseId));
    resetNewSessionForm();
    loadCourses(courseId || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, courseId, consultantId]);

  useEffect(() => {
    if (!courses.length) {
      setShowCreateCourseForm(true);
    }
  }, [courses.length]);

  useEffect(() => {
    if (!selectedCourse) {
      setTitle("");
      setSummary("");
      setCategory("");
      setTags("");
      setLevel("");
      setDurationHours("");
      setDeliveryDefault("in_person");
      setDescription("");
      setActiveSessionId(null);
      clearSessionEditor();
      return;
    }

    setTitle(selectedCourse.title || "");
    setSummary(selectedCourse.summary || "");
    setCategory(selectedCourse.category || "");
    setTags(Array.isArray(selectedCourse.tags) ? selectedCourse.tags.join(",") : (selectedCourse.tags || ""));
    setLevel(selectedCourse.level || "");
    setDurationHours(selectedCourse.duration_hours != null ? String(selectedCourse.duration_hours) : "");
    setDeliveryDefault(selectedCourse.delivery_default || "in_person");
    setDescription(selectedCourse.description || "");

    const preferredSession = sessions.find((session) => session.id === activeSessionId) || sessions[0] || null;
    if (preferredSession) {
      selectSession(preferredSession);
    } else {
      setActiveSessionId(null);
      clearSessionEditor();
    }
  }, [selectedCourse, sessions, activeSessionId]);

  useEffect(() => {
    if (!open || !canManage || !activeSessionId) {
      setSessionBookings([]);
      setSessionBookingCounts(null);
      return;
    }

    loadSessionBookingsFor(activeSessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, canManage, activeSessionId]);

  async function saveCourse() {
    if (!selectedCourseId) return;

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
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      };

      const res = await fetch(`/api/training/courses/${encodeURIComponent(selectedCourseId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(json?.error || json?.message || "Failed to save course.");

      await loadCourses(selectedCourseId);
      onChanged?.();
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
      if (!sDate || !sStart || !sEnd || !sTimezone) {
        throw new Error("Session date, start, end and timezone are required.");
      }

      const payload = {
        timezone: sTimezone,
        starts_at: fromZoned(sDate, sStart, sTimezone),
        ends_at: fromZoned(sDate, sEnd, sTimezone),
        delivery_method: sDelivery,
        location_name: sDelivery === "online" ? null : (sLocation || null),
        join_url: sDelivery === "online" || sDelivery === "hybrid" ? (sJoinUrl || null) : null,
        booking_url: sBookingUrl.trim() || null,
        capacity: sCapacity !== "" && Number.isFinite(Number(sCapacity)) ? Number(sCapacity) : null,
        bookings_enabled: sBookingsEnabled,
        availability_display: sAvailabilityDisplay,
        price_cents: sPrice === "" ? null : Math.round(Number(sPrice) * 100),
        currency: sCurrency || "AUD",
      };

      const res = await fetch(`/api/training/sessions/${encodeURIComponent(activeSessionId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(json?.error || json?.message || "Failed to save session.");

      await loadCourses(selectedCourseId);
      onChanged?.();
    } catch (e) {
      setError(e.message || "Failed to save session.");
    } finally {
      setSavingSessionId(null);
    }
  }

  async function createSession() {
    if (!selectedCourseId || !canManage) return;

    setCreatingSession(true);
    setError("");
    try {
      if (!nDate || !nStart || !nEnd || !nTimezone) {
        throw new Error("New session date, start, end and timezone are required.");
      }

      const payload = {
        sessions: [
          {
            timezone: nTimezone,
            starts_at: fromZoned(nDate, nStart, nTimezone),
            ends_at: fromZoned(nDate, nEnd, nTimezone),
            delivery_method: nDelivery,
            location_name: nDelivery === "online" ? null : (nLocation || null),
            join_url: nDelivery === "online" || nDelivery === "hybrid" ? (nJoinUrl || null) : null,
            booking_url: nBookingUrl.trim() || null,
            capacity: nCapacity !== "" && Number.isFinite(Number(nCapacity)) ? Number(nCapacity) : null,
            bookings_enabled: nBookingsEnabled,
            availability_display: nAvailabilityDisplay,
            price_cents: nPrice === "" ? null : Math.round(Number(nPrice) * 100),
            currency: nCurrency || "AUD",
            status: "scheduled",
          },
        ],
      };

      const res = await fetch(`/api/training/courses/${encodeURIComponent(selectedCourseId)}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const json = text ? JSON.parse(text) : null;
      if (!res.ok) throw new Error(json?.error || json?.message || "Failed to create session.");

      resetNewSessionForm();
      setShowNewSessionForm(false);
      await loadCourses(selectedCourseId);
      onChanged?.();
    } catch (e) {
      setError(e.message || "Failed to create session.");
    } finally {
      setCreatingSession(false);
    }
  }

  async function deleteCourse() {
    if (!selectedCourseId || !canManage) return;

    const ok = window.confirm("Delete this course permanently? This will also delete all sessions. This cannot be undone.");
    if (!ok) return;

    setDeletingCourse(true);
    setError("");
    try {
      const res = await fetch(`/api/training/courses/${encodeURIComponent(selectedCourseId)}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to delete course.");

      const deletedCourseId = selectedCourseId;
      await loadCourses(null);
      onDeleted?.(deletedCourseId);
      onChanged?.();
      router.refresh();
    } catch (e) {
      setError(e.message || "Failed to delete course.");
    } finally {
      setDeletingCourse(false);
    }
  }

  async function deleteActiveSession() {
    if (!activeSessionId || !canManage) return;

    const ok = window.confirm("Delete this session permanently? This cannot be undone.");
    if (!ok) return;

    setDeletingSessionId(activeSessionId);
    setError("");
    try {
      const res = await fetch(`/api/training/sessions/${encodeURIComponent(activeSessionId)}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to delete session.");

      const nextCourseId = selectedCourseId;
      setActiveSessionId(null);
      await loadCourses(nextCourseId);
      onChanged?.();
      router.refresh();
    } catch (e) {
      setError(e.message || "Failed to delete session.");
    } finally {
      setDeletingSessionId(null);
    }
  }

  async function updateBookingStatus(bookingId, status) {
    if (!bookingId) return;

    setBookingActionId(bookingId);
    setError("");
    try {
      const res = await fetch(`/api/training/bookings/${encodeURIComponent(bookingId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to update booking.");

      await loadSessionBookingsFor(activeSessionId);
      await loadCourses(selectedCourseId);
      onChanged?.();
    } catch (e) {
      setError(e.message || "Failed to update booking.");
    } finally {
      setBookingActionId(null);
    }
  }

  const tabs = [
    { key: "courses", label: "Courses", eyebrow: `${stats.courseCount} total`, blurb: "Manage your course library and the selected course details." },
    { key: "sessions", label: "Sessions", eyebrow: `${stats.sessionCount} for selected`, blurb: "Manage schedule, pricing and booking settings." },
    { key: "bookings", label: "Bookings", eyebrow: `${stats.pendingCount} pending`, blurb: "Review requests for the selected course." },
  ];

  return (
    <div className={classNames("fixed inset-0 z-50", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
      <div
        ref={overlayRef}
        onClick={(event) => {
          if (event.target === overlayRef.current) onClose?.();
        }}
        className={classNames(
          "absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
      />

      <div className="absolute inset-0 flex items-start justify-center p-4 sm:p-6">
        <aside
          role="dialog"
          aria-modal="true"
          className={classNames(
            "flex max-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-slate-950 shadow-[0_30px_120px_rgba(2,6,23,0.65)] ring-1 ring-white/10 transition-all duration-300 sm:max-h-[calc(100vh-3rem)]",
            open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          )}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-300">Training manager</div>
              <div className="mt-1 truncate text-lg font-semibold text-white">
                {seedMeta?.providerName || "Provider"} training workspace
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-white/10"
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 overscroll-contain">
            {error ? (
              <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            ) : null}

            {loadingCourses ? (
              <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="h-72 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04]" />
                <div className="h-72 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04]" />
              </div>
            ) : (
              <>
                <div className="mb-4 rounded-[24px] border border-white/10 bg-slate-950/80 p-2 shadow-[0_18px_50px_rgba(2,6,23,0.28)] ring-1 ring-white/10 backdrop-blur">
                  <div className="grid grid-cols-3 gap-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={classNames(
                          "rounded-[18px] px-3 py-3 text-left transition sm:px-4",
                          activeTab === tab.key
                            ? "bg-[linear-gradient(135deg,rgba(56,189,248,0.28),rgba(14,165,233,0.16))] shadow-[inset_0_0_0_1px_rgba(125,211,252,0.35),0_12px_30px_rgba(14,165,233,0.14)]"
                            : "bg-transparent hover:bg-white/[0.05]"
                        )}
                      >
                        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">{tab.eyebrow}</div>
                        <div className="mt-1 text-sm font-semibold text-white sm:text-base">{tab.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-5 overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),rgba(15,23,42,0.92)_48%,rgba(2,6,23,0.98)_100%)] p-5 shadow-[0_24px_80px_rgba(2,6,23,0.45)] sm:p-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-3xl">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-300/80">Training workspace</div>
                      <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                        {selectedCourse?.title || "Manage courses, sessions and bookings"}
                      </h2>
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-[15px]">
                        Start with the course library, refine the selected course, then switch into session scheduling or booking review for the active offer.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <div className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-200">
                        <span className="text-slate-400">Courses </span>{stats.courseCount}
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-200">
                        <span className="text-slate-400">Sessions </span>{stats.sessionCount}
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-slate-200">
                        <span className="text-slate-400">Next </span>{stats.nextSession ? formatMoment(stats.nextSession.starts_at, stats.nextSession.timezone) : "Not scheduled"}
                      </div>
                    </div>
                  </div>
                </div>

                {activeTab === "courses" ? (
                  <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
                    <div className="space-y-4 xl:sticky xl:top-0 xl:self-start">
                      <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,6,23,0.86))] p-4 ring-1 ring-white/10 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-lg font-semibold text-white">Course library</div>
                            <div className="text-sm text-slate-400">Choose the course you want to manage.</div>
                          </div>
                          {canManage ? (
                            <button
                              type="button"
                              onClick={() => setShowCreateCourseForm((current) => !current)}
                              className="rounded-full border border-sky-300/20 bg-sky-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100 hover:bg-sky-500/20"
                            >
                              {showCreateCourseForm ? "Hide form" : "+ Add course"}
                            </button>
                          ) : null}
                        </div>

                        {showCreateCourseForm ? (
                          <div className="mt-4 rounded-[24px] border border-sky-400/20 bg-[linear-gradient(180deg,rgba(14,165,233,0.10),rgba(15,23,42,0.65))] p-4 ring-1 ring-sky-300/10">
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div>
                                <div className="text-base font-semibold text-white">Add training</div>
                                <div className="text-sm text-slate-300">Create a new course without leaving the manager.</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowCreateCourseForm(false)}
                                className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                              >
                                Close
                              </button>
                            </div>

                            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_18px_60px_-36px_rgba(56,189,248,0.45)] ring-1 ring-white/10">
                              <AddCourseForm
                                consultantId={consultantId}
                                reloadOnSuccess={false}
                                onDone={async (payload) => {
                                  await loadCourses(payload?.id || null);
                                  setSelectedCourseId(payload?.id || null);
                                  setActiveTab("courses");
                                  setShowCreateCourseForm(false);
                                  onCreated?.(payload);
                                  onChanged?.();
                                }}
                              />
                            </div>
                          </div>
                        ) : null}

                        <div className="mt-4 space-y-2">
                          {courses.length ? (
                            courses.map((course) => (
                              <CourseListCard
                                key={course.id}
                                course={course}
                                active={selectedCourseId === course.id}
                                onSelect={() => {
                                  setSelectedCourseId(course.id);
                                  setShowNewSessionForm(false);
                                }}
                              />
                            ))
                          ) : (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-8 text-center">
                              <div className="text-lg font-semibold text-white">No courses yet</div>
                              <p className="mt-2 text-sm text-slate-400">Use the add course form to publish your first training offer.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {!selectedCourse ? (
                        <div className="rounded-[28px] border border-dashed border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.55),rgba(15,23,42,0.25))] px-6 py-14 text-center ring-1 ring-white/10">
                          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/10 text-xl text-sky-200">◎</div>
                          <div className="mt-4 text-xl font-semibold text-white">{courses.length ? "Select a course to continue" : "Create your first course"}</div>
                          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
                            {courses.length
                              ? "Choose a course from the library to edit its details, then switch to sessions or bookings when you are ready."
                              : "Start by adding a course, then build out sessions and attendee workflows from here."}
                          </p>
                        </div>
                      ) : null}

                      {selectedCourse ? (
                        <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.82))] ring-1 ring-white/10">
                          <div className="border-b border-white/10 px-5 py-5 sm:px-6">
                            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                              <div className="min-w-0">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-300/80">Selected course</div>
                                <div className="mt-2 text-2xl font-semibold text-white">{selectedCourse.title || "Untitled course"}</div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                                    {selectedCourse.category || "Training course"}
                                  </span>
                                  {selectedCourse.level ? (
                                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                                      {selectedCourse.level}
                                    </span>
                                  ) : null}
                                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                                    {sessions.length} session{sessions.length === 1 ? "" : "s"}
                                  </span>
                                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                                    {stats.nextSession ? `Next ${formatMoment(stats.nextSession.starts_at, stats.nextSession.timezone)}` : "No future sessions"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2 xl:justify-end">
                                {canManage ? (
                                  <button
                                    type="button"
                                    onClick={deleteCourse}
                                    disabled={deletingCourse || savingCourse}
                                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200 hover:bg-red-500/15 disabled:opacity-50"
                                  >
                                    {deletingCourse ? "Deleting course..." : "Delete course"}
                                  </button>
                                ) : null}

                                <button
                                  type="button"
                                  onClick={saveCourse}
                                  disabled={savingCourse || !title.trim()}
                                  className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(14,165,233,0.65)] hover:bg-sky-500 disabled:opacity-50"
                                >
                                  {savingCourse ? "Saving..." : "Save course"}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="px-5 py-5 sm:px-6">
                            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                              <div className="rounded-[24px] border border-white/10 bg-slate-950/45 p-4 sm:p-5">
                                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Core details</div>
                                <div className="mt-4 space-y-4">
                                  <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                      <label className="block text-sm text-slate-200">Title</label>
                                      <input className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white" value={title} onChange={(e) => setTitle(e.target.value)} />
                                    </div>
                                    <div>
                                      <label className="block text-sm text-slate-200">Category</label>
                                      <input className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white" value={category} onChange={(e) => setCategory(e.target.value)} />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-sm text-slate-200">Summary</label>
                                    <input className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white" value={summary} onChange={(e) => setSummary(e.target.value)} />
                                  </div>

                                  <div>
                                    <label className="block text-sm text-slate-200">Description</label>
                                    <textarea rows={7} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white" value={description} onChange={(e) => setDescription(e.target.value)} />
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
                                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Positioning</div>
                                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                                    <div>
                                      <label className="block text-sm text-slate-200">Level</label>
                                      <input className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white" value={level} onChange={(e) => setLevel(e.target.value)} />
                                    </div>
                                    <div>
                                      <label className="block text-sm text-slate-200">Duration (hours)</label>
                                      <input type="number" step="0.5" className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white" value={durationHours} onChange={(e) => setDurationHours(e.target.value)} />
                                    </div>
                                    <div>
                                      <label className="block text-sm text-slate-200">Default delivery</label>
                                      <select className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white" value={deliveryDefault} onChange={(e) => setDeliveryDefault(e.target.value)}>
                                        <option value="in_person">In person</option>
                                        <option value="online">Online</option>
                                        <option value="hybrid">Hybrid</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-sm text-slate-200">Tags (comma separated)</label>
                                      <input className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white" value={tags} onChange={(e) => setTags(e.target.value)} />
                                    </div>
                                  </div>
                                </div>

                                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 sm:p-5">
                                  <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">Next step</div>
                                  <div className="mt-3 space-y-3 text-sm text-slate-300">
                                    <div>Save the course here, then use the tabs above to move into sessions or bookings.</div>
                                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-slate-200">
                                      {stats.nextSession ? `Next session: ${formatMoment(stats.nextSession.starts_at, stats.nextSession.timezone)}` : "No sessions scheduled yet for this course."}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,6,23,0.82))] p-4 ring-1 ring-white/10 sm:p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-300/80">
                            {activeTab === "sessions" ? "Session workspace" : "Booking workspace"}
                          </div>
                          <div className="mt-2 text-xl font-semibold text-white">
                            {activeTab === "sessions" ? "Choose a course, then manage session dates" : "Choose a course, then review attendees"}
                          </div>
                          <p className="mt-2 text-sm text-slate-300">
                            {activeTab === "sessions"
                              ? "The course selector stays at the top so you can jump between offers without scrolling back through course details."
                              : "Switch the course here to review booking activity across your training offers faster."}
                          </p>
                        </div>

                        <div className="min-w-0 w-full max-w-xl lg:w-[360px]">
                          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Selected course</label>
                          <select
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-white"
                            value={selectedCourseId || ""}
                            onChange={(e) => {
                              setSelectedCourseId(e.target.value || null);
                              setShowNewSessionForm(false);
                            }}
                          >
                            <option value="">{courses.length ? "Choose a course" : "No courses available"}</option>
                            {courses.map((course) => (
                              <option key={course.id} value={course.id}>{course.title || "Untitled course"}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {!selectedCourse ? (
                      <div className="rounded-[28px] border border-dashed border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.55),rgba(15,23,42,0.25))] px-6 py-14 text-center ring-1 ring-white/10">
                        <div className="text-xl font-semibold text-white">{courses.length ? "Select a course to continue" : "No courses to manage yet"}</div>
                        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
                          {courses.length
                            ? `Pick a course from the selector above to open the ${activeTab} workspace.`
                            : "Create a course in the Courses tab first, then come back here to manage sessions and bookings."}
                        </p>
                      </div>
                    ) : null}

                    {selectedCourse && activeTab === "sessions" ? (
                      <>
                        {showNewSessionForm ? (
                          <div className="rounded-[28px] border border-sky-400/20 bg-[linear-gradient(180deg,rgba(14,165,233,0.10),rgba(15,23,42,0.65))] p-5 ring-1 ring-sky-300/10">
                            <div className="mb-4 flex items-center justify-between gap-3">
                              <div>
                                <div className="text-lg font-semibold text-white">New session</div>
                                <div className="text-sm text-slate-300">Add a fresh date for {selectedCourse.title}.</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  resetNewSessionForm();
                                  setShowNewSessionForm(false);
                                }}
                                className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
                              >
                                Cancel
                              </button>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                              <div>
                                <label className="block text-sm text-slate-200">Date</label>
                                <input type="date" className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white" value={nDate} onChange={(e) => setNDate(e.target.value)} />
                              </div>
                              <div>
                                <label className="block text-sm text-slate-200">Start</label>
                                <input type="time" className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white" value={nStart} onChange={(e) => setNStart(e.target.value)} />
                              </div>
                              <div>
                                <label className="block text-sm text-slate-200">End</label>
                                <input type="time" className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white" value={nEnd} onChange={(e) => setNEnd(e.target.value)} />
                              </div>
                            </div>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className="block text-sm text-slate-200">Timezone</label>
                                <input className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white" value={nTimezone} onChange={(e) => setNTimezone(e.target.value)} />
                              </div>
                              <div>
                                <label className="block text-sm text-slate-200">Delivery</label>
                                <select className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white" value={nDelivery} onChange={(e) => setNDelivery(e.target.value)}>
                                  <option value="in_person">In person</option>
                                  <option value="online">Online</option>
                                  <option value="hybrid">Hybrid</option>
                                </select>
                              </div>
                            </div>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className="block text-sm text-slate-200">Location (if not online)</label>
                                <input className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white" value={nLocation} onChange={(e) => setNLocation(e.target.value)} disabled={nDelivery === "online"} />
                              </div>
                              <div>
                                <label className="block text-sm text-slate-200">Join URL (online/hybrid)</label>
                                <input className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white" value={nJoinUrl} onChange={(e) => setNJoinUrl(e.target.value)} disabled={!(nDelivery === "online" || nDelivery === "hybrid")} />
                              </div>
                            </div>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className="block text-sm text-slate-200">Price (AUD dollars)</label>
                                <input type="number" min="0" step="1" className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white" value={nPrice} onChange={(e) => setNPrice(e.target.value)} />
                              </div>
                              <div>
                                <label className="block text-sm text-slate-200">Currency</label>
                                <input className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white" value={nCurrency} onChange={(e) => setNCurrency(e.target.value)} />
                              </div>
                            </div>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className="block text-sm text-slate-200">Capacity</label>
                                <input type="number" min="0" className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white" value={nCapacity} onChange={(e) => setNCapacity(e.target.value)} />
                              </div>
                              <div>
                                <label className="block text-sm text-slate-200">Booking redirect URL</label>
                                <input className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white" value={nBookingUrl} onChange={(e) => setNBookingUrl(e.target.value)} placeholder="https://trainer-site.example.com/checkout" />
                              </div>
                            </div>

                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                              <div>
                                <label className="block text-sm text-slate-200">Availability display</label>
                                <select className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/60 p-3 text-white" value={nAvailabilityDisplay} onChange={(e) => setNAvailabilityDisplay(e.target.value)}>
                                  <option value="remaining_places">Show remaining places</option>
                                  <option value="availability_only">Show availability only</option>
                                </select>
                              </div>
                              <div className="flex items-end">
                                <label className="inline-flex w-full items-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
                                  <input type="checkbox" className="h-4 w-4" checked={nBookingsEnabled} onChange={(e) => setNBookingsEnabled(e.target.checked)} />
                                  Enable bookings for this session
                                </label>
                              </div>
                            </div>

                            <div className="mt-5 flex items-center justify-end">
                              <button
                                type="button"
                                onClick={createSession}
                                disabled={creatingSession}
                                className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
                              >
                                {creatingSession ? "Adding..." : "Add session"}
                              </button>
                            </div>
                          </div>
                        ) : null}

                        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 ring-1 ring-white/10">
                          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="text-lg font-semibold text-white">Session management</div>
                              <div className="text-sm text-slate-400">Scheduling and booking controls for {selectedCourse.title}.</div>
                            </div>
                            {canManage ? (
                              <button
                                type="button"
                                onClick={() => {
                                  resetNewSessionForm();
                                  setShowNewSessionForm((current) => !current);
                                }}
                                className="rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/20"
                              >
                                {showNewSessionForm ? "Close new session" : "+ Add session"}
                              </button>
                            ) : null}
                          </div>

                          {sessions.length ? (
                            <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
                              <div className="space-y-2">
                                {sessions.map((session) => (
                                  <button
                                    key={session.id}
                                    type="button"
                                    onClick={() => selectSession(session)}
                                    className={classNames(
                                      "block w-full rounded-2xl border px-4 py-3 text-left transition",
                                      activeSessionId === session.id
                                        ? "border-sky-300/35 bg-sky-500/10"
                                        : "border-white/10 bg-slate-950/40 hover:border-white/20 hover:bg-white/[0.06]"
                                    )}
                                  >
                                    <div className="text-sm font-semibold text-white">{formatMoment(session.starts_at, session.timezone)}</div>
                                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{session.delivery_method || "session"}</div>
                                    <div className="mt-2 text-xs text-slate-500">{session.timezone || "UTC"}</div>
                                  </button>
                                ))}
                              </div>

                              <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                                {activeSession ? (
                                  <>
                                    <div className="mb-4 text-sm font-semibold text-white">Edit selected session</div>

                                    <div className="grid gap-4 sm:grid-cols-3">
                                      <div>
                                        <label className="block text-sm text-slate-200">Date</label>
                                        <input type="date" className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white" value={sDate} onChange={(e) => setSDate(e.target.value)} />
                                      </div>
                                      <div>
                                        <label className="block text-sm text-slate-200">Start</label>
                                        <input type="time" className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white" value={sStart} onChange={(e) => setSStart(e.target.value)} />
                                      </div>
                                      <div>
                                        <label className="block text-sm text-slate-200">End</label>
                                        <input type="time" className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white" value={sEnd} onChange={(e) => setSEnd(e.target.value)} />
                                      </div>
                                    </div>

                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                      <div>
                                        <label className="block text-sm text-slate-200">Timezone</label>
                                        <input className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white" value={sTimezone} onChange={(e) => setSTimezone(e.target.value)} />
                                      </div>
                                      <div>
                                        <label className="block text-sm text-slate-200">Delivery</label>
                                        <select className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white" value={sDelivery} onChange={(e) => setSDelivery(e.target.value)}>
                                          <option value="in_person">In person</option>
                                          <option value="online">Online</option>
                                          <option value="hybrid">Hybrid</option>
                                        </select>
                                      </div>
                                    </div>

                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                      <div>
                                        <label className="block text-sm text-slate-200">Location (if not online)</label>
                                        <input className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white" value={sLocation} onChange={(e) => setSLocation(e.target.value)} disabled={sDelivery === "online"} />
                                      </div>
                                      <div>
                                        <label className="block text-sm text-slate-200">Join URL (online/hybrid)</label>
                                        <input className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white" value={sJoinUrl} onChange={(e) => setSJoinUrl(e.target.value)} disabled={!(sDelivery === "online" || sDelivery === "hybrid")} />
                                      </div>
                                    </div>

                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                      <div>
                                        <label className="block text-sm text-slate-200">Price (AUD dollars)</label>
                                        <input type="number" min="0" step="1" className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white" value={sPrice} onChange={(e) => setSPrice(e.target.value)} />
                                      </div>
                                      <div>
                                        <label className="block text-sm text-slate-200">Currency</label>
                                        <input className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white" value={sCurrency} onChange={(e) => setSCurrency(e.target.value)} />
                                      </div>
                                    </div>

                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                      <div>
                                        <label className="block text-sm text-slate-200">Capacity</label>
                                        <input type="number" min="0" className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white" value={sCapacity} onChange={(e) => setSCapacity(e.target.value)} />
                                      </div>
                                      <div>
                                        <label className="block text-sm text-slate-200">Booking redirect URL</label>
                                        <input className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white" value={sBookingUrl} onChange={(e) => setSBookingUrl(e.target.value)} placeholder="https://trainer-site.example.com/checkout" />
                                      </div>
                                    </div>

                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                      <div>
                                        <label className="block text-sm text-slate-200">Availability display</label>
                                        <select className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white" value={sAvailabilityDisplay} onChange={(e) => setSAvailabilityDisplay(e.target.value)}>
                                          <option value="remaining_places">Show remaining places</option>
                                          <option value="availability_only">Show availability only</option>
                                        </select>
                                      </div>
                                      <div className="flex items-end">
                                        <label className="inline-flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                                          <input type="checkbox" className="h-4 w-4" checked={sBookingsEnabled} onChange={(e) => setSBookingsEnabled(e.target.checked)} />
                                          Enable bookings for this session
                                        </label>
                                      </div>
                                    </div>

                                    <div className="mt-5 flex items-center justify-between gap-3">
                                      <div>
                                        {canManage ? (
                                          <button
                                            type="button"
                                            onClick={deleteActiveSession}
                                            disabled={deletingSessionId === activeSessionId || savingSessionId === activeSessionId}
                                            className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200 hover:bg-red-500/15 disabled:opacity-50"
                                          >
                                            {deletingSessionId === activeSessionId ? "Deleting session..." : "Delete session"}
                                          </button>
                                        ) : null}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={saveSession}
                                        disabled={savingSessionId === activeSessionId}
                                        className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
                                      >
                                        {savingSessionId === activeSessionId ? "Saving..." : "Save session"}
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-5 py-10 text-center text-sm text-slate-400">
                                    Select a session from the left to edit it.
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-5 py-10 text-center">
                              <div className="text-lg font-semibold text-white">No sessions yet</div>
                              <p className="mt-2 text-sm text-slate-400">Add the first session for this course to enable schedule and booking management.</p>
                            </div>
                          )}
                        </div>
                      </>
                    ) : null}

                    {selectedCourse && activeTab === "bookings" ? (
                      <>
                        <div className="grid gap-3 sm:grid-cols-4">
                          {[
                            ["Pending", sessionBookingCounts?.pending || 0, "text-amber-100"],
                            ["Confirmed", sessionBookingCounts?.confirmed || 0, "text-cyan-100"],
                            ["Waitlisted", sessionBookingCounts?.waitlisted || 0, "text-fuchsia-100"],
                            ["Cancelled", sessionBookingCounts?.cancelled || 0, "text-red-100"],
                          ].map(([label, value, tone]) => (
                            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 ring-1 ring-white/10">
                              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{label}</div>
                              <div className={classNames("mt-2 text-2xl font-semibold", tone)}>{value}</div>
                            </div>
                          ))}
                        </div>

                        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 ring-1 ring-white/10">
                          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="text-lg font-semibold text-white">Booking management</div>
                              <div className="text-sm text-slate-400">Requests for {selectedCourse.title}.</div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {sessions.map((session) => (
                                <button
                                  key={session.id}
                                  type="button"
                                  onClick={() => selectSession(session)}
                                  className={classNames(
                                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                                    activeSessionId === session.id
                                      ? "border-sky-300/35 bg-sky-500/10 text-sky-100"
                                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                                  )}
                                >
                                  {formatMoment(session.starts_at, session.timezone)}
                                </button>
                              ))}
                            </div>
                          </div>

                          {!sessions.length ? (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-5 py-10 text-center">
                              <div className="text-lg font-semibold text-white">No sessions to manage</div>
                              <p className="mt-2 text-sm text-slate-400">Bookings appear once the selected course has at least one scheduled session.</p>
                            </div>
                          ) : !activeSession ? (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-5 py-10 text-center">
                              <div className="text-lg font-semibold text-white">Select a session</div>
                              <p className="mt-2 text-sm text-slate-400">Choose one of this course's sessions to review attendees.</p>
                            </div>
                          ) : loadingSessionBookings ? (
                            <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-8 text-sm text-slate-300">
                              Loading attendees...
                            </div>
                          ) : sessionBookings.length ? (
                            <div className="space-y-3">
                              {sessionBookings.map((booking) => (
                                <div key={booking.id} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4">
                                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <div className="text-sm font-semibold text-white">{booking.booking_name}</div>
                                        <span className={classNames("rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]", bookingBadgeClass(booking.status))}>
                                          {booking.status}
                                        </span>
                                      </div>
                                      <div className="mt-2 text-sm text-slate-300">{booking.booking_email}</div>
                                      {booking.booking_phone ? <div className="mt-1 text-sm text-slate-400">{booking.booking_phone}</div> : null}
                                      <div className="mt-2 text-xs text-slate-500">Booked {formatMoment(booking.booked_at, activeSession.timezone)}</div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() => updateBookingStatus(booking.id, "confirmed")}
                                        disabled={bookingActionId === booking.id || booking.status === "confirmed"}
                                        className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15 disabled:opacity-40"
                                      >
                                        Confirm
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => updateBookingStatus(booking.id, "waitlisted")}
                                        disabled={bookingActionId === booking.id || booking.status === "waitlisted"}
                                        className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15 disabled:opacity-40"
                                      >
                                        Waitlist
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => updateBookingStatus(booking.id, "cancelled")}
                                        disabled={bookingActionId === booking.id || booking.status === "cancelled"}
                                        className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-100 hover:bg-red-500/15 disabled:opacity-40"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-5 py-10 text-center">
                              <div className="text-lg font-semibold text-white">No bookings yet</div>
                              <p className="mt-2 text-sm text-slate-400">Requests for the selected session will appear here as they come in.</p>
                            </div>
                          )}
                        </div>
                      </>
                    ) : null}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}