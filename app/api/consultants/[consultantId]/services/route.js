import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer"; // must use SERVICE_ROLE key

export async function GET(_req, { params }) {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("consultant_services")
    .select("services:service_id(id, name, slug, category_id)")
    .eq("consultant_id", params.consultantId);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, services: (data || []).map((r) => r.services) });
}

export async function POST(req, { params }) {
  const sb = supabaseServer(); // service role bypasses RLS
  const { service_id, service_slug } = await req.json().catch(() => ({}));

  let sid = service_id || null;
  if (!sid && service_slug) {
    const { data: svc, error } = await sb.from("services").select("id").eq("slug", service_slug).maybeSingle();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    if (!svc) return NextResponse.json({ ok: false, error: "Service not found" }, { status: 404 });
    sid = svc.id;
  }
  if (!sid) return NextResponse.json({ ok: false, error: "service_id or service_slug required" }, { status: 400 });

  // Insert; ignore duplicates to avoid UPDATE path
  const { error: insErr } = await sb
    .from("consultant_services")
    .upsert(
      { consultant_id: params.consultantId, service_id: sid },
      { onConflict: "consultant_id,service_id", ignoreDuplicates: true }
    );

  if (insErr) return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const sb = supabaseServer(); // service role
  const { searchParams } = new URL(req.url);
  let sid = searchParams.get("service_id");
  const slug = searchParams.get("service_slug");

  if (!sid && slug) {
    const { data: svc, error } = await sb.from("services").select("id").eq("slug", slug).maybeSingle();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    if (!svc) return NextResponse.json({ ok: false, error: "Service not found" }, { status: 404 });
    sid = svc.id;
  }
  if (!sid) return NextResponse.json({ ok: false, error: "service_id or service_slug required" }, { status: 400 });

  const { error: delErr } = await sb
    .from("consultant_services")
    .delete()
    .eq("consultant_id", params.consultantId)
    .eq("service_id", sid);

  if (delErr) return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}