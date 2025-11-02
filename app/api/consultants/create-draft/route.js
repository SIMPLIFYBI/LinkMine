export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

const MAX_HEADLINE = 120;
const MAX_SERVICES = 15;

function slugify(s = "") {
  const base = s
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const rand = Math.random().toString(36).slice(2, 6);
  return base ? `${base}-${rand}` : `consultant-${rand}`;
}

export async function POST(req) {
  const sb = await supabaseServerClient();

  const { data: auth } = await sb.auth.getUser();
  const userId = auth?.user?.id || null;
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const display_name = String(body?.display_name || "").trim();
  const headline = String(body?.headline || "").trim();
  const location = String(body?.location || "").trim();
  const contact_email = String(body?.contact_email || "").trim();
  const services = Array.isArray(body?.services) ? body.services.slice(0, MAX_SERVICES) : [];

  if (!display_name) return NextResponse.json({ error: "Display name is required" }, { status: 400 });
  if (!headline) return NextResponse.json({ error: "Headline is required" }, { status: 400 });
  if (headline.length > MAX_HEADLINE) return NextResponse.json({ error: `Headline must be ${MAX_HEADLINE} characters or fewer` }, { status: 400 });
  if (!location) return NextResponse.json({ error: "Location is required" }, { status: 400 });
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email);
  if (!contact_email || !emailOk) return NextResponse.json({ error: "Valid contact email is required" }, { status: 400 });
  if (!services.length) return NextResponse.json({ error: "Select at least one service" }, { status: 400 });

  // Validate services against DB (trust but verify)
  const { data: validSvcs = [] } = await sb
    .from("services")
    .select("id")
    .in("id", services)
    .limit(MAX_SERVICES);
  const svcIds = (validSvcs || []).map((s) => s.id);
  if (!svcIds.length) return NextResponse.json({ error: "No valid services selected" }, { status: 400 });

  // Generate unique-ish slug
  let slug = slugify(display_name);
  const { data: existing } = await sb.from("consultants").select("id").eq("slug", slug).limit(1);
  if (existing && existing.length) slug = slugify(`${display_name}-${Date.now().toString(36).slice(4)}`);

  // Create consultant as pending + owned by user
  const { data: inserted, error } = await sb
    .from("consultants")
    .insert({
      display_name,
      headline,
      location,
      contact_email,
      visibility: "public", // still gated by status
      status: "pending",
      slug,
      claimed_by: userId,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message || "Create failed" }, { status: 400 });
  }

  // Attach services
  if (svcIds.length) {
    const rows = svcIds.map((service_id) => ({ consultant_id: inserted.id, service_id }));
    // Best effort insert; if it fails, still return the consultant id
    await sb.from("consultant_services").insert(rows);
  }

  return NextResponse.json({ id: inserted.id, ok: true });
}