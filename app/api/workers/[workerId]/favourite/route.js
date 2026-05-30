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

async function getUserOrUnauthorized(sb) {
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }

  return { user, response: null };
}

export async function GET(_req, ctx) {
  const sb = await supabaseFromCookies();
  const { user, response } = await getUserOrUnauthorized(sb);
  if (response) return response;

  const { workerId } = await ctx.params;
  const { data, error } = await sb
    .from("worker_favourites")
    .select("worker_id")
    .eq("user_id", user.id)
    .eq("worker_id", workerId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ favourite: Boolean(data) });
}

export async function POST(_req, ctx) {
  const sb = await supabaseFromCookies();
  const { user, response } = await getUserOrUnauthorized(sb);
  if (response) return response;

  const { workerId } = await ctx.params;
  const { error } = await sb.from("worker_favourites").insert({
    user_id: user.id,
    worker_id: workerId,
  });

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req, ctx) {
  const sb = await supabaseFromCookies();
  const { user, response } = await getUserOrUnauthorized(sb);
  if (response) return response;

  const { workerId } = await ctx.params;
  const { error } = await sb
    .from("worker_favourites")
    .delete()
    .eq("user_id", user.id)
    .eq("worker_id", workerId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}