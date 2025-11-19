"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";

export default function LearnAboutPostingModalMobile({ buttonClassName = "" }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Lock body scroll while modal open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          "inline-flex items-center rounded-full font-semibold px-4 py-2 text-[12px]",
          "border border-white/25 bg-white/10 backdrop-blur-sm text-white",
          "hover:bg-white/15 transition focus:outline-none focus:ring-2 focus:ring-sky-500/40",
          buttonClassName
        ].join(" ")}
      >
        Learn about posting jobs
      </button>

      {open && mounted &&
        createPortal(
          <div
            className="
              fixed inset-0 z-30
              flex flex-col
              bg-black/60 backdrop-blur-sm
              text-slate-100
            "
            // Header (z-40) & ticker remain visible above since z-30 < z-40
          >
            {/* Click outside to close */}
            <div
              className="absolute inset-0"
              onClick={close}
              aria-hidden="true"
            />

            {/* Content wrapper (pointer events) */}
            <div
              className="
                relative flex flex-col h-full
                pointer-events-none
              "
            >
              {/* Spacer under header+ticker (tweak if needed) */}
              <div className="h-28 md:hidden" /> {/* adjust this height if header+ticker differs */}

              {/* Modal panel */}
              <div
                className="
                  pointer-events-auto mx-auto w-full max-w-none
                  flex flex-col flex-1
                  rounded-none
                  bg-gradient-to-br from-slate-950/95 via-slate-900/90 to-slate-900/95
                  border-t border-white/10
                "
              >
                {/* Top bar */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/25 text-sky-300">
                      📣
                    </span>
                    <h2 className="text-base font-semibold text-white">
                      Post jobs your way
                    </h2>
                  </div>
                  <button
                    aria-label="Close"
                    onClick={close}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-slate-200 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  >
                    ✕
                  </button>
                </div>

                {/* Scrollable content */}
                <div
                  className="flex-1 overflow-y-auto px-5 py-5 space-y-6"
                  style={{ WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
                >
                  <p className="text-[13px] leading-relaxed text-slate-300/90">
                    Write your job once. Choose who sees it. Keep control of the inbox.
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 ring-1 ring-white/10">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/25 text-emerald-300">
                          🔒
                        </span>
                        <h3 className="text-sm font-semibold text-white">Private invites</h3>
                      </div>
                      <p className="text-[13px] text-slate-300/90">
                        Hand‑pick up to 5 specialists. Your request goes straight to their inbox.
                      </p>
                      <ul className="mt-3 space-y-1.5 text-[13px] text-slate-200">
                        <li>• Target exactly who you want</li>
                        <li>• Keep it discreet and focused</li>
                        <li>• Replies come directly to you</li>
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 ring-1 ring-white/10">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/25 text-sky-300">
                          🌍
                        </span>
                        <h3 className="text-sm font-semibold text-white">Public board</h3>
                      </div>
                      <p className="text-[13px] text-slate-300/90">
                        Publish to the jobs board so any consultant can discover and reach out.
                      </p>
                      <ul className="mt-3 space-y-1.5 text-[13px] text-slate-200">
                        <li>• Maximum reach</li>
                        <li>• Great for fast interest</li>
                        <li>• Still “write once”—we handle the rest</li>
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 p-4 text-[13px] text-slate-200">
                    Tip: invite privately + list publicly for extra reach—one post, two audiences.
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 ring-1 ring-white/10">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/25 text-amber-300">
                        💬
                      </span>
                      <h3 className="text-sm font-semibold text-white">Message directly</h3>
                    </div>
                    <p className="text-[13px] text-slate-300/90">
                      Reach out from a profile for quick questions or smaller gigs.
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-white/10 bg-white/[0.05] px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-[11px] text-slate-400">
                    Ready when you are—pick a path that fits your job.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/activity?tab=jobs"
                      onClick={close}
                      className="inline-flex items-center rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-[12px] font-semibold text-white shadow hover:from-sky-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    >
                      Start a private post
                    </Link>
                    <Link
                      href="/consultants"
                      onClick={close}
                      className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[12px] font-semibold text-slate-100 hover:border-sky-300/50 hover:bg-sky-500/10"
                    >
                      Browse consultants
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}