import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";
import { jobRequestInfoEmailPayload, postmarkClient } from "@/lib/postmark";

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

  return { ok: true, authClient, writeClient, user };
}

export async function POST(req, context) {
  try {
    const admin = await getAdminClient(req);
    if (!admin.ok) {
      return NextResponse.json({ ok: false, error: admin.error }, { status: admin.status });
    }

    const { authClient, writeClient } = admin;
    const params = await context.params;
    const jobId = params?.id;
    if (!jobId) {
      return NextResponse.json({ ok: false, error: "Missing job id." }, { status: 400 });
    }

    const payload = await req.json().catch(() => ({}));
    const note = typeof payload?.note === "string" ? payload.note.trim() : "";

    const { data: job, error: jobError } = await authClient
      .from("jobs")
      .select("id, title, company, location, contact_name, contact_email, status, email_log")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError) {
      return NextResponse.json({ ok: false, error: jobError.message }, { status: 400 });
    }

    if (!job) {
      return NextResponse.json({ ok: false, error: "Job not found." }, { status: 404 });
    }

    if (!job.contact_email) {
      return NextResponse.json({ ok: false, error: "This job does not have a contact email." }, { status: 400 });
    }

    let nextStatus = job.status;
    if (job.status !== "paused" && job.status !== "deleted") {
      const { data: updatedJob, error: updateError } = await writeClient
        .from("jobs")
        .update({ status: "paused" })
        .eq("id", jobId)
        .select("id, status")
        .maybeSingle();

      if (updateError) {
        return NextResponse.json({ ok: false, error: updateError.message }, { status: 400 });
      }

      if (!updatedJob) {
        return NextResponse.json(
          { ok: false, error: "Job update was blocked by database permissions. Apply the admin jobs update policy migration." },
          { status: 400 }
        );
      }

      nextStatus = updatedJob.status;
    }

    const from = process.env.POSTMARK_FROM_EMAIL || process.env.EMAIL_FROM || "info@youmine.com.au";
    const replyTo = "info@youmine.com.au";
    const client = postmarkClient();
    const response = await client.sendEmail(
      jobRequestInfoEmailPayload({
        to: job.contact_email,
        from,
        replyTo,
        job,
        note,
      })
    );

    try {
      const emailLog = Array.isArray(job.email_log) ? [...job.email_log] : [];
      emailLog.push({
        type: "request_more_information",
        to: job.contact_email,
        note,
        status: nextStatus,
        message_id: response?.MessageID,
        submitted_at: response?.SubmittedAt,
      });
      await writeClient.from("jobs").update({ email_log: emailLog }).eq("id", jobId);
    } catch {}

    return NextResponse.json({
      ok: true,
      job: {
        id: job.id,
        status: nextStatus,
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error?.message || "Server error" }, { status: 500 });
  }
}