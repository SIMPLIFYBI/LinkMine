import "server-only";
import { createClient } from "@supabase/supabase-js";
import world from "./world-paths.json";
import { fmt } from "./format";
import { STANDARD_CHARTS } from "./mapReports";

const DRAWN = new Set([...world.countries.map((c) => c.iso), ...world.dots.map((d) => d.iso)]);

// Entities that have a reading in the shown years but no boundary on the map (former states, tiny territories).
function undrawnOf(names, series) {
  const out = Object.keys(series)
    .filter((iso) => !DRAWN.has(iso) && series[iso].some((v) => v != null))
    .map((iso) => names[iso] || iso)
    .sort();
  return { count: out.length, names: out.slice(0, 4) };
}

export class PublishedDataError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function publishedClient() {
  const url = process.env.INTEL_SUPABASE_URL;
  const key = process.env.INTEL_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new PublishedDataError("missing_config", "INTEL_SUPABASE_URL and INTEL_SUPABASE_ANON_KEY are not set.");
  }
  return createClient(url, key, {
    db: { schema: "published" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function check({ data, error }) {
  if (error) {
    const code = error.code === "PGRST106" ? "schema_not_exposed" : "query_failed";
    throw new PublishedDataError(code, error.message);
  }
  return data;
}

const RTP_COLUMNS = [
  "commodity_code",
  "commodity_name",
  "iso_alpha3",
  "country_name",
  "reserves_t",
  "production_t",
  "years_remaining",
  "reserve_year",
  "production_year",
  "reserve_rank",
  "production_rank",
  "n_ranked",
  "reserve_source_code",
  "production_source_code",
].join(",");

export async function getPublishedSources() {
  const sb = publishedClient();
  return fetchAll(() =>
    sb.from("source").select("source_code,name,publisher,licence_name,licence_url,attribution_text").order("source_code")
  );
}

// Everything the reserves-to-production chart needs. 323 rows, so it is sent whole and filtered in the browser.
export async function getReservesToProduction() {
  const sb = publishedClient();

  const rows = check(await sb.from("reserves_to_production").select(RTP_COLUMNS).limit(2000));
  const basis = check(await sb.from("rp_basis").select("commodity_code,note").not("note", "is", null));
  const sources = check(await sb.from("source").select("source_code,name,licence_name,attribution_text"));
  const build = check(
    await sb.from("build_info").select("refreshed_at").eq("object_name", "reserves_to_production").maybeSingle()
  );

  return {
    rows,
    notes: Object.fromEntries(basis.map((row) => [row.commodity_code, row.note])),
    sources,
    builtAt: build?.refreshed_at || null,
  };
}

// PostgREST caps a response at 1,000 rows, so larger reads are paged.
async function fetchAll(build) {
  const size = 1000;
  const out = [];
  for (let from = 0; ; from += size) {
    const page = check(await build().range(from, from + size - 1));
    out.push(...page);
    if (page.length < size) return out;
  }
}

// Production as a share of consumption for every country and year, folded into one array per country.
export async function getEnergyHero(fuel = "liquids", firstYear = 1992) {
  const sb = publishedClient();

  const rows = await fetchAll(() =>
    sb
      .from("energy_self_sufficiency")
      .select("iso_alpha3,country_name,year,production,self_sufficiency_pct")
      .eq("fuel", fuel)
      .gte("year", firstYear)
      .order("iso_alpha3")
      .order("year")
  );
  const fuelRow = check(await sb.from("fuel").select("label,quantity_unit,note").eq("fuel", fuel).maybeSingle());
  const source = check(await sb.from("source").select("name,attribution_text").eq("source_code", "E1").maybeSingle());
  const build = check(
    await sb.from("build_info").select("refreshed_at").eq("object_name", "energy_self_sufficiency").maybeSingle()
  );

  const lastYear = rows.reduce((max, r) => Math.max(max, r.year), firstYear);
  const series = {};
  const names = {};
  for (const r of rows) {
    names[r.iso_alpha3] = r.country_name;
    (series[r.iso_alpha3] ||= new Array(lastYear - firstYear + 1).fill(null))[r.year - firstYear] = r.self_sufficiency_pct;
  }
  const latest = rows
    .filter((r) => r.year === lastYear && r.production > 0)
    .map((r) => ({ iso: r.iso_alpha3, name: r.country_name, production: r.production, pct: r.self_sufficiency_pct }))
    .sort((a, b) => b.production - a.production);
  const short = fuel === "gas" ? "bcm" : "kb/d";

  return {
    fuel,
    label: fuelRow?.label,
    unit: fuelRow?.quantity_unit,
    note: fuelRow?.note,
    sourceName: source?.name,
    attribution: source?.attribution_text,
    builtAt: build?.refreshed_at || null,
    firstYear,
    lastYear,
    series,
    names,
    latest,
    undrawn: undrawnOf(names, series),
    table: {
      head: ["Country", `Production, ${lastYear}`, "Share of own demand"],
      rows: latest.slice(0, 20).map((r) => [r.name, `${fmt(r.production)} ${short}`, `${fmt(r.pct)}%`]),
    },
  };
}

async function seriesKeyFor(sb, match) {
  const found = check(await sb.from("series_facet").select("series_key").match(match).limit(2));
  if (found.length !== 1) {
    throw new PublishedDataError("query_failed", `Expected one series for ${JSON.stringify(match)}, found ${found.length}.`);
  }
  return found[0].series_key;
}

// Rows from published.series folded to a dense array per country over [first, last]; a missing year stays null.
function denseSeries(rows, first, last) {
  const names = {};
  const series = {};
  for (const r of rows) {
    names[r.iso_alpha3] = r.country_name;
    const out = new Array(last - first + 1).fill(null);
    r.years.forEach((y, i) => {
      if (y >= first && y <= last && r.vals[i] != null) out[y - first] = Number(r.vals[i]);
    });
    series[r.iso_alpha3] = out;
  }
  return { names, series };
}

async function sourceInfo(sb, code) {
  return check(await sb.from("source").select("name,attribution_text").eq("source_code", code).maybeSingle());
}

async function seriesBuiltAt(sb) {
  const build = check(await sb.from("build_info").select("refreshed_at").eq("object_name", "series").maybeSingle());
  return build?.refreshed_at || null;
}

// Wind plus solar generation as a percentage of all net generation. A country-year missing any of the three has no reading.
export async function getWindSolarShare(firstYear = 1990) {
  const sb = publishedClient();
  const key = (commodity) => seriesKeyFor(sb, { sector: "power", measure: "net_generation", commodity_code: commodity, source_code: "E1" });
  const [windKey, solarKey, totalKey] = await Promise.all([key("WIND"), key("SOLAR"), key("ELECTRICITY")]);
  const [wind, solar, total, source, builtAt] = await Promise.all([
    getSeriesRows(windKey),
    getSeriesRows(solarKey),
    getSeriesRows(totalKey),
    sourceInfo(sb, "E1"),
    seriesBuiltAt(sb),
  ]);

  const lastYear = total.reduce((max, r) => Math.max(max, ...r.years), firstYear);
  const w = denseSeries(wind, firstYear, lastYear).series;
  const s = denseSeries(solar, firstYear, lastYear).series;
  const t = denseSeries(total, firstYear, lastYear);

  const series = {};
  const latest = [];
  for (const iso of Object.keys(t.series)) {
    series[iso] = t.series[iso].map((tot, i) => {
      const a = w[iso]?.[i];
      const b = s[iso]?.[i];
      return tot > 0 && a != null && b != null ? (100 * (a + b)) / tot : null;
    });
    const i = lastYear - firstYear;
    const a = w[iso]?.[i];
    const b = s[iso]?.[i];
    if (series[iso][i] != null) latest.push({ name: t.names[iso], twh: a + b, pct: series[iso][i] });
  }
  latest.sort((x, y) => y.twh - x.twh);

  return {
    firstYear,
    lastYear,
    series,
    names: t.names,
    sourceName: source?.name,
    attribution: source?.attribution_text,
    builtAt,
    undrawn: undrawnOf(t.names, series),
    table: {
      head: ["Country", `Wind and solar, ${lastYear}`, "Share of its electricity"],
      rows: latest.slice(0, 20).map((r) => [r.name, `${fmt(r.twh)} TWh`, `${r.pct.toFixed(0)}%`]),
    },
  };
}

// Copper in ore and concentrate, tonnes of metal content, as published by the British Geological Survey.
export async function getCopperMined(firstYear = 1992) {
  const sb = publishedClient();
  const key = await seriesKeyFor(sb, {
    sector: "mining",
    measure: "production",
    commodity_code: "CU",
    source_code: "M3",
    basis: "copper, mine | stage=mine | form=ores and concentrates",
  });
  const [rows, source, builtAt] = await Promise.all([getSeriesRows(key), sourceInfo(sb, "M3"), seriesBuiltAt(sb)]);

  const lastYear = rows.reduce((max, r) => Math.max(max, ...r.years), firstYear);
  const { names, series } = denseSeries(rows, firstYear, lastYear);
  const i = lastYear - firstYear;
  const reporting = Object.keys(series).filter((iso) => series[iso][i] != null);
  const worldTotal = reporting.reduce((sum, iso) => sum + series[iso][i], 0);
  const latest = reporting
    .filter((iso) => series[iso][i] > 0)
    .map((iso) => ({ name: names[iso], t: series[iso][i] }))
    .sort((a, b) => b.t - a.t);

  return {
    firstYear,
    lastYear,
    series,
    names,
    sourceName: source?.name,
    attribution: source?.attribution_text,
    builtAt,
    undrawn: undrawnOf(names, series),
    table: {
      head: ["Country", `Mined, ${lastYear}`, "Share of reported total"],
      rows: latest.slice(0, 20).map((r) => [r.name, `${fmt(r.t / 1000)} kt`, `${((100 * r.t) / worldTotal).toFixed(0)}%`]),
    },
  };
}

// Everything the Discover page needs, read in parallel and held briefly so the page is quick.
const HOME_TTL_MS = 5 * 60 * 1000;
let homeCache = { at: 0, value: null };

// A chart whose series cannot be found is left out rather than breaking the page.
async function getStandardCharts() {
  const sb = publishedClient();
  const settled = await Promise.allSettled(STANDARD_CHARTS.map((c) => seriesKeyFor(sb, c.match)));
  return STANDARD_CHARTS.flatMap((c, i) =>
    settled[i].status === "fulfilled" ? [{ label: c.label, blurb: c.blurb, href: `/intelligence/data?k=${settled[i].value}` }] : []
  );
}

export async function getHomeData() {
  if (homeCache.value && Date.now() - homeCache.at < HOME_TTL_MS) return homeCache.value;
  const [reserves, hero, gas, power, copper, charts] = await Promise.all([
    getReservesToProduction(),
    getEnergyHero(),
    getEnergyHero("gas"),
    getWindSolarShare(),
    getCopperMined(),
    getStandardCharts(),
  ]);
  homeCache = { at: Date.now(), value: { reserves, hero, charts, maps: { oil: hero, gas, power, copper } } };
  return homeCache.value;
}

// The Data area's catalogue: what can be selected, who the sources are, and population for per-person views.
export async function getDataCatalog() {
  const sb = publishedClient();
  const [facet, population, sources, build] = await Promise.all([
    sb.from("series_facet").select("*").limit(2000),
    sb.from("population").select("iso_alpha3,years,vals").limit(1000),
    sb.from("source").select("source_code,name,licence_name,attribution_text"),
    sb.from("build_info").select("refreshed_at").eq("object_name", "series").maybeSingle(),
  ]);
  return {
    facet: check(facet),
    population: Object.fromEntries(check(population).map((p) => [p.iso_alpha3, { years: p.years, vals: p.vals.map(Number) }])),
    sources: check(sources),
    builtAt: check(build)?.refreshed_at || null,
  };
}

// One series for every country that reports it. Small enough (at most about 240 rows) to fetch in one request.
export async function getSeriesRows(seriesKey) {
  const sb = publishedClient();
  return check(
    await sb.from("series").select("iso_alpha3,country_name,years,vals").eq("series_key", seriesKey).limit(1000)
  );
}
