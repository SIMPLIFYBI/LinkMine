"use client";

import { useEffect, useRef, useState } from "react";

function fmtDT(iso) {
  try {
    return new Date(iso).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function fmtPrice(cents, currency = "AUD") {
  if (cents == null) return null;
  try {
    return (cents / 100).toLocaleString("en-AU", { style: "currency", currency, minimumFractionDigits: 0 });
  } catch {
    return `$${(cents / 100).toFixed(0)} ${currency}`;
  }
}

export default function WhatsOnDrawer({ open, onClose, item }) {
  const overlayRef = useRef(null);
  const openRef = useRef(open);
  const onCloseRef = useRef(onClose);

  const [course, setCourse] = useState(null);
  const [courseError, setCourseError] = useState("");

  useEffect(() => {
    openRef.current = open;
  }, [open]);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && openRef.current) onCloseRef.current?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // For training items, optionally fetch richer course details (provider name/logo/summary)
  useEffect(() => {
    let cancelled = false;
    setCourse(null);
    setCourseError("");

    async function loadCourse() {
      if (!open || !item || item.type !== "training" || !item.course_id) return;
      try {
        const res = await fetch(`/api/training/courses/${encodeURIComponent(item.course_id)}`, { cache: "no-store" });
        const ct = res.headers.get("content-type") || "";
        const text = await res.text();
        const json = ct.includes("application/json") ? JSON.parse(text) : null;
        if (!res.ok) throw new Error(json?.error || json?.message || `HTTP ${res.status}`);
        if (!cancelled) setCourse(json);
      } catch (e) {
        if (!cancelled) setCourseError(e.message || "Failed to load course.");
      }
    }

    loadCourse();
    return () => {
      cancelled = true;
    };
  }, [open, item?.type, item?.course_id]);

  if (!item) return null;

  const isTraining = item.type === "training";
  const badge = isTraining ? "Training" : "Event";
  const badgeCls = isTraining ? "bg-indigo-500/20 text-indigo-100 border-indigo-400/30" : "bg-emerald-500/20 text-emerald-100 border-emerald-400/30";

  const providerName = course?.consultant?.display_name || null;

  return (
    <div className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!open}>
      <div
        ref={overlayRef}
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose?.();
        }}
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        className={`absolute inset-y-0 right-0 w-full max-w-md transform bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl ring-1 ring-white/10 transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start gap-3 border-b border-white/10 bg-slate-900/80 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badgeCls}`}>
                {badge}
              </span>
              {providerName ? <span className="truncate text-xs text-slate-300">{providerName}</span> : null}
            </div>
            <div className="truncate text-base font-semibold text-white">{item.title}</div>
            <div className="mt-1 text-xs text-slate-400">
              {fmtDT(item.starts_at)}{item.ends_at ? ` → ${fmtDT(item.ends_at)}` : ""} • {item.locationText || "TBA"}
            </div>
          </div>

          <button onClick={onClose} className="ml-auto rounded-md border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/10">
            Close
          </button>
        </div>

        <div className="h-[calc(100%-52px)] overflow-y-auto px-4 py-4">
          {isTraining ? (
            <>
              <div className="mb-3 grid grid-cols-2 gap-3">
                <div className="rounded-md border border-white/10 bg-white/5 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Delivery</div>
                  <div className="text-sm text-white">{item.delivery_method === "online" ? "Online" : item.delivery_method === "hybrid" ? "Hybrid" : "In person"}</div>
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 p-2">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Price</div>
                  <div className="text-sm text-white">{fmtPrice(item.price_cents, item.currency) || "TBA"}</div>
                </div>
              </div>

              {courseError ? (
                <div className="mb-3 rounded border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{courseError}</div>
              ) : null}

              {course?.summary ? <p className="mb-3 text-sm text-slate-300">{course.summary}</p> : null}

              <div className="flex flex-wrap items-center gap-2">
                {item.course_id ? (
                  <a
                    href={`/training/schedule`}
                    className="rounded-md border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
                    title="Go to training schedule"
                  >
                    View training schedule
                  </a>
                ) : null}

                {course?.consultant?.slug ? (
                  <a
                    href={`/consultants/${encodeURIComponent(course.consultant.slug)}`}
                    className="rounded-md border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
                  >
                    View provider
                  </a>
                ) : null}
              </div>
            </>
          ) : (
            <>
              {item.summary ? <p className="mb-3 text-sm text-slate-300">{item.summary}</p> : null}
              {item.description ? (
                <div className="prose prose-invert prose-sm mb-4 max-w-none">
                  <p className="whitespace-pre-wrap">{item.description}</p>
                </div>
              ) : null}

              {Array.isArray(item.tags) && item.tags.length ? (
                <div className="mb-4 rounded-md border border-white/10 bg-white/5 p-3">
                  <div className="mb-2 text-[10px] uppercase tracking-wider text-slate-400">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((t, idx) => (
                      <span key={`${t}-${idx}`} className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-xs text-slate-200">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-2">
                {item.external_url ? (
                  <a
                    href={item.external_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sky-500"
                  >
                    More info
                  </a>
                ) : null}
                {item.join_url ? (
                  <a
                    href={item.join_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
                  >
                    Join link
                  </a>
                ) : null}
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}