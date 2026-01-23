"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import CourseEditorModal from "./CourseEditorModal.client.jsx";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fmtDT(iso) {
  try {
    return new Date(iso).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}
function fmtPrice(cents, currency = "AUD") {
  if (cents == null) return "TBA";
  try {
    return (cents / 100).toLocaleString("en-AU", { style: "currency", currency, minimumFractionDigits: 0 });
  } catch {
    return `$${(cents / 100).toFixed(0)} ${currency}`;
  }
}

export default function CourseDrawer({ open, onClose, courseId, seedMeta }) {
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState(null);
  const [error, setError] = useState("");
  const [logoBroken, setLogoBroken] = useState(false);

  const [canManage, setCanManage] = useState(false);
  const [checkingPerms, setCheckingPerms] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  // ✅ if we only have a slug, resolve it to an id for /consultants/[id]
  const [resolvedConsultantId, setResolvedConsultantId] = useState(null);

  const overlayRef = useRef(null);
  const openRef = useRef(open);
  const onCloseRef = useRef(onClose);

  // keep refs in sync so the key handler sees latest values
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    setLogoBroken(false);
  }, [courseId]);

  useEffect(() => {
    if (!open || !courseId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setCourse(null);
    (async () => {
      try {
        const res = await fetch(`/api/training/courses/${encodeURIComponent(courseId)}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || json.error) throw new Error(json.error || "Failed to load");
        if (!cancelled) setCourse(json);
      } catch (e) {
        if (!cancelled) setError(e.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, courseId]);

  // ✅ compute owner/admin permission for showing Manage button
  useEffect(() => {
    if (!open || !courseId) return;
    let cancelled = false;

    async function loadPerms() {
      try {
        setCheckingPerms(true);

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        const res = await fetch(`/api/training/courses/${courseId}/permissions`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: "no-store",
        });

        if (!res.ok) {
          if (!cancelled) setCanManage(false);
          return;
        }

        const json = await res.json();
        if (!cancelled) setCanManage(!!json.canEdit);
      } catch {
        if (!cancelled) setCanManage(false);
      } finally {
        if (!cancelled) setCheckingPerms(false);
      }
    }

    loadPerms();
    return () => {
      cancelled = true;
    };
  }, [open, courseId]);

  // subscribe once; use refs to avoid changing deps size/order
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && openRef.current) onCloseRef.current?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setResolvedConsultantId(null);
  }, [courseId, open]);

  const consultant = course?.consultant || {};
  const logo = consultant.logo_url || seedMeta?.providerLogoUrl || null;

  const rawConsultantId =
    consultant?.id ||
    consultant?.consultant_id ||
    course?.consultant_id ||
    seedMeta?.consultantId ||
    seedMeta?.consultant_id ||
    null;

  const consultantId = rawConsultantId && UUID_RE.test(String(rawConsultantId)) ? String(rawConsultantId) : null;
  const consultantSlug = consultant?.slug || seedMeta?.consultantSlug || seedMeta?.consultant_slug || null;

  // ✅ resolve slug -> id (best-effort)
  useEffect(() => {
    if (!open) return;
    if (consultantId) return;
    if (!consultantSlug) return;

    let cancelled = false;

    (async () => {
      try {
        const { data, error: qErr } = await supabase
          .from("consultants")
          .select("id")
          .eq("slug", consultantSlug)
          .maybeSingle();

        if (cancelled) return;
        if (qErr) return;

        const id = data?.id;
        if (id && UUID_RE.test(String(id))) setResolvedConsultantId(String(id));
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, consultantId, consultantSlug]);

  const providerHref = (consultantId || resolvedConsultantId)
    ? `/consultants/${encodeURIComponent(String(consultantId || resolvedConsultantId))}`
    : null;

  return (
    <div className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!open}>
      {/* Overlay with fade */}
      <div
        ref={overlayRef}
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose?.();
        }}
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Sliding panel */}
      <aside
        role="dialog"
        aria-modal="true"
        className={`absolute inset-y-0 right-0 w-full max-w-md transform bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl ring-1 ring-white/10 transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/10 bg-slate-900/80 px-4 py-3">
          <div className="h-10 w-10 overflow-hidden ring-1 ring-white/10">
            {logo && !logoBroken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt={consultant.display_name || "Provider"}
                className="h-full w-full object-cover"
                onError={() => setLogoBroken(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-500/60 to-indigo-600/60 text-sm font-bold text-white">
                {(consultant.display_name || seedMeta?.providerName || "?").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="truncate text-xs font-semibold uppercase tracking-wider text-slate-300">
              {consultant.display_name || seedMeta?.providerName || "Provider"}
            </div>
            <div className="truncate text-base font-semibold text-white">{course?.title || seedMeta?.courseTitle || "Course"}</div>
          </div>

          {canManage ? (
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              disabled={checkingPerms}
              className="ml-auto rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200 hover:bg-white/10 disabled:opacity-60"
              title="Edit or delete this course and its sessions"
            >
              {checkingPerms ? "…" : "Manage"}
            </button>
          ) : null}

          <button
            onClick={onClose}
            className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div className="h-[calc(100%-52px)] overflow-y-auto px-4 py-4">
          {loading && <div className="text-slate-400">Loading…</div>}
          {error && <div className="rounded border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>}
          {!loading && !error && (
            <>
              {course?.summary && <p className="mb-3 text-sm text-slate-300">{course.summary}</p>}

              {course?.description && (
                <div className="prose prose-invert prose-sm mb-4 max-w-none">
                  <p className="whitespace-pre-wrap">{course.description}</p>
                </div>
              )}

              <div className="mb-4 grid grid-cols-2 gap-3">
                {course?.category && (
                  <div className="rounded-md border border-white/10 bg-white/5 p-2">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">Category</div>
                    <div className="text-sm text-white">{course.category}</div>
                  </div>
                )}
                {course?.level && (
                  <div className="rounded-md border border-white/10 bg-white/5 p-2">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">Level</div>
                    <div className="text-sm text-white">{course.level}</div>
                  </div>
                )}
                {Number.isFinite(course?.duration_hours) && (
                  <div className="rounded-md border border-white/10 bg-white/5 p-2">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">Duration</div>
                    <div className="text-sm text-white">{course.duration_hours} hours</div>
                  </div>
                )}
                {Array.isArray(course?.tags) && course.tags.length > 0 && (
                  <div className="rounded-md border border-white/10 bg-white/5 p-2">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">Tags</div>
                    <div className="text-xs text-slate-200">{course.tags.join(", ")}</div>
                  </div>
                )}
              </div>

              <div className="mb-2 text-sm font-semibold text-white">Upcoming sessions</div>
              {course?.sessions?.length ? (
                <ul className="space-y-2">
                  {course.sessions.map((s) => (
                    <li key={s.id} className="rounded-md border border-white/10 bg-white/5 p-3">
                      <div className="text-sm text-white">
                        {fmtDT(s.starts_at)} → {fmtDT(s.ends_at)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {s.delivery_method === "online"
                          ? "Online"
                          : [s.location_name, s.suburb, s.state].filter(Boolean).join(", ") || "TBA"}
                        {" • "}
                        {fmtPrice(s.price_cents, s.currency)}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-md border border-white/10 bg-white/5 p-3 text-sm text-slate-400">No upcoming sessions.</div>
              )}

              <div className="mt-4 flex items-center gap-2">
                {providerHref ? (
                  <a
                    href={providerHref}
                    className="rounded-md border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
                  >
                    View provider
                  </a>
                ) : null}
              </div>
            </>
          )}
        </div>
      </aside>

      {/* ✅ editor modal (edit + delete lives here) */}
      <CourseEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        courseId={courseId}
        seedMeta={seedMeta}
        canManage={canManage}
      />
    </div>
  );
}