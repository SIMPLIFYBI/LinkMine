import { supabasePublicServer } from "@/lib/supabasePublicServer";
import { siteUrl } from "@/lib/siteUrl";
import { landingPages } from "@/app/landing/registry";

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
    "/landing",
  ].map((p) => ({
    url: siteUrl(p),
    changefreq: "weekly",
    priority: 0.7,
  }));

  const landingEntries = landingPages.map((page) => ({
    url: siteUrl(`/landing/${page.slug}`),
    changefreq: "weekly",
    priority: 0.7,
  }));

  const [{ data: consultants = [] }, { data: jobs = [] }] = await Promise.all([
    sb
      .from("consultants")
      .select("id")
      .eq("visibility", "public")
      .eq("status", "approved"),
    sb
      .from("jobs")
      .select("id, created_at")
      .or("listing_type.eq.Public,listing_type.eq.Both")
      .eq("status", "open"),
  ]);

  const consultantEntries = consultants.map((consultant) => ({
    url: siteUrl(`/consultants/${consultant.id}`),
    changefreq: "weekly",
    priority: 0.6,
  }));

  const jobEntries = jobs.map((job) => ({
    url: siteUrl(`/jobs/${job.id}`),
    ...(job.created_at ? { lastModified: new Date(job.created_at) } : {}),
    changefreq: "daily",
    priority: 0.6,
  }));

  return [...core, ...landingEntries, ...consultantEntries, ...jobEntries];
}