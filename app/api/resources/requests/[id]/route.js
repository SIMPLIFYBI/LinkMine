export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import {
  cleanNullableText,
  cleanText,
  getResourceAuthContext,
  isValidResourceRequestStatus,
} from "@/lib/resourceHubServer";

function mapRequestRow(row) {
  return {
    id: row.id,
    requesterUserId: row.requester_user_id,
    fulfillerUserId: row.fulfiller_user_id,
    fulfilledResourceId: row.fulfilled_resource_id,
    title: row.title,
    specifications: row.specifications,
    bountyCents: row.bounty_cents,
    currencyCode: row.currency_code,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    claimedAt: row.claimed_at,
    completedAt: row.completed_at,
  };
}

export async function GET(_req, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing request id." }, { status: 400 });
  }

  const sb = await supabaseServerClient();
  const { user } = await getResourceAuthContext(sb);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await sb
    .from("resource_requests")
    .select("id, requester_user_id, fulfiller_user_id, fulfilled_resource_id, title, specifications, bounty_cents, currency_code, status, created_at, updated_at, claimed_at, completed_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ ok: false, error: "Request not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, request: mapRequestRow(data) });
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing request id." }, { status: 400 });
  }

  const sb = await supabaseServerClient();
  const adminSb = supabaseAdminClient();
  const { userId, isAdmin } = await getResourceAuthContext(sb);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const { data: existing, error: existingError } = await sb
    .from("resource_requests")
    .select("id, requester_user_id, fulfiller_user_id, fulfilled_resource_id, title, specifications, bounty_cents, currency_code, status, claimed_at, completed_at")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ ok: false, error: existingError.message }, { status: 400 });
  }

  if (!existing) {
    return NextResponse.json({ ok: false, error: "Request not found." }, { status: 404 });
  }

  const isRequester = existing.requester_user_id === userId;
  const isFulfiller = existing.fulfiller_user_id === userId;
  if (!isRequester && !isFulfiller && !isAdmin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const payload = await req.json().catch(() => ({}));
  const requestedStatus = cleanText(payload.status);
  const title = payload.title !== undefined ? cleanText(payload.title) : undefined;
  const specifications = payload.specifications !== undefined ? cleanText(payload.specifications) : undefined;
  const fulfilledResourceId = payload.fulfilledResourceId !== undefined ? cleanNullableText(payload.fulfilledResourceId) : undefined;
  const bountyCents = payload.bountyCents !== undefined
    ? (Number.isFinite(Number(payload.bountyCents)) && Number(payload.bountyCents) >= 0
        ? Math.trunc(Number(payload.bountyCents))
        : null)
    : undefined;

  const update = {};

  if (title !== undefined) {
    if (!isRequester && !isAdmin) {
      return NextResponse.json({ ok: false, error: "Only the requester can edit the title." }, { status: 403 });
    }
    if (!title) {
      return NextResponse.json({ ok: false, error: "Title cannot be empty." }, { status: 400 });
    }
    update.title = title;
  }

  if (specifications !== undefined) {
    if (!isRequester && !isAdmin) {
      return NextResponse.json({ ok: false, error: "Only the requester can edit the specifications." }, { status: 403 });
    }
    if (!specifications) {
      return NextResponse.json({ ok: false, error: "Specifications cannot be empty." }, { status: 400 });
    }
    update.specifications = specifications;
  }

  if (bountyCents !== undefined) {
    if (!isRequester && !isAdmin) {
      return NextResponse.json({ ok: false, error: "Only the requester can edit the bounty." }, { status: 403 });
    }
    if (bountyCents == null) {
      return NextResponse.json({ ok: false, error: "Bounty must be a positive integer or zero." }, { status: 400 });
    }
    update.bounty_cents = bountyCents;
  }

  if (requestedStatus !== undefined && requestedStatus !== "") {
    if (!isValidResourceRequestStatus(requestedStatus)) {
      return NextResponse.json({ ok: false, error: "Invalid request status." }, { status: 400 });
    }

    if (requestedStatus === "claimed") {
      if (existing.status !== "open" && !isAdmin) {
        return NextResponse.json({ ok: false, error: "Only open requests can be claimed." }, { status: 400 });
      }
      if (isRequester && !isAdmin) {
        return NextResponse.json({ ok: false, error: "Requester cannot claim their own request." }, { status: 403 });
      }
      update.status = "claimed";
      update.fulfiller_user_id = existing.fulfiller_user_id || userId;
      update.claimed_at = existing.claimed_at || new Date().toISOString();
    } else if (requestedStatus === "completed") {
      if (!existing.fulfiller_user_id && !isAdmin) {
        return NextResponse.json({ ok: false, error: "Request must be claimed before completion." }, { status: 400 });
      }
      if (!isFulfiller && !isAdmin) {
        return NextResponse.json({ ok: false, error: "Only the fulfiller can complete the request." }, { status: 403 });
      }
      update.status = "completed";
      update.completed_at = new Date().toISOString();
      if (fulfilledResourceId !== undefined) update.fulfilled_resource_id = fulfilledResourceId;
    } else if (requestedStatus === "cancelled") {
      if (!isRequester && !isAdmin) {
        return NextResponse.json({ ok: false, error: "Only the requester can cancel the request." }, { status: 403 });
      }
      update.status = "cancelled";
    } else if (requestedStatus === "open") {
      if (!isRequester && !isAdmin) {
        return NextResponse.json({ ok: false, error: "Only the requester can reopen the request." }, { status: 403 });
      }
      update.status = "open";
      update.fulfiller_user_id = null;
      update.claimed_at = null;
      update.completed_at = null;
      if (fulfilledResourceId !== undefined) update.fulfilled_resource_id = fulfilledResourceId;
    }
  }

  if (fulfilledResourceId !== undefined && update.fulfilled_resource_id === undefined) {
    if (!isFulfiller && !isAdmin) {
      return NextResponse.json({ ok: false, error: "Only the fulfiller can attach a delivered resource." }, { status: 403 });
    }
    update.fulfilled_resource_id = fulfilledResourceId;
  }

  if (!Object.keys(update).length) {
    return NextResponse.json({ ok: false, error: "No changes provided." }, { status: 400 });
  }

  const { data, error } = await sb
    .from("resource_requests")
    .update(update)
    .eq("id", id)
    .select("id, requester_user_id, fulfiller_user_id, fulfilled_resource_id, title, specifications, bounty_cents, currency_code, status, created_at, updated_at, claimed_at, completed_at")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  if (data.status === "completed" && data.fulfilled_resource_id) {
    const { error: entitlementError } = await adminSb
      .from("resource_entitlements")
      .insert({
        user_id: data.requester_user_id,
        resource_id: data.fulfilled_resource_id,
        grant_source: "request_fulfilment",
        revoked_at: null,
      });

    if (entitlementError && entitlementError.code !== "23505") {
      return NextResponse.json({ ok: false, error: entitlementError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, request: mapRequestRow(data) });
}
