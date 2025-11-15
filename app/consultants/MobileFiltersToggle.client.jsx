"use client";
import { useState } from "react";

export default function MobileFiltersToggle({ children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-slate-100 backdrop-blur hover:bg-white/15 transition focus:outline-none focus:ring-2 focus:ring-sky-500/40"
        aria-expanded={open}
      >
        {open ? "Hide filters" : "More filters"}
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.177l3.71-3.946a.75.75 0 111.08 1.04l-4.24 4.508a.75.75 0 01-1.08 0L5.25 8.27a.75.75 0 01-.02-1.06z" />
        </svg>
      </button>
      {open && (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3">
          {children}
        </div>
      )}
    </div>
  );
}