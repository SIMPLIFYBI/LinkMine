"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function ServiceFinder({ className = "" }) {
  const router = useRouter();
  const sb = supabaseBrowser();

  const [loading, setLoading] = useState(true);
  const [cats, setCats] = useState([]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [highlight, setHighlight] = useState(0);

  const popRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await sb
        .from("service_categories_with_children")
        .select("*")
        .order("position", { ascending: true });
      if (!mounted) return;
      if (!error) {
        const categories = (data || []).map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          services: Array.isArray(c.services)
            ? c.services.map((s) => ({ id: s.id, name: s.name, slug: s.slug }))
            : [],
        }));
        setCats(categories);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []); // eslint-disable-line

  const flatOptions = useMemo(() => {
    const items = [];
    for (const c of cats) {
      items.push({ type: "group", id: c.id, name: c.name });
      for (const s of c.services) {
        items.push({
          type: "service",
          id: s.id,
          name: s.name,
          slug: s.slug,
          group: c.name,
        });
      }
    }
    return items;
  }, [cats]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return flatOptions;
    return flatOptions.filter((item) =>
      item.type === "group" ? item.name.toLowerCase().includes(needle) : item.name.toLowerCase().includes(needle)
    );
  }, [flatOptions, q]);

  // For keyboard nav, we only count selectable items (services)
  const selectableIndexes = useMemo(
    () => filtered.map((it, i) => (it.type === "service" ? i : null)).filter((i) => i !== null),
    [filtered]
  );

  useEffect(() => {
    if (!open) return;
    setHighlight(selectableIndexes[0] ?? 0);
  }, [open, selectableIndexes]);

  useEffect(() => {
    function onKey(e) {
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        btnRef.current?.focus?.();
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const idx = selectableIndexes.indexOf(highlight);
        if (idx === -1) return;
        const delta = e.key === "ArrowDown" ? 1 : -1;
        const nextIdx = Math.max(0, Math.min(selectableIndexes.length - 1, idx + delta));
        const nextHighlight = selectableIndexes[nextIdx];
        setHighlight(nextHighlight);
        // Scroll into view
        const el = listRef.current?.querySelector?.(`[data-idx="${nextHighlight}"]`);
        el?.scrollIntoView?.({ block: "nearest" });
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = filtered[highlight];
        if (item && item.type === "service") {
          onSelect(item.slug);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, highlight, filtered, selectableIndexes]);

  useEffect(() => {
    function onClickOutside(e) {
      if (!open) return;
      if (!popRef.current || popRef.current.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function onSelect(slug) {
    setOpen(false);
    if (!slug) return;
    router.push(`/consultants?service=${encodeURIComponent(slug)}`);
  }

  return (
    <div className={className}>
      <p className="mb-2 text-sm font-semibold text-slate-200">
        Find a Consultant by a specific service
      </p>

      {/* Glassmorphic combobox container */}
      <div className="relative">
        <button
          ref={btnRef}
          type="button"
          onClick={() => setOpen((o) => !o)}
          disabled={loading}
          className={[
            "group w-full rounded-2xl border px-4 py-3 text-left text-sm shadow-lg ring-1 transition",
            "border-white/15 bg-white/10 text-slate-100 backdrop-blur-lg ring-white/10",
            "hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-sky-400/40",
            loading ? "opacity-60 cursor-not-allowed" : "",
          ].join(" ")}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls="service-combobox-list"
        >
          <div className="flex items-center justify-between">
            <span className="pointer-events-none select-none">
              {loading ? "Loading services..." : "Choose a service"}
            </span>
            <svg
              className="h-4 w-4 text-slate-200/80 transition group-aria-expanded:rotate-180"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </button>

        {/* Popover */}
        {open && (
          <div
            ref={popRef}
            className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-white/15 bg-slate-900/70 shadow-2xl backdrop-blur-xl ring-1 ring-white/10"
          >
            {/* Search input */}
            <div className="border-b border-white/10 p-2">
              <label className="sr-only" htmlFor="service-search">
                Search services
              </label>
              <input
                id="service-search"
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search services…"
                className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-300 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
              />
            </div>

            {/* Options list */}
            <ul
              id="service-combobox-list"
              role="listbox"
              ref={listRef}
              className="max-h-64 overflow-auto p-2"
              aria-label="Service options"
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-slate-300">No matches.</li>
              ) : (
                filtered.map((item, idx) =>
                  item.type === "group" ? (
                    <li
                      key={`g-${item.id}-${idx}`}
                      className="mt-2 mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-slate-300/80"
                      aria-hidden="true"
                    >
                      {item.name}
                    </li>
                  ) : (
                    <li
                      key={`s-${item.id}-${idx}`}
                      data-idx={idx}
                      role="option"
                      aria-selected={highlight === idx}
                      onMouseEnter={() => setHighlight(idx)}
                      onClick={() => onSelect(item.slug)}
                      className={[
                        "cursor-pointer rounded-xl px-3 py-2 text-sm transition",
                        highlight === idx
                          ? "bg-sky-500/25 text-sky-50 ring-1 ring-sky-400/40"
                          : "text-slate-100 hover:bg-white/10",
                      ].join(" ")}
                    >
                      <div className="font-medium">{item.name}</div>
                    </li>
                  )
                )
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}