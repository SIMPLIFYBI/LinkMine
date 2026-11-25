import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getReport } from "@/lib/intelligence/reports";
import { injectAuthor } from "@/lib/intelligence/byline";
import { reportHead } from "@/lib/intelligence/seo";
import { campaignParameters } from "@/lib/ga4Client";
import { INTELLIGENCE_NAV_BRAND, INTELLIGENCE_NAV_ITEMS } from "@/lib/intelligence/navigation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Report fragments need a doctype and viewport for standards mode and mobile layout.
const FRAGMENT_PREFIX =
  '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">';

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const analyticsEnabled = process.env.NODE_ENV === "production" && /^G-[A-Z0-9]+$/.test(measurementId || "");
const tagHost = "https://www.googletagmanager.com";
const analyticsHost = "https://*.google-analytics.com";
const analytics = analyticsEnabled ? `<script>
(() => {
  const url = new URL(window.location.href);
  const campaign = new URLSearchParams();
  const allowed = ${JSON.stringify([...campaignParameters])};
  for (const [name, value] of url.searchParams) {
    if (allowed.includes(name.toLowerCase())) campaign.append(name, value);
  }
  url.search = campaign.toString();
  url.hash = "";
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag("js", new Date());
  gtag("config", "${measurementId}", {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    send_page_view: false,
    page_location: url.href,
  });
  gtag("event", "page_view", {
    page_location: url.href,
    page_path: url.pathname,
    page_title: document.title,
  });
})();
</script>
<script async src="${tagHost}/gtag/js?id=${measurementId}"></script>` : "";

function buildReportDocument(html, report) {
  const links = INTELLIGENCE_NAV_ITEMS.map(({ href, label }) =>
    `<a href="${href}"${href === "/intelligence/reports" ? ' aria-current="location"' : ""}>${label}</a>`
  ).join("\n");
  const bar = `<style>
.ym-report-nav {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--surface, var(--ground, #fbfaf6));
  border-bottom: 1px solid var(--rule, #e2e1dc);
}
.ym-report-nav__links {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas: "brand tabs sources";
  align-items: center;
  gap: 0 clamp(.75rem, 3vw, 2rem);
  max-width: 76rem;
  margin: 0 auto;
  padding-top: env(safe-area-inset-top, 0px);
  padding-left: max(16px, env(safe-area-inset-left, 0px));
  padding-right: max(16px, env(safe-area-inset-right, 0px));
}
.ym-report-nav__brand {
  grid-area: brand;
  font: 600 1rem/1.2 var(--serif, var(--font-body, Georgia, serif));
  color: var(--ink, #16160f);
}
.ym-report-nav__tabs {
  grid-area: tabs;
  display: flex;
  flex-wrap: wrap;
  gap: 0 clamp(.75rem, 2.2vw, 1.5rem);
}
.ym-report-nav a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  color: var(--ink, #16160f);
  font: 600 .875rem/1.25 system-ui, sans-serif;
  text-decoration: none;
  white-space: nowrap;
}
.ym-report-nav__tabs a {
  border-bottom: 2px solid transparent;
}
.ym-report-nav__tabs a[aria-current="location"] {
  border-bottom-color: currentColor;
}
.ym-report-nav .ym-report-nav__sources {
  grid-area: sources;
  justify-self: end;
}
.ym-report-nav a:hover,
.ym-report-nav .ym-report-nav__sources {
  text-decoration: underline;
  text-underline-offset: .2em;
}
@media (max-width: 670px) {
  .ym-report-nav__links {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas: "brand sources" "tabs tabs";
  }
}
</style>
<nav class="ym-report-nav" aria-label="Intelligence">
  <div class="ym-report-nav__links">
    <span class="ym-report-nav__brand">${INTELLIGENCE_NAV_BRAND}</span>
    <div class="ym-report-nav__tabs">${links}</div>
    <a class="ym-report-nav__sources" href="/intelligence/sources?report=${encodeURIComponent(report.slug)}">Explore sources</a>
  </div>
</nav>`;

  const document = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, () => `${reportHead(report)}\n${analytics}`);
  if (/^\s*<!doctype/i.test(document)) {
    return document.replace(/<body\b[^>]*>/i, (body) => `${body}\n${bar}`);
  }
  // The fragment starts with head metadata and styles, followed by its content wrapper.
  return FRAGMENT_PREFIX
    + document.replace(/^<(?:main|div)\b/im, (start) => `</head><body>\n${bar}\n${start}`)
    + "</body></html>";
}

const CSP = [
  "default-src 'none'",
  `script-src 'unsafe-inline'${analyticsEnabled ? ` ${tagHost}` : ""}`,
  "style-src 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  `img-src 'self' data:${analyticsEnabled ? ` ${tagHost} ${analyticsHost}` : ""}`,
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'self'",
];

// Public: anyone with the URL can read a report. noindex keeps drafts out of search until publication.
export async function GET(_request, { params }) {
  const { slug } = await params;
  const report = getReport(slug);
  if (!report) return new NextResponse("Not found", { status: 404 });

  const html = await readFile(path.join(process.cwd(), "app", "reports", report.file), "utf8");
  const connect = [
    ...(slug === "bauxite-to-aluminium" ? ["'self'"] : []),
    ...(analyticsEnabled ? [tagHost, analyticsHost, "https://*.google.com"] : []),
  ];

  return new NextResponse(injectAuthor(buildReportDocument(html, report), report), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Security-Policy": [...CSP, ...(connect.length ? [`connect-src ${connect.join(" ")}`] : [])].join("; "),
      "X-Content-Type-Options": "nosniff",
      ...(!report.publishedAt && { "X-Robots-Tag": "noindex, nofollow" }),
    },
  });
}
