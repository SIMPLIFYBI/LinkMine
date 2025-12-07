"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function WorkersFiltersMobile({ roles, selectedRoleSlugs, availNow, fromDate, resultCount }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(new Set(selectedRoleSlugs || []));
  const [availableNow, setAvailableNow] = useState(!!availNow);
  const [from, setFrom] = useState(fromDate || "");

  useEffect(() => {
    setSelected(new Set(selectedRoleSlugs || []));
    setAvailableNow(!!availNow);
    setFrom(fromDate || "");
  }, [selectedRoleSlugs, availNow, fromDate]);

  const selectedCount = selected.size;
  const labelSummary = useMemo(() => {
    if (selectedCount === 0) return "Any role";
    if (selectedCount === 1) {
      const slug = Array.from(selected)[0];
      return roles.find((r) => r.slug === slug)?.name || "1 selected";
    }
    return `${selectedCount} roles`;
  }, [selected, selectedCount, roles]);

  function apply() {
    const params = new URLSearchParams(searchParams?.toString() || "");
    const rolesArr = Array.from(selected).sort();
    if (rolesArr.length) params.set("roles", rolesArr.join(","));
    else params.delete("roles");

    if (availableNow) params.set("avail", "now");
    else params.delete("avail");

    if (from) params.set("from", from);
    else params.delete("from");

    params.delete("page");
    const href = `${pathname}${params.toString() ? `?${params}` : ""}`;
    router.push(href);
    setOpen(false);
  }

  function reset() {
    setSelected(new Set());
    setAvailableNow(false);
    setFrom("");
  }

  return (
    <>
      {/* Top bar with button */}
      <div className="md:hidden sticky top-[56px] z-30 border-b border-white/10 bg-slate-900/70 backdrop-blur">
        <div className="mx-auto max-w-screen-xl px-4 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-sm text-slate-100"
          >
            Filters
            <span className="h-1 w-1 rounded-full bg-slate-400/60" />
            <span className="text-slate-300">{labelSummary}</span>
          </button>
          <div className="text-xs text-slate-400">
            {resultCount} result{resultCount === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {/* Sheet */}
      {open && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-white/12 bg-slate-900/95 ring-1 ring-white/10 backdrop-blur">
            <div className="mx-auto max-w-screen-sm px-5 pt-4 pb-5">
              <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-white/15" />
              <h3 className="text-sm font-semibold text-white">Filters</h3>

              {/* Roles */}
              <div className="mt-5">
                <div className="text-xs uppercase tracking-wide text-slate-400">Roles</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {roles.map((r) => {
                    const active = selected.has(r.slug);
                    return (
                      <button
                        key={r.slug}
                        type="button"
                        onClick={() => {
                          const next = new Set(selected);
                          if (next.has(r.slug)) next.delete(r.slug);
                          else next.add(r.slug);
                          setSelected(next);
                        }}
                        className={`rounded-full border px-3 py-1.5 text-xs ${
                          active
                            ? "border-sky-400/30 bg-sky-500/10 text-sky-100"
                            : "border-white/12 bg-white/[0.06] text-slate-200"
                        }`}
                      >
                        {r.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Availability */}
              <div className="mt-6">
                <div className="text-xs uppercase tracking-wide text-slate-400">Availability</div>
                <label className="mt-2 inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2 text-sm text-slate-100">
                  <input
                    type="checkbox"
                    className="accent-emerald-400"
                    checked={availableNow}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setAvailableNow(v);
                      if (v) setFrom("");
                    }}
                  />
                  Available now
                </label>
                <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-3 py-2 text-sm text-slate-100">
                  <span className="opacity-80">From</span>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => {
                      setFrom(e.target.value);
                      setAvailableNow(false);
                    }}
                    className="bg-transparent text-slate-100 outline-none [color-scheme:dark]"
                  />
                  {from ? (
                    <button
                      className="ml-1 rounded-md border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] text-slate-200"
                      onClick={() => setFrom("")}
                      type="button"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2 text-sm text-slate-200"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={apply}
                  className="inline-flex items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-100 hover:bg-sky-500/15 hover:border-sky-400/40 transition"
                >
                  Apply
                  <ArrowNarrowRight />
                </button>
              </div>

              <div className="pb-2" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ArrowNarrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" className="opacity-80">
      <path fill="currentColor" d="M11 5l4 5-4 5v-3H5v-4h6V5z" />
    </svg>
  );
}