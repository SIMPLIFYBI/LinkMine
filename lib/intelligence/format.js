export const fmt = (n) => Math.round(n).toLocaleString("en-US");

export function tonnes(t) {
  if (t >= 1e9) return `${(t / 1e9).toFixed(1)} bn t`;
  if (t >= 1e6) return `${(t / 1e6).toFixed(1)} M t`;
  if (t >= 1e3) return `${fmt(t / 1e3)} k t`;
  return t >= 10 ? `${fmt(t)} t` : `${t.toFixed(2)} t`;
}

export function stamp(iso) {
  return iso ? `${new Date(iso).toISOString().slice(0, 16).replace("T", " ")} UTC` : "unknown";
}

// A line over a year range on a log axis from 10% to 1,000%, with the 100% line marked by the caller.
export function sparkPath(values, width = 100, height = 32) {
  const n = values.length;
  const y = (v) => height - ((Math.log10(Math.max(10, Math.min(1000, v))) - 1) / 2) * height;
  let d = "";
  let pen = false;
  values.forEach((v, i) => {
    if (v == null) {
      pen = false;
      return;
    }
    d += `${pen ? "L" : "M"}${((i / (n - 1)) * width).toFixed(1)} ${y(v).toFixed(1)}`;
    pen = true;
  });
  return { d, baseline: y(100) };
}
