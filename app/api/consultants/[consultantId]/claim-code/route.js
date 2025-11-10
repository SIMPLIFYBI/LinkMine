export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeClaimCodeInput, tokenMatchesCode } from "@/lib/claimCode";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req, ctx) {
  const authHeader = req.headers.get("authorization") || "";
  const accessToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7)
    : null;

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Create a Supabase client that forwards the bearer token for RLS
  const sb = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  });

  // Resolve the user from the provided token explicitly
  const { data: userData, error: userErr } = await sb.auth.getUser(accessToken);
  const user = userData?.user || null;
  if (userErr || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { consultantId } = await ctx.params;
  const { code } = await req.json().catch(() => ({}));
  if (!consultantId || !code) {
    return NextResponse.json({ error: "Missing consultantId or code" }, { status: 400 });
  }

  const normalized = normalizeClaimCodeInput(code);
  if (normalized.length < 12) {
    return NextResponse.json({ error: "Invalid code format" }, { status: 400 });
  }

  const { data: c, error } = await sb
    .from("consultants")
    .select("id, claim_token, claimed_by, claimed_at")
    .eq("id", consultantId)
    .maybeSingle();

  if (error || !c) return NextResponse.json({ error: "Consultant not found" }, { status: 404 });
  if (c.claimed_by || c.claimed_at) return NextResponse.json({ error: "Already claimed" }, { status: 409 });
  if (!c.claim_token || !tokenMatchesCode(c.claim_token, normalized)) {
    return NextResponse.json({ error: "Code mismatch" }, { status: 400 });
  }

  const { error: upd } = await sb
    .from("consultants")
    .update({ claimed_by: user.id, claimed_at: new Date().toISOString(), claim_token: null })
    .eq("id", consultantId);

  if (upd) return NextResponse.json({ error: upd.message || "Claim failed" }, { status: 400 });
  return NextResponse.json({ ok: true });
}