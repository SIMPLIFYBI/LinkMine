import { NextResponse } from "next/server";
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

export async function PATCH(req, { params }) {
  try {
    const p = await params;
    const id = p?.id;
    if (!id) return NextResponse.json({ error: "Missing course id" }, { status: 400 });

    const sb = await supabaseServerClient();

    const { data: auth } = await sb.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Load course consultant_id for permission checks
    const { data: course, error: courseErr } = await sb
      .from("training_courses")
      .select("id, consultant_id")
      .eq("id", id)
      .maybeSingle();

    if (courseErr) return NextResponse.json({ error: courseErr.message }, { status: 500 });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const { data: adminRow } = await sb.from("app_admins").select("user_id").eq("user_id", userId).maybeSingle();
    const isAdmin = Boolean(adminRow);

    let canManage = isAdmin;
    if (!canManage) {
      const { data: ownerRow } = await sb
        .from("consultants")
        .select("id")
        .eq("id", course.consultant_id)
        .or(`user_id.eq.${userId},claimed_by.eq.${userId}`)
        .maybeSingle();
      canManage = Boolean(ownerRow);
    }

    if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));

    // Allowlist fields
    const patch = {};
    if (typeof body.title === "string") patch.title = body.title.trim();
    if (typeof body.summary === "string") patch.summary = body.summary.trim();
    if (typeof body.description === "string") patch.description = body.description.trim();
    if (typeof body.category === "string") patch.category = body.category;
    if (typeof body.level === "string") patch.level = body.level;
    if (typeof body.delivery_default === "string") patch.delivery_default = body.delivery_default;
    if (body.duration_hours != null) patch.duration_hours = Number(body.duration_hours);

    if (Array.isArray(body.tags)) {
      patch.tags = body.tags.map((t) => String(t).trim()).filter(Boolean);
    }

    if (!patch.title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    const { error: updErr } = await sb.from("training_courses").update(patch).eq("id", id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}