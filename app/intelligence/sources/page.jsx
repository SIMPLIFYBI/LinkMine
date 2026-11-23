import { getPublishedSources } from "@/lib/intelligence/published";
import { REPORTS, REPORT_SOURCES } from "@/lib/intelligence/reports";
import SourceExplorer from "./SourceExplorer.client";
import styles from "./sources.module.css";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Source explorer · YouMine Intelligence",
  description: "Explore the database relationships and sources behind YouMine Intelligence reports.",
  robots: { index: false, follow: false },
};

export default async function SourcesPage({ searchParams }) {
  const { report } = await searchParams;
  const catalogue = await getPublishedSources().catch(() => null);
  const sources = { ...REPORT_SOURCES };
  for (const row of catalogue || []) {
    const registered = sources[row.source_code];
    sources[row.source_code] = {
      name: row.name || registered?.name,
      publisher: row.publisher,
      licence: row.licence_name || registered?.licence,
      licenceUrl: row.licence_url,
      attribution: row.attribution_text || registered?.attribution,
    };
  }

  const reports = REPORTS.map(({ slug, title, sources: codes }) => ({ slug, title, codes }));
  const activeReport = reports.find(({ slug }) => slug === report);

  return (
    <main className={`yi-wrap yi-wrap--wide ${styles.page}`}>
      <h1 className="yi-title">Source explorer</h1>
      <p className="yi-lede">See how the Intelligence database fits together, or choose a report to inspect the datasets it credits.</p>
      <SourceExplorer
        key={activeReport?.slug || "database"}
        reports={reports}
        initialReport={activeReport?.slug || ""}
        sources={sources}
        catalogueAvailable={catalogue !== null}
      />
    </main>
  );
}
