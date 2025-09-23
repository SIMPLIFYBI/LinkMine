import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseServer } from "@/lib/supabaseServer";

function userClient() {
  const jar = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (n) => jar.get(n)?.value,
        set: (name, value, options) => jar.set({ name, value, ...options }),
        remove: (name, options) => jar.set({ name, value: "", ...options, expires: new Date(0) }),
      },
    }
  );
}

export async function GET() {
  const u = userClient();
  const a = supabaseServer(); // service role
  const { data: auth } = await u.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ ok: true, jobs: [] });
  const { data, error } = await a
    .from("jobs")
    .select("id, title, description, location, service_slug, consultant_ids, status, created_at")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, jobs: data || [] });
}

export async function POST(req) {
  const u = userClient();
  const a = supabaseServer(); // service role
  const { data: auth } = await u.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { title, description, location, service_slug, consultant_ids } = body || {};
  if (!title || !service_slug || !Array.isArray(consultant_ids) || consultant_ids.length === 0) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  const { data, error } = await a
    .from("jobs")
    .insert({
      created_by: user.id,
      title,
      description: description || null,
      location: location || null,
      service_slug,
      consultant_ids,
      status: "open",
    })
    .select("id, title, description, location, service_slug, consultant_ids, status, created_at")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, job: data });
}