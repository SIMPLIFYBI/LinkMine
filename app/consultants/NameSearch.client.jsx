"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

export default function NameSearch({
  initialValue = "",
  onApplied,
  className = "",
  placeholder = "Search consultancy name",
  submitLabel = "Search",
}) {
  const [value, setValue] = useState(initialValue || "");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function replaceWithValue(nextValue) {
    const params = new URLSearchParams(searchParams?.toString() || "");
    const q = String(nextValue || "").trim();
    if (q) params.set("q", q);
    else params.delete("q");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    onApplied?.();
  }

  function apply(e) {
    e?.preventDefault?.();
    replaceWithValue(value);
  }

  return (
    <form onSubmit={apply} className={`w-full ${className}`}>
      <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-[linear-gradient(130deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-1.5 shadow-[0_12px_34px_-22px_rgba(0,0,0,0.75)] ring-1 ring-white/10 backdrop-blur-xl">
        <div className="relative min-w-0 flex-1">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300"
            fill="none"
          >
            <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z" stroke="currentColor" strokeWidth="1.8" />
            <path d="m16.3 16.3 3.7 3.7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            aria-label="Search consultancy name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-xl border border-transparent bg-white/5 py-2.5 pr-10 pl-9 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-[rgba(var(--consultants-accent-rgb),0.45)] focus:bg-white/10 focus:ring-2 focus:ring-[rgba(var(--consultants-accent-rgb),0.28)]"
          />
          {value && (
            <button
              type="button"
              onClick={() => {
                setValue("");
                replaceWithValue("");
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/15 bg-white/8 px-2 py-0.5 text-[11px] font-semibold text-slate-200 transition hover:border-white/30 hover:bg-white/14"
              aria-label="Clear search"
            >
              Clear
            </button>
          )}
        </div>
        <button
          type="submit"
          className="rounded-xl bg-[linear-gradient(135deg,rgb(var(--consultants-accent-rgb)),rgb(var(--consultants-accent-soft-rgb)))] px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--consultants-accent-rgb),0.45)]"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}