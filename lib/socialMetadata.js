import { siteUrl } from "./siteUrl";

export const SITE_TITLE = "YouMine | Mining and Oil & Gas";
export const SITE_DESCRIPTION =
  "Find consultants, jobs, training, events, digital resources and industry analysis for mining and oil & gas on YouMine.";

export const DEFAULT_SHARE_IMAGE = {
  // Crawlers can retain a cached response for the previous image URL.
  url: siteUrl("/og-image.png?v=2"),
  width: 1200,
  height: 630,
  alt: "YouMine | Mining and oil & gas",
};

export function socialOpenGraph({ image = DEFAULT_SHARE_IMAGE, ...metadata } = {}) {
  return {
    siteName: "YouMine",
    type: "website",
    ...metadata,
    images: [image],
  };
}
