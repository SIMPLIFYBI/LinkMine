"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import CourseDrawer from "@/app/training/schedule/CourseDrawer.client.jsx";
import CourseEditorModal from "@/app/training/schedule/CourseEditorModal.client.jsx";

function fmtDateTime(iso) {
  try {
    return new Date(iso).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso || "";
  }
}

function nextSession(course) {
  return (course?.sessions || []).find((session) => session?.starts_at) || null;
}

function bookingSummaryLabel(course, summary) {
  const upcoming = nextSession(course);
  if (!upcoming) return "No session scheduled";
  if (!upcoming.bookings_enabled) return "Bookings disabled";

  const availability = summary?.availability || null;
  if (!availability) return upcoming.capacity != null ? `Capacity ${upcoming.capacity}` : "Bookings open";
  if (availability.displayMode === "availability_only") {
    return availability.hasAvailability ? "Places available" : "Currently full";
  }
  if (availability.remainingPlaces != null) {
    return `${availability.remainingPlaces} places left`;
  }
  return "Bookings open";
}

function sessionCountLabel(count) {
  return `${count} session${count === 1 ? "" : "s"}`;
}

function classNames(...parts) {
  return parts.filter(Boolean).join(" ");
}

export default function ConsultantTrainingSection({
  consultantId,
  consultantName,
  initialCourses = [],
}) {
  const searchParams = useSearchParams();
  const queryHandledRef = useRef(false);
  const [courses, setCourses] = useState(initialCourses);
  const [availabilityBySessionId, setAvailabilityBySessionId] = useState({});
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [error, setError] = useState("");

  const [drawerCourse, setDrawerCourse] = useState(null);
  const [managerOpen, setManagerOpen] = useState(false);
  const [managerCourseId, setManagerCourseId] = useState(null);
  const [notice, setNotice] = useState("");

  const hasCourses = courses.length > 0;

  const drawerSeed = useMemo(() => {
    if (!drawerCourse) return null;
    return {
      providerName: consultantName,
      consultantId,
      courseTitle: drawerCourse.title,
    };
  }, [consultantId, consultantName, drawerCourse]);

  const managerSeed = useMemo(() => ({
    providerName: consultantName,
    consultantId,
    courseTitle: courses.find((course) => course.id === managerCourseId)?.title || null,
  }), [consultantId, consultantName, courses, managerCourseId]);

  async function loadCourses() {
    setLoadingCourses(true);
    setError("");
    try {
      const res = await fetch(`/api/consultants/${encodeURIComponent(consultantId)}/courses`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed to load training.");
      setCourses(Array.isArray(json?.courses) ? json.courses : []);
    } catch (err) {
      setError(err.message || "Failed to load training.");
    } finally {
      setLoadingCourses(false);
    }
  }

  async function loadPermissions() {
    setLoadingPermissions(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(`/api/consultants/${encodeURIComponent(consultantId)}/permissions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCanEdit(false);
        return;
      }

      setCanEdit(Boolean(json?.canEdit));
    } catch {
      setCanEdit(false);
    } finally {
      setLoadingPermissions(false);
    }
  }

  useEffect(() => {
    setCourses(initialCourses);
  }, [initialCourses]);

  useEffect(() => {
    const sessionIds = Array.from(new Set(courses.map((course) => nextSession(course)?.id).filter(Boolean)));
    if (!sessionIds.length) {
      setAvailabilityBySessionId({});
      return;
    }

    let cancelled = false;

    async function loadAvailability() {
      try {
        const results = await Promise.all(
          sessionIds.map(async (sessionId) => {
            const res = await fetch(`/api/training/sessions/${encodeURIComponent(sessionId)}/bookings`, { cache: "no-store" });
            const json = await res.json().catch(() => ({}));
            return [sessionId, res.ok ? json : null];
          })
        );

        if (!cancelled) setAvailabilityBySessionId(Object.fromEntries(results));
      } catch {
        if (!cancelled) setAvailabilityBySessionId({});
      }
    }

    loadAvailability();
    return () => {
      cancelled = true;
    };
  }, [courses]);

  useEffect(() => {
    loadPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultantId]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 3200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (queryHandledRef.current) return;
    if (loadingPermissions || !canEdit) return;

    const trainingIntent = searchParams?.get("training");
    const courseId = searchParams?.get("course");
    if (trainingIntent !== "manage" || !courseId) return;

    const matchedCourse = courses.find((course) => course.id === courseId);
    if (!matchedCourse) return;

    queryHandledRef.current = true;
    setDrawerCourse(null);
    setManagerCourseId(matchedCourse.id);
    setManagerOpen(true);
  }, [canEdit, courses, loadingPermissions, searchParams]);

  if (!hasCourses && !canEdit && !loadingPermissions) return null;

  return (
    <article className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(2,6,23,0.9))] p-6 text-slate-100 shadow-[0_28px_80px_-42px_rgba(14,165,233,0.45)] ring-1 ring-white/5">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.24),transparent_55%)]" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200">
            Training
          </div>
          <h2 className="mt-3 text-xl font-semibold text-white">Courses and upcoming sessions</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Publish consultant training directly from this page. Upcoming sessions flow into What&apos;s On automatically.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {loadingPermissions ? (
            <span className="h-10 w-28 animate-pulse rounded-full bg-white/10" />
          ) : canEdit ? (
            <button
              type="button"
              onClick={() => {
                setManagerCourseId(courses[0]?.id || null);
                setManagerOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-sky-300/40 bg-gradient-to-r from-sky-500/90 to-cyan-500/80 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_16px_32px_-18px_rgba(56,189,248,0.7)] transition hover:translate-y-[-1px] hover:from-sky-400 hover:to-cyan-400"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-950/15 text-sm">≡</span>
              Manage training
            </button>
          ) : null}
        </div>
      </div>

      {notice ? (
        <div className="relative mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="relative mt-4 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="relative mt-6 space-y-3">
        {loadingCourses ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="h-44 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
            ))}
          </div>
        ) : hasCourses ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {courses.map((course) => {
              const upcoming = nextSession(course);
              const count = course.sessions?.length || 0;
              const availabilitySummary = upcoming?.id ? availabilityBySessionId[upcoming.id] : null;

              return (
                <div
                  key={course.id}
                  className="group rounded-3xl border border-white/10 bg-white/[0.045] p-4 transition hover:border-sky-300/25 hover:bg-white/[0.07]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setDrawerCourse(course)}
                      className="min-w-0 text-left"
                    >
                      <div className="text-base font-semibold text-white transition group-hover:text-sky-100">{course.title}</div>
                      {course.summary ? (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-300">{course.summary}</p>
                      ) : (
                        <p className="mt-1 text-sm text-slate-400">Open the course to add summary, sessions, and delivery details.</p>
                      )}
                    </button>

                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => {
                          setManagerCourseId(course.id);
                          setManagerOpen(true);
                        }}
                        className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-white/10"
                      >
                        Manage
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Upcoming</div>
                      <div className="mt-1 text-sm text-white">{upcoming ? fmtDateTime(upcoming.starts_at) : "No session scheduled"}</div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Schedule</div>
                      <div className="mt-1 text-sm text-white">{sessionCountLabel(count)}</div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Availability</div>
                      <div className="mt-1 text-sm text-white">{bookingSummaryLabel(course, availabilitySummary)}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {Array.isArray(course.tags) && course.tags.length ? (
                      course.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Published
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-xs text-slate-400">
                      {course.level ? `${course.level} level` : "Training course"}
                      {Number.isFinite(course.duration_hours) ? ` • ${course.duration_hours}h` : ""}
                    </div>

                    <button
                      type="button"
                      onClick={() => setDrawerCourse(course)}
                      className="text-sm font-semibold text-sky-200 hover:text-sky-100"
                    >
                      View details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/10 text-xl text-sky-200">+</div>
            <h3 className="mt-4 text-lg font-semibold text-white">No training published yet</h3>
            <p className="mt-2 text-sm text-slate-300">
              Add a course and at least one session to start appearing in the training calendar.
            </p>
            {canEdit ? (
              <button
                type="button"
                onClick={() => {
                  setManagerCourseId(null);
                  setManagerOpen(true);
                }}
                className="mt-5 rounded-full border border-sky-300/35 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/20"
              >
                Manage training
              </button>
            ) : null}
          </div>
        )}
      </div>

      <CourseDrawer
        open={Boolean(drawerCourse)}
        onClose={() => setDrawerCourse(null)}
        courseId={drawerCourse?.id || null}
        seedMeta={drawerSeed}
        onChanged={loadCourses}
        onDeleted={async () => {
          setDrawerCourse(null);
          await loadCourses();
          setNotice("Training removed.");
        }}
      />

      <CourseEditorModal
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        courseId={managerCourseId || null}
        seedMeta={managerSeed}
        canManage={canEdit}
        onChanged={async () => {
          await loadCourses();
          if (managerCourseId) {
            setDrawerCourse((current) => (current?.id === managerCourseId ? { ...current } : current));
          }
          setNotice("Training updated.");
        }}
        onDeleted={async () => {
          await loadCourses();
          setNotice("Training removed.");
        }}
        onCreated={async () => {
          await loadCourses();
          setNotice("Training added. You can keep editing everything from the manager.");
        }}
      />
    </article>
  );
}