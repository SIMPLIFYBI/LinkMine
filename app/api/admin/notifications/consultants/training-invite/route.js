export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";
import { siteUrl } from "@/lib/siteUrl";
import { sendEmail } from "@/lib/emailPostmark";
import { shouldSendEmail, logEmailSent } from "@/lib/emails/trackEmail";
import { buildTrainingConsultantInviteEmail } from "@/lib/emails/trainingConsultantInvite";

async function getAdminClient(req) {
  const authClient = await supabaseServerClient({
    global: {
      headers: {
        Authorization: req.headers.get("Authorization") ?? "",
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return { ok: false, status: 401, error: authError?.message ?? "Not authenticated" };
  }

  const [{ data: adminRow }, email] = await Promise.all([
    authClient.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    Promise.resolve(user.email?.toLowerCase() || ""),
  ]);

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin = Boolean(adminRow) || (email && adminEmails.includes(email));
  if (!isAdmin) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  let writeClient = authClient;
  try {
    writeClient = supabaseAdminClient();
  } catch {
    writeClient = authClient;
  }

  return { ok: true, authClient, writeClient, user };
}

export async function POST(req) {
  try {
    const admin = await getAdminClient(req);
    if (!admin.ok) {
      return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });
    }

    const { authClient, writeClient } = admin;
    const payload = await req.json().catch(() => ({}));
    const consultantIds = Array.isArray(payload?.consultantIds)
      ? Array.from(new Set(payload.consultantIds.map((value) => String(value || "").trim()).filter(Boolean)))
      : [];

    if (!consultantIds.length) {
      return NextResponse.json({ ok: false, error: "Select at least one consultant." }, { status: 400 });
    }

    const { data: consultants, error: consultantError } = await authClient
      .from("consultants")
      .select("id, display_name, company, contact_email, status, visibility, claimed_by, is_trainer, provider_kind, invite_email")
      .in("id", consultantIds)
      .eq("status", "approved")
      .eq("visibility", "public");

    if (consultantError) {
      return NextResponse.json({ ok: false, error: consultantError.message }, { status: 400 });
    }

    const eligibleConsultants = (consultants || []).filter((consultant) => String(consultant.contact_email || "").trim());
    const invalidCount = consultantIds.length - eligibleConsultants.length;
    if (!eligibleConsultants.length) {
      return NextResponse.json(
        { ok: false, error: "No approved/public consultants with a contact email matched the current selection." },
        { status: 400 }
      );
    }

    const whatsOnCalendarUrl = siteUrl("/whats-on", req);

    const sentIds = [];
    const skippedAlreadySent = [];
    const failed = [];

    for (const consultant of eligibleConsultants) {
      const recipient = String(consultant.contact_email || "").trim();
      const shouldSend = await shouldSendEmail({
        recipient,
        emailType: "training_consultant_invite",
        relatedId: consultant.id,
      });

      if (!shouldSend) {
        skippedAlreadySent.push({ id: consultant.id, email: recipient });
        continue;
      }

      const email = buildTrainingConsultantInviteEmail({
        recipientName: "",
        whatsOnCalendarUrl,
        replyTo: "info@youmine.com.au",
      });

      let sendError = null;
      try {
        const result = await sendEmail({
          to: recipient,
          subject: email.Subject,
          html: email.HtmlBody,
          text: email.TextBody,
        });

        if (!result?.ok) {
          sendError = new Error(result?.error || "Failed to send email.");
        }
      } catch (error) {
        sendError = error;
      }

      await logEmailSent({
        recipient,
        subject: email.Subject,
        emailType: "training_consultant_invite",
        relatedId: consultant.id,
        error: sendError,
      });

      if (sendError) {
        failed.push({ id: consultant.id, email: recipient, error: sendError.message || String(sendError) });
      } else {
        sentIds.push(consultant.id);
      }
    }

    if (sentIds.length) {
      try {
        await writeClient.from("consultants").update({ invite_email: true }).in("id", sentIds);
      } catch {}
    }

    return NextResponse.json({
      ok: true,
      requested: consultantIds.length,
      eligible: eligibleConsultants.length,
      invalidCount,
      sent: sentIds.length,
      sentIds,
      skippedAlreadySentCount: skippedAlreadySent.length,
      skippedAlreadySent,
      failedCount: failed.length,
      failed,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error?.message || "Server error" }, { status: 500 });
  }
}