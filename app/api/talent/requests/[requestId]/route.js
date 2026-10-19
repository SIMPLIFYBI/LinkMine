import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

const CANDIDATE_STATUSES = new Set(["accepted", "declined", "blocked"]);

export async function PATCH(req, { params }) {
  const sb = await supabaseServerClient();
  const { data: auth } = await sb.auth.getUser();
  const user = auth?.user;
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { requestId } = await params;
  const body = await req.json().catch(() => ({}));
  const status = typeof body.status === "string" ? body.status.trim() : "";
  const { data: request, error: requestError } = await sb
    .from("talent_connection_requests")
    .select("id, candidate_worker_id, requester_user_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError || !request) return NextResponse.json({ error: "Connection request not found." }, { status: 404 });

  const isCandidate = request.candidate_worker_id === user.id;
  const isRequester = request.requester_user_id === user.id;
  const allowed = (isCandidate && CANDIDATE_STATUSES.has(status) && request.status === "pending")
    || (isRequester && status === "withdrawn" && request.status === "pending");
  if (!allowed) return NextResponse.json({ error: "This request cannot be updated." }, { status: 403 });

  const timestamp = new Date().toISOString();
  const updates = {
    status,
    updated_at: timestamp,
    ...(isCandidate ? { responded_at: timestamp } : { withdrawn_at: timestamp }),
  };
  const { data, error } = await sb
    .from("talent_connection_requests")
    .update(updates)
    .eq("id", requestId)
    .select("id, status, responded_at, withdrawn_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, request: data });
}