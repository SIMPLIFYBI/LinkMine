import { getReport, reportPath } from "@/lib/intelligence/reports";

export async function GET(request, { params }) {
  const { slug } = await params;
  const report = getReport(slug);
  if (!report) return new Response("Report not found", { status: 404 });

  return new Response(null, {
    status: 308,
    headers: { Location: reportPath(report.slug) + new URL(request.url).search },
  });
}
