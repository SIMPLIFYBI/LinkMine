"use client";

import { useState } from "react";
import Link from "next/link";

export default function DirectoryMobileSheet({ categories }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm hover:bg-white/5"
      >
        Directory
        <svg width="14" height="14" viewBox="0 0 20 20" className="opacity-70">
          <path fill="currentColor" d="M5.5 7.5L10 12l4.5-4.5z" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute bottom-0 left-0 right-0 max-h-[75vh] overflow-auto rounded-t-2xl border border-white/10 bg-slate-900 ring-1 ring-white/10 p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-1 pb-2">
              <h2 className="text-sm font-semibold">Directory</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {categories.map((cat) => (
                <div key={cat.id}>
                  <div className="text-xs uppercase tracking-wide text-slate-400 mb-1.5">
                    {cat.name}
                  </div>
                  <ul className="divide-y divide-white/5 rounded-md border border-white/10 overflow-hidden">
                    {cat.services.map((s) => (
                      <li key={s.id}>
                        <Link
                          href={`/consultants?service=${encodeURIComponent(s.slug)}`}
                          className="block px-3 py-2 text-sm text-slate-200 hover:bg-white/5 hover:text-white"
                          onClick={() => setOpen(false)}
                        >
                          {s.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}