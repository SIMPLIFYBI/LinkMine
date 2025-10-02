export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabaseServer";

function userClient() {
  const jar = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { get: (n) => jar.get(n)?.value, set: (n, v, o) => jar.set({ name: n, value: v, ...o }), remove: (n, o) => jar.set({ name: n, value: "", ...o, expires: new Date(0) }) } }
  );
}

export async function PATCH(req, { params }) {
  const u = userClient();
  const a = supabaseServer();
  const { data: auth } = await u.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const patch = await req.json().catch(() => ({}));
  const allowed = ["title", "description", "location", "service_slug", "recipient_ids", "status"];
  const update = Object.fromEntries(Object.entries(patch).filter(([k, v]) => allowed.includes(k)));
  if (Object.keys(update).length === 0) return NextResponse.json({ ok: false, error: "No changes" }, { status: 400 });

  const { data, error } = await a
    .from("jobs")
    .update(update)
    .eq("id", params.id)
    .eq("created_by", user.id)
    .select("id, title, description, location, service_slug, recipient_ids, status, created_at")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, job: data });
}

export async function DELETE(_req, { params }) {
  const u = userClient();
  const a = supabaseServer();
  const { data: auth } = await u.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const { error } = await a.from("jobs").delete().eq("id", params.id).eq("created_by", user.id);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}