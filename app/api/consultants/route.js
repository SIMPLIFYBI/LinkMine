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
  const authHeader = req.headers.get("authorization") || "";
  const token =
    authHeader && authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7)
      : "";

  if (!token) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await sb.auth.getUser(token);

  if (authError) {
    return NextResponse.json({ ok: false, error: authError.message }, { status: 401 });
  }

  const payload = await req.json().catch(() => ({}));
  const insert = {
    display_name: payload.display_name?.trim(),
    company: payload.company?.trim() || null,
    headline: payload.headline?.trim() || null,
    location: payload.location?.trim() || null,
    contact_email: payload.contact_email?.trim() || null,
    visibility: payload.visibility || "public",
    status: "pending",
  };

  const { data, error } = await sb
    .from("consultants")
    .insert([{ ...insert, claimed_by: user.id }])
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: "Thanks! Your consultancy has been submitted for review. We’ll notify you once it’s approved.",
    id: data.id,
  });
}

