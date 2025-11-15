import { supabasePublicServer } from "@/lib/supabasePublicServer";
import { siteUrl } from "@/lib/siteUrl";

export const revalidate = 60 * 60 * 24; // 24 hours

export default async function sitemap() {
  const sb = supabasePublicServer();

  // Core/static pages (add or remove as needed)
  const core = [
    "/",
    "/consultants",
    "/jobs",
    "/about",
    "/pricing",
    "/terms",
    "/privacy",
    // Landing pages you’ve created/linked
    "/landing/open-pit-engineering-mine-planning-consultants-australia",
    "/landing/mining-consultants-perth-western-australia",
    "/landing/mining-consultants-brisbane-queensland",
  ].map((p) => ({
    url: siteUrl(p),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Category listing URLs: /consultants?category=slug
  const { data: categories = [] } = await sb
    .from("service_categories")
    .select("slug, updated_at")
    .order("position", { ascending: true })
    .order("name", { ascending: true });

  const categoryUrls = categories
    .filter((c) => c?.slug)
    .map((c) => ({
      url: siteUrl(`/consultants?category=${encodeURIComponent(c.slug)}`),
      changeFrequency: "weekly",
      priority: 0.6,
      lastModified: c?.updated_at ? new Date(c.updated_at) : undefined,
    }));

  // Service listing URLs: /consultants?service=slug
  const { data: services = [] } = await sb
    .from("services")
    .select("slug, updated_at")
    .order("name", { ascending: true });

  const serviceUrls = services
    .filter((s) => s?.slug)
    .map((s) => ({
      url: siteUrl(`/consultants?service=${encodeURIComponent(s.slug)}`),
      changeFrequency: "weekly",
      priority: 0.6,
      lastModified: s?.updated_at ? new Date(s.updated_at) : undefined,
    }));

  // Individual consultant profiles (public + approved only)
  // Keep the select slim; cap at 5000 for now (easy to chunk later if needed)
  const { data: consultants = [] } = await sb
    .from("consultants")
    .select("id, updated_at, created_at, visibility, status")
    .eq("visibility", "public")
    .eq("status", "approved")
    .limit(5000);

  const profileUrls = consultants
    .filter((c) => c?.id)
    .map((c) => ({
      url: siteUrl(`/consultants/${c.id}`),
      lastModified: c?.updated_at
        ? new Date(c.updated_at)
        : c?.created_at
        ? new Date(c.created_at)
        : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  // Return a flat list (Next.js metadata route will serialize as XML)
  return [...core, ...categoryUrls, ...serviceUrls, ...profileUrls];
}