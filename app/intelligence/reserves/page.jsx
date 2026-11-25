import Link from "next/link";
import { getReservesToProduction } from "@/lib/intelligence/published";
import { intelligenceMetadata } from "@/lib/intelligence/seo";
import ReservesExplorer from "./ReservesExplorer.client";

export const dynamic = "force-dynamic";

export const metadata = intelligenceMetadata(
  "/intelligence/reserves",
  "Mineral Reserves and Mine Production by Country | YouMine Intelligence",
  "Compare reported mineral reserves with annual mine production by country. Explore reserves-to-production rankings, data sources and reporting years.",
);

const one = (value) => (Array.isArray(value) ? value[0] : value);

export default async function ReservesPage({ searchParams }) {
  const params = await searchParams;
  const state = { c: one(params?.c), h: one(params?.h), v: one(params?.v) };
  const initial = { code: state.c, highlight: state.h, view: state.v };

  let data = null;
  try {
    data = await getReservesToProduction();
  } catch (error) {
    console.error("Intelligence reserves data unavailable", error);
  }

  return (
    <main className="yi-wrap">
      <p className="yi-kicker">YouMine Intelligence · Data</p>
      <h1 className="yi-title">Years of reserves remaining</h1>
      <p className="yi-lede">
        Reported reserves divided by one year of mine production, for every country that publishes both. A log scale,
        because the range runs from a couple of years to tens of thousands.
      </p>
      <p className="yi-fresh">
        <Link href="/intelligence/reserves/rows" prefetch={false}>Browse rows and inspect their inputs</Link>
      </p>

      {!data ? (
        <p className="yi-flag" role="alert">
          The reserves explorer is temporarily unavailable. <a href="/intelligence/raw/reserve-report">Read the reserves analysis</a> or <Link href="/intelligence/reports">browse the reports</Link>.
        </p>
      ) : (
        <ReservesExplorer
          rows={data.rows}
          notes={data.notes}
          sources={data.sources}
          builtAt={data.builtAt}
          initial={initial}
        />
      )}
    </main>
  );
}
