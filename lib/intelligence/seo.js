import "server-only";
import { siteUrl } from "@/lib/siteUrl";
import { escapeHtml } from "@/lib/emails/emailLayout";
import { DEFAULT_SHARE_IMAGE, socialOpenGraph } from "@/lib/socialMetadata";
import { AUTHOR } from "./author";
import { reportPath } from "./reports";

export function intelligenceMetadata(path, title, description) {
  const url = siteUrl(path);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: socialOpenGraph({ url, siteName: "YouMine Intelligence" }),
  };
}

export function reportHead(report) {
  const headline = escapeHtml(report.title);
  const title = `${escapeHtml(report.searchTitle || report.title)} | YouMine Intelligence`;
  const description = escapeHtml(report.summary);
  const url = siteUrl(reportPath(report.slug));
  const shareImage = report.shareImage?.url
    ? {
        ...report.shareImage,
        url: new URL(report.shareImage.url, siteUrl("/")).href,
        alt: report.shareImage.alt || report.title,
      }
    : DEFAULT_SHARE_IMAGE;
  const image = escapeHtml(shareImage.url);
  const imageAlt = escapeHtml(shareImage.alt);
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
    ...(report.shareImage?.url && { image: shareImage.url }),
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
${shareImage.width ? `<meta property="og:image:width" content="${escapeHtml(shareImage.width)}">` : ""}
${shareImage.height ? `<meta property="og:image:height" content="${escapeHtml(shareImage.height)}">` : ""}
<meta property="og:image:alt" content="${imageAlt}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${headline}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
<meta name="twitter:image:alt" content="${imageAlt}">
${published ? `<meta property="article:published_time" content="${escapeHtml(published)}">
<meta property="article:modified_time" content="${escapeHtml(updated)}">
<script type="application/ld+json">${JSON.stringify(article).replace(/</g, "\\u003c")}</script>` : ""}`;
}
