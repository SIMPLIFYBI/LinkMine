import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

function approvalEmailHtml(name) {
  const safeName = name || "there";
  return `<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;background:#0b1220;color:#ecf3ff;">
  <head>
    <meta charSet="utf-8" />
    <title>Your MineLink consultancy is approved</title>
  </head>
  <body style="margin:0;padding:32px 0;background:#0b1220;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
      <tr>
        <td align="center">
          <table role="presentation" width="560" border="0" cellspacing="0" cellpadding="0" style="width:560px;max-width:90%;background:linear-gradient(140deg,#12233f,#0b162d 70%);border:1px solid rgba(255,255,255,0.06);border-radius:24px;overflow:hidden;box-shadow:0 24px 60px rgba(11,18,32,0.55);">
            <tr>
              <td style="padding:40px 44px 32px;">
                <p style="margin:0 0 18px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#7aa7ff;">MineLink</p>
                <h1 style="margin:0 0 16px;font-size:28px;line-height:1.3;color:#ffffff;">Your consultancy profile is live</h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:rgba(236,243,255,0.78);">
                  Hi ${safeName},<br/>Thanks for submitting your consultancy to MineLink. We’ve reviewed your details and everything looks great—your profile is now visible in the directory.
                </p>
                <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>
                      <a href="${process.env.NEXT_PUBLIC_SITE_URL || ""}/consultants" style="display:inline-block;padding:14px 28px;border-radius:999px;background:linear-gradient(120deg,#33c8ff,#2a6bff);color:#0b1220;font-weight:600;font-size:15px;text-decoration:none;">View your profile</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:rgba(236,243,255,0.62);">
                  Log in to update your details, invite clients, and track engagement.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 44px 32px;border-top:1px solid rgba(255,255,255,0.06);">
                <p style="margin:0;font-size:12px;color:rgba(236,243,255,0.45);">
                  © ${new Date().getFullYear()} MineLink. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0;font-size:11px;color:rgba(236,243,255,0.35);">
            You’re receiving this update because you requested a MineLink consultancy listing.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendApprovalEmail({ to, consultantName }) {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  const from = process.env.POSTMARK_FROM_EMAIL;
  if (!token || !from || !to) return;

  const payload = {
    From: from,
    To: to,
    Subject: "Your MineLink consultancy profile is approved",
    HtmlBody: approvalEmailHtml(consultantName),
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

  const consultantId = params?.id;
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
    await sendApprovalEmail({
      to: data.contact_email,
      consultantName: data.display_name,
    });
  }

  return NextResponse.json({ ok: true, consultant: data });
}