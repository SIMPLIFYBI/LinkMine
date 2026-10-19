import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

async function getAcceptedRequest(sb, requestId, userId) {
  const { data, error } = await sb
    .from("talent_connection_requests")
    .select("id, candidate_worker_id, requester_user_id, status")
    .eq("id", requestId)
    .maybeSingle();
  if (error || !data) return { error: "Connection not found.", status: 404 };
  if (data.status !== "accepted") return { error: "Messages are available after a connection is accepted.", status: 403 };
  if (data.candidate_worker_id !== userId && data.requester_user_id !== userId) return { error: "Not authorized.", status: 403 };
  return { request: data };
}

export async function GET(_req, { params }) {
  const sb = await supabaseServerClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { requestId } = await params;
  const access = await getAcceptedRequest(sb, requestId, auth.user.id);
  if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

  const { data, error } = await sb
    .from("talent_messages")
    .select("id, sender_user_id, body, read_at, created_at")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ messages: data || [] });
}

export async function POST(req, { params }) {
  const sb = await supabaseServerClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { requestId } = await params;
  const access = await getAcceptedRequest(sb, requestId, auth.user.id);
  if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

  const payload = await req.json().catch(() => ({}));
  const body = typeof payload.body === "string" ? payload.body.trim().slice(0, 4000) : "";
  if (!body) return NextResponse.json({ error: "Write a message before sending." }, { status: 400 });

  const timestamp = new Date().toISOString();
  const { data, error } = await sb
    .from("talent_messages")
    .insert({ request_id: requestId, sender_user_id: auth.user.id, body })
    .select("id, sender_user_id, body, read_at, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await sb.from("talent_connection_requests").update({ last_message_at: timestamp, updated_at: timestamp }).eq("id", requestId);
  return NextResponse.json({ ok: true, message: data }, { status: 201 });
}