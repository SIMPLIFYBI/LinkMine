export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseFromRequest } from "@/lib/supabaseRequestClient";
import { sendEmail } from "@/lib/emailPostmark";

function getBearer(req) {
  const m = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

function renderJobHtml(job) {
  return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial">
      <h2>New job: ${job.title || "Untitled"}</h2>
      ${job.company ? `<div><b>Company:</b> ${job.company}</div>` : ""}
      ${job.location ? `<div><b>Location:</b> ${job.location}</div>` : ""}
      ${job.budget ? `<div><b>Budget:</b> ${job.budget}</div>` : ""}
      ${job.close_date ? `<div><b>Closes:</b> ${job.close_date}</div>` : ""}
      <hr />
      <div>${(job.description || "").replace(/\n/g, "<br/>")}</div>
      <hr />
      <div><b>Contact:</b> ${job.contact_name || ""} ${job.contact_email ? `&lt;${job.contact_email}&gt;` : ""}</div>
    </div>
  `;
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