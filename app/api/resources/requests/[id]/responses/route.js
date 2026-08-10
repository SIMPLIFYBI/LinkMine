export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { cleanNullableText, cleanText, getResourceAuthContext } from "@/lib/resourceHubServer";

function mapResponseRow(row) {
  return {
    id: row.id,
    requestId: row.request_id,
    responderUserId: row.responder_user_id,
    resourceId: row.resource_id,
    resourceTitle: row.resource?.title || "",
    resourceStatus: row.resource?.status || "",
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    acceptedAt: row.accepted_at,
    rejectedAt: row.rejected_at,
    withdrawnAt: row.withdrawn_at,
  };
}

export async function GET(_req, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing request id." }, { status: 400 });
  }

  const sb = await supabaseServerClient();
  const { userId, isAdmin } = await getResourceAuthContext(sb);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const { data: requestRow, error: requestError } = await sb
    .from("resource_requests")
    .select("id, requester_user_id")
    .eq("id", id)
    .maybeSingle();

  if (requestError) {
    return NextResponse.json({ ok: false, error: requestError.message }, { status: 400 });
  }

  if (!requestRow) {
    return NextResponse.json({ ok: false, error: "Request not found." }, { status: 404 });
  }

  const canViewAll = isAdmin || requestRow.requester_user_id === userId;

  let query = sb
    .from("resource_request_responses")
    .select("id, request_id, responder_user_id, resource_id, message, status, created_at, updated_at, accepted_at, rejected_at, withdrawn_at, resource:resources(id, title, status)")
    .eq("request_id", id)
    .order("created_at", { ascending: false });

  if (!canViewAll) {
    query = query.eq("responder_user_id", userId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    responses: (data || []).map(mapResponseRow),
  });
}

export async function POST(req, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing request id." }, { status: 400 });
  }

  const sb = await supabaseServerClient();
  const { userId, isAdmin } = await getResourceAuthContext(sb);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const payload = await req.json().catch(() => ({}));
  const resourceId = cleanText(payload.resourceId);
  const message = cleanNullableText(payload.message);

  if (!resourceId) {
    return NextResponse.json({ ok: false, error: "resourceId is required." }, { status: 400 });
  }

  const { data: requestRow, error: requestError } = await sb
    .from("resource_requests")
    .select("id, requester_user_id, status")
    .eq("id", id)
    .maybeSingle();

  if (requestError) {
    return NextResponse.json({ ok: false, error: requestError.message }, { status: 400 });
  }

  if (!requestRow) {
    return NextResponse.json({ ok: false, error: "Request not found." }, { status: 404 });
  }

  if (requestRow.status === "completed" || requestRow.status === "cancelled") {
    return NextResponse.json({ ok: false, error: "This request is closed." }, { status: 400 });
  }

  if (requestRow.requester_user_id === userId && !isAdmin) {
    return NextResponse.json({ ok: false, error: "You cannot respond to your own request." }, { status: 403 });
  }

  const { data: resourceRow, error: resourceError } = await sb
    .from("resources")
    .select("id, owner_user_id")
    .eq("id", resourceId)
    .maybeSingle();

  if (resourceError) {
    return NextResponse.json({ ok: false, error: resourceError.message }, { status: 400 });
  }

  if (!resourceRow) {
    return NextResponse.json({ ok: false, error: "Resource not found." }, { status: 404 });
  }

  if (resourceRow.owner_user_id !== userId && !isAdmin) {
    return NextResponse.json({ ok: false, error: "You can only respond with your own resource." }, { status: 403 });
  }

  const { data, error } = await sb
    .from("resource_request_responses")
    .insert({
      request_id: id,
      responder_user_id: userId,
      resource_id: resourceId,
      message,
      status: "submitted",
    })
    .select("id, request_id, responder_user_id, resource_id, message, status, created_at, updated_at, accepted_at, rejected_at, withdrawn_at, resource:resources(id, title, status)")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ ok: false, error: "You already have an active response for this request." }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, response: mapResponseRow(data) }, { status: 201 });
}
