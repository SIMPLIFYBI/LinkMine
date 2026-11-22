"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import WorldMap from "./WorldMap";
import { divergingColor, divergingGradient, frameValue } from "@/lib/intelligence/frames";

const SPEED = 1.4; // years per second
const HOLD_MS = 2600; // pause on each captioned year

function pctLabel(v) {
  if (v == null) return "no usable reading";
  return `${v >= 1000 ? Math.round(v).toLocaleString("en-US") : v.toFixed(0)}% of its own demand`;
}

export default function HeroMapPlayer({ hero, captions, title, rangeNotes = [] }) {
  const { series, names, firstYear, lastYear } = hero;
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
    for (const iso of Object.keys(series)) out[iso] = frameValue(series[iso], firstYear, year);
    return out;
  }, [series, firstYear, year]);

  const reporting = Object.values(values).filter((v) => v != null).length;
  const caption = [...captions].filter((c) => c.year <= whole).pop();
  const rangeNote = rangeNotes.find((n) => whole >= n.from && whole <= n.to);
  const gradient = useMemo(() => divergingGradient(), []);
  const hovered = hover ? { name: names[hover.iso] || hover.name, value: values[hover.iso] } : null;

  return (
    <section className="yi-stage" aria-label={title}>
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
        colorFor={divergingColor}
        onHover={(iso, name) => setHover(iso ? { iso, name } : null)}
        label={`${title}, ${whole}. Countries are shaded by production as a share of their own demand.`}
        idPrefix="hero"
      />

      <p className="yi-pick" role="status">
        {hovered ? (
          <>
            <strong>{hovered.name}</strong> in {whole}: <span className="yi-num">{pctLabel(hovered.value)}</span>
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
        <span className="yi-num yi-legend">
          {reporting} reporting
        </span>
      </div>

      <div className="yi-legend">
        <span>produces less than it burns</span>
        <span className="yi-legend__bar" style={{ background: gradient }} aria-hidden="true" />
        <span>produces more</span>
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
    </section>
  );
}
