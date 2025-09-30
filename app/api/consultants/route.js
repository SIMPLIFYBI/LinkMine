export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseFromAuthHeader(req) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const auth = req.headers.get("authorization") || "";
  if (!url || !anon) throw new Error("Missing Supabase anon env vars");
  return createClient(url, anon, {
    global: { headers: auth ? { Authorization: auth } : {} },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function slugify(s) {
  return String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

export async function POST(req) {
  const sb = supabaseFromAuthHeader(req);
  if (!req.headers.get("authorization")) {
    return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { display_name, company = null, headline = null, location = null, contact_email = null, visibility = "public" } =
    body || {};
  if (!display_name) return NextResponse.json({ ok: false, error: "display_name is required" }, { status: 400 });

  let base = slugify(display_name || company) || `consultant-${Math.random().toString(36).slice(2, 7)}`;
  let slug = base;
  for (let i = 1; i <= 20; i++) {
    const { data: existing, error } = await sb.from("consultants").select("id").eq("slug", slug).maybeSingle();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    if (!existing) break;
    slug = `${base}-${i + 1}`;
  }

  const { data, error } = await sb
    .from("consultants")
    .insert({ display_name, company, headline, location, contact_email, slug, visibility })
    .select("id, display_name, company, headline, location, contact_email, slug, visibility")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, consultant: data }, { status: 201 });
}

