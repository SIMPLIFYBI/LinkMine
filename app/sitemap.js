import { supabasePublicServer } from "@/lib/supabasePublicServer";
import { siteUrl } from "@/lib/siteUrl";

export const revalidate = 86400; // 24h

const toArray = (v) => (Array.isArray(v) ? v : []);

export default async function sitemap() {
  const sb = supabasePublicServer();

  const core = [
    "/",
    "/consultants",
    "/jobs",
    "/about",
    "/pricing",
    "/terms",
    "/privacy",
    // Hand-authored landing pages are good to keep:
    "/landing/open-pit-engineering-mine-planning-consultants-australia",
    "/landing/mining-consultants-perth-western-australia",
    "/landing/mining-consultants-brisbane-queensland",
  ].map((p) => ({
    url: siteUrl(p),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  try {
    // Consultant profiles (public + approved)
    const consultantsRes = await sb
      .from("consultants")
      .select("id, slug, updated_at, created_at, visibility, status")
      .eq("visibility", "public")
      .eq("status", "approved")
      .limit(5000);

    const consultants = toArray(consultantsRes?.data);
    const profileUrls = consultants
      .filter((c) => c?.id)
      .map((c) => {
        const handle = c?.slug || c.id;
        return {
          url: siteUrl(`/consultants/${encodeURIComponent(handle)}`),
          lastModified: c?.updated_at
            ? new Date(c.updated_at)
            : c?.created_at
            ? new Date(c.created_at)
            : undefined,
          changeFrequency: "weekly",
          priority: 0.8,
        };
      });

    // Note: we intentionally exclude service/category query-param URLs from the sitemap
    // to avoid faceted duplication. Keep /landing/* pages for indexable category pages.

    return [...core, ...profileUrls];
  } catch {
    // Fallback to core pages only if DB access fails
    return core;
  }
}