export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { siteUrl } from "@/lib/siteUrl";
import { buildConsultantApprovedEmail } from "@/lib/emails/consultantApproved";
import { buildConsultantRejectedEmail } from "@/lib/emails/consultantRejected";
import { buildClaimProfileHtml, buildClaimProfileText } from "@/lib/emails/claimProfile";
import { WELCOME_SUBJECT, buildWelcomeEmailHtml, buildWelcomeEmailText } from "@/lib/emails/welcomeEmail";
import { buildTrainingConsultantInviteEmail } from "@/lib/emails/trainingConsultantInvite";
import { buildContactConsultantEmail } from "@/lib/emails/contactConsultant";
import { NEW_CONSULTANCY_SUBJECT, buildNewConsultancyHtml, buildNewConsultancyText } from "@/lib/emails/newConsultancyNotification";
import { buildTrainingBookingEmail, buildTrainingBookingTrainerAlertEmail } from "@/lib/emails/trainingBooking";

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderJobNotificationEmail(row) {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "") || "http://localhost:3000";
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

async function getAdminContext(req) {
  const sb = await supabaseServerClient();

  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  let user = null;

  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) {
      const { data } = await sb.auth.getUser(token);
      user = data?.user || null;
    }
  }

  if (!user) {
    const { data } = await sb.auth.getUser();
    user = data?.user || null;
  }

  if (!user) {
    return { ok: false, status: 401, error: "Not authenticated" };
  }

  const [{ data: adminRow }, email] = await Promise.all([
    sb.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    Promise.resolve(user.email?.toLowerCase() || ""),
  ]);

  const envAdmins = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin = Boolean(adminRow) || (email && envAdmins.includes(email));

  if (!isAdmin) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, user };
}

