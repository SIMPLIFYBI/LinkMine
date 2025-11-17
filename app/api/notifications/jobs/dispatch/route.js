export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { sendEmail } from "@/lib/emailPostmark";

function checkSecret(req) {
  const secret = process.env.CRON_SECRET || process.env.NOTIFY_CRON_SECRET;
  if (!secret) return { ok: false, error: "CRON_SECRET not set" };
  const bearer = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1];
  const header = req.headers.get("x-cron-secret") || "";
  return bearer === secret || header === secret ? { ok: true } : { ok: false, error: "Unauthorized" };
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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

  const html = `<!doctype html>
<html>
  <body style="font-family:Segoe UI,Helvetica,Arial,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:24px">
    <div style="max-width:640px;margin:0 auto;background:#0b1220;border:1px solid rgba(255,255,255,.08);border-radius:14px;overflow:hidden">
      <div style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,.08)">
        <div style="font-weight:700;font-size:18px;background:linear-gradient(90deg,#38bdf8,#818cf8);-webkit-background-clip:text;color:transparent">YouMine</div>
        <h1 style="margin:8px 0 0;font-size:18px;color:#f8fafc">New job in ${escapeHtml(row.category_name)}</h1>
      </div>
      <div style="padding:20px">
        <div style="font-size:16px;font-weight:600;color:#f1f5f9">${escapeHtml(row.job_title || "Untitled")}</div>
        ${row.job_location ? `<div style="opacity:.9">Location: ${escapeHtml(row.job_location)}</div>` : ""}
        ${row.listing_type ? `<div style="opacity:.9">Visibility: ${escapeHtml(row.listing_type)}</div>` : ""}
        ${
          row.description_preview
            ? `<p style="margin-top:12px;white-space:pre-wrap">${escapeHtml(row.description_preview)}</p>`
            : ""
        }
        <div style="margin-top:14px">
          <a href="${jobUrl}" style="display:inline-block;background:#38bdf8;color:#0f172a;text-decoration:none;padding:10px 16px;border-radius:9999px;font-weight:600">View job</a>
        </div>
      </div>
      <div style="padding:12px 20px;background:#0a1020;font-size:12px;opacity:.7;text-align:center">© ${new Date().getFullYear()} YouMine</div>
    </div>
  </body>
</html>`;
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