import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

async function supabaseFromCookies() {
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
  const { token } = await req.json().catch(() => ({}));
  if (!token)
    return NextResponse.json({ error: "Claim token missing." }, { status: 400 });

  const consultantId = params.consultantId;
  const sb = await supabaseFromCookies();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const { data: consultant, error } = await sb
    .from("consultants")
    .select("id, claim_token, claimed_by, claimed_at")
    .eq("id", consultantId)
    .maybeSingle();
  if (error || !consultant)
    return NextResponse.json({ error: "Consultant not found." }, { status: 404 });
  if (!consultant.claim_token || consultant.claim_token !== token)
    return NextResponse.json({ error: "Invalid or expired claim token." }, { status: 400 });
  if (consultant.claimed_by && consultant.claimed_by !== user.id)
    return NextResponse.json(
      { error: "Profile already claimed by another account." },
      { status: 409 }
    );

  const { error: updateError } = await sb
    .from("consultants")
    .update({
      claimed_by: user.id,
      claimed_at: new Date().toISOString(),
      claim_token: null,
    })
    .eq("id", consultant.id)
    .eq("claim_token", token);
  if (updateError)
    return NextResponse.json({ error: "Could not complete claim." }, { status: 500 });

  return NextResponse.json({ ok: true });
}