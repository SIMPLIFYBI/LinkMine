// Pure calculations for the Data area. No React, so each rule can be tested on its own.

// Rows arrive as parallel years[] and vals[]; this lays them on one shared year axis with nulls for gaps.
export function densify(rows) {
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const r of rows) {
    y0 = Math.min(y0, r.years[0]);
    y1 = Math.max(y1, r.years[r.years.length - 1]);
  }
  if (!Number.isFinite(y0)) return { years: [], rows: [] };
  const years = [];
  for (let y = y0; y <= y1; y++) years.push(y);
  const dense = rows.map((r) => {
    const values = new Array(years.length).fill(null);
    r.years.forEach((y, i) => {
      values[y - y0] = r.vals[i] == null ? null : Number(r.vals[i]);
    });
    return { iso: r.iso_alpha3, name: r.country_name, values };
  });
  return { years, rows: dense };
}

// Centred 3-year average, only where all three years exist. Single-year peaks are often reporting artefacts.
export function smooth3(values) {
  return values.map((v, i) => {
    const a = values[i - 1];
    const b = values[i + 1];
    return v != null && a != null && b != null ? (a + v + b) / 3 : null;
  });
}

const peakOf = (values) => values.reduce((m, v) => (v != null && v > m ? v : m), -Infinity);

// Smoothing first, then normalisation. `window` is the [from, to] index range for "first year = 100".
export function transform(rows, years, { normal = "abs", smooth = false, population = {}, window = [0, years.length - 1] }) {
  const base = rows.map((r) => ({ ...r, values: smooth ? smooth3(r.values) : r.values }));

  if (normal === "share") {
    const totals = years.map((_, i) => base.reduce((s, r) => s + (r.values[i] ?? 0), 0));
    return base.map((r) => ({ ...r, values: r.values.map((v, i) => (v == null || totals[i] <= 0 ? null : (v / totals[i]) * 100)) }));
  }

  if (normal === "peak") {
    return base.map((r) => {
      const m = peakOf(r.values);
      return { ...r, values: r.values.map((v) => (v == null || !(m > 0) ? null : (v / m) * 100)) };
    });
  }

  if (normal === "first") {
    return base.map((r) => {
      const startIdx = r.values.findIndex((v, i) => i >= window[0] && i <= window[1] && v != null && v > 0);
      const start = startIdx < 0 ? null : r.values[startIdx];
      return { ...r, values: r.values.map((v) => (v == null || start == null ? null : (v / start) * 100)) };
    });
  }

  if (normal === "pop") {
    return base.map((r) => {
      const pop = population[r.iso];
      return {
        ...r,
        values: r.values.map((v, i) => {
          const p = pop ? pop.vals[pop.years.indexOf(years[i])] : null;
          return v == null || !(p > 0) ? null : v / Number(p);
        }),
      };
    });
  }

  return base;
}

// Years for which per-person is possible, given the population table, or null when it holds none.
export function populationRange(population) {
  let lo = Infinity;
  let hi = -Infinity;
  for (const p of Object.values(population)) {
    lo = Math.min(lo, p.years[0]);
    hi = Math.max(hi, p.years[p.years.length - 1]);
  }
  return Number.isFinite(lo) ? [lo, hi] : null;
}

// The largest countries by their latest value at or before `endIdx` (looking back at most 3 years).
export function pickTop(rows, n, endIdx) {
  const scored = rows
    .map((r) => {
      for (let i = endIdx; i >= Math.max(0, endIdx - 3); i--) if (r.values[i] != null) return { iso: r.iso, v: r.values[i] };
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => b.v - a.v);
  return scored.slice(0, n).map((s) => s.iso);
}

export function fmtNum(v) {
  if (v == null || Number.isNaN(v)) return "–";
  const a = Math.abs(v);
  if (a === 0) return "0";
  if (a >= 1e9) return `${(v / 1e9).toFixed(a >= 1e10 ? 0 : 1)} bn`;
  if (a >= 1e6) return `${(v / 1e6).toFixed(a >= 1e7 ? 0 : 1)} M`;
  if (a >= 1e4) return `${Math.round(v / 1e3)} k`;
  if (a >= 1e3) return `${(v / 1e3).toFixed(1)} k`;
  if (a >= 100) return String(Math.round(v));
  if (a >= 10) return v.toFixed(1);
  if (a >= 1) return v.toFixed(2);
  return v.toPrecision(2);
}

// Tick values that land on round numbers.
export function niceTicks(lo, hi, count = 5) {
  if (!(hi > lo)) return [lo];
  const raw = (hi - lo) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || mag * 10;
  const out = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi + step * 1e-9; t += step) out.push(Number(t.toPrecision(12)));
  if (out[out.length - 1] < hi - step * 1e-9) out.push(Number((out[out.length - 1] + step).toPrecision(12)));
  return out;
}

// "copper, mine | stage=mine | form=ores and concentrates" -> "Mine, ores and concentrates"
export function basisLabel(basis) {
  if (!basis) return "As published";
  const stage = /stage=([^|]+)/.exec(basis)?.[1]?.trim();
  const form = /form=([^|]+)/.exec(basis)?.[1]?.trim();
  if (stage || form) return [stage, form].filter(Boolean).join(", ").replace(/^./, (c) => c.toUpperCase());
  return basis;
}

export const MEASURE_LABEL = {
  production: "Production",
  import: "Imports",
  imports: "Imports",
  export: "Exports",
  consumption: "Consumption",
  net_generation: "Net generation",
  installed_capacity: "Installed capacity",
  net_consumption: "Net consumption",
  net_imports: "Net imports",
  distribution_losses: "Distribution losses",
};

export const SECTOR_LABEL = { mining: "Mining", petroleum: "Oil and gas", power: "Power" };

export const NORMAL_LABEL = {
  abs: "Absolute",
  share: "Share of reporting total",
  peak: "Indexed to own peak",
  first: "Indexed to first year",
  pop: "Per person",
};

export function toCsv({ rows, years, unitLabel, title, notes }) {
  const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const lines = [...notes.map((n) => `# ${n}`), `# ${title}`, ["country", "iso3", "year", `value (${unitLabel})`].map(esc).join(",")];
  for (const r of rows) {
    years.forEach((y, i) => {
      if (r.values[i] != null) lines.push([esc(r.name), r.iso, y, r.values[i]].join(","));
    });
  }
  return lines.join("\n");
}

export const PALETTE = ["#0072B2", "#D55E00", "#009E73", "#CC79A7", "#E69F00", "#56B4E9", "#6b6b60", "#8c564b", "#17becf", "#7f7f2a"];
