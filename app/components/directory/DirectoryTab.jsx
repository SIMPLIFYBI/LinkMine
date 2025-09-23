"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function DirectoryTab({ variant = "desktop" }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const ref = useRef(null);

  async function load() {
    if (categories.length || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/directory", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) setCategories(json.categories);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (variant === "mobile") {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            load();
          }}
          className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm hover:bg-white/5"
        >
          Directory
          <svg width="14" height="14" viewBox="0 0 20 20" className="opacity-70">
            <path fill="currentColor" d="M5.5 7.5L10 12l4.5-4.5z" />
          </svg>
        </button>

        {open && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
            <div
              className="absolute bottom-0 left-0 right-0 max-h-[75vh] overflow-auto rounded-t-2xl border border-white/10 bg-slate-900 ring-1 ring-white/10 p-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-1 pb-2">
                <h2 className="text-sm font-semibold">Directory</h2>
                <button onClick={() => setOpen(false)} className="text-slate-300 hover:text-white">✕</button>
              </div>

              {loading ? (
                <div className="text-slate-400 text-sm px-1 py-2">Loading…</div>
              ) : (
                <div className="space-y-3">
                  {categories.map((cat) => (
                    <div key={cat.id}>
                      <div className="text-xs uppercase tracking-wide text-slate-400 mb-1.5">{cat.name}</div>
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
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop: open on hover, close on mouse leave (no global click handler)
  return (
    <div
      className="relative"
      ref={ref}
      onMouseEnter={() => {
        setOpen(true);
        load();
      }}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm hover:bg-white/5"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Directory
        <svg width="14" height="14" viewBox="0 0 20 20" className="opacity-70">
          <path fill="currentColor" d="M5.5 7.5L10 12l4.5-4.5z" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 mt-2 w-[min(92vw,860px)] z-50 rounded-xl border border-white/10 bg-slate-900/95 ring-1 ring-white/10 shadow-2xl backdrop-blur px-3 py-3"
        >
          {loading ? (
            <div className="text-slate-400 text-sm px-2 py-1.5">Loading…</div>
          ) : (
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
          )}
        </div>
      )}
    </div>
  );
}