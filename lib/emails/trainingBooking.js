import { sendEmail } from "@/lib/emailPostmark";
import { siteUrl } from "@/lib/siteUrl";
import { buildEmailLayout, emailButton, emailDetails, emailPanel, escapeHtml } from "./emailLayout";

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

export function buildTrainingBookingEmail({ kind, booking, session, course, consultant, req }) {
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

  const html = buildEmailLayout({
    eyebrow: "YouMine Training",
    title: variant.heading,
    preheader: variant.intro,
    content: `<p style="margin:0 0 15px;color:#d8e7f4;font-size:15px;line-height:1.65;">Hi ${escapeHtml(attendeeName)},</p><p style="margin:0 0 18px;color:#d8e7f4;font-size:15px;line-height:1.65;">${escapeHtml(variant.intro)}</p>${variant.followUp ? `<p style="margin:0 0 18px;color:#d8e7f4;font-size:14px;line-height:1.65;">${escapeHtml(variant.followUp)}</p>` : ""}${emailPanel(`<div style="font-size:18px;font-weight:700;color:#ffffff;margin-bottom:10px;">${escapeHtml(courseTitle)}</div>${emailDetails([{ label: "Provider", value: providerName }, { label: "Session", value: sessionDate }, { label: "Location", value: sessionLocation }])}`)}${emailButton({ href: activityLink, label: "View training activity" })}${providerLink ? emailButton({ href: providerLink, label: "Provider profile", secondary: true }) : ""}`,
  });

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

  const content = buildTrainingBookingTrainerAlertEmail({ booking, session, course, consultant, req });
  return sendEmail({ to, subject: content.subject, html: content.html, text: content.text });
}

export function buildTrainingBookingTrainerAlertEmail({ booking, session, course, consultant, req }) {
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

  const html = buildEmailLayout({
    eyebrow: "YouMine Training",
    title: "New booking request",
    preheader: `A booking request was submitted for ${courseTitle}.`,
    content: `<p style="margin:0 0 15px;color:#d8e7f4;font-size:15px;line-height:1.65;">Hi ${escapeHtml(providerName)},</p><p style="margin:0 0 18px;color:#d8e7f4;font-size:15px;line-height:1.65;">Someone has requested a place on ${escapeHtml(courseTitle)}. Review the request in the training manager to confirm, waitlist, or cancel it.</p>${emailPanel(`<div style="font-size:18px;font-weight:700;color:#ffffff;margin-bottom:10px;">${escapeHtml(courseTitle)}</div>${emailDetails([{ label: "Attendee", value: attendeeName }, { label: "Email", value: booking?.booking_email }, { label: "Phone", value: booking?.booking_phone }, { label: "Session", value: sessionDate }, { label: "Location", value: sessionLocation }])}`)}${emailButton({ href: manageUrl, label: "Open training manager" })}`,
  });

  return { subject, html, text };
}