import { buildEmailLayout, emailButton, emailPanel, escapeHtml } from "./emailLayout";

const SUBJECT = "A New Way to Grow Your Consulting Revenue";

export function buildTrainingConsultantInviteEmail({
  recipientName = "",
  whatsOnCalendarUrl,
  replyTo = "info@youmine.com.au",
}) {
  const safeName = recipientName ? escapeHtml(recipientName) : "there";
  const safeWhatsOnCalendarUrl = escapeHtml(whatsOnCalendarUrl || "https://youmine.io/whats-on");
  const safeReplyTo = escapeHtml(replyTo);

  const HtmlBody = buildEmailLayout({ eyebrow: "YouMine Training", title: "Turn expertise into bookable training", preheader: "A new revenue channel is now available on YouMine.", content: `<p style="margin:0 0 14px;color:#d8e7f4;font-size:15px;line-height:1.65;">Hi ${safeName},</p><p style="margin:0 0 18px;color:#d8e7f4;font-size:15px;line-height:1.65;">You can now offer short courses, site refreshers, and capability-building sessions directly through YouMine.</p>${emailPanel(`<div style="font-size:16px;font-weight:700;color:#ffffff;margin-bottom:9px;">What is included</div><ul style="margin:0;padding-left:20px;color:#c7d9e9;font-size:14px;line-height:1.7;"><li>Publish training to the WhatsOn Calendar.</li><li>Manage schedules, sessions, and provider visibility.</li><li>Handle booking flow and learner enquiries in one place.</li><li>Keep 100% of your training revenue.</li></ul>`)}${emailButton({ href: safeWhatsOnCalendarUrl, label: "Open WhatsOn Calendar" })}${emailPanel(`<div style="font-size:16px;font-weight:700;color:#ffffff;margin-bottom:7px;">Want a quick walkthrough?</div><div style="color:#c7d9e9;font-size:14px;line-height:1.6;">Reply to this email and we can arrange a free 15-minute discovery call. Contact: ${safeReplyTo}</div>`, { tone: "attention" })}` });

  const TextBody = `A New Way to Grow Your Consulting Revenue

Hi ${recipientName || "there"},

A new way to grow your consulting revenue is now live on YouMine.

We have expanded YouMine with a Training Hub so consultants and specialist providers can offer short courses, site refreshers, and capability-building sessions directly through the platform.

If training is already part of your service mix, or something you have been considering, this is a straightforward way to monetise that expertise without adding another admin tool to your workflow.

What is included
- Publish training directly to the WhatsOn Calendar and gain exposure across YouMine's specialist community
- Manage schedules, session details, and provider visibility in one place
- Let YouMine handle booking flow and learner enquiries
- Keep 100% of your training revenue because YouMine does not take a cut or fee

WhatsOn Calendar: ${whatsOnCalendarUrl || "https://youmine.io/whats-on"}

Want a quick walkthrough?
Reply to this email and we can arrange a free 15-minute discovery call to show how training listings, schedules, and bookings work on YouMine.

Reply to: ${replyTo}`;

  return {
    Subject: SUBJECT,
    HtmlBody,
    TextBody,
  };
}

export const TRAINING_CONSULTANT_INVITE_SUBJECT = SUBJECT;