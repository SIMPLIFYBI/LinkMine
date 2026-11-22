// Pure helpers shared by the web player and any video render: the same inputs always give the same frame.

const LOST = [235, 104, 52];
const GAIN = [42, 120, 214];
const MID = [236, 233, 224];

// Diverging scale centred on 100% of own demand, on a log axis from a tenth to ten times.
export function divergingColor(pct) {
  const t = Math.max(-1, Math.min(1, Math.log10(Math.max(pct, 0.1) / 100)));
  const end = t < 0 ? LOST : GAIN;
  const k = Math.abs(t);
  const c = MID.map((m, i) => Math.round(m + (end[i] - m) * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export function divergingGradient() {
  const stops = [-1, -0.5, 0, 0.5, 1].map((t) => `${divergingColor(100 * Math.pow(10, t))}`);
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}

// Value at a fractional year. It never bridges a gap: if either neighbouring year is missing the nearer
// year's reading is shown, and if that is missing too the country has no reading.
export function frameValue(values, firstYear, year) {
  const base = Math.floor(year);
  const frac = year - base;
  const a = values[base - firstYear];
  const b = values[base + 1 - firstYear];
  if (a == null || b == null) return (frac < 0.5 ? a : b) ?? null;
  const la = Math.log(Math.max(a, 0.1));
  const lb = Math.log(Math.max(b, 0.1));
  return Math.exp(la + (lb - la) * frac);
}

// Single-hue scale for quantities, light to deep blue. t runs 0 to 1.
const SEQ_LIGHT = [233, 238, 243];
const SEQ_DARK = [14, 66, 124];

export function sequentialColor(t) {
  const k = Math.max(0, Math.min(1, t));
  const c = SEQ_LIGHT.map((l, i) => Math.round(l + (SEQ_DARK[i] - l) * k));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export function sequentialGradient() {
  return `linear-gradient(90deg, ${[0, 0.25, 0.5, 0.75, 1].map(sequentialColor).join(", ")})`;
}

// The first year after which a series never returns to the side of 100% it started the last stretch on.
export function sustainedCrossing(values, firstYear) {
  const finalValue = [...values].reverse().find((v) => v != null);
  if (finalValue == null) return null;
  const finalUp = finalValue >= 100;
  let lastOpposite = -1;
  values.forEach((v, i) => {
    if (v != null && v >= 100 !== finalUp) lastOpposite = i;
  });
  if (lastOpposite < 0) return null;
  for (let i = lastOpposite + 1; i < values.length; i++) {
    if (values[i] != null) return { year: firstYear + i, direction: finalUp ? "up" : "down" };
  }
  return null;
}
