import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";
import { postmarkClient, jobEmailPayload } from "@/lib/postmark";

async function getAdminClient(req) {
  const authClient = await supabaseServerClient({
    global: {
      headers: {
        Authorization: req.headers.get("Authorization") ?? "",
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return { ok: false, status: 401, error: authError?.message ?? "Not authenticated" };
  }

  const { data: adminRow, error: adminError } = await authClient
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminError) {
    return { ok: false, status: 500, error: adminError.message };
  }

  if (!adminRow) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  let writeClient = authClient;
  try {
    writeClient = supabaseAdminClient();
  } catch {
    writeClient = authClient;
  }

  return { ok: true, sb: writeClient, user };
}

async function notifyApprovedJob(sb, job) {
  if (!job?.id) return { queued: false, directSent: 0 };

  try {
    await sb.rpc("queue_job_notifications", { p_job_id: job.id });
  } catch (e) {
    console.error("queue_job_notifications failed:", e?.message || e);
  }

  try {
    const base = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
    const secret = process.env.CRON_SECRET || process.env.NOTIFY_CRON_SECRET;
    if (base && secret) {
      fetch(`${base}/api/notifications/jobs/dispatch`, {
        method: "POST",
        headers: { "x-cron-secret": secret },
        cache: "no-store",
      }).catch(() => {});
    }
  } catch {
    // best effort
  }

  const recipientIds = Array.isArray(job.recipient_ids) ? job.recipient_ids.filter(Boolean) : [];
  if (!recipientIds.length) return { queued: true, directSent: 0 };

  const { data: consultants, error: consultantsError } = await sb
    .from("consultants")
    .select("id, display_name, contact_email")
    .in("id", recipientIds);

  if (consultantsError) {
    console.error("job approval consultant lookup failed:", consultantsError.message);
    return { queued: true, directSent: 0 };
  }

  let client;
  let from;
  try {
    client = postmarkClient();
    from = process.env.EMAIL_FROM;
  } catch (e) {
    console.error("postmark init failed:", e?.message || e);
    return { queued: true, directSent: 0 };
  }

  if (!from) return { queued: true, directSent: 0 };

  const results = [];
  for (const consultant of consultants ?? []) {
    if (!consultant.contact_email) continue;
    try {
      const response = await client.sendEmail(
        jobEmailPayload({
          to: consultant.contact_email,
          from,
          job,
          consultant,
        })
      );
      results.push({
        consultant_id: consultant.id,
        message_id: response.MessageID,
        submitted_at: response.SubmittedAt,
      });
    } catch (e) {
      console.error("job approval direct email failed:", e?.message || e);
    }
  }

  if (results.length) {
    const emailLog = Array.isArray(job.email_log) ? [...job.email_log, ...results] : results;
    await sb.from("jobs").update({ email_log: emailLog }).eq("id", job.id);
  }

  return { queued: true, directSent: results.length };
}

export async function PATCH(req, context) {
  try {
    const admin = await getAdminClient(req);
    if (!admin.ok) {
      return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });
    }

    const { sb } = admin;
    const params = await context.params;
    const jobId = params?.id;
    if (!jobId) {
      return NextResponse.json({ ok: false, error: "Missing job id." }, { status: 400 });
    }

    const payload = await req.json().catch(() => ({}));
    const nextStatus = payload?.status?.toLowerCase?.();
    if (!["pending", "open", "paused", "closed", "deleted"].includes(nextStatus)) {
      return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 400 });
    }

    const { data: existing, error: selErr } = await sb
      .from("jobs")
      .select("id, title, description, location, preferred_payment_type, urgency, listing_type, company, budget, close_date, contact_name, contact_email, recipient_ids, category_id, status, email_log")
      .eq("id", jobId)
      .maybeSingle();

    if (selErr) {
      return NextResponse.json({ ok: false, error: selErr.message }, { status: 400 });
    }

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Job not found." }, { status: 404 });
    }

    const { data: job, error } = await sb
      .from("jobs")
      .update({
        status: nextStatus,
      })
      .eq("id", jobId)
      .select("id, title, description, location, preferred_payment_type, urgency, listing_type, company, budget, close_date, contact_name, contact_email, recipient_ids, category_id, status, created_by, created_at, email_log")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    if (!job) {
      return NextResponse.json(
        { ok: false, error: "Job update was blocked by database permissions. Apply the admin jobs update policy migration." },
        { status: 400 }
      );
    }

    let notificationStatus = null;
    if (existing.status === "pending" && nextStatus === "open") {
      notificationStatus = await notifyApprovedJob(sb, { ...existing, ...job });
    }

    return NextResponse.json({ ok: true, job, notificationStatus });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error?.message || "Server error" }, { status: 500 });
  }
}