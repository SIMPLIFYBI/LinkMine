import { supabaseServerClient } from "@/lib/supabaseServerClient";

export const runtime = "nodejs";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const from = url.searchParams.get("from"); // ISO
    const to = url.searchParams.get("to");     // ISO
    const includeCompleted = url.searchParams.get("includeCompleted") === "true";

    const now = new Date();
    const defaultFrom = now.toISOString();
    const defaultTo = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 180).toISOString(); // +180d

    const sb = await supabaseServerClient();

    let q = sb
      .from("training_sessions")
      .select(`
        id, starts_at, ends_at, timezone, delivery_method,
        location_name, suburb, state, country, join_url,
        capacity, price_cents, currency, gst_included, status,
        course:training_courses!inner (
          id, title, slug, summary, delivery_default, consultant_id,
          provider:consultants!inner ( id, display_name, slug )
        )
      `)
      .order("starts_at", { ascending: true })
      .limit(1000);

    // Status filter
    if (includeCompleted) {
      q = q.in("status", ["scheduled", "completed"]);
    } else {
      q = q.eq("status", "scheduled");
    }

    // Range filter
    q = q.gte("starts_at", from || defaultFrom);
    if (to) q = q.lte("starts_at", to);
    else q = q.lte("starts_at", defaultTo);

    const { data, error } = await q;

    if (error) {
      console.error("[training sessions] query error:", error);
      return new Response(JSON.stringify({ sessions: [], error: error.message }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const sessions = (data || []).map((s) => ({
      id: s.id,
      course_id: s.course?.id || null,
      course: s.course?.title || "Course",
      course_slug: s.course?.slug || null,
      course_summary: s.course?.summary || null,
      course_delivery_default: s.course?.delivery_default || null,

      provider_id: s.course?.provider?.id || null,
      provider: s.course?.provider?.display_name || "Provider",
      provider_slug: s.course?.provider?.slug || null,

      location:
        s.delivery_method === "online"
          ? "Online"
          : [s.location_name, s.suburb, s.state].filter(Boolean).join(", "),
      starts_at: s.starts_at,
      ends_at: s.ends_at,
      price_cents: s.price_cents,
      currency: s.currency || "AUD",
      delivery_method: s.delivery_method,
      timezone: s.timezone,
      status: s.status,
    }));

    return new Response(JSON.stringify({ sessions }), {
      status: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("[training sessions] unexpected error:", e);
    return new Response(JSON.stringify({ sessions: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}