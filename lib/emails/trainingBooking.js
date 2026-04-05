import { sendEmail } from "@/lib/emailPostmark";
import { siteUrl } from "@/lib/siteUrl";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatSessionDate(iso, timeZone) {
  if (!iso) return "To be confirmed";
  try {
    return new Intl.DateTimeFormat("en-AU", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: timeZone || "UTC",
    }).format(new Date(iso));
  } catch {
    return String(iso);
  }
}

function formatLocation(session) {
  if (!session) return "To be confirmed";
  if (session.delivery_method === "online") return "Online";
  return [session.location_name, session.suburb, session.state, session.country].filter(Boolean).join(", ") || "To be confirmed";
}

function buildTrainingBookingEmail({ kind, booking, session, course, consultant, req }) {
  const attendeeName = booking?.booking_name || "there";
  const courseTitle = course?.title || "Training course";
  const providerName = consultant?.display_name || "Training provider";
  const sessionDate = formatSessionDate(session?.starts_at, session?.timezone);
  const sessionLocation = formatLocation(session);
  const activityLink = siteUrl("/activity?tab=training", req);
  const providerLink = consultant?.id ? siteUrl(`/consultants/${consultant.id}`, req) : null;

  const variants = {
    request_received: {
      subject: `Booking request received: ${courseTitle}`,
      heading: "Thanks for your booking request",
      intro: `Thanks for requesting a place in ${courseTitle} with ${providerName}. You will receive another email shortly once the trainer has reviewed your request and confirmed, waitlisted, or cancelled it.`,
    },
    confirmed: {
      subject: `Booking confirmed: ${courseTitle}`,
      heading: "Your booking is confirmed",
      intro: `You now have a confirmed place in ${courseTitle} with ${providerName}.`,
    },
    waitlisted: {
      subject: `Waitlist update: ${courseTitle}`,
      heading: "You have been added to the waitlist",
      intro: `This session is currently full, so you have been added to the waitlist for ${courseTitle} with ${providerName}.`,
    },
    cancelled: {
      subject: `Booking cancelled: ${courseTitle}`,
      heading: "Your booking has been cancelled",
      intro: `Your booking for ${courseTitle} with ${providerName} has been cancelled.`,
      followUp: "If you have any questions regarding this, please contact the training provider directly.",
    },
  };

  const variant = variants[kind] || variants.confirmed;
  const text = [
    `Hi ${attendeeName},`,
    "",
    variant.intro,
    "",
    `Course: ${courseTitle}`,
    `Provider: ${providerName}`,
    `Session: ${sessionDate}`,
    `Location: ${sessionLocation}`,
    variant.followUp || "",
    providerLink ? `Provider profile: ${providerLink}` : "",
    `View your training activity: ${activityLink}`,
    "",
    "YouMine",
  ].filter(Boolean).join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(variant.subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#020617;color:#e2e8f0;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;background:radial-gradient(circle at top right,#0ea5e9 0%,#0f172a 45%,#020617 100%);">
      <tr>
        <td align="center">
          <table role="presentation" width="620" cellpadding="0" cellspacing="0" style="max-width:620px;background:rgba(2,6,23,0.9);border:1px solid rgba(148,163,184,0.18);border-radius:22px;overflow:hidden;">
            <tr>
              <td style="padding:32px 36px 12px;">
                <div style="font-size:12px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:#7dd3fc;">YouMine Training</div>
                <h1 style="margin:14px 0 0;font-size:30px;line-height:1.2;color:#f8fafc;">${escapeHtml(variant.heading)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 36px 28px;">
                <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#cbd5e1;">Hi ${escapeHtml(attendeeName)},</p>
                <p style="margin:0 0 22px;font-size:16px;line-height:1.7;color:#cbd5e1;">${escapeHtml(variant.intro)}</p>
                ${variant.followUp ? `<p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#cbd5e1;">${escapeHtml(variant.followUp)}</p>` : ""}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;border:1px solid rgba(148,163,184,0.2);border-radius:16px;background:rgba(15,23,42,0.72);">
                  <tr>
                    <td style="padding:20px 22px;">
                      <div style="font-size:20px;font-weight:600;color:#f8fafc;margin-bottom:14px;">${escapeHtml(courseTitle)}</div>
                      <div style="font-size:14px;line-height:1.8;color:#cbd5e1;">
                        <div><strong style="color:#f8fafc;">Provider:</strong> ${escapeHtml(providerName)}</div>
                        <div><strong style="color:#f8fafc;">Session:</strong> ${escapeHtml(sessionDate)}</div>
                        <div><strong style="color:#f8fafc;">Location:</strong> ${escapeHtml(sessionLocation)}</div>
                      </div>
                    </td>
                  </tr>
                </table>
                <a href="${escapeHtml(activityLink)}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#38bdf8;color:#082f49;text-decoration:none;font-weight:700;">View my training activity</a>
                ${providerLink ? `<a href="${escapeHtml(providerLink)}" style="display:inline-block;padding:12px 22px;margin-left:10px;border-radius:999px;border:1px solid rgba(148,163,184,0.28);color:#e2e8f0;text-decoration:none;font-weight:600;">Provider profile</a>` : ""}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject: variant.subject, html, text };
}

export async function sendTrainingBookingEmail({ kind, booking, session, course, consultant, req }) {
  const to = booking?.booking_email;
  if (!to) return { ok: false, error: "Missing booking email" };
  const content = buildTrainingBookingEmail({ kind, booking, session, course, consultant, req });
  return sendEmail({ to, subject: content.subject, html: content.html, text: content.text });
}

export async function sendTrainingBookingTrainerAlertEmail({ to, booking, session, course, consultant, req }) {
  if (!to) return { ok: false, error: "Missing trainer email" };

  const providerName = consultant?.display_name || "Training provider";
  const courseTitle = course?.title || "Training course";
  const sessionDate = formatSessionDate(session?.starts_at, session?.timezone);
  const sessionLocation = formatLocation(session);
  const attendeeName = booking?.booking_name || booking?.booking_email || "Attendee";
  const manageUrl = consultant?.id && course?.id
    ? siteUrl(`/consultants/${consultant.id}?training=manage&course=${course.id}`, req)
    : siteUrl("/consultants", req);
  const subject = `New booking request: ${courseTitle}`;
  const text = [
    `Hi ${providerName},`,
    "",
    `Someone has requested a place on ${courseTitle}.`,
    "",
    `Attendee: ${attendeeName}`,
    booking?.booking_email ? `Email: ${booking.booking_email}` : "",
    booking?.booking_phone ? `Phone: ${booking.booking_phone}` : "",
    `Session: ${sessionDate}`,
    `Location: ${sessionLocation}`,
    "",
    "Please open the training manager and confirm, waitlist, or cancel this booking request:",
    manageUrl,
    "",
    "YouMine",
  ].filter(Boolean).join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#020617;color:#e2e8f0;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;background:radial-gradient(circle at top right,#38bdf8 0%,#0f172a 48%,#020617 100%);">
      <tr>
        <td align="center">
          <table role="presentation" width="620" cellpadding="0" cellspacing="0" style="max-width:620px;background:rgba(2,6,23,0.9);border:1px solid rgba(148,163,184,0.18);border-radius:22px;overflow:hidden;">
            <tr>
              <td style="padding:32px 36px 12px;">
                <div style="font-size:12px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;color:#7dd3fc;">YouMine Training</div>
                <h1 style="margin:14px 0 0;font-size:30px;line-height:1.2;color:#f8fafc;">New booking request</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 36px 28px;">
                <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#cbd5e1;">Hi ${escapeHtml(providerName)},</p>
                <p style="margin:0 0 22px;font-size:16px;line-height:1.7;color:#cbd5e1;">Someone has requested a place on ${escapeHtml(courseTitle)}. Please review the request and confirm, waitlist, or cancel it in the training manager.</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;border:1px solid rgba(148,163,184,0.2);border-radius:16px;background:rgba(15,23,42,0.72);">
                  <tr>
                    <td style="padding:20px 22px;">
                      <div style="font-size:20px;font-weight:600;color:#f8fafc;margin-bottom:14px;">${escapeHtml(courseTitle)}</div>
                      <div style="font-size:14px;line-height:1.8;color:#cbd5e1;">
                        <div><strong style="color:#f8fafc;">Attendee:</strong> ${escapeHtml(attendeeName)}</div>
                        ${booking?.booking_email ? `<div><strong style="color:#f8fafc;">Email:</strong> ${escapeHtml(booking.booking_email)}</div>` : ""}
                        ${booking?.booking_phone ? `<div><strong style="color:#f8fafc;">Phone:</strong> ${escapeHtml(booking.booking_phone)}</div>` : ""}
                        <div><strong style="color:#f8fafc;">Session:</strong> ${escapeHtml(sessionDate)}</div>
                        <div><strong style="color:#f8fafc;">Location:</strong> ${escapeHtml(sessionLocation)}</div>
                      </div>
                    </td>
                  </tr>
                </table>
                <a href="${escapeHtml(manageUrl)}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:#38bdf8;color:#082f49;text-decoration:none;font-weight:700;">Open training manager</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return sendEmail({ to, subject, html, text });
}