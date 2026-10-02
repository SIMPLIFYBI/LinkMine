export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export async function DELETE(req) {
  const authorization = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const sb = await supabaseServerClient({ global: { headers: { Authorization: authorization } } });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

  const { data: adminRow } = await sb.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (!adminRow && !adminEmails.includes(user.email?.toLowerCase() || "")) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await sb
    .from("resource_payout_accounts")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", "stripe")
    .select("id");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, deleted: data?.length || 0 });
}