import { supabaseServerClient } from "@/lib/supabaseServerClient";

export const runtime = "nodejs";

function slugify(s = "") {
  return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "").slice(0, 80);
}

export async function POST(req, { params }) {
  try {
    const p = await params;
    const consultantId = p.consultantId;

    const payload = await req.json();
    const title = String(payload?.title || "").trim();
    if (!title) {
      return new Response(JSON.stringify({ error: "Title is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const course = {
      consultant_id: consultantId,
      title,
      slug: slugify(title),
      summary: payload?.summary ?? null,
      description: payload?.description ?? null,
      category: payload?.category ?? null,
      tags: Array.isArray(payload?.tags) ? payload.tags : [],
      level: payload?.level ?? null,
      duration_hours: typeof payload?.duration_hours === "number" ? payload.duration_hours : null,
      delivery_default: payload?.delivery_default ?? null,
      status: "published",
    };

    const sb = await supabaseServerClient();

    // Create course
    const { data: courseRow, error: courseErr } = await sb
      .from("training_courses")
      .insert([course])
      .select("id")
      .single();

    if (courseErr) {
      const code = courseErr.code === "42501" ? 403 : 400;
      return new Response(JSON.stringify({ error: courseErr.message }), { status: code, headers: { "Content-Type": "application/json" } });
    }

    const courseId = courseRow.id;

    // Sessions: support 'session' (single) and 'sessions' (array)
    const sessionList = Array.isArray(payload?.sessions)
      ? payload.sessions
      : payload?.session
      ? [payload.session]
      : [];

    if (sessionList.length > 0) {
      const rows = [];
      for (const s of sessionList) {
        if (!s?.starts_at || !s?.ends_at || new Date(s.ends_at) <= new Date(s.starts_at)) {
          await sb.from("training_courses").delete().eq("id", courseId);
          return new Response(JSON.stringify({ error: "Invalid session times" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        if (!["in_person", "online", "hybrid"].includes(s.delivery_method)) {
          await sb.from("training_courses").delete().eq("id", courseId);
          return new Response(JSON.stringify({ error: "Invalid delivery_method" }), { status: 400, headers: { "Content-Type": "application/json" } });
        }
        rows.push({
          course_id: courseId,
          starts_at: s.starts_at,
          ends_at: s.ends_at,
          timezone: s.timezone ?? null,
          delivery_method: s.delivery_method,
          location_name: s.location_name ?? null,
          suburb: s.suburb ?? null,
          state: s.state ?? null,
          country: s.country ?? "AU",
          join_url: s.join_url ?? null,
          capacity: s.capacity ?? null,
          price_cents: s.price_cents ?? null,
          currency: s.currency ?? "AUD",
          gst_included: s.gst_included ?? true,
          status: s.status ?? "scheduled",
          notes: null,
          metadata: {},
        });
      }

      // One statement -> if any row fails, none are inserted
      const { error: sessErr } = await sb.from("training_sessions").insert(rows);
      if (sessErr) {
        await sb.from("training_courses").delete().eq("id", courseId);
        const code = sessErr.code === "42501" ? 403 : 400;
        return new Response(JSON.stringify({ error: sessErr.message }), { status: code, headers: { "Content-Type": "application/json" } });
      }
    }

    return new Response(JSON.stringify({ id: courseId }), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Unexpected error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}