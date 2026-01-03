import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export const runtime = "nodejs";

export async function PATCH(req, { params }) {
  try {
    const p = await params;
    const id = p?.id;
    if (!id) return NextResponse.json({ error: "Missing session id" }, { status: 400 });

    const sb = await supabaseServerClient();
    const { data: auth } = await sb.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Load session + owning consultant via course
    const { data: row, error: rowErr } = await sb
      .from("training_sessions")
      .select("id, course_id, starts_at, ends_at, course:training_courses!inner(consultant_id)")
      .eq("id", id)
      .maybeSingle();

    if (rowErr) return NextResponse.json({ error: rowErr.message }, { status: 500 });
    if (!row) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    // Admin?
    const { data: adminRow } = await sb.from("app_admins").select("user_id").eq("user_id", userId).maybeSingle();
    const isAdmin = Boolean(adminRow);

    let canManage = isAdmin;
    if (!canManage) {
      const consultantId = row.course?.consultant_id;
      const { data: ownerRow } = await sb
        .from("consultants")
        .select("id")
        .eq("id", consultantId)
        .or(`user_id.eq.${userId},claimed_by.eq.${userId}`)
        .maybeSingle();
      canManage = Boolean(ownerRow);
    }

    if (!canManage) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));

    // Allowlist
    const patch = {};
    if (typeof body.timezone === "string") patch.timezone = body.timezone;
    if (typeof body.starts_at === "string") patch.starts_at = body.starts_at;
    if (typeof body.ends_at === "string") patch.ends_at = body.ends_at;
    if (typeof body.delivery_method === "string") patch.delivery_method = body.delivery_method;
    if (body.location_name !== undefined) patch.location_name = body.location_name;
    if (body.join_url !== undefined) patch.join_url = body.join_url;
    if (body.price_cents !== undefined) patch.price_cents = body.price_cents;
    if (typeof body.currency === "string") patch.currency = body.currency;

    // Validate time ordering (prevents training_sessions_time_check failures)
    const starts = new Date(patch.starts_at ?? row.starts_at);
    const ends = new Date(patch.ends_at ?? row.ends_at);
    if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime())) {
      return NextResponse.json({ error: "Invalid starts_at/ends_at" }, { status: 400 });
    }
    if (ends <= starts) {
      return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
    }

    const { error: updErr } = await sb.from("training_sessions").update(patch).eq("id", id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}