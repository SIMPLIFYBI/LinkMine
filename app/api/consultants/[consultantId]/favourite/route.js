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

export async function POST(_req, ctx) {
  const sb = await supabaseFromCookies();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { consultantId } = await ctx.params; // await params

  const { error } = await sb.from("consultant_favourites").insert({
    user_id: user.id,
    consultant_id: consultantId,
  });

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req, ctx) {
  const sb = await supabaseFromCookies();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { consultantId } = await ctx.params; // await params

  const { error } = await sb
    .from("consultant_favourites")
    .delete()
    .eq("user_id", user.id)
    .eq("consultant_id", consultantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}