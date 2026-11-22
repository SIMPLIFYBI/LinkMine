"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import WorldMap from "./WorldMap";
import ChartFrame, { DownloadPanel, SharePanel, SourcesPanel } from "@/app/intelligence/ChartFrame.client";
import { frameValue } from "@/lib/intelligence/frames";
import { SCALES } from "@/lib/intelligence/mapScales";
import { stamp } from "@/lib/intelligence/format";
import { toCsv } from "@/lib/intelligence/dataMath";

const SPEED = 1.4; // years per second
const HOLD_MS = 2600; // pause on each captioned year
const VIEWS = [["map", "Map"], ["table", "Table"]];

function notDrawn(undrawn) {
  if (!undrawn?.count) return null;
  const more = undrawn.count - undrawn.names.length;
  return `${undrawn.names.join(", ")}${more > 0 ? ` and ${more} more` : ""}`;
}

function MapStage({ report, visible }) {
  const { series, names, firstYear, lastYear, captions, rangeNotes = [], note, undrawn } = report;
  const scale = SCALES[report.scale];
  const [year, setYear] = useState(firstYear);
  const [playing, setPlaying] = useState(false);
  const [hover, setHover] = useState(null);
  const yearRef = useRef(firstYear);
  const holdUntil = useRef(0);
  const shown = useRef(new Set());

  // Reduced-motion visitors get the final frame and no autoplay.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      yearRef.current = lastYear;
      setYear(lastYear);
    } else {
      setPlaying(true);
    }
  }, [lastYear]);

  // Nothing animates behind the Table view or an open panel.
  useEffect(() => {
    if (!visible) setPlaying(false);
  }, [visible]);

  useEffect(() => {
    if (!playing) return undefined;
    let raf = 0;
    let prev = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.1, (now - prev) / 1000);
      prev = now;
      if (now >= holdUntil.current) {
        let next = yearRef.current + dt * SPEED;
        const stop = captions.find((c) => !shown.current.has(c.year) && yearRef.current < c.year && next >= c.year);
        if (stop) {
          next = stop.year;
          shown.current.add(stop.year);
          holdUntil.current = now + HOLD_MS;
        }
        if (next >= lastYear) {
          next = lastYear;
          setPlaying(false);
        }
        yearRef.current = next;
        setYear(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, captions, lastYear]);

  function scrub(next) {
    yearRef.current = next;
    holdUntil.current = 0;
    shown.current = new Set(captions.filter((c) => c.year <= next).map((c) => c.year));
    setYear(next);
  }

  function toggle() {
    if (playing) return setPlaying(false);
    if (yearRef.current >= lastYear) scrub(firstYear);
    setPlaying(true);
  }

  const whole = Math.floor(year);
  const values = useMemo(() => {
    const out = {};
    for (const iso of Object.keys(series)) out[iso] = frameValue(series[iso], firstYear, year, scale.floor);
    return out;
  }, [series, firstYear, year, scale]);

  const reporting = Object.values(values).filter((v) => v != null).length;
  const caption = [...captions].filter((c) => c.year <= whole).pop();
  const rangeNote = rangeNotes.find((n) => whole >= n.from && whole <= n.to);
  const hovered = hover ? { name: names[hover.iso] || hover.name, value: values[hover.iso] } : null;
  const skipped = notDrawn(undrawn);

  return (
    <div className="yi-stage">
      <div className="yi-stage__top">
        <div className="yi-stage__year yi-num" aria-live="off">
          {whole}
        </div>
        <p className="yi-stage__cap" aria-live="polite">
          {caption ? (
            <>
              <span className="yi-num">{caption.year}</span> · {caption.text}
            </>
          ) : null}
        </p>
      </div>

      <WorldMap
        values={values}
        colorFor={scale.colorFor}
        onHover={(iso, name) => setHover(iso ? { iso, name } : null)}
        label={`${report.ariaLabel}, ${whole}.`}
        idPrefix="stage"
      />

      <p className="yi-pick" role="status">
        {hovered ? (
          <>
            <strong>{hovered.name}</strong> in {whole}:{" "}
            <span className="yi-num">{hovered.value == null ? "no usable reading" : scale.read(hovered.value)}</span>
          </>
        ) : (
          "Hover a country to read it."
        )}
      </p>

      <div className="yi-transport">
        <button type="button" className="yi-btn yi-btn--primary" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
          {playing ? "Pause" : yearRef.current >= lastYear ? "Replay" : "Play"}
        </button>
        <input
          className="yi-scrub"
          type="range"
          min={firstYear}
          max={lastYear}
          step={1}
          value={whole}
          aria-label="Year"
          onChange={(e) => {
            setPlaying(false);
            scrub(Number(e.target.value));
          }}
        />
        <span className="yi-num yi-legend">{reporting} reporting</span>
      </div>

      <div className="yi-legend">
        <span>{scale.low}</span>
        <span className="yi-legend__bar" style={{ background: scale.gradient }} aria-hidden="true" />
        <span>{scale.high}</span>
        <span>
          <i className="yi-legend__swatch" style={{ background: "var(--yi-sunken)" }} />
          no usable reading
        </span>
      </div>
      {rangeNote ? (
        <p className="yi-flag" role="note">
          {rangeNote.text}
        </p>
      ) : null}
      {note ? <p className="yi-flag" role="note">{note}</p> : null}
      <p className="yi-fresh">
        {report.attribution ? `${report.attribution.replace(/\.?\s*$/, ".")} ` : ""}
        {skipped ? `Not drawn, because they have no boundary on this map: ${skipped}.` : ""}
      </p>
    </div>
  );
}

