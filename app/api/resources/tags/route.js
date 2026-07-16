export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { cleanText, getResourceAuthContext, sanitizeSlug } from "@/lib/resourceHubServer";

export async function GET(req) {
  const sb = await supabaseServerClient();
  const url = new URL(req.url);
  const queryText = cleanText(url.searchParams.get("q")).toLowerCase();

  let query = sb
    .from("resource_tags")
    .select("id, name, slug")
    .order("name", { ascending: true })
    .limit(50);

  if (queryText) {
    query = query.or(`name.ilike.%${queryText}%,slug.ilike.%${queryText}%`);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, tags: data || [] });
}

export async function POST(req) {
  const sb = await supabaseServerClient();
  const { user, isAdmin } = await getResourceAuthContext(sb);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const payload = await req.json().catch(() => ({}));
  const name = cleanText(payload.name);
  const slug = sanitizeSlug(payload.slug || payload.name);

  if (!name) {
    return NextResponse.json({ ok: false, error: "Tag name is required." }, { status: 400 });
  }

  if (!slug) {
    return NextResponse.json({ ok: false, error: "Tag slug is required." }, { status: 400 });
  }

  const { data, error } = await sb
    .from("resource_tags")
    .insert({ name, slug })
    .select("id, name, slug")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, tag: data });
}
