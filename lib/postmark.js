import { ServerClient } from "postmark";

let client;
export function postmarkClient() {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  if (!token) throw new Error("POSTMARK_SERVER_TOKEN missing");
  if (!client) client = new ServerClient(token);
  return client;
}

export function jobEmailPayload({ to, from, job, consultant }) {
  const subject = "You've been requested to quote on a Job";
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3004";
  const jobUrl = `${baseUrl}/jobs/${job.id}`;

  const plain = [
    `Hi ${consultant.display_name || "there"},`,
    "",
    "YouMine connects mining projects with trusted specialists. A company has requested your quote for the job below:",
    "",
    `Title: ${job.title}`,
    job.description ? `Description: ${job.description}` : "",
    job.company ? `Company: ${job.company}` : "",
    job.location ? `Location: ${job.location}` : "",
    job.budget ? `Budget: ${job.budget}` : "",
    job.close_date ? `Closing date: ${job.close_date}` : "",
    job.contact_name ? `Contact: ${job.contact_name}` : "",
    job.contact_email ? `Contact email: ${job.contact_email}` : "",
    "",
    `View the full job: ${jobUrl}`,
    "",
    "Please reply directly to the contact provided.",
    "",
    "— YouMine Team",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#0a1b3f;color:#f8fafc;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0a1b3f 0%,#2f3a52 60%,#f97316 100%);padding:40px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:rgba(10,27,63,0.85);border:1px solid rgba(255,255,255,0.08);border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:32px 40px;text-align:center;">
                <div style="font-size:24px;font-weight:700;background:linear-gradient(90deg,#38bdf8,#818cf8);-webkit-background-clip:text;color:transparent;margin-bottom:12px;">YouMine</div>
                <h1 style="margin:0;font-size:26px;font-weight:600;color:#f8fafc;">You've been requested to quote on a Job</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 32px;">
                <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#e2e8f0;">
                  Hi ${consultant.display_name || "there"},
                </p>
                <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#e2e8f0;">
                  YouMine connects mining projects with trusted specialists. A company has used our platform to invite you to quote on the job outlined below.
                </p>
                <a
                  href="${jobUrl}"
                  style="display:inline-block;padding:12px 24px;margin:0 0 24px;background:#38bdf8;color:#0f172a;text-decoration:none;border-radius:9999px;font-weight:600;"
                >
                  View full job details
                </a>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:rgba(15,23,42,0.75);border-radius:12px;border:1px solid rgba(148,163,184,0.25);">
                  <tr>
                    <td style="padding:20px 24px;">
                      <div style="font-size:18px;font-weight:600;color:#f1f5f9;margin-bottom:10px;">${job.title}</div>
                      ${
                        job.description
                          ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#cbd5f5;">${job.description.replace(/\n/g, "<br />")}</p>`
                          : ""
                      }
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#e2e8f0;line-height:1.5;">
                        <tr><td style="padding:6px 0;width:130px;opacity:0.7;">Company</td><td>${job.company || "<span style='opacity:0.6;'>Not provided</span>"}</td></tr>
                        <tr><td style="padding:6px 0;width:130px;opacity:0.7;">Location</td><td>${job.location || "<span style='opacity:0.6;'>Not provided</span>"}</td></tr>
                        <tr><td style="padding:6px 0;width:130px;opacity:0.7;">Budget</td><td>${job.budget || "<span style='opacity:0.6;'>Not provided</span>"}</td></tr>
                        <tr><td style="padding:6px 0;width:130px;opacity:0.7;">Closing date</td><td>${job.close_date || "<span style='opacity:0.6;'>Not provided</span>"}</td></tr>
                        <tr>
                          <td style="padding:12px 0 0;width:130px;opacity:0.7;">Contact</td>
                          <td>
                            <div>${job.contact_name || "<span style='opacity:0.6;'>Not provided</span>"}</div>
                            <div style="color:#bae6fd;">${job.contact_email || ""}</div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#e2e8f0;">
                  Please reply directly to the contact provided to discuss scope, pricing or next steps.
                </p>
                <p style="margin:0;font-size:14px;line-height:1.6;opacity:0.75;">
                  — The YouMine Team
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px;background:rgba(15,23,42,0.85);font-size:12px;color:rgba(226,232,240,0.7);text-align:center;">
                © ${new Date().getFullYear()} YouMine. Helping mining projects find the right expertise.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    From: from,
    To: to,
    Subject: subject,
    TextBody: plain,
    HtmlBody: html,
    MessageStream: "outbound",
  };
}

