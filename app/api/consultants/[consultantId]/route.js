import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildConsultantApprovedEmail } from "@/lib/emails/consultantApproved";

export const runtime = "nodejs";

const VALID_STATUSES = new Set(["pending", "approved", "rejected"]);
const POSTMARK_API_URL = "https://api.postmarkapp.com/email";

function supabaseFromAuthHeader(req) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const auth = req.headers.get("authorization") || "";

  if (!url || !anon) {
    throw new Error("Missing Supabase environment configuration.");
  }

  return createClient(url, anon, {
    global: { headers: auth ? { Authorization: auth } : {} },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Centralized email send using Postmark
async function sendApprovalEmail({ to, consultantName, profileUrl }) {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  const from = process.env.POSTMARK_FROM_EMAIL;
  if (!token || !from || !to) return;

  const { Subject, HtmlBody, TextBody } = buildConsultantApprovedEmail({
    consultantName,
    profileUrl,
  });

  const payload = {
    From: from,
    To: to,
    Subject,
    HtmlBody,
    TextBody,
    MessageStream: process.env.POSTMARK_MESSAGE_STREAM || "outbound",
  };

  try {
    await fetch(POSTMARK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": token,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Failed to send approval email", err);
  }
}

export async function PATCH(req, { params }) {
  const sb = supabaseFromAuthHeader(req);
  const authHeader = req.headers.get("authorization");
  const token =
    authHeader && authHeader.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7)
      : "";

  if (!token) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await sb.auth.getUser(token);

  if (authError) {
    return NextResponse.json({ ok: false, error: authError.message }, { status: 401 });
  }

  if (!user) {
    return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
  }

  // FIX: param folder is [consultantId], not [id]
  const consultantId = params?.consultantId;
  if (!consultantId) {
    return NextResponse.json({ ok: false, error: "Missing consultant id." }, { status: 400 });
  }

  const existing = await sb
    .from("consultants")
    .select("id, display_name, contact_email")
    .eq("id", consultantId)
    .maybeSingle();

  if (existing.error) {
    return NextResponse.json({ ok: false, error: existing.error.message }, { status: 400 });
  }

  if (!existing.data) {
    return NextResponse.json({ ok: false, error: "Consultant not found." }, { status: 404 });
  }

  const payload = await req.json().catch(() => ({}));
  const nextStatus = payload?.status?.toLowerCase?.();

  if (!VALID_STATUSES.has(nextStatus)) {
    return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 400 });
  }

  const reviewerNotes =
    typeof payload?.reviewerNotes === "string" && payload.reviewerNotes.trim()
      ? payload.reviewerNotes.trim()
      : null;

  const updates = {
    status: nextStatus,
    reviewer_notes: reviewerNotes,
    reviewed_by: nextStatus === "pending" ? null : user.id,
    reviewed_at: nextStatus === "pending" ? null : new Date().toISOString(),
  };

  const { data, error } = await sb
    .from("consultants")
    .update(updates)
    .eq("id", consultantId)
    .select(
      "id, status, display_name, contact_email, reviewed_at, reviewed_by, reviewer_notes"
    )
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  if (data.status === "approved" && data.contact_email) {
    const site = process.env.NEXT_PUBLIC_SITE_URL || "";
    const profileUrl = `${site}/consultants/${consultantId}`;
    await sendApprovalEmail({
      to: data.contact_email,
      consultantName: data.display_name,
      profileUrl,
    });
  }

  return NextResponse.json({ ok: true, consultant: data });
}