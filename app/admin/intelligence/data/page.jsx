import Link from "next/link";
import { requireIntelligenceAdmin } from "@/lib/intelligence/adminPage";
import { getDataCatalog, PublishedDataError } from "@/lib/intelligence/published";
import DataExplorer from "@/app/intelligence/DataExplorer.client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Data · YouMine Intelligence",
  robots: { index: false, follow: false },
};

const PROBLEM = {
  schema_not_exposed: "The published schema is not exposed to the API yet (Settings, API, Exposed schemas).",
  missing_config: "The intelligence project connection is not configured. Set INTEL_SUPABASE_URL and INTEL_SUPABASE_ANON_KEY.",
};

const one = (value) => (Array.isArray(value) ? value[0] : value);
const KEYS = ["k", "t", "p", "n", "sm", "v", "f", "to", "h", "y"];

export default async function DataPage({ searchParams }) {
  const params = await searchParams;
  const initial = Object.fromEntries(KEYS.map((key) => [key, one(params?.[key])]));
  const query = new URLSearchParams(Object.entries(initial).filter(([, value]) => value)).toString();
  await requireIntelligenceAdmin(`/admin/intelligence/data${query ? `?${query}` : ""}`);

  let catalog = null;
  let problem = null;
  try {
    catalog = await getDataCatalog();
  } catch (error) {
    const code = error instanceof PublishedDataError ? error.code : "query_failed";
    problem = PROBLEM[code] || `The data catalogue could not be read: ${error.message}`;
  }

  return (
    <main className="yi-wrap yi-wrap--wide">
      <p className="yi-kicker">Data · Admin only</p>
      <h1 className="yi-title yi-title--sm">Build a view</h1>
      <p className="yi-lede">
        Choose a measure and a commodity, compare countries over time, and switch between chart, ranking, map and table. Only
        combinations that have data are offered.
      </p>
      <p className="yi-fresh">
        Looking for one ready-made answer? <Link href="/admin/intelligence/reserves">Years of reserves remaining</Link> ranks every country for a commodity.
      </p>

      {problem ? (
        <p className="yi-flag" role="alert">{problem}</p>
      ) : (
        <DataExplorer facet={catalog.facet} population={catalog.population} sources={catalog.sources} builtAt={catalog.builtAt} initial={initial} />
      )}
    </main>
  );
}
