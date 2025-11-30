import { supabaseServerClient } from "@/lib/supabaseServerClient";

export const runtime = "nodejs";

function pickLogo(meta) {
  try {
    if (!meta) return null;
    if (meta.logo_url) return meta.logo_url;
    if (meta.logo) return meta.logo;
    if (meta.brand?.logo_url) return meta.brand.logo_url;
    if (meta.brand?.logo) return meta.brand.logo;
    if (meta.assets?.logo_url) return meta.assets.logo_url;
    if (meta.images?.logo_url) return meta.images.logo_url;
    if (meta.images?.logo) return meta.images.logo;
    return null;
  } catch {
    return null;
  }
}

function pickLogoUrl(meta) {
  try {
    if (!meta) return null;
    // Common shapes
    if (typeof meta.logo === "string") return meta.logo;
    if (meta.logo?.url) return meta.logo.url;
    if (meta.brand?.logo?.url) return meta.brand.logo.url;
    if (meta.images?.logo?.url) return meta.images.logo.url;
    if (meta.logo_url) return meta.logo_url;
    return null;
  } catch {
    return null;
  }
}

export async function GET(_req, { params }) {
  try {
    const p = await params;
    const id = p.id;

    const sb = await supabaseServerClient();

    const { data, error } = await sb
      .from("training_courses")
      .select(`
        id, title, slug, summary, description, category, tags, level,
        duration_hours, delivery_default, status,
        consultant:consultants!inner (
          id, display_name, slug, metadata
        ),
        sessions:training_sessions (
          id, starts_at, ends_at, timezone, delivery_method,
          location_name, suburb, state, country,
          price_cents, currency, gst_included, status
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return new Response(JSON.stringify({ error: error?.message || "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sessions = (data.sessions || [])
      .filter((s) => s.status === "scheduled")
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

    const c = data.consultant || {};
    const logo_url = pickLogoUrl(c.metadata);

    return new Response(
      JSON.stringify({
        id: data.id,
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        description: data.description,
        category: data.category,
        tags: data.tags,
        level: data.level,
        duration_hours: data.duration_hours,
        delivery_default: data.delivery_default,
        status: data.status,
        consultant: {
          id: c.id,
          display_name: c.display_name,
          slug: c.slug,
          logo_url,
        },
        sessions,
      }),
      { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}