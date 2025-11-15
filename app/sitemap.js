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
    "/landing/open-pit-engineering-mine-planning-consultants-australia",
    "/landing/mining-consultants-perth-western-australia",
    "/landing/mining-consultants-brisbane-queensland",
  ].map((p) => ({
    url: siteUrl(p),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  try {
    // Categories
    const categoriesRes = await sb
      .from("service_categories")
      .select("slug, updated_at")
      .order("position", { ascending: true })
      .order("name", { ascending: true });

    const categories = toArray(categoriesRes?.data);
    const categoryUrls = categories
      .filter((c) => c?.slug)
      .map((c) => ({
        url: siteUrl(`/consultants?category=${encodeURIComponent(c.slug)}`),
        changeFrequency: "weekly",
        priority: 0.6,
        lastModified: c?.updated_at ? new Date(c.updated_at) : undefined,
      }));

    // Services
    const servicesRes = await sb
      .from("services")
      .select("slug, updated_at")
      .order("name", { ascending: true });

    const services = toArray(servicesRes?.data);
    const serviceUrls = services
      .filter((s) => s?.slug)
      .map((s) => ({
        url: siteUrl(`/consultants?service=${encodeURIComponent(s.slug)}`),
        changeFrequency: "weekly",
        priority: 0.6,
        lastModified: s?.updated_at ? new Date(s.updated_at) : undefined,
      }));

    // Consultant profiles
    const consultantsRes = await sb
      .from("consultants")
      .select("id, updated_at, created_at, visibility, status")
      .eq("visibility", "public")
      .eq("status", "approved")
      .limit(5000);

    const consultants = toArray(consultantsRes?.data);
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

    return [...core, ...categoryUrls, ...serviceUrls, ...profileUrls];
  } catch {
    // If anything goes wrong (missing env, DB unreachable), emit core pages only
    return core;
  }
}