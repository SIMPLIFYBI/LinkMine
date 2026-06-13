import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { siteUrl } from "@/lib/siteUrl";
import { buildTrainingConsultantInviteEmail } from "@/lib/emails/trainingConsultantInvite";
import SendQueuedButton from "./SendQueuedButton.client";
import TrainingInviteAudience from "./TrainingInviteAudience.client";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const sb = await supabaseServerClient();
  const { data: auth } = await sb.auth.getUser();
  const user = auth?.user || null;

  if (!user) {
    return <div className="p-6 text-slate-100">Please sign in.</div>;
  }

  const [{ data: adminRow }, email] = await Promise.all([
    sb.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    Promise.resolve(user.email?.toLowerCase() || ""),
  ]);

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin = Boolean(adminRow) || (email && adminEmails.includes(email));

  if (!isAdmin) {
    return <div className="p-6 text-red-300">You don’t have access to this page.</div>;
  }

  const { data: queue, error } = await sb.rpc("get_job_notifications_queue", { p_limit: 50 });
  const queueLength = queue?.length || 0;
  const { data: consultantRows, error: consultantError } = await sb
    .from("consultants")
    .select("id, display_name, company, contact_email, status, visibility, claimed_by, is_trainer, provider_kind, invite_email")
    .eq("status", "approved")
    .eq("visibility", "public")
    .order("company", { ascending: true })
    .limit(5000);

  const eligibleConsultants = (consultantRows || []).filter((consultant) => {
    const emailAddress = String(consultant.contact_email || "").trim();
    return emailAddress.length > 0;
  });
  const whatsOnCalendarUrl = siteUrl("/whats-on");
  const preview = buildTrainingConsultantInviteEmail({
    recipientName: "",
    whatsOnCalendarUrl,
    replyTo: "info@youmine.com.au",
  });

  return (
    <div className="mx-auto max-w-2xl p-6 text-slate-100">
      <h1 className="mb-2 text-2xl font-semibold">Admin Notifications</h1>
      <p className="mb-6 text-sm opacity-75">
        Manage both the live job-alert queue and the consultant training invite campaign from one place.
      </p>

      <div className="mb-3 text-xs uppercase tracking-wide text-slate-400">Job alert queue</div>

      <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm">Queued items (up to 50):</div>
        {error ? (
          <div className="text-red-400">{error.message}</div>
        ) : (
          <div className="mt-1 text-lg font-semibold">{queueLength}</div>
        )}
        <p className="mt-2 text-xs text-slate-400">This queue only applies to category-based job notification emails. It does not include consultant campaign sends.</p>
      </div>

      <SendQueuedButton initialQueueLength={queueLength} />

      <div className="mt-10 border-t border-white/10 pt-10">
        <h2 className="text-2xl font-semibold text-white">Consultant Training Invite</h2>
        <p className="mt-2 text-sm text-slate-300">
          Draft-only review for the consultant training campaign. Sending is intentionally disabled until the copy and audience are approved.
        </p>
        <div className="mt-4 rounded-xl border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-sky-100">
          <div className="font-semibold">How to send this campaign</div>
          <div className="mt-1">1. Leave the approved/public consultants ticked that you want to email.</div>
          <div className="mt-1">2. Untick any consultants you want to exclude.</div>
          <div className="mt-1">3. Use the consultant campaign button below, not the job queue button above.</div>
        </div>
        {consultantError ? <div className="mt-6 text-sm text-red-300">{consultantError.message}</div> : null}
        <TrainingInviteAudience recipients={eligibleConsultants} />

        <div className="mt-6 rounded-xl border border-white/10 bg-slate-950/60 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Subject</div>
          <div className="mt-1 text-lg font-semibold text-white">{preview.Subject}</div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/60 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">HTML preview</div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
            <iframe
              title="Consultant training invite preview"
              srcDoc={preview.HtmlBody}
              className="h-[840px] w-full bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
