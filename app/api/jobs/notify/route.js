export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseFromRequest } from "@/lib/supabaseRequestClient";
import { sendEmail } from "@/lib/emailPostmark";
import { buildEmailLayout, emailDetails, emailPanel, escapeHtml } from "@/lib/emails/emailLayout";

function getBearer(req) {
  const m = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

function renderJobHtml(job) {
  const title = job.title || "Untitled";
  return buildEmailLayout({
    eyebrow: "Job opportunity",
    title: `New job: ${title}`,
    preheader: "A new job opportunity has been shared with you.",
    content: `${emailDetails([{ label: "Company", value: job.company }, { label: "Location", value: job.location }, { label: "Budget", value: job.budget }, { label: "Closes", value: job.close_date }, { label: "Contact", value: [job.contact_name, job.contact_email].filter(Boolean).join(" ") }])}${job.description ? emailPanel(`<div style="white-space:pre-wrap;color:#e5f1fb;font-size:14px;line-height:1.65;">${escapeHtml(job.description)}</div>`) : ""}`,
  });
}

export async function POST(req) {
  try {
    const sb = supabaseFromRequest(req);
    const token = getBearer(req);
    const { data: auth } = await sb.auth.getUser(token);
    if (!auth?.user) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const job = body.job || {};
    const consultantIds =
      (Array.isArray(body.consultantIds) && body.consultantIds.length > 0 && body.consultantIds) ||
      (Array.isArray(job.recipient_ids) && job.recipient_ids) ||
      [];

    if (!job.id) return NextResponse.json({ ok: false, error: "job.id is required" }, { status: 400 });
    if (consultantIds.length === 0) return NextResponse.json({ ok: false, error: "No recipients" }, { status: 400 });

    // Load consultants’ emails
    const { data: consultants, error: cErr } = await sb
      .from("consultants")
      .select("id, display_name, contact_email")
      .in("id", consultantIds)
      .not("contact_email", "is", null);
    if (cErr) return NextResponse.json({ ok: false, error: cErr.message }, { status: 500 });

    const recipients = (consultants || []).filter((c) => c.contact_email);
    if (recipients.length === 0) return NextResponse.json({ ok: false, error: "No recipient emails found" }, { status: 400 });

    const subject = job.title ? `Job: ${job.title}` : "New job opportunity";
    const html = renderJobHtml(job);

    const results = [];
    for (const r of recipients) {
      try {
        const res = await sendEmail({
          to: r.contact_email,
          subject,
          html,
          text: `New job: ${job.title || "Untitled"}\n\n${job.description || ""}`,
        });
        results.push({
          consultant_id: r.id,
          email: r.contact_email,
          status: res.ok ? "sent" : "failed",
          provider_message_id: res.id || null,
          error: res.error || null,
          at: new Date().toISOString(),
        });
      } catch (e) {
        results.push({
          consultant_id: r.id,
          email: r.contact_email,
          status: "failed",
          provider_message_id: null,
          error: e.message || String(e),
          at: new Date().toISOString(),
        });
      }
    }

    // Append to email_log
    const { data: jobRow, error: jErr } = await sb.from("jobs").select("email_log").eq("id", job.id).maybeSingle();
    if (jErr) return NextResponse.json({ ok: false, error: jErr.message }, { status: 500 });

    const email_log = [...(jobRow?.email_log || []), ...results];
    const { error: uErr } = await sb.from("jobs").update({ email_log }).eq("id", job.id);
    if (uErr) return NextResponse.json({ ok: false, error: uErr.message }, { status: 500 });

    const sent = results.filter((x) => x.status === "sent").length;
    return NextResponse.json({ ok: true, sent, total: recipients.length, results });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || String(e) }, { status: 500 });
  }
}