import { getReservesToProduction, PublishedDataError } from "@/lib/intelligence/published";
import ReservesExplorer from "./ReservesExplorer.client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Years of reserves remaining · Intelligence",
  robots: { index: false, follow: false },
};

const PROBLEM = {
  schema_not_exposed:
    "The published schema is not exposed to the API yet. In the Supabase dashboard for project wfelikvlymtvkmljkvri, open Settings, then API, then Exposed schemas, and add published.",
  missing_config: "The intelligence project connection is not configured. Set INTEL_SUPABASE_URL and INTEL_SUPABASE_ANON_KEY in .env.local and restart the dev server.",
};

const one = (value) => (Array.isArray(value) ? value[0] : value);

export default async function ReservesPage({ searchParams }) {
  const params = await searchParams;
  const state = { c: one(params?.c), h: one(params?.h), v: one(params?.v) };
  const initial = { code: state.c, highlight: state.h, view: state.v };

  let data = null;
  let problem = null;
  try {
    data = await getReservesToProduction();
  } catch (error) {
    const code = error instanceof PublishedDataError ? error.code : "query_failed";
    problem = PROBLEM[code] || `The published data could not be read: ${error.message}`;
  }

  return (
    <main className="yi-wrap">
      <p className="yi-kicker">YouMine Intelligence · Data</p>
      <h1 className="yi-title">Years of reserves remaining</h1>
      <p className="yi-lede">
        Reported reserves divided by one year of mine production, for every country that publishes both. A log scale,
        because the range runs from a couple of years to tens of thousands.
      </p>

      {problem ? (
        <p className="yi-flag" role="alert">
          {problem}
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
