export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { cleanText, getResourceAuthContext } from "@/lib/resourceHubServer";

export async function GET(_req, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing resource id." }, { status: 400 });
  }

  const sb = await supabaseServerClient();
  const adminSb = supabaseAdminClient();
  const { userId, isAdmin } = await getResourceAuthContext(sb);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const { data: resource, error: resourceError } = await sb
    .from("resources")
    .select("id, owner_user_id")
    .eq("id", id)
    .maybeSingle();

  if (resourceError) {
    return NextResponse.json({ ok: false, error: resourceError.message }, { status: 400 });
  }

  if (!resource) {
    return NextResponse.json({ ok: false, error: "Resource not found." }, { status: 404 });
  }

  if (resource.owner_user_id !== userId && !isAdmin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await adminSb
    .from("resource_entitlements")
    .select("id, user_id, resource_id, grant_source, granted_at, revoked_at, created_at")
    .eq("resource_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, entitlements: data || [] });
}

export async function POST(req, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing resource id." }, { status: 400 });
  }

  const sb = await supabaseServerClient();
  const adminSb = supabaseAdminClient();
  const { userId, isAdmin } = await getResourceAuthContext(sb);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const payload = await req.json().catch(() => ({}));
  const targetUserId = cleanText(payload.userId);
  const grantSource = cleanText(payload.grantSource) || "admin";

  if (!targetUserId) {
    return NextResponse.json({ ok: false, error: "userId is required." }, { status: 400 });
  }

  const { data, error } = await adminSb
    .from("resource_entitlements")
    .insert({
      user_id: targetUserId,
      resource_id: id,
      grant_source: grantSource,
      revoked_at: null,
    })
    .select("id, user_id, resource_id, grant_source, granted_at, revoked_at, created_at")
    .single();

  if (error && error.code !== "23505") {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  if (error && error.code === "23505") {
    return NextResponse.json({ ok: false, error: "Active entitlement already exists for this user." }, { status: 409 });
  }

  return NextResponse.json({ ok: true, entitlement: data }, { status: 201 });
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing resource id." }, { status: 400 });
  }

  const sb = await supabaseServerClient();
  const adminSb = supabaseAdminClient();
  const { userId, isAdmin } = await getResourceAuthContext(sb);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const payload = await req.json().catch(() => ({}));
  const targetUserId = cleanText(payload.userId);

  if (!targetUserId) {
    return NextResponse.json({ ok: false, error: "userId is required." }, { status: 400 });
  }

  const { data, error } = await adminSb
    .from("resource_entitlements")
    .update({ revoked_at: new Date().toISOString() })
    .eq("resource_id", id)
    .eq("user_id", targetUserId)
    .is("revoked_at", null)
    .select("id, user_id, resource_id, grant_source, granted_at, revoked_at, created_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ ok: false, error: "Active entitlement not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, entitlement: data });
}
