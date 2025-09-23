"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function DirectoryDropdown({ categories }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm hover:bg-white/5"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Directory
        <svg width="14" height="14" viewBox="0 0 20 20" className="opacity-70"><path fill="currentColor" d="M5.5 7.5L10 12l4.5-4.5z"/></svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 mt-2 w-[min(92vw,860px)] z-50 rounded-xl border border-white/10 bg-slate-900/95 ring-1 ring-white/10 shadow-2xl backdrop-blur px-3 py-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[60vh] overflow-auto pr-1">
            {categories.map((cat) => (
              <div key={cat.id} className="min-w-0">
                <div className="text-xs uppercase tracking-wide text-slate-400 mb-1.5">{cat.name}</div>
                <ul className="space-y-1">
                  {cat.services.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/consultants?service=${encodeURIComponent(s.slug)}`}
                        className="block rounded-md px-2 py-1.5 text-sm text-slate-200 hover:bg-white/5 hover:text-white"
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
      )}
    </div>
  );
}