export async function GET(req) {
  try {
    const adminCheck = await getAdminContext(req);
    if (!adminCheck.ok) {
      return NextResponse.json({ ok: false, error: adminCheck.error }, { status: adminCheck.status });
    }

    const base = siteUrl("");
    const consultantName = "Acme Advisory";
    const consultantId = "00000000-0000-4000-8000-000000000111";
    const profileUrl = `${base}/consultants/${consultantId}`;
    const editUrl = `${base}/consultants/${consultantId}/edit`;
    const claimUrl = `${base}/claim?consultant=${consultantId}`;
    const claimToken = "11111111-2222-4333-8444-555555555555";

    const approved = buildConsultantApprovedEmail({ consultantName, profileUrl });
    const rejected = buildConsultantRejectedEmail({
      consultantName,
      editUrl,
      notes: "Please add a clearer headline and one project example.",
    });
    const claimHtml = buildClaimProfileHtml(consultantName, claimUrl, claimToken);
    const claimText = buildClaimProfileText(consultantName, claimUrl, claimToken);

    const welcomeHtml = buildWelcomeEmailHtml({ firstName: "Sam" });
    const welcomeText = buildWelcomeEmailText({ firstName: "Sam" });

    const trainingInvite = buildTrainingConsultantInviteEmail({
      recipientName: "Sam",
      whatsOnCalendarUrl: `${base}/whats-on`,
      replyTo: "info@youmine.com.au",
    });

    const contactEmail = buildContactConsultantEmail({
      consultantName,
      toEmail: "consultant@example.com",
      subject: "Short-term drill and blast support",
      message: "Can you support a 6-week planning uplift in WA?",
      location: "Perth, WA",
      budget: "$25k-$35k",
      profileUrl,
      sender: {
        name: "Jordan Client",
        email: "jordan@example.com",
        phone: "+61 400 000 000",
      },
    });

    const sampleBooking = {
      booking_name: "Jordan Client",
      booking_email: "jordan@example.com",
      booking_phone: "+61 400 000 000",
    };
    const sampleSession = {
      starts_at: new Date().toISOString(),
      timezone: "Australia/Perth",
      delivery_method: "in_person",
      location_name: "YouMine Hub",
      suburb: "Perth",
      state: "WA",
      country: "Australia",
    };
    const sampleCourse = { id: "00000000-0000-4000-8000-000000000222", title: "Blast Planning Essentials" };
    const sampleConsultant = { id: consultantId, display_name: consultantName };

    const trainingRequest = buildTrainingBookingEmail({
      kind: "request_received",
      booking: sampleBooking,
      session: sampleSession,
      course: sampleCourse,
      consultant: sampleConsultant,
    });
    const trainingConfirmed = buildTrainingBookingEmail({
      kind: "confirmed",
      booking: sampleBooking,
      session: sampleSession,
      course: sampleCourse,
      consultant: sampleConsultant,
    });
    const trainingWaitlisted = buildTrainingBookingEmail({
      kind: "waitlisted",
      booking: sampleBooking,
      session: sampleSession,
      course: sampleCourse,
      consultant: sampleConsultant,
    });
    const trainingCancelled = buildTrainingBookingEmail({
      kind: "cancelled",
      booking: sampleBooking,
      session: sampleSession,
      course: sampleCourse,
      consultant: sampleConsultant,
    });
    const trainerAlert = buildTrainingBookingTrainerAlertEmail({
      booking: sampleBooking,
      session: sampleSession,
      course: sampleCourse,
      consultant: sampleConsultant,
    });

    const newConsultancySubject = NEW_CONSULTANCY_SUBJECT("Acme Advisory");
    const newConsultancyHtml = buildNewConsultancyHtml({
      name: "Acme Advisory",
      slug: "acme-advisory",
      createdBy: { email: "owner@example.com" },
      createdAt: new Date().toISOString(),
      siteUrl: base,
    });
    const newConsultancyText = buildNewConsultancyText({
      name: "Acme Advisory",
      slug: "acme-advisory",
      createdBy: { email: "owner@example.com" },
      createdAt: new Date().toISOString(),
      siteUrl: base,
    });

    const jobNotification = renderJobNotificationEmail({
      category_name: "Geology",
      job_title: "Contract Geologist - 8 weeks",
      job_location: "Kalgoorlie, WA",
      listing_type: "public",
      description_preview: "Support near-term mine planning and pit mapping workflows.",
      job_id: "00000000-0000-4000-8000-000000000333",
    });

    const templates = [
      {
        id: "welcome",
        label: "Welcome Email",
        trigger: "When /api/welcome runs after signup/signin",
        source: "app/api/welcome/route.js",
        recipient: "Signed-in user",
        subject: WELCOME_SUBJECT,
        html: welcomeHtml,
        text: welcomeText,
      },
      {
        id: "consultant-approved",
        label: "Consultant Approved",
        trigger: "When consultant status changes to approved",
        source: "app/api/consultants/[consultantId]/status/route.js",
        recipient: "Consultant contact email",
        subject: approved.Subject,
        html: approved.HtmlBody,
        text: approved.TextBody,
      },
      {
        id: "consultant-rejected",
        label: "Consultant Rejected",
        trigger: "When consultant status changes to rejected",
        source: "app/api/consultants/[consultantId]/status/route.js",
        recipient: "Consultant contact email",
        subject: rejected.Subject,
        html: rejected.HtmlBody,
        text: rejected.TextBody,
      },
      {
        id: "claim-profile",
        label: "Claim Profile Code",
        trigger: "When admin requests consultant claim email",
        source: "app/api/consultants/[consultantId]/request-claim/route.js",
        recipient: "Consultant contact email",
        subject: `Confirm ownership of ${consultantName}`,
        html: claimHtml,
        text: claimText,
      },
      {
        id: "consultant-contact",
        label: "Consultant Contact Enquiry",
        trigger: "When a signed-in user contacts a consultant",
        source: "app/api/consultants/[consultantId]/contact/route.js",
        recipient: "Consultant contact email",
        subject: "YouMine enquiry: Short-term drill and blast support",
        html: contactEmail.HtmlBody,
        text: contactEmail.TextBody,
      },
      {
        id: "training-invite",
        label: "Training Invite Campaign",
        trigger: "When admin sends consultant training invites",
        source: "app/api/admin/notifications/consultants/training-invite/route.js",
        recipient: "Approved public consultants",
        subject: trainingInvite.Subject,
        html: trainingInvite.HtmlBody,
        text: trainingInvite.TextBody,
      },
      {
        id: "training-booking-request",
        label: "Training Booking Request Received",
        trigger: "When attendee submits booking request",
        source: "app/api/training/sessions/[id]/bookings/route.js",
        recipient: "Attendee email",
        subject: trainingRequest.subject,
        html: trainingRequest.html,
        text: trainingRequest.text,
      },
      {
        id: "training-booking-confirmed",
        label: "Training Booking Confirmed",
        trigger: "When trainer/admin confirms booking",
        source: "app/api/training/bookings/[id]/route.js",
        recipient: "Attendee email",
        subject: trainingConfirmed.subject,
        html: trainingConfirmed.html,
        text: trainingConfirmed.text,
      },
      {
        id: "training-booking-waitlisted",
        label: "Training Booking Waitlisted",
        trigger: "When trainer/admin waitlists booking",
        source: "app/api/training/bookings/[id]/route.js",
        recipient: "Attendee email",
        subject: trainingWaitlisted.subject,
        html: trainingWaitlisted.html,
        text: trainingWaitlisted.text,
      },
      {
        id: "training-booking-cancelled",
        label: "Training Booking Cancelled",
        trigger: "When trainer/admin or attendee cancels booking",
        source: "app/api/training/bookings/[id]/route.js",
        recipient: "Attendee email",
        subject: trainingCancelled.subject,
        html: trainingCancelled.html,
        text: trainingCancelled.text,
      },
      {
        id: "training-trainer-alert",
        label: "Training Booking Alert to Trainer",
        trigger: "When attendee submits booking request",
        source: "app/api/training/sessions/[id]/bookings/route.js",
        recipient: "Trainer/consultant email",
        subject: trainerAlert.subject,
        html: trainerAlert.html,
        text: trainerAlert.text,
      },
      {
        id: "job-notification",
        label: "Job Notification Digest Item",
        trigger: "When queued job notifications are dispatched",
        source: "app/api/notifications/jobs/dispatch/route.js",
        recipient: "Subscribed user",
        subject: jobNotification.subject,
        html: jobNotification.html,
        text: jobNotification.text,
      },
      {
        id: "new-consultancy-admin",
        label: "New Consultancy Admin Alert",
        trigger: "When new consultancy draft/profile is created",
        source: "app/api/consultants/create-draft/route.js",
        recipient: "Admin inbox",
        subject: newConsultancySubject,
        html: newConsultancyHtml,
        text: newConsultancyText,
      },
    ];

    const query = cleanText(new URL(req.url).searchParams.get("q")).toLowerCase();
    const filtered = query
      ? templates.filter((item) => {
          const haystack = `${item.label} ${item.trigger} ${item.source} ${item.subject}`.toLowerCase();
          return haystack.includes(query);
        })
      : templates;

    return NextResponse.json({ ok: true, templates: filtered, total: templates.length });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error?.message || "Unable to load templates." }, { status: 500 });
  }
}
