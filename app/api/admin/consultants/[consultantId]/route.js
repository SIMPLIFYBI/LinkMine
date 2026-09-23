import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

async function getAdminContext(req) {
  const sb = await supabaseServerClient();
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  let user = null;

  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const { data } = await sb.auth.getUser(authHeader.slice(7).trim());
    user = data?.user || null;
  }

  if (!user) {
    const { data } = await sb.auth.getUser();
    user = data?.user || null;
  }

  if (!user) return { ok: false, status: 401, error: "Not authenticated" };

  const [{ data: adminRow }, email] = await Promise.all([
    sb.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    Promise.resolve(user.email?.toLowerCase() || ""),
  ]);
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (!adminRow && !adminEmails.includes(email)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, sb };
}

export async function DELETE(req, { params }) {
  const { consultantId } = await params;
  const admin = await getAdminContext(req);
  if (!admin.ok) {
    return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });
  }

  const body = await req.json().catch(() => ({}));
  if (body?.confirm !== true) {
    return NextResponse.json({ ok: false, error: "Deletion confirmation is required." }, { status: 400 });
  }

  const { data: consultant, error: lookupError } = await admin.sb
    .from("consultants")
    .select("id")
    .eq("id", consultantId)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ ok: false, error: lookupError.message }, { status: 400 });
  }
  if (!consultant) {
    return NextResponse.json({ ok: false, error: "Consultant not found." }, { status: 404 });
  }

  const { error: deleteError } = await admin.sb.from("consultants").delete().eq("id", consultantId);
  if (deleteError) {
    if (deleteError.code === "23503") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This consultant cannot be deleted because related records still exist. Remove or reassign their associated data first.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ ok: false, error: deleteError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, deleted: true });
}