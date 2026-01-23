import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export const runtime = "nodejs";

export async function POST(req, { params }) {
  try {
    const p = await params;        // <-- IMPORTANT in your Next version
    const courseId = p?.id;        // <-- now safe
    if (!courseId) return NextResponse.json({ error: "Missing course id" }, { status: 400 });

    const body = await req.json().catch(() => ({}));
    const sessions = Array.isArray(body.sessions) ? body.sessions : [];
    if (sessions.length === 0) return NextResponse.json({ error: "No sessions provided" }, { status: 400 });

    // Basic time validation BEFORE insert (prevents DB constraint crashes)
    for (const s of sessions) {
      const a = new Date(s.starts_at);
      const b = new Date(s.ends_at);
      if (!s.starts_at || !s.ends_at || Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
        return NextResponse.json({ error: "Invalid starts_at/ends_at" }, { status: 400 });
      }
      if (b <= a) {
        return NextResponse.json(
          { error: "End time must be after start time." },
          { status: 400 }
        );
      }
    }

    const sb = await supabaseServerClient();

    const { data: auth } = await sb.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: course, error: courseErr } = await sb
      .from("training_courses")
      .select("id, consultant_id")
      .eq("id", courseId)
      .maybeSingle();

    if (courseErr) return NextResponse.json({ error: courseErr.message }, { status: 500 });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const { data: adminRow } = await sb
      .from("app_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
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

    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = sessions.map((s) => ({
      course_id: courseId,
      timezone: s.timezone || null,
      starts_at: s.starts_at,
      ends_at: s.ends_at,
      delivery_method: s.delivery_method || "in_person",
      location_name: s.location_name ?? null,
      join_url: s.join_url ?? null,
      status: s.status || "scheduled",
    }));

    const { error: insErr } = await sb.from("training_sessions").insert(rows);
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });

    return NextResponse.json({ ok: true, inserted: rows.length });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}