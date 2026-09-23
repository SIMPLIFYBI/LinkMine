import { ServerClient } from "postmark";
import { buildEmailLayout, emailButton, emailDetails, emailPanel, escapeHtml } from "@/lib/emails/emailLayout";

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

  const html = buildEmailLayout({
    eyebrow: "Job opportunity",
    title: "You have been invited to quote",
    preheader: `A company requested a quote for ${job.title || "a YouMine job"}.`,
    content: `<p style="margin:0 0 15px;color:#d8e7f4;font-size:15px;line-height:1.65;">Hi ${escapeHtml(consultant.display_name || "there")},</p><p style="margin:0 0 20px;color:#d8e7f4;font-size:15px;line-height:1.65;">A company has invited you to quote on the job below.</p>${emailPanel(`<div style="font-size:18px;font-weight:700;color:#ffffff;margin-bottom:10px;">${escapeHtml(job.title || "Untitled")}</div>${job.description ? `<div style="white-space:pre-wrap;color:#c7d9e9;font-size:14px;line-height:1.6;margin-bottom:15px;">${escapeHtml(job.description)}</div>` : ""}${emailDetails([{ label: "Company", value: job.company || "Not provided" }, { label: "Location", value: job.location || "Not provided" }, { label: "Budget", value: job.budget || "Not provided" }, { label: "Closes", value: job.close_date || "Not provided" }, { label: "Contact", value: [job.contact_name, job.contact_email].filter(Boolean).join(" ") || "Not provided" }])}`)}${emailButton({ href: jobUrl, label: "View full job details" })}<p style="margin:4px 0 0;color:#91abc0;font-size:13px;line-height:1.55;">Reply directly to the contact provided to discuss scope, pricing, or next steps.</p>`,
  });

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

  const html = buildEmailLayout({
    eyebrow: "Job review",
    title: "We need a few more details",
    preheader: `Additional information is needed for ${job.title || "your job posting"}.`,
    content: `<p style="margin:0 0 15px;color:#d8e7f4;font-size:15px;line-height:1.65;">Hi ${escapeHtml(contactName)},</p><p style="margin:0 0 15px;color:#d8e7f4;font-size:15px;line-height:1.65;">We need a little more information before we can complete validation of your job listing. We have temporarily placed it on hold while we review it.</p>${emailPanel(`<div style="font-size:18px;font-weight:700;color:#ffffff;margin-bottom:10px;">${escapeHtml(job.title || "Untitled")}</div>${emailDetails([{ label: "Company", value: job.company || "Not provided" }, { label: "Location", value: job.location || "Not provided" }])}`)}${extraNote ? emailPanel(`<div style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8fe9ff;margin-bottom:8px;">Additional note</div><div style="white-space:pre-wrap;color:#e5f1fb;font-size:14px;line-height:1.65;">${escapeHtml(extraNote)}</div>`, { tone: "attention" }) : ""}<p style="margin:0;color:#d8e7f4;font-size:14px;line-height:1.65;">Please reply to <a href="mailto:info@youmine.com.au" style="color:#8fe9ff;">info@youmine.com.au</a> with anything that will help us complete the review.</p>`,
  });

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