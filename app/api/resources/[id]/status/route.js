export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import {
  buildResourceRoutePayload,
  cleanNullableText,
  cleanText,
  DEFAULT_RESOURCE_SELECT,
  getResourceAuthContext,
  isValidResourceStatus,
} from "@/lib/resourceHubServer";

export async function PATCH(req, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing resource id." }, { status: 400 });
  }

  const sb = await supabaseServerClient();
  const { user, isAdmin } = await getResourceAuthContext(sb);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const payload = await req.json().catch(() => ({}));
  const nextStatus = cleanText(payload.status);
  const rejectionNotes = cleanNullableText(payload.rejectionNotes);

  if (!isValidResourceStatus(nextStatus)) {
    return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 400 });
  }

  const { data: existing, error: selectError } = await sb
    .from("resources")
    .select("id, status, submitted_at")
    .eq("id", id)
    .maybeSingle();

  if (selectError) {
    return NextResponse.json({ ok: false, error: selectError.message }, { status: 400 });
  }

  if (!existing) {
    return NextResponse.json({ ok: false, error: "Resource not found." }, { status: 404 });
  }

  const now = new Date().toISOString();
  const updates = {
    status: nextStatus,
    submitted_at: nextStatus === "pending" ? existing.submitted_at || now : existing.submitted_at,
  };

  if (nextStatus === "approved") {
    updates.approved_at = now;
    updates.approved_by = user.id;
    updates.rejected_at = null;
    updates.rejection_notes = null;
  } else if (nextStatus === "rejected") {
    updates.rejected_at = now;
    updates.rejection_notes = rejectionNotes;
    updates.approved_at = null;
    updates.approved_by = null;
  } else if (nextStatus === "draft") {
    updates.approved_at = null;
    updates.approved_by = null;
    updates.rejected_at = null;
    updates.rejection_notes = null;
  }

  const { data, error } = await sb
    .from("resources")
    .update(updates)
    .eq("id", id)
    .select(DEFAULT_RESOURCE_SELECT)
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    resource: buildResourceRoutePayload(data, data.resource_tag_links || []),
  });
}
