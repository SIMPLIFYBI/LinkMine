export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export async function POST(req, { params }) {
  const { consultantId } = await params;
  const sb = await supabaseServerClient();

  const { data: auth } = await sb.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: consultant } = await sb
    .from("consultants")
    .select("id, claimed_by")
    .eq("id", consultantId)
    .maybeSingle();
  if (!consultant || consultant.claimed_by !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { path } = await req.json();
  if (!path || typeof path !== "string") {
    return NextResponse.json({ error: "Missing path" }, { status: 400 });
  }

  const expectedPrefix = `users/${userId}/consultants/${consultantId}/`;
  if (!path.startsWith(expectedPrefix)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const { error: delErr } = await sb.storage.from("portfolio").remove([path]);
  if (delErr) {
    return NextResponse.json({ error: delErr.message || "Delete failed" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}