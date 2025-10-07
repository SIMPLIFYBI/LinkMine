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

export async function PATCH(req, context) {
  const { consultantId } = await context.params;
  const payload = await req.json().catch(() => ({}));

  const sb = await supabaseFromCookies();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const updates = {};
  if (typeof payload.headline === "string") {
    updates.headline = payload.headline.trim();
  }
  if (typeof payload.bio === "string") {
    updates.bio = payload.bio.trim();
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json(
      { error: "No changes supplied." },
      { status: 400 }
    );
  }

  const { error } = await sb
    .from("consultants")
    .update(updates)
    .eq("id", consultantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}