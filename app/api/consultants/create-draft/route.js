export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { sendNewConsultancyNotification } from "@/lib/emails/sendNewConsultancy";

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
  const authHeader = req.headers.get("authorization") || undefined;
  const headers = authHeader ? { Authorization: authHeader } : undefined;
  const sb = await supabaseServerClient({ headers });

  // Auth
  const { data: auth } = await sb.auth.getUser();
  const userId = auth?.user?.id || null;
  if (!userId) {
    return NextResponse.json({ stage: "auth", error: "Not authenticated" }, { status: 401 });
  }

  // Parse + validate
  const body = await req.json().catch(() => ({}));
  const display_name = String(body?.display_name || "").trim();
  const headline = String(body?.headline || "").trim();
  const location = String(body?.location || "").trim();
  const contact_email = String(body?.contact_email || "").trim();
  const services = Array.isArray(body?.services) ? body.services.slice(0, MAX_SERVICES) : [];

  if (!display_name) return NextResponse.json({ stage: "validate", error: "Display name is required" }, { status: 400 });
  if (!headline) return NextResponse.json({ stage: "validate", error: "Headline is required" }, { status: 400 });
  if (headline.length > MAX_HEADLINE) return NextResponse.json({ stage: "validate", error: `Headline must be ${MAX_HEADLINE} characters or fewer` }, { status: 400 });
  if (!location) return NextResponse.json({ stage: "validate", error: "Location is required" }, { status: 400 });
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email);
  if (!contact_email || !emailOk) return NextResponse.json({ stage: "validate", error: "Valid contact email is required" }, { status: 400 });
  if (!services.length) return NextResponse.json({ stage: "validate", error: "Select at least one service" }, { status: 400 });

  // Validate services exist
  const { data: validSvcs = [], error: svcErr } = await sb
    .from("services")
    .select("id")
    .in("id", services)
    .limit(MAX_SERVICES);

  if (svcErr) {
    return NextResponse.json({ stage: "services-validate", error: svcErr.message, code: svcErr.code, details: svcErr.details, hint: svcErr.hint }, { status: 400 });
  }

  const svcIds = (validSvcs || []).map((s) => s.id);
  if (!svcIds.length) return NextResponse.json({ stage: "services-validate", error: "No valid services selected" }, { status: 400 });

  // Slug
  let slug = slugify(display_name);
  const { data: existing, error: existErr } = await sb
    .from("consultants")
    .select("id")
    .eq("slug", slug)
    .limit(1);

  if (existErr) {
    return NextResponse.json({ stage: "slug-check", error: existErr.message, code: existErr.code, details: existErr.details, hint: existErr.hint }, { status: 400 });
  }
  if (existing && existing.length) slug = slugify(`${display_name}-${Date.now().toString(36).slice(4)}`);

  // INSERT consultant — keep this minimal to satisfy RLS with-check
  const insertPayload = {
    display_name,
    headline,
    location,
    contact_email,
    slug,
    claimed_by: userId,
    company: display_name, // NEW: seed company same as display name
  };

  const { data: inserted, error: insErr } = await sb
    .from("consultants")
    .insert(insertPayload)
    .select("id")
    .single();

  if (insErr) {
    return NextResponse.json({
      stage: "consultants-insert",
      error: insErr.message,
      code: insErr.code,
      details: insErr.details,
      hint: insErr.hint,
      payloadKeys: Object.keys(insertPayload),
    }, { status: 400 });
  }

  // Attach services
  if (svcIds.length) {
    const rows = svcIds.map((service_id) => ({ consultant_id: inserted.id, service_id }));
    const { error: joinErr } = await sb.from("consultant_services").insert(rows);
    if (joinErr) {
      return NextResponse.json({
        id: inserted.id,
        ok: true,
        stage: "consultant-services-insert",
        joinError: joinErr.message,
        joinCode: joinErr.code,
        joinDetails: joinErr.details,
        joinHint: joinErr.hint,
      });
    }
  }

  // ADD THIS: Send admin notification (fire-and-forget)
  console.log("[create-draft] created:", inserted?.id, "— sending admin notification…");
  sendNewConsultancyNotification({
    consultancy: { ...inserted, display_name, headline, location, contact_email },
    createdBy: { email: contact_email, name: display_name },
  })
    .then(() => console.log("[create-draft] admin notified"))
    .catch((err) => console.error("[create-draft] notify error:", err));

  return NextResponse.json({ id: inserted.id, ok: true });
}