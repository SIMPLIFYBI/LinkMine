export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function sbFromCookies() {
  const jar = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (n) => jar.get(n)?.value,
        set: (n, v, o) => jar.set({ name: n, value: v, ...o }),
        remove: (n, o) => jar.set({ name: n, value: "", ...o, expires: new Date(0) }),
      },
    }
  );
}

export async function POST(req) {
  const { access_token, refresh_token } = await req.json().catch(() => ({}));
  if (!access_token || !refresh_token) {
    return NextResponse.json({ ok: false, error: "Missing tokens" }, { status: 400 });
  }
  const sb = sbFromCookies();
  const { data, error } = await sb.auth.setSession({ access_token, refresh_token });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
  return NextResponse.json({ ok: true, user: data.user ?? null });
}

export async function DELETE() {
  const sb = sbFromCookies();
  await sb.auth.signOut();
  return NextResponse.json({ ok: true });
}