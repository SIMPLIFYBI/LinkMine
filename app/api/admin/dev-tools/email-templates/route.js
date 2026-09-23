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

function buildVaultCompanyClaimOutreachEmail({ companyName, profileUrl, signupUrl, loginUrl }) {
  const safeCompanyName = companyName || "your company";
  const subject = `Action required: Claim your YouMine profile for ${safeCompanyName}`;

  const text = [
    `Hi ${safeCompanyName} team,`,
    "",
    "We have created your company profile in the YouMine Vault.",
    "",
    `Your profile link: ${profileUrl}`,
    "",
    "How to claim ownership:",
    "1. Open your profile link above.",
    `2. If you do not have an account yet, create a free account here: ${signupUrl}`,
    `3. If you already have an account, log in here: ${loginUrl}`,
    "4. Once logged in, return to your profile page and click the 'Claim Profile' button at the bottom of the screen.",
    "5. We will send a verification email to your registered email address.",
    "6. Open that email and follow the instructions to complete ownership.",
    "",
    "After verification, you will have full control of your company profile.",
    "",
    "If you need help, reply to this email and our team will assist.",
  ].join("\n");

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#07111f;color:#dbe7f7;font-family:'Trebuchet MS','Segoe UI',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:radial-gradient(circle at top right,#133a64 0,#07111f 45%);padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px;border-collapse:collapse;background:#08182b;border:1px solid #1f3b58;border-radius:20px;overflow:hidden;box-shadow:0 20px 45px rgba(3,10,20,.45);">
            <tr>
              <td style="padding:0;background:linear-gradient(115deg,#18b6ff,#67e8f9 55%,#d0f5ff 110%);">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding:20px 22px 10px;color:#06253f;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;">YouMine Vault</td>
                  </tr>
                  <tr>
                    <td style="padding:0 22px 20px;color:#04233b;">
                      <h1 style="margin:0;font-size:28px;line-height:1.15;font-weight:800;">Claim your company profile</h1>
                      <p style="margin:10px 0 0;font-size:14px;line-height:1.5;font-weight:600;color:#073a60;">A profile has been prepared for ${escapeHtml(safeCompanyName)}.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:22px 22px 6px;">
                <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#d9e6f6;">Hi ${escapeHtml(safeCompanyName)} team,</p>
                <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#d9e6f6;">Your company listing is now live in the YouMine Vault. Follow the steps below to take ownership and manage it directly.</p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 22px 18px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;background:#061320;border:1px solid #1b3148;border-radius:14px;">
                  <tr>
                    <td style="padding:14px 14px 8px;font-size:11px;color:#83a7cc;letter-spacing:.08em;text-transform:uppercase;font-weight:700;">Company profile link</td>
                  </tr>
                  <tr>
                    <td style="padding:0 14px 14px;word-break:break-word;">
                      <a href="${profileUrl}" style="color:#63ddff;text-decoration:none;font-size:14px;font-weight:700;">${escapeHtml(profileUrl)}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:0 22px 8px;">
                <p style="margin:0 0 12px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#8db2d6;font-weight:700;">How to claim ownership</p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 22px 8px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 10px;">
                  <tr>
                    <td style="width:34px;vertical-align:top;padding-top:2px;"><span style="display:inline-block;min-width:26px;height:26px;line-height:26px;text-align:center;border-radius:999px;background:#173958;color:#8ce5ff;font-size:12px;font-weight:700;">1</span></td>
                    <td style="font-size:14px;line-height:1.6;color:#d7e5f6;">Open your profile link.</td>
                  </tr>
                  <tr>
                    <td style="width:34px;vertical-align:top;padding-top:2px;"><span style="display:inline-block;min-width:26px;height:26px;line-height:26px;text-align:center;border-radius:999px;background:#173958;color:#8ce5ff;font-size:12px;font-weight:700;">2</span></td>
                    <td style="font-size:14px;line-height:1.6;color:#d7e5f6;">No account yet? Create a free account using the button below.</td>
                  </tr>
                  <tr>
                    <td style="width:34px;vertical-align:top;padding-top:2px;"><span style="display:inline-block;min-width:26px;height:26px;line-height:26px;text-align:center;border-radius:999px;background:#173958;color:#8ce5ff;font-size:12px;font-weight:700;">3</span></td>
                    <td style="font-size:14px;line-height:1.6;color:#d7e5f6;">Already have an account? Log in, then return to your profile page.</td>
                  </tr>
                  <tr>
                    <td style="width:34px;vertical-align:top;padding-top:2px;"><span style="display:inline-block;min-width:26px;height:26px;line-height:26px;text-align:center;border-radius:999px;background:#173958;color:#8ce5ff;font-size:12px;font-weight:700;">4</span></td>
                    <td style="font-size:14px;line-height:1.6;color:#d7e5f6;">Scroll to the bottom of the profile and click <strong style="color:#ffffff;">Claim Profile</strong>.</td>
                  </tr>
                  <tr>
                    <td style="width:34px;vertical-align:top;padding-top:2px;"><span style="display:inline-block;min-width:26px;height:26px;line-height:26px;text-align:center;border-radius:999px;background:#173958;color:#8ce5ff;font-size:12px;font-weight:700;">5</span></td>
                    <td style="font-size:14px;line-height:1.6;color:#d7e5f6;">A verification email is sent to your registered email address.</td>
                  </tr>
                  <tr>
                    <td style="width:34px;vertical-align:top;padding-top:2px;"><span style="display:inline-block;min-width:26px;height:26px;line-height:26px;text-align:center;border-radius:999px;background:#173958;color:#8ce5ff;font-size:12px;font-weight:700;">6</span></td>
                    <td style="font-size:14px;line-height:1.6;color:#d7e5f6;">Open that email and follow the instructions to complete ownership.</td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 22px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding:0 0 10px;">
                      <a href="${signupUrl}" style="display:block;text-align:center;background:#20c6ff;color:#03253e;text-decoration:none;padding:12px 14px;border-radius:10px;font-size:14px;font-weight:800;">Create free account</a>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <a href="${loginUrl}" style="display:block;text-align:center;background:#0f253a;color:#8fdfff;text-decoration:none;padding:11px 14px;border-radius:10px;border:1px solid #2a4d72;font-size:14px;font-weight:700;">Log in to existing account</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td style="padding:0 22px 22px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#071521;border:1px solid #1a2d41;border-radius:12px;">
                  <tr>
                    <td style="padding:12px 14px;font-size:13px;line-height:1.6;color:#c9dbef;">
                      After verification, your team will have full control of this profile. Need help? Reply to this email and we will assist.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
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
    const signupUrl = `${base}/signup`;
    const loginUrl = `${base}/login`;

    const approved = buildConsultantApprovedEmail({ consultantName, profileUrl });
    const rejected = buildConsultantRejectedEmail({
      consultantName,
      editUrl,
      notes: "Please add a clearer headline and one project example.",
    });
    const claimHtml = buildClaimProfileHtml(consultantName, claimUrl, claimToken);
    const claimText = buildClaimProfileText(consultantName, claimUrl, claimToken);
    const vaultClaimOutreach = buildVaultCompanyClaimOutreachEmail({
      companyName: consultantName,
      profileUrl,
      signupUrl,
      loginUrl,
    });

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
        id: "vault-company-claim-outreach",
        label: "Vault Company Claim Outreach",
        trigger: "Manual outreach campaign to companies already listed in the Vault",
        source: "app/api/admin/dev-tools/email-templates/route.js",
        recipient: "Company contact email",
        subject: vaultClaimOutreach.subject,
        html: vaultClaimOutreach.html,
        text: vaultClaimOutreach.text,
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
