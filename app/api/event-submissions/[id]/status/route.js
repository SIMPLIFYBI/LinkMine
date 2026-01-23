import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export const runtime = "nodejs";

export async function PATCH(req, { params }) {
  try {
    const p = await params;
    const id = p?.id;
    if (!id) return NextResponse.json({ ok: false, error: "Missing submission id." }, { status: 400 });

    const authz = req.headers.get("authorization") || undefined;
    const sb = await supabaseServerClient(authz ? { headers: { Authorization: authz } } : undefined);

    const { data: auth, error: authErr } = await sb.auth.getUser();
    if (authErr) return NextResponse.json({ ok: false, error: authErr.message }, { status: 401 });

    const userId = auth?.user?.id;
    if (!userId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { data: adminRow, error: adminErr } = await sb
      .from("app_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (adminErr) return NextResponse.json({ ok: false, error: adminErr.message }, { status: 500 });
    if (!adminRow) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const status = String(body?.status || "").toLowerCase();
    const reviewNotes = typeof body?.review_notes === "string" ? body.review_notes : "";

    if (!["approved", "denied"].includes(status)) {
      return NextResponse.json({ ok: false, error: "Invalid status. Use 'approved' or 'denied'." }, { status: 400 });
    }

    const patch = {
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: userId,
      review_notes: reviewNotes,
    };

    const { error: upErr } = await sb.from("event_submissions").update(patch).eq("id", id);
    if (upErr) return NextResponse.json({ ok: false, error: upErr.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e?.message || "Server error" }, { status: 500 });
  }
}