import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getReport } from "@/lib/intelligence/reports";
import { injectAuthor } from "@/lib/intelligence/byline";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Report fragments need a doctype and viewport for standards mode and mobile layout.
const FRAGMENT_PREFIX =
  '<!doctype html><html lang="en"><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">';

function withReportNavigation(html, report) {
  const bar = `<style>
.ym-report-nav {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--surface, var(--ground, #fbfaf6));
  border-bottom: 1px solid var(--rule, #e2e1dc);
}
.ym-report-nav__links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0 1rem;
  max-width: 76rem;
  margin: 0 auto;
  padding-left: max(16px, env(safe-area-inset-left, 0px));
  padding-right: max(16px, env(safe-area-inset-right, 0px));
}
.ym-report-nav a {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  color: var(--ink, #16160f);
  font: 600 .875rem/1.25 system-ui, sans-serif;
  text-decoration: underline;
  text-underline-offset: .2em;
}
</style>
<nav class="ym-report-nav" aria-label="Report navigation">
  <div class="ym-report-nav__links">
    <a href="/intelligence/reports">All reports</a>
    <a href="/intelligence/sources?report=${encodeURIComponent(report.slug)}">Explore sources</a>
  </div>
</nav>`;

  if (/^\s*<!doctype/i.test(html)) {
    return html.replace(/<body\b[^>]*>/i, (body) => `${body}\n${bar}`);
  }
  // Keep the fragment's title, font links and styles before the first content element.
  return FRAGMENT_PREFIX + html.replace(/^<(?:main|div)\b/im, (start) => `${bar}\n${start}`);
}

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

// Public: anyone with the URL can read a report. noindex keeps drafts out of search until publication.
export async function GET(_request, { params }) {
  const { slug } = await params;
  const report = getReport(slug);
  if (!report) return new NextResponse("Not found", { status: 404 });

  const html = await readFile(path.join(process.cwd(), "app", "reports", report.file), "utf8");

  return new NextResponse(injectAuthor(withReportNavigation(html, report), report), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": slug === "bauxite-to-aluminium" ? `${CSP}; connect-src 'self'` : CSP,
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
