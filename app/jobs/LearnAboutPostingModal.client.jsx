"use client";

import { useState } from "react";
import Link from "next/link";

export default function LearnAboutPostingModal({ buttonClassName = "" }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          // Filled gradient with strong contrast over photos
          "relative inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white",
          "bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-500",
          // Pop against background
          "shadow-lg shadow-sky-900/30 ring-1 ring-white/20",
          "hover:from-sky-400 hover:via-cyan-400 hover:to-indigo-400",
          "focus:outline-none focus:ring-2 focus:ring-sky-300/50",
          // Subtle glass sheen overlay (top highlight)
          "before:absolute before:inset-0 before:rounded-full before:content-['']",
          "before:bg-white/10 before:opacity-30",
          "before:[mask-image:linear-gradient(to_bottom,white,transparent_60%)]",
          // Allow custom additions
          buttonClassName,
        ].join(" ")}
      >
        Learn about Posting Jobs
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] grid place-items-center bg-black/60 backdrop-blur-sm px-4 py-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-900/95 ring-1 ring-white/10 shadow-2xl"
            style={{ maxHeight: "calc(100dvh - 4rem)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-300 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
            >
              ✕
            </button>

            {/* Header */}
            <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20 text-sky-300">📣</span>
                <h2 className="text-lg font-semibold text-white">Post jobs your way</h2>
              </div>
              <p className="mt-1 text-sm text-slate-300/90">
                Write your job once. Choose who sees it. Keep control of the inbox.
              </p>
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-5 py-5">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Private */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 ring-1 ring-white/10">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">🔒</span>
                    <h3 className="text-base font-semibold text-white">Private invites</h3>
                  </div>
                  <p className="text-sm text-slate-300/90">
                    Hand‑pick up to 5 specialists. Your request goes straight to their inbox.
                  </p>
                  <ul className="mt-3 space-y-1.5 text-sm text-slate-200">
                    <li>• Target exactly who you want</li>
                    <li>• Keep it discreet and focused</li>
                    <li>• Replies come directly to you</li>
                  </ul>
                </div>

                {/* Public */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 ring-1 ring-white/10">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-300">🌍</span>
                    <h3 className="text-base font-semibold text-white">Public board</h3>
                  </div>
                  <p className="text-sm text-slate-300/90">
                    Publish to the jobs board so any consultant can discover and reach out.
                  </p>
                  <ul className="mt-3 space-y-1.5 text-sm text-slate-200">
                    <li>• Maximum reach</li>
                    <li>• Great for fast interest</li>
                    <li>• Still “write once”—we handle the rest</li>
                  </ul>
                </div>
              </div>

              {/* Combined note */}
              <div className="mt-4 rounded-xl border border-white/10 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 p-4 text-sm text-slate-200">
                Tip: you can do Both—invite a shortlist privately and list publicly for extra reach. One post, two audiences.
              </div>

              {/* Direct contact card */}
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 ring-1 ring-white/10">
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300">💬</span>
                  <h3 className="text-base font-semibold text-white">Message consultants directly</h3>
                </div>
                <p className="text-sm text-slate-300/90">
                  You can also contact consultants straight from their profile—perfect for quick questions or smaller gigs.
                </p>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex flex-col gap-2 border-t border-white/10 bg-white/[0.03] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-400">Ready when you are—pick a path that fits your job.</div>
              <div className="flex items-center gap-2">
                <Link
                  href="/activity?tab=jobs"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                  onClick={() => setOpen(false)}
                >
                  Start a private post
                </Link>
                <Link
                  href="/consultants"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-sky-300/50 hover:bg-sky-500/10"
                  onClick={() => setOpen(false)}
                >
                  Browse consultants
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}