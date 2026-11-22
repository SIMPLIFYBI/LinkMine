"use client";

import { useMemo, useState } from "react";
import { fmtNum } from "@/lib/intelligence/dataMath";

// Checklist of every country in the series. Chosen countries are pinned to the top.
// In map view the same list highlights one country instead, because the map already shows them all.
export default function CountryRail({ rows, chosen, onToggle, onClear, mode = "select", highlight, onHighlight, valueLabel }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("value");
  const [open, setOpen] = useState(false);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const shown = rows.filter((r) => !q || r.name.toLowerCase().includes(q));
    const by = sort === "name" ? (a, b) => a.name.localeCompare(b.name) : (a, b) => (b.v ?? -Infinity) - (a.v ?? -Infinity) || a.name.localeCompare(b.name);
    const pinned = (r) => (mode === "select" ? chosen.includes(r.iso) : r.iso === highlight);
    return [...shown.filter(pinned).sort(by), ...shown.filter((r) => !pinned(r)).sort(by)];
  }, [rows, query, sort, chosen, mode, highlight]);

  const count = mode === "select" ? chosen.length : highlight ? 1 : 0;

  return (
    <aside className="yi-rail" aria-label="Countries">
      <button type="button" className="yi-rail__toggle yi-btn" aria-expanded={open} onClick={() => setOpen(!open)}>
        {mode === "select" ? "Countries" : "Highlight"} ({count})
      </button>
      <div className={`yi-rail__panel${open ? " is-open" : ""}`}>
        <label className="yi-rail__search">
          <span className="yi-sr">Search countries</span>
          <input type="search" placeholder="Type to find a country" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="yi-rail__sort">
          <label htmlFor="rail-sort">Sort by</label>
          <select id="rail-sort" className="yi-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="value">{valueLabel || "Latest value"}</option>
            <option value="name">Name, A to Z</option>
          </select>
        </div>
        <ul className="yi-rail__list">
          {list.map((r) => {
            const on = mode === "select" ? chosen.includes(r.iso) : r.iso === highlight;
            return (
              <li key={r.iso} className={on ? "is-on" : undefined}>
                <label>
                  <input
                    type={mode === "select" ? "checkbox" : "radio"}
                    name="rail-country"
                    checked={on}
                    onChange={() => (mode === "select" ? onToggle(r.iso) : onHighlight(on ? null : r.iso))}
                    onClick={mode === "highlight" && on ? () => onHighlight(null) : undefined}
                  />
                  <span className="yi-rail__name">{r.name}</span>
                  <span className="yi-num yi-rail__val">{fmtNum(r.v)}</span>
                </label>
              </li>
            );
          })}
          {!list.length ? <li className="yi-rail__none">No country matches.</li> : null}
        </ul>
        <button type="button" className="yi-rail__clear" onClick={onClear} disabled={!count}>
          Clear selection
        </button>
      </div>
    </aside>
  );
}