export function jobRequestInfoEmailPayload({ to, from, replyTo, job, note }) {
  const subject = "A few more details about your YouMine job posting";
  const contactName = job.contact_name?.trim() || job.company?.trim() || "there";
  const extraNote = typeof note === "string" ? note.trim() : "";

  const plain = [
    `Hi ${contactName},`,
    "",
    "Thank you for posting a job on YouMine.",
    "",
    "As part of our routine review process, we need a little more information before we can complete validation of this listing.",
    "To avoid the posting being incomplete while we review it, we have temporarily placed it on hold.",
    "",
    `Job title: ${job.title}`,
    job.company ? `Company: ${job.company}` : "",
    job.location ? `Location: ${job.location}` : "",
    "",
    extraNote ? "Additional note from our team:" : "",
    extraNote || "",
    extraNote ? "" : "",
    "Please reply to info@youmine.com.au with any additional details that may help us complete the review.",
    "",
    "Thank you for your time and understanding.",
    "",
    "YouMine Team",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#0f172a;color:#e2e8f0;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 55%,#0f766e 100%);padding:40px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:rgba(15,23,42,0.92);border:1px solid rgba(255,255,255,0.08);border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:32px 40px 20px;text-align:center;">
                <div style="font-size:24px;font-weight:700;color:#f8fafc;margin-bottom:12px;">YouMine</div>
                <h1 style="margin:0;font-size:26px;font-weight:600;color:#f8fafc;">A few more details about your job posting</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 32px;">
                <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#e2e8f0;">Hi ${contactName},</p>
                <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#e2e8f0;">
                  Thank you for posting a job on YouMine. As part of our routine review process, we need a little more information before we can complete validation of this listing.
                </p>
                <p style="margin:0 0 18px;font-size:16px;line-height:1.6;color:#e2e8f0;">
                  To avoid the posting being incomplete while we review it, we have temporarily placed it on hold.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:rgba(15,23,42,0.75);border-radius:12px;border:1px solid rgba(148,163,184,0.25);">
                  <tr>
                    <td style="padding:20px 24px;">
                      <div style="font-size:18px;font-weight:600;color:#f1f5f9;margin-bottom:10px;">${job.title}</div>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#e2e8f0;line-height:1.5;">
                        <tr><td style="padding:6px 0;width:130px;opacity:0.7;">Company</td><td>${job.company || "<span style='opacity:0.6;'>Not provided</span>"}</td></tr>
                        <tr><td style="padding:6px 0;width:130px;opacity:0.7;">Location</td><td>${job.location || "<span style='opacity:0.6;'>Not provided</span>"}</td></tr>
                      </table>
                    </td>
                  </tr>
                </table>
                ${
                  extraNote
                    ? `<div style="margin:0 0 18px;padding:16px 18px;border-radius:12px;background:rgba(15,118,110,0.18);border:1px solid rgba(45,212,191,0.22);">
                        <div style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#99f6e4;margin-bottom:8px;">Additional note</div>
                        <div style="font-size:15px;line-height:1.7;color:#e2e8f0;">${extraNote.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br />")}</div>
                      </div>`
                    : ""
                }
                <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#e2e8f0;">
                  Please reply to <a href="mailto:info@youmine.com.au" style="color:#99f6e4;">info@youmine.com.au</a> with any additional details that may help us complete the review.
                </p>
                <p style="margin:0;font-size:14px;line-height:1.6;opacity:0.8;color:#cbd5e1;">Thank you for your time and understanding.</p>
                <p style="margin:16px 0 0;font-size:14px;line-height:1.6;opacity:0.75;color:#cbd5e1;">YouMine Team</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    From: from,
    To: to,
    Subject: subject,
    TextBody: plain,
    HtmlBody: html,
    MessageStream: "outbound",
    ...(replyTo ? { ReplyTo: replyTo } : {}),
  };
}