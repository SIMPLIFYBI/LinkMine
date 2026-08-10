export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { cleanText, getResourceAuthContext } from "@/lib/resourceHubServer";

function mapResponseRow(row) {
  return {
    id: row.id,
    requestId: row.request_id,
    responderUserId: row.responder_user_id,
    resourceId: row.resource_id,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    acceptedAt: row.accepted_at,
    rejectedAt: row.rejected_at,
    withdrawnAt: row.withdrawn_at,
  };
}

export async function PATCH(req, { params }) {
  const { id, responseId } = await params;
  if (!id || !responseId) {
    return NextResponse.json({ ok: false, error: "Missing request or response id." }, { status: 400 });
  }

  const sb = await supabaseServerClient();
  const adminSb = supabaseAdminClient();
  const { userId, isAdmin } = await getResourceAuthContext(sb);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const { data: requestRow, error: requestError } = await sb
    .from("resource_requests")
    .select("id, requester_user_id, status, accepted_response_id")
    .eq("id", id)
    .maybeSingle();

  if (requestError) {
    return NextResponse.json({ ok: false, error: requestError.message }, { status: 400 });
  }

  if (!requestRow) {
    return NextResponse.json({ ok: false, error: "Request not found." }, { status: 404 });
  }

  const { data: responseRow, error: responseError } = await sb
    .from("resource_request_responses")
    .select("id, request_id, responder_user_id, resource_id, status, message, created_at, updated_at, accepted_at, rejected_at, withdrawn_at")
    .eq("id", responseId)
    .eq("request_id", id)
    .maybeSingle();

  if (responseError) {
    return NextResponse.json({ ok: false, error: responseError.message }, { status: 400 });
  }

  if (!responseRow) {
    return NextResponse.json({ ok: false, error: "Response not found." }, { status: 404 });
  }

  const payload = await req.json().catch(() => ({}));
  const action = cleanText(payload.action);

  if (!action) {
    return NextResponse.json({ ok: false, error: "action is required." }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const isRequester = requestRow.requester_user_id === userId;
  const isResponder = responseRow.responder_user_id === userId;

  if (action === "withdraw") {
    if (!isResponder && !isAdmin) {
      return NextResponse.json({ ok: false, error: "Only the responder can withdraw this response." }, { status: 403 });
    }

    if (responseRow.status === "accepted") {
      return NextResponse.json({ ok: false, error: "Accepted responses cannot be withdrawn." }, { status: 400 });
    }

    const { data, error } = await sb
      .from("resource_request_responses")
      .update({ status: "withdrawn", withdrawn_at: nowIso })
      .eq("id", responseId)
      .select("id, request_id, responder_user_id, resource_id, status, message, created_at, updated_at, accepted_at, rejected_at, withdrawn_at")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, response: mapResponseRow(data) });
  }

  if (action === "reject") {
    if (!isRequester && !isAdmin) {
      return NextResponse.json({ ok: false, error: "Only the requester can reject responses." }, { status: 403 });
    }

    const { data, error } = await sb
      .from("resource_request_responses")
      .update({ status: "rejected", rejected_at: nowIso })
      .eq("id", responseId)
      .select("id, request_id, responder_user_id, resource_id, status, message, created_at, updated_at, accepted_at, rejected_at, withdrawn_at")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, response: mapResponseRow(data) });
  }

  if (action === "accept") {
    if (!isRequester && !isAdmin) {
      return NextResponse.json({ ok: false, error: "Only the requester can accept responses." }, { status: 403 });
    }

    if (requestRow.status === "cancelled") {
      return NextResponse.json({ ok: false, error: "Cancelled requests cannot accept responses." }, { status: 400 });
    }

    if (responseRow.status !== "submitted") {
      return NextResponse.json({ ok: false, error: "Only submitted responses can be accepted." }, { status: 400 });
    }

    const { error: rejectOtherError } = await sb
      .from("resource_request_responses")
      .update({ status: "rejected", rejected_at: nowIso })
      .eq("request_id", id)
      .eq("status", "submitted")
      .neq("id", responseId);

    if (rejectOtherError) {
      return NextResponse.json({ ok: false, error: rejectOtherError.message }, { status: 400 });
    }

    const { data: acceptedResponse, error: acceptError } = await sb
      .from("resource_request_responses")
      .update({ status: "accepted", accepted_at: nowIso, rejected_at: null, withdrawn_at: null })
      .eq("id", responseId)
      .select("id, request_id, responder_user_id, resource_id, status, message, created_at, updated_at, accepted_at, rejected_at, withdrawn_at")
      .single();

    if (acceptError) {
      return NextResponse.json({ ok: false, error: acceptError.message }, { status: 400 });
    }

    const { data: updatedRequest, error: requestUpdateError } = await sb
      .from("resource_requests")
      .update({
        accepted_response_id: acceptedResponse.id,
        fulfiller_user_id: acceptedResponse.responder_user_id,
        fulfilled_resource_id: acceptedResponse.resource_id,
        status: "completed",
        claimed_at: nowIso,
        completed_at: nowIso,
      })
      .eq("id", id)
      .select("id, requester_user_id, fulfilled_resource_id, status")
      .single();

    if (requestUpdateError) {
      return NextResponse.json({ ok: false, error: requestUpdateError.message }, { status: 400 });
    }

    if (updatedRequest.fulfilled_resource_id) {
      const { error: entitlementError } = await adminSb
        .from("resource_entitlements")
        .insert({
          user_id: updatedRequest.requester_user_id,
          resource_id: updatedRequest.fulfilled_resource_id,
          grant_source: "request_fulfilment",
          revoked_at: null,
        });

      if (entitlementError && entitlementError.code !== "23505") {
        return NextResponse.json({ ok: false, error: entitlementError.message }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true, response: mapResponseRow(acceptedResponse) });
  }

  return NextResponse.json({ ok: false, error: "Unsupported action." }, { status: 400 });
}
