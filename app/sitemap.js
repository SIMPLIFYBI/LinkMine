import { supabasePublicServer } from "@/lib/supabasePublicServer";
import { siteUrl } from "@/lib/siteUrl";

export const revalidate = 86400; // 24h

export default async function sitemap() {
  const sb = supabasePublicServer();

  const core = [
    "/",
    "/consultants",
    "/jobs",
    "/about",
    "/terms",
    "/privacy",
    "/landing/open-pit-engineering-mine-planning-consultants-australia",
    "/landing/mining-consultants-perth-western-australia",
    "/landing/mining-consultants-brisbane-queensland",
    "/landing/mine-engineering-planning-consultants-australia", // added
    "/landing/geotechnical-consultants-wa",                     // added
  ].map((p) => ({
    url: siteUrl(p),
    changefreq: "weekly",
    priority: 0.7,
  }));

  return core;
}