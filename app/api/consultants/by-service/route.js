export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req) {
  const sb = supabaseServer();
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("service") || searchParams.get("service_slug");
  if (!slug) return NextResponse.json({ ok: true, consultants: [] });

  const { data: svc, error: svcErr } = await sb.from("services").select("id, slug, name").eq("slug", slug).maybeSingle();
  if (svcErr) return NextResponse.json({ ok: false, error: svcErr.message }, { status: 500 });
  if (!svc) return NextResponse.json({ ok: true, consultants: [] });

  const { data: links, error: lErr } = await sb
    .from("consultant_services")
    .select("consultant_id")
    .eq("service_id", svc.id);
  if (lErr) return NextResponse.json({ ok: false, error: lErr.message }, { status: 500 });

  const ids = (links || []).map((r) => r.consultant_id);
  if (ids.length === 0) return NextResponse.json({ ok: true, consultants: [] });

  const { data: consultants, error: cErr } = await sb
    .from("consultants")
    .select("id, display_name, company, headline, location, contact_email, slug, visibility")
    .in("id", ids)
    .eq("visibility", "public")
    .order("display_name", { ascending: true });

  if (cErr) return NextResponse.json({ ok: false, error: cErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, consultants: consultants || [] });
}