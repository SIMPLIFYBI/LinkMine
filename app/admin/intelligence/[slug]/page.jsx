import Link from "next/link";
import { notFound } from "next/navigation";
import { requireIntelligenceAdmin } from "@/lib/intelligence/adminPage";
import { getReport, REPORT_SOURCES } from "@/lib/intelligence/reports";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const report = getReport(slug);
  return {
    title: report ? `${report.title} · Intelligence preview` : "Intelligence preview",
    robots: { index: false, follow: false },
  };
}

export default async function IntelligenceReportPreviewPage({ params }) {
  const { slug } = await params;
  await requireIntelligenceAdmin(`/admin/intelligence/${slug}`);

  const report = getReport(slug);
  if (!report) notFound();

  const rawHref = `/admin/intelligence/raw/${report.slug}`;
  const attributions = report.sources
    .map((code) => REPORT_SOURCES[code]?.attribution)
    .filter((text) => text && text !== "required by house style");

  return (
    <main className="yi-wrap yi-wrap--wide">
      <div className="yi-head">
        <div className="min-w-0">
          <Link href="/admin/intelligence/reports" className="yi-back">
            All reports
          </Link>
          <h1 className="yi-title yi-title--sm">{report.title}</h1>
        </div>
        <a href={rawHref} target="_blank" rel="noopener noreferrer" className="yi-btn">
          Open standalone
        </a>
      </div>

      {attributions.length ? (
        <p className="yi-flag">Attribution required on publication: {attributions.join(" ")}</p>
      ) : null}

      <iframe title={report.title} src={rawHref} className="yi-frame" />
    </main>
  );
}
