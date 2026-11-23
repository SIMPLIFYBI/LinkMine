import Link from "next/link";
import { CHARTS, REPORTS, REPORT_SOURCES } from "@/lib/intelligence/reports";
import { AUTHOR } from "@/lib/intelligence/author";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Intelligence reports · YouMine",
  robots: { index: false, follow: false },
};

const SECTOR_LABEL = { mining: "Mining", "oil-gas": "Oil & gas" };

export default async function IntelligenceReportsPage() {
  return (
    <main className="yi-wrap">
      <p className="yi-kicker">YouMine Intelligence</p>
      <h1 className="yi-title">Reports</h1>
      <p className="yi-lede">
        Data-led reports on mining and energy, with the method, sources and caveats on every page.
      </p>

      <ul className="yi-list">
        {REPORTS.map((report) => (
          <li key={report.slug} className="yi-item">
            <div className="yi-item__body">
              <div className="yi-meta">
                <span>{SECTOR_LABEL[report.sector] || report.sector}</span>
                <span aria-hidden="true">·</span>
                <span>{report.kicker}</span>
                <span aria-hidden="true">·</span>
                <span>By {AUTHOR.name}</span>
                <span className="yi-tag yi-tag--draft">{report.status}</span>
              </div>
              <h2>{report.title}</h2>
              <p>{report.summary}</p>
            </div>

            <div className="yi-actions">
              <Link href={`/intelligence/${report.slug}`} className="yi-btn yi-btn--primary">
                Read
              </Link>
              <a
                href={`/intelligence/raw/${report.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="yi-btn"
              >
                Open standalone
              </a>
            </div>

            <ul className="yi-sources">
              {report.sources.map((code) => {
                const source = REPORT_SOURCES[code];
                return (
                  <li key={code} className="yi-source" title={source ? `${source.name}. ${source.licence}.` : code}>
                    <b>{code}</b>
                    {source ? ` · ${source.licence}` : ""}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>

      <h2 className="yi-section">Native charts</h2>
      <ul className="yi-list">
        {CHARTS.map((chart) => (
          <li key={chart.href} className="yi-item">
            <div className="yi-item__body">
              <div className="yi-meta">
                <span>{chart.kicker}</span>
              </div>
              <h2>{chart.title}</h2>
              <p>{chart.summary}</p>
            </div>
            <div className="yi-actions">
              <Link href={chart.href} className="yi-btn yi-btn--primary">
                Open
              </Link>
            </div>
            <ul className="yi-sources">
              {chart.sources.map((code) => (
                <li key={code} className="yi-source">
                  <b>{code}</b>
                  {REPORT_SOURCES[code] ? ` · ${REPORT_SOURCES[code].licence}` : ""}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </main>
  );
}
