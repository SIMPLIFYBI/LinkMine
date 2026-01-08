"use client";

import CourseDrawer from "../training/schedule/CourseDrawer.client.jsx";
import { useEffect, useRef } from "react";

function fmtDT(iso) {
  try {
    return new Date(iso).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function WhatsOnDrawer({ open, onClose, item }) {
  // ✅ For training items, reuse the richer drawer
  if (item?.type === "training") {
    // If you have seed meta available, pass it here; otherwise CourseDrawer will fetch by courseId.
    const seedMeta = item.course_meta ?? null;

    return (
      <CourseDrawer
        open={open}
        onClose={onClose}
        courseId={item.course_id}
        seedMeta={seedMeta}
      />
    );
  }

  // --- Existing event drawer below (unchanged behavior) ---
  const overlayRef = useRef(null);
  const openRef = useRef(open);
  const onCloseRef = useRef(onClose);

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

  if (!item) return null;

  const badgeCls = "bg-emerald-500/20 text-emerald-100 border-emerald-400/30";

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
                Event
              </span>
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
          {item.summary ? <p className="mb-3 text-sm text-slate-300">{item.summary}</p> : null}
          {item.description ? <p className="whitespace-pre-wrap text-sm text-slate-300">{item.description}</p> : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
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
        </div>
      </aside>
    </div>
  );
}