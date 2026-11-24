import Link from "next/link";
import { getDataCatalog } from "@/lib/intelligence/published";
import { intelligenceMetadata } from "@/lib/intelligence/seo";
import DataExplorer from "@/app/intelligence/DataExplorer.client";

export const dynamic = "force-dynamic";

export const metadata = intelligenceMetadata(
  "/intelligence/data",
  "Mining and Energy Data Explorer | YouMine Intelligence",
  "Compare mining production and trade, oil and gas statistics, and electricity generation by country. Explore charts, maps and tables or download the data.",
);

const one = (value) => (Array.isArray(value) ? value[0] : value);
const KEYS = ["k", "t", "p", "n", "sm", "v", "f", "to", "h", "y"];

export default async function DataPage({ searchParams }) {
  const params = await searchParams;
  const initial = Object.fromEntries(KEYS.map((key) => [key, one(params?.[key])]));

  let catalog = null;
  try {
    catalog = await getDataCatalog();
  } catch (error) {
    console.error("Intelligence data catalogue unavailable", error);
  }

  return (
    <main className="yi-wrap yi-wrap--wide">
      <p className="yi-kicker">Data</p>
      <h1 className="yi-title yi-title--sm">Mining and energy data explorer</h1>
      <p className="yi-lede">
        Choose a measure and a commodity, compare countries over time, and switch between chart, ranking, map and table. Only
        combinations that have data are offered.
      </p>
      <p className="yi-fresh">
        <Link href="/intelligence/reserves">Years of reserves remaining</Link> ranks countries with both reserves and production figures.
      </p>

      {!catalog ? (
        <p className="yi-flag" role="alert">
          The data explorer is temporarily unavailable. <Link href="/intelligence/reports">Browse the reports</Link>.
        </p>
      ) : (
        <DataExplorer facet={catalog.facet} population={catalog.population} sources={catalog.sources} builtAt={catalog.builtAt} initial={initial} />
      )}
    </main>
  );
}
