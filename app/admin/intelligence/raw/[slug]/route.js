import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getAnalyticsAdminContext } from "@/lib/adminAnalyticsAuth";
import { getReport } from "@/lib/intelligence/reports";
import { injectAuthor } from "@/lib/intelligence/byline";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Two reports are saved as fragments with no doctype or viewport, which renders in quirks mode and breaks on phones.
const FRAGMENT_PREFIX =
  '<!doctype html><html lang="en"><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">';

const CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data:",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'self'",
].join("; ");

export async function GET(_request, { params }) {
  const gate = await getAnalyticsAdminContext();
  if (!gate.ok) return new NextResponse(gate.error, { status: gate.status });

  const { slug } = await params;
  const report = getReport(slug);
  if (!report) return new NextResponse("Not found", { status: 404 });

  let html = await readFile(path.join(process.cwd(), "app", "reports", report.file), "utf8");
  if (!/^\s*<!doctype/i.test(html)) html = FRAGMENT_PREFIX + html;
  html = injectAuthor(html, report);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": CSP,
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