// State lives here so choosing another map starts from a clean view and a closed panel.
function ReportFrame({ report }) {
  const [view, setView] = useState("map");
  const [panelOpen, setPanelOpen] = useState(false);
  const scale = SCALES[report.scale];
  const years = useMemo(() => Array.from({ length: report.lastYear - report.firstYear + 1 }, (_, i) => report.firstYear + i), [report]);

  function download() {
    const rows = Object.keys(report.series).map((iso) => ({ iso, name: report.names[iso] || iso, values: report.series[iso] }));
    const notes = [
      report.attribution,
      `${report.sourceName}, ${report.firstYear}-${report.lastYear}. Source data refreshed ${stamp(report.builtAt)}.`,
      "A missing year means no usable reading, never zero.",
    ].filter(Boolean);
    const body = toCsv({ rows, years, unitLabel: report.unit, title: report.title, notes });
    const url = URL.createObjectURL(new Blob([body], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `youmine-map-${report.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const panels = {
    sources: {
      label: "Sources",
      content: (
        <SourcesPanel
          items={[
            { label: "Publisher", text: `${report.sourceName}, ${report.firstYear} to ${report.lastYear}.` },
            { label: "Attribution", text: report.attribution },
            { label: "About this map", text: report.note },
            { label: "Colour scale", text: `${scale.low} to ${scale.high}. The scale is fixed, so colours mean the same thing in every year.` },
            { label: "Not drawn", text: notDrawn(report.undrawn) },
            { label: "Source data refreshed", text: stamp(report.builtAt) },
          ]}
        />
      ),
    },
    download: {
      label: "Download",
      content: (
        <DownloadPanel
          onCsv={download}
          includes={`Every country with a reading, ${report.firstYear} to ${report.lastYear}. The file starts with the source attribution.`}
        />
      ),
    },
    share: { label: "Share", content: <SharePanel /> },
  };

  return (
    <ChartFrame
      title={report.title}
      subtitle={report.unit}
      views={VIEWS}
      view={view}
      onView={setView}
      panels={panels}
      onPanel={(p) => setPanelOpen(Boolean(p))}
      source={`Data: ${report.sourceName}, through ${report.lastYear}, refreshed ${stamp(report.builtAt)}.`}
    >
      <div hidden={view !== "map"}>
        <MapStage report={report} visible={view === "map" && !panelOpen} />
      </div>
      {view === "table" ? (
        <div className="yi-scroll">
          <table className="yi-table">
            <thead>
              <tr>
                {report.table.head.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.table.rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) => (
                    <td key={i} className={i ? "yi-num" : undefined}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </ChartFrame>
  );
}

export default function MapReports({ reports, charts = [], initialId }) {
  const [id, setId] = useState(reports.some((r) => r.id === initialId) ? initialId : reports[0].id);
  const report = reports.find((r) => r.id === id);

  function choose(next) {
    setId(next);
    const url = new URL(window.location.href);
    if (next === reports[0].id) url.searchParams.delete("map");
    else url.searchParams.set("map", next);
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="yi-lib">
      <nav className="yi-lib__nav" aria-label="Standard maps and charts">
        <p className="yi-lib__head">Maps</p>
        <ul>
          {reports.map((r) => (
            <li key={r.id}>
              <button type="button" aria-pressed={r.id === id} onClick={() => choose(r.id)}>
                <span>{r.tab}</span>
                <small>
                  Animated, {r.firstYear} to {r.lastYear}
                </small>
              </button>
            </li>
          ))}
        </ul>

        {charts.length ? (
          <>
            <p className="yi-lib__head">Charts</p>
            <ul>
              {charts.map((c) => (
                <li key={c.href}>
                  <Link href={c.href}>
                    <span>{c.label}</span>
                    <small>{c.blurb}</small>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/admin/intelligence/reserves?c=CU">
                  <span>Years of reserves left</span>
                  <small>Every country, any commodity</small>
                </Link>
              </li>
            </ul>
          </>
        ) : null}

        <p className="yi-lib__more">
          <Link href="/admin/intelligence/data">Build your own view</Link>
        </p>
      </nav>

      <div className="yi-lib__main">
        <ReportFrame key={report.id} report={report} />
      </div>
    </div>
  );
}
