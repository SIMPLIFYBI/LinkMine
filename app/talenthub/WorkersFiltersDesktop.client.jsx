"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function WorkersFiltersDesktop({ roles, selectedRoleSlugs, availNow, fromDate }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Local state mirrors URL
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(new Set(selectedRoleSlugs || []));
  const [availableNow, setAvailableNow] = useState(!!availNow);
  const [from, setFrom] = useState(fromDate || "");

  const dropdownRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  // Keep in sync if URL changes elsewhere
  useEffect(() => {
    setSelected(new Set(selectedRoleSlugs || []));
    setAvailableNow(!!availNow);
    setFrom(fromDate || "");
  }, [selectedRoleSlugs, availNow, fromDate]);

  const selectedCount = selected.size;
  const labelSummary = useMemo(() => {
    if (selectedCount === 0) return "Any role";
    const first = roles.find((r) => selected.has(r.slug))?.name || "Selected";
    return selectedCount > 1 ? `${first} +${selectedCount - 1}` : first;
  }, [selected, selectedCount, roles]);

  function pushParams(next = {}) {
    const params = new URLSearchParams(searchParams?.toString() || "");
    // roles
    if (next.roles === undefined) {
      // leave as-is
    } else if (!next.roles || next.roles.length === 0) {
      params.delete("roles");
    } else {
      params.set("roles", next.roles.join(","));
    }
    // availability
    if (next.avail === undefined) {
      // leave
    } else if (next.avail === "now") {
      params.set("avail", "now");
    } else {
      params.delete("avail");
    }
    // from date
    if (next.from === undefined) {
      // leave
    } else if (next.from) {
      params.set("from", next.from);
    } else {
      params.delete("from");
    }
    params.delete("page"); // reset pagination if you add it later
    const href = `${pathname}${params.toString() ? `?${params}` : ""}`;
    router.push(href);
  }

  function toggleRole(slug) {
    const next = new Set(selected);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    setSelected(next);
    pushParams({ roles: Array.from(next).sort() });
  }

  function onToggleNow(v) {
    setAvailableNow(v);
    if (v) {
      setFrom("");
      pushParams({ avail: "now", from: "" });
    } else {
      pushParams({ avail: "", from }); // keep from if any
    }
  }

  function onPickDate(val) {
    setFrom(val);
    // picking a date cancels "now"
    setAvailableNow(false);
    pushParams({ from: val, avail: "" });
  }

  function onReset() {
    setSelected(new Set());
    setAvailableNow(false);
    setFrom("");
    pushParams({ roles: [], avail: "", from: "" });
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 h-14 flex items-center gap-3">
      {/* Roles multi-select */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-slate-100 hover:bg-white/[0.09] focus:outline-none focus:ring-2 focus:ring-sky-400/30"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-sky-400/70" />
          Roles
          <span className="ml-1 truncate text-slate-300">{labelSummary}</span>
          <CaretDown />
        </button>
        {open && (
          <div className="absolute z-30 mt-2 w-[320px] overflow-hidden rounded-xl border border-white/10 bg-slate-900/95 ring-1 ring-white/10 shadow-2xl backdrop-blur">
            <div className="max-h-80 overflow-auto p-2">
              {roles.map((r) => {
                const active = selected.has(r.slug);
                return (
                  <label
                    key={r.slug}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm transition ${
                      active ? "bg-sky-500/10 text-sky-100" : "text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-sky-400"
                      checked={active}
                      onChange={() => toggleRole(r.slug)}
                    />
                    <span className="truncate">{r.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Availability: Now toggle */}
      <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-slate-100 hover:bg-white/[0.09]">
        <input
          type="checkbox"
          className="accent-emerald-400"
          checked={availableNow}
          onChange={(e) => onToggleNow(e.target.checked)}
        />
        Available now
      </label>

      {/* Availability: From date */}
      <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-slate-100">
        <span className="opacity-80">From</span>
        <input
          type="date"
          value={from}
          onChange={(e) => onPickDate(e.target.value)}
          className="bg-transparent text-slate-100 outline-none [color-scheme:dark]"
        />
        {from ? (
          <button
            className="ml-1 rounded-md border border-white/10 bg-white/10 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-white/15"
            onClick={() => onPickDate("")}
            type="button"
          >
            Clear
          </button>
        ) : null}
      </div>

      {/* Reset */}
      <button
        type="button"
        onClick={onReset}
        className="ml-1 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-200 hover:bg-white/[0.07]"
      >
        Reset
      </button>

      {/* Spacer + count sits on right via page.jsx */}
    </div>
  );
}

function CaretDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" className="opacity-70">
      <path fill="currentColor" d="M5.5 7.5L10 12l4.5-4.5z" />
    </svg>
  );
}