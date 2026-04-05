import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export const runtime = "nodejs";

export async function GET(req, { params }) {
  try {
    const p = await params;
    const id = p?.id;
    if (!id) return NextResponse.json({ isOwner: false, isAdmin: false, canEdit: false }, { status: 400 });

    const authz = req.headers.get("authorization") || undefined;
    const sb = await supabaseServerClient(authz ? { headers: { Authorization: authz } } : undefined);

    const { data: auth } = await sb.auth.getUser();
    const userId = auth?.user?.id || null;

    if (!userId) {
      return NextResponse.json({ isOwner: false, isAdmin: false, canEdit: false }, { status: 200 });
    }

    // Admin?
    const { data: adminRow, error: adminErr } = await sb
      .from("app_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (adminErr) {
      return NextResponse.json({ error: adminErr.message }, { status: 500 });
    }

    const isAdmin = !!adminRow;
    if (isAdmin) return NextResponse.json({ isOwner: false, isAdmin: true, canEdit: true }, { status: 200 });

    // Course consultant
    const { data: courseRow, error: courseErr } = await sb
      .from("training_courses")
      .select("id, consultant_id")
      .eq("id", id)
      .maybeSingle();

    if (courseErr) return NextResponse.json({ error: courseErr.message }, { status: 500 });
    if (!courseRow?.consultant_id) return NextResponse.json({ isOwner: false, isAdmin: false, canEdit: false }, { status: 200 });

    // Owner? (claimed consultant matches course consultant)
    const { data: owned, error: ownedErr } = await sb
      .from("consultants")
      .select("id")
      .eq("id", courseRow.consultant_id)
      .or(`user_id.eq.${userId},claimed_by.eq.${userId}`)
      .maybeSingle();

    if (ownedErr) return NextResponse.json({ error: ownedErr.message }, { status: 500 });

    const isOwner = !!owned;
    return NextResponse.json({ isOwner, isAdmin: false, canEdit: isOwner }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}