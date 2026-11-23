import Link from "next/link";
import { notFound } from "next/navigation";
import { getReport } from "@/lib/intelligence/reports";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const report = getReport(slug);
  return {
    title: report ? `${report.title} · YouMine Intelligence` : "YouMine Intelligence",
    description: report?.summary,
    robots: { index: false, follow: false },
  };
}

export default async function IntelligenceReportPage({ params }) {
  const { slug } = await params;

  const report = getReport(slug);
  if (!report) notFound();

  // Source attribution is in each report's own credit line, so the wrapper adds none.
  const rawHref = `/intelligence/raw/${report.slug}`;

  return (
    <main className="yi-wrap yi-wrap--wide">
      <div className="yi-head">
        <div className="min-w-0">
          <Link href="/intelligence/reports" className="yi-back">
            All reports
          </Link>
          <h1 className="yi-title yi-title--sm">{report.title}</h1>
        </div>
        <div className="yi-actions">
          <Link href={`/intelligence/sources?report=${report.slug}`} className="yi-btn">
            Explore sources
          </Link>
          <a href={rawHref} target="_blank" rel="noopener noreferrer" className="yi-btn">
            Open full page
          </a>
        </div>
      </div>

      <iframe title={report.title} src={rawHref} className="yi-frame" />
    </main>
  );
}
