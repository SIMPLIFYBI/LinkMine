import "server-only";
import { createClient } from "@supabase/supabase-js";

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
  };
}

// Everything the Discover page needs, read in parallel and held briefly so the page is quick.
const HOME_TTL_MS = 5 * 60 * 1000;
let homeCache = { at: 0, value: null };

export async function getHomeData() {
  if (homeCache.value && Date.now() - homeCache.at < HOME_TTL_MS) return homeCache.value;
  const [reserves, hero] = await Promise.all([getReservesToProduction(), getEnergyHero()]);
  homeCache = { at: Date.now(), value: { reserves, hero } };
  return homeCache.value;
}
