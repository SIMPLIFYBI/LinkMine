export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { sendEmail } from "@/lib/emailPostmark";
import { buildEmailLayout, emailButton, emailDetails, emailPanel, escapeHtml } from "@/lib/emails/emailLayout";

function checkSecret(req) {
  const secret = process.env.CRON_SECRET || process.env.NOTIFY_CRON_SECRET;
  if (!secret) return { ok: false, error: "CRON_SECRET not set" };
  const bearer = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1];
  const header = req.headers.get("x-cron-secret") || "";
  return bearer === secret || header === secret ? { ok: true } : { ok: false, error: "Unauthorized" };
}

function renderEmail(row) {
  const baseUrl =
    (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "") || "http://localhost:3000";
  const jobUrl = `${baseUrl}/jobs/${row.job_id}`;
  const subject = `New job in ${row.category_name}: ${row.job_title || "Untitled"}`;
  const text = [
    `New job in ${row.category_name}`,
    `Title: ${row.job_title || "Untitled"}`,
    row.job_location ? `Location: ${row.job_location}` : "",
    row.listing_type ? `Visibility: ${row.listing_type}` : "",
    "",
    row.description_preview || "",
    "",
    `View: ${jobUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = buildEmailLayout({
    eyebrow: "Job opportunity",
    title: `New job in ${row.category_name}`,
    preheader: row.job_title || "A new job opportunity is available.",
    content: `<div style="font-size:19px;font-weight:700;color:#ffffff;margin-bottom:14px;">${escapeHtml(row.job_title || "Untitled")}</div>${emailDetails([{ label: "Location", value: row.job_location }, { label: "Visibility", value: row.listing_type }])}${row.description_preview ? emailPanel(`<div style="white-space:pre-wrap;color:#e5f1fb;font-size:14px;line-height:1.65;">${escapeHtml(row.description_preview)}</div>`) : ""}${emailButton({ href: jobUrl, label: "View job" })}`,
  });
  return { subject, text, html };
}

async function checkAdmin(req) {
  const sb = await supabaseServerClient({ headers: Object.fromEntries(req.headers) });
  const { data: auth } = await sb.auth.getUser();
  const user = auth?.user;
  if (!user) return { ok: false, status: 401, error: "Not signed in" };

  const [{ data: adminRow }, email] = await Promise.all([
    sb.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    Promise.resolve(user.email?.toLowerCase() || ""),
  ]);

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin = Boolean(adminRow) || (email && adminEmails.includes(email));
  return isAdmin ? { ok: true, sb, user } : { ok: false, status: 403, error: "Forbidden" };
}

export async function POST(req) {
  // Allow either: a) CRON secret, or b) signed-in admin
  const secret = checkSecret(req);
  let sb;

  if (!secret.ok) {
    const adminCheck = await checkAdmin(req);
    if (!adminCheck.ok) {
      return NextResponse.json({ ok: false, error: adminCheck.error }, { status: adminCheck.status });
    }
    sb = adminCheck.sb;
  } else {
    // Secret path: still run with a request-scoped client (no service role)
    sb = await supabaseServerClient({ headers: Object.fromEntries(req.headers) });
  }

  // Get a small batch from the SECURITY DEFINER RPC
  const { data: queue, error: qErr } = await sb.rpc("get_job_notifications_queue", { p_limit: 50 });
  if (qErr) return NextResponse.json({ ok: false, error: qErr.message }, { status: 500 });
  if (!queue || queue.length === 0) return NextResponse.json({ ok: true, sent: 0, total: 0 });

  let sent = 0;
  const results = [];

  for (const row of queue) {
    try {
      const { subject, text, html } = renderEmail(row);
      const res = await sendEmail({ to: row.recipient_email, subject, html, text });
      if (res.ok) {
        sent += 1;
        await sb.rpc("mark_job_notification_sent", {
          p_log_id: row.log_id,
          p_status: "sent",
          p_message_id: res.id || null,
        });
        results.push({ log_id: row.log_id, status: "sent", id: res.id || null });
      } else {
        await sb.rpc("mark_job_notification_sent", {
          p_log_id: row.log_id,
          p_status: "failed",
          p_message_id: null,
        });
        results.push({ log_id: row.log_id, status: "failed", error: res.error || "unknown" });
      }
    } catch (e) {
      try {
        await sb.rpc("mark_job_notification_sent", {
          p_log_id: row.log_id,
          p_status: "failed",
          p_message_id: null,
        });
      } catch {}
      results.push({ log_id: row.log_id, status: "failed", error: e.message || String(e) });
    }
  }

  return NextResponse.json({ ok: true, sent, total: queue.length, results });
}