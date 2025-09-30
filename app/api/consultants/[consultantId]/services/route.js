export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseFromRequest } from "@/lib/supabaseRequestClient";

function getBearer(req) {
  const m = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

// List services
export async function GET(req, { params }) {
  try {
    const sb = supabaseFromRequest(req);
    const consultantId = params.consultantId;
    const { data: rows, error: e1 } = await sb
      .from("consultant_services")
      .select("service_id")
      .eq("consultant_id", consultantId);
    if (e1) return NextResponse.json({ ok: false, error: e1.message }, { status: 500 });

    const ids = (rows || []).map(r => r.service_id);
    if (!ids.length) return NextResponse.json({ ok: true, services: [] });

    const { data: services, error: e2 } = await sb
      .from("services")
      .select("id, name, slug")
      .in("id", ids);
    if (e2) return NextResponse.json({ ok: false, error: e2.message }, { status: 500 });
    return NextResponse.json({ ok: true, services: services || [] });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}

// Add services
export async function POST(req, { params }) {
  try {
    const sb = supabaseFromRequest(req);
    const token = getBearer(req);
    const { data: auth } = await sb.auth.getUser(token);
    if (!auth?.user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

    const consultantId = params.consultantId;
    const body = await req.json().catch(() => ({}));
    let add = Array.isArray(body.add)
      ? body.add
      : Array.isArray(body.service_ids)
      ? body.service_ids
      : body.service_id
      ? [body.service_id]
      : [];
    add = add.filter(Boolean);
    if (!add.length) return NextResponse.json({ ok: false, error: "No services to add" }, { status: 400 });

    const rows = add.map((sid) => ({ consultant_id: consultantId, service_id: sid }));
    const { error } = await sb
      .from("consultant_services")
      .upsert(rows, { onConflict: "consultant_id,service_id", ignoreDuplicates: true });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, added: add.length });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}

// Remove services
export async function DELETE(req, { params }) {
  try {
    const sb = supabaseFromRequest(req);
    const token = getBearer(req);
    const { data: auth } = await sb.auth.getUser(token);
    if (!auth?.user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

    const consultantId = params.consultantId;
    const body = await req.json().catch(() => ({}));
    let remove = Array.isArray(body.remove)
      ? body.remove
      : Array.isArray(body.service_ids)
      ? body.service_ids
      : body.service_id
      ? [body.service_id]
      : [];
    remove = remove.filter(Boolean);
    if (!remove.length) return NextResponse.json({ ok: false, error: "No services to remove" }, { status: 400 });

    const { error } = await sb.from("consultant_services").delete().eq("consultant_id", consultantId).in("service_id", remove);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, removed: remove.length });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}