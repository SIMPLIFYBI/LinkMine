"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import LineChart from "@/app/intelligence/LineChart.client";
import WorldMap from "@/app/intelligence/maps/WorldMap";
import { sequentialColor, sequentialGradient } from "@/lib/intelligence/frames";
import {
  basisLabel, densify, fmtNum, MEASURE_LABEL, NORMAL_LABEL, pickTop, populationRange, SECTOR_LABEL, toCsv, transform,
} from "@/lib/intelligence/dataMath";

const SECTORS = ["mining", "petroleum", "power"];
const MEASURE_ORDER = ["production", "consumption", "import", "imports", "export", "net_generation", "installed_capacity", "net_consumption", "net_imports", "distribution_losses"];
const VIEWS = [["chart", "Chart"], ["rank", "Ranking"], ["map", "Map"], ["table", "Table"]];
const TOP_CHOICES = [5, 8, 12, 20];

const stamp = (iso) => (iso ? `${new Date(iso).toISOString().slice(0, 16).replace("T", " ")} UTC` : "unknown");
const best = (list) => [...list].sort((a, b) => b.countries - a.countries || b.points - a.points)[0];

export default function DataExplorer({ facet, population, sources, builtAt, initial }) {
  const popRange = useMemo(() => populationRange(population), [population]);
  const byKey = useMemo(() => Object.fromEntries(facet.map((f) => [f.series_key, f])), [facet]);
  const srcByCode = useMemo(() => Object.fromEntries(sources.map((s) => [s.source_code, s])), [sources]);

  const measuresFor = (sector) =>
    [...new Set(facet.filter((f) => f.sector === sector).map((f) => f.measure))].sort((a, b) => MEASURE_ORDER.indexOf(a) - MEASURE_ORDER.indexOf(b));
  const commoditiesFor = (sector, measure) => {
    const groups = new Map();
    facet.filter((f) => f.sector === sector && f.measure === measure).forEach((f) => {
      const g = groups.get(f.commodity_code) || { code: f.commodity_code, name: f.commodity_name, list: [] };
      g.list.push(f);
      groups.set(f.commodity_code, g);
    });
    return [...groups.values()].map((g) => ({ ...g, top: best(g.list) })).sort((a, b) => b.top.countries - a.top.countries || a.name.localeCompare(b.name));
  };
  const seriesFor = (sector, measure, code) =>
    facet.filter((f) => f.sector === sector && f.measure === measure && f.commodity_code === code).sort((a, b) => b.countries - a.countries);

  // Starting point: a valid series from the link, otherwise copper production.
  const start = useMemo(() => {
    const fromLink = byKey[initial.k];
    if (fromLink) return fromLink;
    const cu = facet.filter((f) => f.sector === "mining" && f.measure === "production" && f.commodity_code === "CU");
    return cu.length ? best(cu) : best(facet);
  }, [byKey, facet, initial.k]);

  const [key, setKey] = useState(start.series_key);
  const series = byKey[key];
  const [topN, setTopN] = useState(TOP_CHOICES.includes(Number(initial.t)) ? Number(initial.t) : 8);
  const [picked, setPicked] = useState(initial.p ? initial.p.split(",").filter(Boolean) : []);
  const [custom, setCustom] = useState(Boolean(initial.p));
  const [normal, setNormal] = useState(NORMAL_LABEL[initial.n] ? initial.n : "abs");
  const [smooth, setSmooth] = useState(initial.sm === "1");
  const [view, setView] = useState(VIEWS.some(([v]) => v === initial.v) ? initial.v : "chart");
  const [fromYear, setFromYear] = useState(initial.f ? Number(initial.f) : null);
  const [toYear, setToYear] = useState(initial.to ? Number(initial.to) : null);
  const [highlight, setHighlight] = useState(initial.h || null);
  const [mapYear, setMapYear] = useState(initial.y ? Number(initial.y) : null);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [state, setState] = useState({ status: "loading", years: [], rows: [] });
  const cache = useRef(new Map());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (cache.current.has(key)) return setState({ status: "ready", ...cache.current.get(key) });
      setState((s) => ({ ...s, status: "loading" }));
      try {
        const res = await fetch(`/api/intelligence/series?key=${key}&v=${encodeURIComponent(builtAt || "")}`);
        if (!res.ok) throw new Error(String(res.status));
        const { rows } = await res.json();
        const dense = densify(rows);
        cache.current.set(key, dense);
        if (!cancelled) setState({ status: "ready", ...dense });
      } catch {
        if (!cancelled) setState({ status: "error", years: [], rows: [] });
      }
    }
    load();
    return () => { cancelled = true; };
  }, [key, builtAt]);

  const { years, rows } = state;
  const lastIdx = Math.max(0, years.length - 1);
  const perPerson = normal === "pop" && popRange;
  const minYear = perPerson ? Math.max(years[0] ?? 0, popRange[0]) : years[0];
  const maxYear = perPerson ? Math.min(years[lastIdx] ?? 0, popRange[1]) : years[lastIdx];
  const clampYear = (y, fallback) => Math.min(maxYear, Math.max(minYear, y ?? fallback));
  const fromIdx = years.length ? Math.max(0, years.indexOf(clampYear(fromYear, minYear))) : 0;
  const toIdx = years.length ? Math.max(fromIdx, years.indexOf(clampYear(toYear, maxYear))) : 0;
  const mapIdx = years.length ? Math.min(toIdx, Math.max(fromIdx, years.indexOf(clampYear(mapYear, years[toIdx])))) : 0;

  const data = useMemo(
    () => (years.length ? transform(rows, years, { normal, smooth, population, window: [fromIdx, toIdx] }) : []),
    [rows, years, normal, smooth, population, fromIdx, toIdx]
  );

  const chosen = useMemo(() => {
    if (!data.length) return [];
    const isos = custom ? picked : pickTop(data, topN, toIdx);
    return isos.map((iso) => data.find((r) => r.iso === iso)).filter(Boolean);
  }, [data, custom, picked, topN, toIdx]);

  // Fixed scale for the whole window, so moving through years never rescales the map.
  const mapScale = useMemo(() => {
    if (!data.length) return null;
    let hi = 0;
    const positives = [];
    data.forEach((r) => { for (let i = fromIdx; i <= toIdx; i++) { const v = r.values[i]; if (v != null && v > 0) { positives.push(v); hi = Math.max(hi, v); } } });
    if (!positives.length) return null;
    positives.sort((a, b) => a - b);
    // The low end sits at the 5th percentile so one tiny producer cannot flatten the colours for everyone else.
    const lo = positives[Math.floor(positives.length * 0.05)];
    const capped = lo > positives[0];
    const mode = normal === "peak" ? "linear" : normal === "share" ? "sqrt" : "log";
    const t = (v) => {
      if (v == null || v <= 0) return 0;
      if (mode === "linear") return v / hi;
      if (mode === "sqrt") return Math.sqrt(v / hi);
      return hi > lo ? Math.max(0, (Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))) : 1;
    };
    return { lo, hi, capped, mode, color: (v) => sequentialColor(t(v)) };
  }, [data, fromIdx, toIdx, normal]);

  const yearNow = useRef(0);
  yearNow.current = years[mapIdx];
  useEffect(() => {
    if (!playing) return undefined;
    const id = setInterval(() => {
      if (yearNow.current >= years[toIdx]) setPlaying(false);
      else setMapYear(yearNow.current + 1);
    }, 450);
    return () => clearInterval(id);
  }, [playing, years, toIdx]);

  // The link always describes the current view.
  useEffect(() => {
    const p = new URLSearchParams({ k: key });
    if (custom && picked.length) p.set("p", picked.join(",")); else if (topN !== 8) p.set("t", String(topN));
    if (normal !== "abs") p.set("n", normal);
    if (smooth) p.set("sm", "1");
    if (view !== "chart") p.set("v", view);
    if (fromYear) p.set("f", String(fromYear));
    if (toYear) p.set("to", String(toYear));
    if (highlight) p.set("h", highlight);
    if (view === "map" && mapYear) p.set("y", String(mapYear));
    window.history.replaceState(null, "", `${window.location.pathname}?${p}`);
  }, [key, custom, picked, topN, normal, smooth, view, fromYear, toYear, highlight, mapYear]);

  // ----- cascade handlers -----
  const sector = series.sector;
  const measures = measuresFor(sector);
  const commodities = commoditiesFor(sector, series.measure);
  const choices = seriesFor(sector, series.measure, series.commodity_code);

  function setSector(next) {
    const m = measuresFor(next).includes("production") ? "production" : measuresFor(next)[0];
    const list = commoditiesFor(next, m);
    setKey(list[0].top.series_key);
    resetWindow();
  }
  function setMeasure(m) {
    const list = commoditiesFor(sector, m);
    const same = list.find((c) => c.code === series.commodity_code);
    setKey((same || list[0]).top.series_key);
    resetWindow();
  }
  function setCommodity(code) {
    setKey(best(seriesFor(sector, series.measure, code)).series_key);
    resetWindow();
  }
  function resetWindow() { setFromYear(null); setToYear(null); setMapYear(null); setPicked([]); setCustom(false); setHighlight(null); setPlaying(false); }

  // ----- derived labels -----
  const unitBase = series.unit;
  const unitLabel = {
    abs: unitBase,
    share: "% of the reporting total",
    peak: "index, each country's own peak = 100",
    first: `index, ${years[fromIdx]} = 100`,
    pop: `${unitBase} per person`,
  }[normal];
  const measureName = MEASURE_LABEL[series.measure] || series.measure;
  const title = `${measureName}: ${series.commodity_name}`;
  const src = srcByCode[series.source_code];
  const reportingAt = (i) => data.filter((r) => r.values[i] != null).length;
  const notes = [
    src?.attribution_text,
    `${series.countries} countries, ${series.year_from}-${series.year_to}. Series: ${basisLabel(series.basis)} (${series.source_code}). Unit: ${unitBase}.`,
    `View: ${NORMAL_LABEL[normal]}${smooth ? ", centred 3-year average" : ""}, ${years[fromIdx]}-${years[toIdx]}.`,
    `Source data refreshed ${stamp(builtAt)}.`,
  ].filter(Boolean);

  function download() {
    const shifted = chosen.map((r) => ({ ...r, values: r.values.slice(fromIdx, toIdx + 1) }));
    const body = toCsv({ rows: shifted, years: years.slice(fromIdx, toIdx + 1), unitLabel, title, notes });
    const url = URL.createObjectURL(new Blob([body], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `youmine-${series.sector}-${series.measure}-${series.commodity_code}.csv`.toLowerCase();
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { window.prompt("Copy this link", window.location.href); }
  }

  const addable = data.filter((r) => !picked.includes(r.iso)).sort((a, b) => a.name.localeCompare(b.name));
  const yearOptions = years.filter((y) => y >= (minYear ?? 0) && y <= (maxYear ?? 0));
  const ranked = useMemo(() => {
    if (!data.length) return [];
    return data.map((r) => ({ iso: r.iso, name: r.name, v: r.values[toIdx] })).filter((r) => r.v != null).sort((a, b) => b.v - a.v).slice(0, 15);
  }, [data, toIdx]);
  const mapValues = useMemo(() => Object.fromEntries(data.map((r) => [r.iso, r.values[mapIdx]])), [data, mapIdx]);
  const [hover, setHover] = useState(null);

  return (
    <>
      <div className="yi-seg" role="group" aria-label="Sector">
        {SECTORS.filter((s) => facet.some((f) => f.sector === s)).map((s) => (
          <button key={s} type="button" aria-pressed={s === sector} className="yi-btn" onClick={() => setSector(s)}>
            {SECTOR_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="yi-controls">
        <div className="yi-ctrl">
          <label htmlFor="d-measure">Measure</label>
          <select id="d-measure" className="yi-select" value={series.measure} onChange={(e) => setMeasure(e.target.value)}>
            {measures.map((m) => <option key={m} value={m}>{MEASURE_LABEL[m] || m}</option>)}
          </select>
        </div>
        <div className="yi-ctrl">
          <label htmlFor="d-com">{sector === "mining" ? "Commodity" : sector === "power" ? "Source of power" : "Fuel"}</label>
          <select id="d-com" className="yi-select" value={series.commodity_code} onChange={(e) => setCommodity(e.target.value)}>
            {commodities.map((c) => <option key={c.code} value={c.code}>{c.name}: {c.top.countries} countries, {c.top.year_from} to {c.top.year_to}</option>)}
          </select>
        </div>
        {choices.length > 1 ? (
          <div className="yi-ctrl">
            <label htmlFor="d-basis">Basis (never combined)</label>
            <select id="d-basis" className="yi-select" value={key} onChange={(e) => { setKey(e.target.value); resetWindow(); }}>
              {choices.map((c) => <option key={c.series_key} value={c.series_key}>{basisLabel(c.basis)} · {c.source_code} · {c.countries} countries, {c.year_from} to {c.year_to}</option>)}
            </select>
          </div>
        ) : null}
      </div>

      <div className="yi-controls">
        <div className="yi-ctrl">
          <label htmlFor="d-countries">Countries</label>
          <select id="d-countries" className="yi-select" value={custom ? "custom" : String(topN)} onChange={(e) => { if (e.target.value === "custom") { setCustom(true); if (!picked.length) setPicked(pickTop(data, 5, toIdx)); } else { setCustom(false); setTopN(Number(e.target.value)); } }}>
            {TOP_CHOICES.map((n) => <option key={n} value={n}>Top {n} by latest value</option>)}
            <option value="custom">Choose countries</option>
          </select>
        </div>
        {custom ? (
          <div className="yi-ctrl">
            <label htmlFor="d-add">Add a country</label>
            <select id="d-add" className="yi-select" value="" onChange={(e) => e.target.value && setPicked([...picked, e.target.value])}>
              <option value="">Select…</option>
              {addable.map((r) => <option key={r.iso} value={r.iso}>{r.name}</option>)}
            </select>
          </div>
        ) : null}
        <div className="yi-ctrl">
          <label htmlFor="d-from">From</label>
          <select id="d-from" className="yi-select" value={years[fromIdx]} onChange={(e) => { setFromYear(Number(e.target.value)); if (Number(e.target.value) > years[toIdx]) setToYear(Number(e.target.value)); }}>
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="yi-ctrl">
          <label htmlFor="d-to">To</label>
          <select id="d-to" className="yi-select" value={years[toIdx]} onChange={(e) => { setToYear(Number(e.target.value)); if (Number(e.target.value) < years[fromIdx]) setFromYear(Number(e.target.value)); }}>
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="yi-ctrl">
          <label htmlFor="d-norm">Show as</label>
          <select id="d-norm" className="yi-select" value={normal} onChange={(e) => setNormal(e.target.value)}>
            <option value="abs">{NORMAL_LABEL.abs}</option>
            <option value="share" disabled={!series.share_ok}>{NORMAL_LABEL.share}{series.share_ok ? "" : " (not meaningful here)"}</option>
            <option value="peak">{NORMAL_LABEL.peak}</option>
            <option value="first">{NORMAL_LABEL.first}</option>
            <option value="pop" disabled={!popRange}>{NORMAL_LABEL.pop}{popRange ? ` (${popRange[0]} to ${popRange[1]} only)` : ""}</option>
          </select>
        </div>
        <label className="yi-check">
          <input type="checkbox" checked={smooth} onChange={(e) => setSmooth(e.target.checked)} /> Smooth (3-year average)
        </label>
      </div>

      {custom && picked.length ? (
        <ul className="yi-chipset" aria-label="Chosen countries">
          {picked.map((iso) => (
            <li key={iso}>
              {data.find((r) => r.iso === iso)?.name || iso}
              <button type="button" aria-label={`Remove ${iso}`} onClick={() => setPicked(picked.filter((p) => p !== iso))}>×</button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="yi-toolbar">
        <div className="yi-seg" role="group" aria-label="View">
          {VIEWS.map(([v, label]) => (
            <button key={v} type="button" aria-pressed={view === v} className="yi-btn" onClick={() => { setView(v); setPlaying(false); }}>{label}</button>
          ))}
        </div>
        <div className="yi-actions">
          <button type="button" className="yi-btn" onClick={copyLink}>{copied ? "Link copied" : "Copy link"}</button>
          <button type="button" className="yi-btn" onClick={download} disabled={!chosen.length}>Download CSV</button>
        </div>
      </div>

      <section className="yi-card" aria-busy={state.status === "loading"}>
        <h2 className="yi-card-title">{title}</h2>
        <p className="yi-card-sub">{unitLabel}{smooth ? ", centred 3-year average" : ""}</p>

        {state.status === "error" ? <p className="yi-flag" role="alert">This series could not be loaded. Try another selection.</p> : null}
        {state.status === "loading" && !years.length ? <p className="yi-pick">Loading…</p> : null}

        {years.length && view === "chart" ? (
          chosen.length ? (
            <LineChart rows={chosen} years={years} from={fromIdx} to={toIdx} highlight={highlight} onHighlight={setHighlight} unitLabel={unitLabel} title={`${title}, ${years[fromIdx]} to ${years[toIdx]}`} zeroBased={normal !== "first" && normal !== "peak"} />
          ) : (
            <p className="yi-pick">No countries have a value in this period. Widen the years or choose other countries.</p>
          )
        ) : null}

        {years.length && view === "rank" ? (
          <>
          <ul className="yi-bars" aria-label={`Top countries in ${years[toIdx]}`}>
            {ranked.map((r) => (
              <li key={r.iso} className={chosen.some((c) => c.iso === r.iso) ? "is-me" : undefined}>
                <span title={r.name}>{r.name}</span>
                <span className="yi-num">{fmtNum(r.v)}</span>
                <span className="yi-bars__track" aria-hidden="true"><span className="yi-bars__fill" style={{ width: `${Math.max(2, (r.v / ranked[0].v) * 100)}%` }} /></span>
              </li>
            ))}
          </ul>
          <p className="yi-pick">The top 15 countries in {years[toIdx]}. Orange bars are the countries in your chart.</p>
          </>
        ) : null}

        {years.length && view === "table" ? (
          <div className="yi-scroll">
            <table className="yi-table">
              <thead><tr><th>Country</th><th>{years[fromIdx]}</th><th>{years[toIdx]}</th><th>Change</th></tr></thead>
              <tbody>
                {chosen.map((r) => {
                  const a = r.values[fromIdx];
                  const b = r.values[toIdx];
                  return (
                    <tr key={r.iso}>
                      <td>{r.name}</td>
                      <td className="yi-num">{fmtNum(a)}</td>
                      <td className="yi-num">{fmtNum(b)}</td>
                      <td className="yi-num">{a != null && b != null && a > 0 ? `${b >= a ? "+" : ""}${Math.round(((b - a) / a) * 100)}%` : "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {years.length && view === "map" && mapScale ? (
          <div>
            <WorldMap values={mapValues} colorFor={mapScale.color} highlight={highlight} onHover={(iso, name) => setHover(iso ? { iso, name } : null)} onPick={(iso) => setHighlight(highlight === iso ? null : iso)} label={`${title}, ${years[mapIdx]}`} idPrefix="data" />
            <p className="yi-pick" role="status">
              {hover ? <><strong>{data.find((r) => r.iso === hover.iso)?.name || hover.name}</strong> in {years[mapIdx]}: <span className="yi-num">{mapValues[hover.iso] != null ? fmtNum(mapValues[hover.iso]) : "no value"}</span></> : "Hover a country to read it."}
            </p>
            <div className="yi-transport">
              <button type="button" className="yi-btn yi-btn--primary" onClick={() => { if (!playing && mapIdx >= toIdx) setMapYear(years[fromIdx]); setPlaying(!playing); }}>{playing ? "Pause" : "Play"}</button>
              <input className="yi-scrub" type="range" min={years[fromIdx]} max={years[toIdx]} step={1} value={years[mapIdx]} aria-label="Year" onChange={(e) => { setPlaying(false); setMapYear(Number(e.target.value)); }} />
              <span className="yi-num yi-legend">{years[mapIdx]}</span>
            </div>
            <div className="yi-legend">
              <span className="yi-num">{mapScale.capped && mapScale.mode === "log" ? "≤ " : ""}{fmtNum(mapScale.lo)}</span>
              <span className="yi-legend__bar" style={{ background: sequentialGradient() }} aria-hidden="true" />
              <span className="yi-num">{fmtNum(mapScale.hi)}</span>
              <span>{mapScale.mode === "log" ? "log scale" : mapScale.mode === "sqrt" ? "square-root scale" : "linear scale"}, fixed for all years</span>
              <span><i className="yi-legend__swatch" style={{ background: "var(--yi-sunken)" }} /> no value</span>
            </div>
          </div>
        ) : null}

        {years.length ? (
          <p className="yi-coverage">
            <span className="yi-num">{reportingAt(view === "map" ? mapIdx : toIdx)}</span> of <span className="yi-num">{series.countries}</span> countries have a value in{" "}
            <span className="yi-num">{years[view === "map" ? mapIdx : toIdx]}</span>. A gap means no reading, never zero.
          </p>
        ) : null}
      </section>

      {series.caveat ? <p className="yi-flag"><strong>About this series.</strong> {series.caveat}</p> : null}
      {normal === "share" ? <p className="yi-flag"><strong>Share of reporting total.</strong> No world total is published. Each share is of the countries that report in that year, so it can move when coverage changes.</p> : null}
      {normal === "pop" ? <p className="yi-flag"><strong>Per person.</strong> Population (World Bank) exists for {popRange?.[0]} to {popRange?.[1]} only, so the period is limited to those years.</p> : null}
      {smooth ? <p className="yi-coverage">Smoothing shows a centred 3-year average and leaves out years without both neighbours, so each line is two years shorter.</p> : null}

      <footer className="yi-sourcebar">
        <p><strong>Series:</strong> {basisLabel(series.basis)}, {unitBase}. {series.countries} countries, {series.year_from} to {series.year_to}. Series with different bases or sources are kept separate and never added together. Measures reported by only one or two countries are not offered here.</p>
        {src?.attribution_text ? <p>{src.attribution_text}</p> : null}
        <p>Source data refreshed <span className="yi-num">{stamp(builtAt)}</span>.</p>
      </footer>
    </>
  );
}
