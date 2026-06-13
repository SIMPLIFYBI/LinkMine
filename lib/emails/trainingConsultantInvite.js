const SUBJECT = "A New Way to Grow Your Consulting Revenue";

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

export function buildTrainingConsultantInviteEmail({
  recipientName = "",
  whatsOnCalendarUrl,
  replyTo = "info@youmine.com.au",
}) {
  const safeName = recipientName ? escapeHtml(recipientName) : "there";
  const safeWhatsOnCalendarUrl = escapeHtml(whatsOnCalendarUrl || "https://youmine.io/whats-on");
  const safeReplyTo = escapeHtml(replyTo);

  const HtmlBody = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${SUBJECT}</title>
  </head>
  <body style="margin:0;padding:0;background:#0b1220;">
    <div style="max-width:680px;margin:0 auto;padding:32px 20px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#E5E7EB;">
      <header style="margin-bottom:20px;">
        <p style="margin:0 0 8px 0;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#7dd3fc;">YouMine Training</p>
        <h1 style="margin:0;font-size:28px;line-height:1.2;color:#ffffff;">Turn consulting expertise into bookable training</h1>
      </header>

      <section style="background:#0f172a;border:1px solid #1f2a44;border-radius:16px;padding:24px;">
        <p style="margin:0 0 14px 0;color:#cbd5e1;">Hi ${safeName},</p>
        <p style="margin:0 0 14px 0;color:#ffffff;font-weight:700;">A new way to grow your consulting revenue is now live on YouMine.</p>
        <p style="margin:0 0 14px 0;color:#cbd5e1;">
          We have expanded YouMine with a Training Hub so consultants and specialist providers can offer short courses,
          site refreshers, and capability-building sessions directly through the platform.
        </p>
        <p style="margin:0 0 14px 0;color:#cbd5e1;">
          If training is already part of your service mix, or something you have been considering, this is a straightforward
          way to monetise that expertise without adding another admin tool to your workflow.
        </p>

        <div style="margin-top:20px;padding:18px;border-radius:14px;background:#111827;border:1px solid #22304f;">
          <p style="margin:0 0 10px 0;font-size:14px;font-weight:700;color:#ffffff;">What is included</p>
          <ul style="margin:0;padding-left:20px;color:#cbd5e1;">
            <li style="margin:6px 0;">Publish training directly to the WhatsOn Calendar and gain exposure across YouMine's specialist community</li>
            <li style="margin:6px 0;">Manage schedules, session details, and provider visibility in one place</li>
            <li style="margin:6px 0;">Let YouMine handle booking flow and learner enquiries</li>
            <li style="margin:6px 0;">Keep 100% of your training revenue because YouMine does not take a cut or fee</li>
          </ul>
        </div>

        <div style="margin-top:22px;">
          <a href="${safeWhatsOnCalendarUrl}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#0ea5e9;color:#082f49;text-decoration:none;font-weight:700;">WhatsOn Calendar</a>
        </div>
      </section>

      <section style="margin-top:18px;background:#0f172a;border:1px solid #1f2a44;border-radius:16px;padding:22px;">
        <h2 style="margin:0 0 10px 0;font-size:18px;color:#ffffff;">Want a quick walkthrough?</h2>
        <p style="margin:0 0 12px 0;color:#cbd5e1;">
          Reply to this email and we can arrange a free 15-minute discovery call to show how training listings,
          schedules, and bookings work on YouMine.
        </p>
        <p style="margin:0;color:#93c5fd;">Reply to: ${safeReplyTo}</p>
      </section>

      <footer style="margin-top:18px;color:#94a3b8;font-size:12px;line-height:1.6;">
        <p style="margin:0 0 6px 0;">YouMine helps mining and energy specialists present their expertise, get discovered, and convert that expertise into work.</p>
        <p style="margin:0;">If training is not relevant for your business right now, no action is needed.</p>
      </footer>
    </div>
  </body>
</html>`;

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