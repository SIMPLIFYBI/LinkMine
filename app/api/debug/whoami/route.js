export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export async function GET(req) {
  const authHeader = req.headers.get("authorization") || undefined;
  const headers = authHeader ? { Authorization: authHeader } : undefined;
  const sb = await supabaseServerClient({ headers });

  const { data: auth } = await sb.auth.getUser();
  const userId = auth?.user?.id || null;

  // Try a trivial DB call to see if PostgREST is using a JWT
  const { error: selectErr } = await sb
    .from("consultants")
    .select("id", { count: "exact", head: true })
    .limit(1);

  return NextResponse.json({
    userId,
    dbHasJwt: !selectErr || !/row-level security/.test(selectErr.message || ""),
    dbError: selectErr?.message ?? null,
  });
}