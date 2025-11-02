import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { ServerClient as Postmark } from "postmark";
import { siteUrl } from "@/lib/siteUrl";
import { buildConsultantApprovedEmail } from "@/lib/emails/consultantApproved";

const POSTMARK_TOKEN = process.env.POSTMARK_TOKEN || process.env.POSTMARK_SERVER_TOKEN;
const FROM_EMAIL = process.env.POSTMARK_FROM_EMAIL || "info@youmine.com.au";
const FROM_NAME = process.env.POSTMARK_FROM_NAME || "YouMine";

export async function PATCH(req, context) {
  const sb = await supabaseServerClient({
    global: {
      headers: {
        Authorization: req.headers.get("Authorization") ?? "",
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await sb.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: authError?.message ?? "Not authenticated" },
      { status: 401 }
    );
  }

  const params = await context.params;
  const consultantId = params?.consultantId;
  if (!consultantId) {
    return NextResponse.json(
      { ok: false, error: "Missing consultant id." },
      { status: 400 }
    );
  }

  const payload = await req.json().catch(() => ({}));
  console.log("PATCH payload", payload);
  const nextStatus = payload?.status?.toLowerCase?.();
  if (!["pending", "approved", "rejected"].includes(nextStatus)) {
    return NextResponse.json(
      { ok: false, error: "Invalid status." },
      { status: 400 }
    );
  }

  // Note: ReviewList sends reviewer_notes (snake_case); keep accepting that.
  const reviewerNotes =
    typeof payload?.reviewer_notes === "string" && payload.reviewer_notes.trim()
      ? payload.reviewer_notes.trim()
      : null;

  // Load current to determine previous status and email address
  const { data: existing, error: selErr } = await sb
    .from("consultants")
    .select("id, display_name, contact_email, status")
    .eq("id", consultantId)
    .maybeSingle();
  if (selErr || !existing) {
    return NextResponse.json(
      { ok: false, error: "Consultant not found." },
      { status: 404 }
    );
  }

  const { data, error } = await sb
    .from("consultants")
    .update({
      status: nextStatus,
      reviewer_notes: reviewerNotes,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", consultantId)
    .select("id, status, reviewed_by, reviewed_at, reviewer_notes")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json(
      { ok: false, error: "Consultant not found or update prevented by policy." },
      { status: 404 }
    );
  }

  // Try to send approval email only on transition to approved
  let emailStatus = "skipped";
  try {
    if (nextStatus === "approved" && existing.status !== "approved") {
      const to = (existing.contact_email || "").trim();
      if (POSTMARK_TOKEN && FROM_EMAIL && to) {
        const client = new Postmark(POSTMARK_TOKEN);
        const profileUrl = siteUrl(`/consultants/${consultantId}`, req);
        const { Subject, HtmlBody, TextBody } = buildConsultantApprovedEmail({
          consultantName: existing.display_name,
          profileUrl,
        });
        await client.sendEmail({
          From: `${FROM_NAME} <${FROM_EMAIL}>`,
          To: to,
          Subject,
          HtmlBody,
          TextBody,
          MessageStream: process.env.POSTMARK_STREAM || "outbound",
        });
        emailStatus = "sent";
      } else {
        emailStatus = "not_configured";
      }
    }
  } catch (e) {
    console.error("Approval email send error:", e);
    emailStatus = `error:${e?.message || "send failed"}`;
  }

  return NextResponse.json({ ok: true, consultant: data, emailStatus });
}