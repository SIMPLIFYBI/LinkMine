// One-off generator: Natural Earth 1:110m countries -> Equal Earth SVG paths keyed by ISO alpha-3.
// Run: node scripts/build-world-paths.mjs   (output is committed; the packages are dev-only)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { feature } from "topojson-client";
import { geoEqualEarth, geoPath } from "d3-geo";
import isoCountries from "i18n-iso-countries";

const topology = JSON.parse(readFileSync("node_modules/world-atlas/countries-110m.json", "utf8"));
const { features } = feature(topology, topology.objects.countries);

// world-atlas leaves these without an ISO numeric id.
const BY_NAME = { Kosovo: "XKX" };
// Not drawn: Antarctica wastes a third of the canvas; the two unrecognised territories have no statistics.
const SKIP = new Set(["Antarctica", "N. Cyprus", "Somaliland"]);

const projection = geoEqualEarth().fitSize([960, 500], { type: "Sphere" });
const path = geoPath(projection);
const round = (d) => d.replace(/-?\d+\.\d+/g, (n) => String(Math.round(Number(n) * 10) / 10));

const countries = [];
const unmapped = [];
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

for (const f of features) {
  const name = f.properties.name;
  if (SKIP.has(name)) continue;
  const iso = BY_NAME[name] || (f.id ? isoCountries.numericToAlpha3(String(f.id)) : null);
  if (!iso) { unmapped.push(name); continue; }
  const d = path(f);
  if (!d) continue;
  const [[x0, y0], [x1, y1]] = path.bounds(f);
  minX = Math.min(minX, x0); minY = Math.min(minY, y0); maxX = Math.max(maxX, x1); maxY = Math.max(maxY, y1);
  const [cx, cy] = path.centroid(f);
  countries.push({ iso, name, d: round(d), cx: Math.round(cx * 10) / 10, cy: Math.round(cy * 10) / 10 });
}

const pad = 4;
const viewBox = [Math.floor(minX - pad), Math.floor(minY - pad), Math.ceil(maxX - minX + pad * 2), Math.ceil(maxY - minY + pad * 2)];
countries.sort((a, b) => a.iso.localeCompare(b.iso));

// Countries too small for 1:110m, drawn as dots at hand-set coordinates (the database holds no geometry).
const DOT_SOURCES = [
  ["BHR", "Bahrain", 50.55, 26.07], ["SGP", "Singapore", 103.82, 1.35], ["MLT", "Malta", 14.45, 35.9],
  ["HKG", "Hong Kong", 114.17, 22.32], ["MAC", "Macao", 113.55, 22.2], ["MDV", "Maldives", 73.5, 3.2],
  ["MUS", "Mauritius", 57.55, -20.2], ["SYC", "Seychelles", 55.45, -4.68], ["CPV", "Cabo Verde", -23.6, 15.1],
  ["BRB", "Barbados", -59.55, 13.19], ["ABW", "Aruba", -69.97, 12.52], ["BMU", "Bermuda", -64.75, 32.3],
  ["CYM", "Cayman Islands", -81.25, 19.3], ["COM", "Comoros", 43.33, -11.65], ["TON", "Tonga", -175.2, -21.18],
  ["WSM", "Samoa", -172.1, -13.76],
];
const drawn = new Set(countries.map((c) => c.iso));
const dots = DOT_SOURCES.filter(([iso]) => !drawn.has(iso)).map(([iso, name, lon, lat]) => {
  const [x, y] = projection([lon, lat]);
  return { iso, name, cx: Math.round(x * 10) / 10, cy: Math.round(y * 10) / 10 };
});

mkdirSync("lib/intelligence", { recursive: true });
const out = JSON.stringify({ viewBox, countries, dots });
writeFileSync("lib/intelligence/world-paths.json", out);

console.log(`countries: ${countries.length} | dots: ${dots.length} | viewBox: ${viewBox.join(" ")} | size: ${(Buffer.byteLength(out) / 1024).toFixed(0)} KB`);
if (unmapped.length) console.log("no ISO code for:", unmapped.join(", "));

