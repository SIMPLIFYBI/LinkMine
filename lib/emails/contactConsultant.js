import { buildEmailLayout, emailButton, emailDetails, emailPanel, escapeHtml } from "./emailLayout";

export function buildContactConsultantEmail({
  consultantName,
  toEmail,
  subject,
  message,
  location,
  budget,
  profileUrl,
  sender,
}) {
  const safe = (s) => String(s || "");
  const senderDetail = `${safe(sender?.name)} &lt;${escapeHtml(sender?.email)}&gt;${sender?.phone ? ` · ${escapeHtml(sender.phone)}` : ""}`;
  const details = emailDetails([
    { label: "From", value: senderDetail, html: true },
    { label: "Subject", value: safe(subject) },
    { label: "Location", value: safe(location) },
    { label: "Budget", value: safe(budget) },
  ]);
  const HtmlBody = buildEmailLayout({ eyebrow: "New enquiry", title: "A client wants to connect", preheader: `New message for ${safe(consultantName)}.`, content: `<p style="margin:0 0 18px;color:#d8e7f4;font-size:15px;line-height:1.65;">You have a new enquiry for <strong style="color:#ffffff;">${escapeHtml(consultantName)}</strong>.</p>${emailPanel(details)}${emailPanel(`<div style="font-size:11px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:#8fb2cd;margin-bottom:8px;">Message</div><div style="white-space:pre-wrap;color:#e5f1fb;font-size:14px;line-height:1.65;">${escapeHtml(message)}</div>`, { tone: "attention" })}${emailButton({ href: profileUrl, label: "Open profile" })}<p style="margin:3px 0 0;color:#91abc0;font-size:12px;line-height:1.55;">Reply directly to the sender's email to continue the conversation.</p>` });
  const TextBody = `New enquiry via YouMine

Consultant: ${safe(consultantName)}
From: ${safe(sender.name)} <${safe(sender.email)}> ${sender.phone ? " · " + safe(sender.phone) : ""}
Subject: ${safe(subject)}
${location ? "Location: " + safe(location) : ""}
${budget ? "Budget: " + safe(budget) : ""}

Message:
${safe(message)}

Open profile: ${profileUrl}

Reply directly to the sender’s email to continue the conversation.
© ${new Date().getFullYear()} YouMine`;

  return { HtmlBody, TextBody };
}