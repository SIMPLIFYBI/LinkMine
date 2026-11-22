"use client";

import { useEffect, useRef, useState } from "react";
import { fmtNum, niceTicks, PALETTE } from "@/lib/intelligence/dataMath";

function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

// Pushes end labels apart so they never overlap.
function spread(items, minGap, lo, hi) {
  const sorted = [...items].sort((a, b) => a.y - b.y);
  for (let i = 1; i < sorted.length; i++) if (sorted[i].y - sorted[i - 1].y < minGap) sorted[i].y = sorted[i - 1].y + minGap;
  const over = sorted.length ? sorted[sorted.length - 1].y - hi : 0;
  if (over > 0) sorted.forEach((s) => (s.y -= over));
  for (let i = sorted.length - 2; i >= 0; i--) if (sorted[i + 1].y - sorted[i].y < minGap) sorted[i].y = sorted[i + 1].y - minGap;
  sorted.forEach((s) => (s.y = Math.max(lo, s.y)));
  return sorted;
}

export default function LineChart({ rows, years, from, to, highlight, onHighlight, unitLabel, title, zeroBased = true }) {
  const [ref, width] = useWidth();
  const [hoverIdx, setHoverIdx] = useState(null);

  const compact = width > 0 && width < 520;
  const height = compact ? 300 : 380;
  const m = { l: 46, r: compact ? 12 : 128, t: 14, b: 26 };
  const iw = Math.max(10, width - m.l - m.r);
  const ih = height - m.t - m.b;

  const idxs = [];
  for (let i = from; i <= to; i++) idxs.push(i);
  let max = 0;
  let min = Infinity;
  rows.forEach((r) => idxs.forEach((i) => {
    const v = r.values[i];
    if (v != null) { max = Math.max(max, v); min = Math.min(min, v); }
  }));
  if (!Number.isFinite(min)) { min = 0; max = 1; }
  const lo = zeroBased ? Math.min(0, min) : min;
  const ticks = niceTicks(lo, max, 5);
  const top = ticks[ticks.length - 1] > max ? ticks[ticks.length - 1] : max;
  const X = (i) => m.l + ((i - from) / Math.max(1, to - from)) * iw;
  const Y = (v) => m.t + ih - ((v - lo) / (top - lo || 1)) * ih;

  const pathFor = (r) => {
    let d = "";
    let pen = false;
    idxs.forEach((i) => {
      const v = r.values[i];
      if (v == null) { pen = false; return; }
      d += `${pen ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  };

  const yearTicks = (() => {
    const span = to - from;
    const step = span > 40 ? 10 : span > 20 ? 5 : span > 10 ? 2 : 1;
    return idxs.filter((i) => (years[i] % step === 0));
  })();

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - rect.left - m.l) / iw;
    setHoverIdx(Math.min(to, Math.max(from, Math.round(from + rel * (to - from)))));
  }

  const labels = !compact
    ? spread(
        rows.map((r, k) => {
          let last = -1;
          idxs.forEach((i) => { if (r.values[i] != null) last = i; });
          return last < 0 ? null : { iso: r.iso, name: r.name, k, y: Y(r.values[last]) };
        }).filter(Boolean),
        13, m.t + 6, m.t + ih
      )
    : [];

  return (
    <div ref={ref} className="yi-lc" style={{ minHeight: height }}>
      {width > 0 ? (
        <svg width={width} height={height} role="img" aria-label={title} onPointerMove={onMove} onPointerLeave={() => setHoverIdx(null)} style={{ touchAction: "pan-y" }}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={m.l} x2={m.l + iw} y1={Y(t)} y2={Y(t)} stroke="var(--yi-rule)" />
              <text x={m.l - 6} y={Y(t) + 3.5} textAnchor="end" className="yi-lc-ax">{fmtNum(t)}</text>
            </g>
          ))}
          {yearTicks.map((i) => (
            <text key={i} x={X(i)} y={height - 8} textAnchor="middle" className="yi-lc-ax">{years[i]}</text>
          ))}
          {rows.map((r, k) => {
            const faded = highlight && highlight !== r.iso;
            return (
              <path key={r.iso} d={pathFor(r)} fill="none" stroke={PALETTE[k % PALETTE.length]} strokeWidth={highlight === r.iso ? 3 : 2} strokeLinejoin="round" strokeLinecap="round" opacity={faded ? 0.22 : 1} />
            );
          })}
          {labels.map((l) => (
            <text key={l.iso} x={m.l + iw + 8} y={l.y + 3.5} className="yi-lc-lab" fill="var(--yi-ink-2)" onClick={() => onHighlight(highlight === l.iso ? null : l.iso)}>
              <tspan fill={PALETTE[l.k % PALETTE.length]}>● </tspan>
              {l.name.length > 16 ? `${l.name.slice(0, 15)}…` : l.name}
            </text>
          ))}
          {hoverIdx != null ? (
            <g pointerEvents="none">
              <line x1={X(hoverIdx)} x2={X(hoverIdx)} y1={m.t} y2={m.t + ih} stroke="var(--yi-ink-3)" strokeDasharray="3 3" />
              {rows.map((r, k) => (r.values[hoverIdx] != null ? <circle key={r.iso} cx={X(hoverIdx)} cy={Y(r.values[hoverIdx])} r="3.5" fill={PALETTE[k % PALETTE.length]} stroke="var(--yi-raised)" strokeWidth="1.5" /> : null))}
            </g>
          ) : null}
        </svg>
      ) : null}
      {hoverIdx != null ? (
        <div className="yi-lc-tip" role="status">
          <strong className="yi-num">{years[hoverIdx]}</strong>
          {[...rows].map((r, k) => ({ r, k })).filter(({ r }) => r.values[hoverIdx] != null).sort((a, b) => b.r.values[hoverIdx] - a.r.values[hoverIdx]).slice(0, 8).map(({ r, k }) => (
            <span key={r.iso}><i style={{ background: PALETTE[k % PALETTE.length] }} /> {r.name} <b className="yi-num">{fmtNum(r.values[hoverIdx])}</b></span>
          ))}
        </div>
      ) : (
        <p className="yi-pick">{unitLabel} · hover or touch the chart to read a year</p>
      )}
    </div>
  );
}
