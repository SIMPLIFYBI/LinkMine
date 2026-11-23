import { notFound, redirect } from "next/navigation";
import { getReport } from "@/lib/intelligence/reports";

export const metadata = { robots: { index: false, follow: false } };

export default async function IntelligenceReportPage({ params }) {
  const { slug } = await params;
  const report = getReport(slug);
  if (!report) notFound();
  redirect(`/intelligence/raw/${report.slug}`);
}
