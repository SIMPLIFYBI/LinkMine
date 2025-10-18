export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

async function sbFromCookies() {
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => jar.get(name)?.value,
        set() {},
        remove() {},
      },
    }
  );
}

export async function POST(req, { params }) {
  const sb = await sbFromCookies();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { token } = (await req.json().catch(() => ({}))) || {};
  const consultantId = params?.consultantId;
  if (!consultantId || !token)
    return NextResponse.json({ error: "Missing consultantId or token" }, { status: 400 });

  const { data: c, error } = await sb
    .from("consultants")
    .select("id, claim_token, claimed_by, claimed_at")
    .eq("id", consultantId)
    .maybeSingle();

  if (error || !c) return NextResponse.json({ error: "Consultant not found" }, { status: 404 });
  if (!c.claim_token || c.claim_token !== token)
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
  if (c.claimed_by || c.claimed_at)
    return NextResponse.json({ error: "Already claimed" }, { status: 409 });

  const { error: upd } = await sb
    .from("consultants")
    .update({ claimed_by: user.id, claimed_at: new Date().toISOString(), claim_token: null })
    .eq("id", consultantId);

  if (upd) return NextResponse.json({ error: upd.message || "Claim failed" }, { status: 400 });
  return NextResponse.json({ ok: true });
}