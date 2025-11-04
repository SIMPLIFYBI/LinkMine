export const runtime = "nodejs";

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
        get: (n) => jar.get(n)?.value,
        set: (n, v, o) => jar.set({ name: n, value: v, ...o }),
        remove: (n, o) => jar.delete({ name: n, ...o }),
      },
    }
  );
}

export async function POST(req) {
  const { access_token, refresh_token } = await req.json().catch(() => ({}));
  if (!access_token || !refresh_token) {
    return NextResponse.json({ ok: false, error: "Missing tokens" }, { status: 400 });
  }
  const sb = await sbFromCookies();
  const { data, error } = await sb.auth.setSession({ access_token, refresh_token });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
  return NextResponse.json({ ok: true, user: data.user ?? null });
}

export async function DELETE() {
  const sb = await sbFromCookies();
  await sb.auth.signOut();
  return NextResponse.json({ ok: true });
}