import "server-only";
import { siteUrl } from "@/lib/siteUrl";
import { escapeHtml } from "@/lib/emails/emailLayout";
import { AUTHOR } from "./author";
import { reportPath } from "./reports";

const SHARE_IMAGE = "/intelligence/share-card.png";
const SHARE_IMAGE_ALT = "YouMine Intelligence, mining and energy data";

export function intelligenceMetadata(path, title, description) {
  const url = siteUrl(path);
  const image = siteUrl(SHARE_IMAGE);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: "YouMine Intelligence",
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: SHARE_IMAGE_ALT }],
    },
    twitter: { card: "summary_large_image", title, description, images: [{ url: image, alt: SHARE_IMAGE_ALT }] },
  };
}

export function reportHead(report) {
  const headline = escapeHtml(report.title);
  const title = `${escapeHtml(report.searchTitle || report.title)} | YouMine Intelligence`;
  const description = escapeHtml(report.summary);
  const url = siteUrl(reportPath(report.slug));
  const image = escapeHtml(siteUrl(SHARE_IMAGE));
  const published = report.publishedAt;
  const updated = report.corrections.at(-1)?.date || published;
  const article = published && {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: report.title,
    description: report.summary,
    mainEntityOfPage: url,
    datePublished: published,
    dateModified: updated,
    author: { "@type": "Person", name: AUTHOR.name, url: AUTHOR.linkedin },
    publisher: { "@type": "Organization", name: "YouMine", url: siteUrl("/") },
  };

  return `<title>${title}</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${escapeHtml(url)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="article">
<meta property="og:site_name" content="YouMine Intelligence">
<meta property="og:url" content="${escapeHtml(url)}">
<meta property="og:title" content="${headline}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${SHARE_IMAGE_ALT}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${headline}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
<meta name="twitter:image:alt" content="${SHARE_IMAGE_ALT}">
${published ? `<meta property="article:published_time" content="${escapeHtml(published)}">
<meta property="article:modified_time" content="${escapeHtml(updated)}">
<script type="application/ld+json">${JSON.stringify(article).replace(/</g, "\\u003c")}</script>` : ""}`;
}
