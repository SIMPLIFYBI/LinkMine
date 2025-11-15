import { getBaseUrl, siteUrl } from "@/lib/siteUrl";

export default function robots() {
  const host = getBaseUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Optionally disallow internal debug/admin paths:
      // disallow: ["/api/", "/debug/", "/admin/"],
    },
    sitemap: siteUrl("/sitemap.xml"),
    host,
  };
}