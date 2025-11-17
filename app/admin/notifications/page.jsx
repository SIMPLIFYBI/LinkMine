import { supabaseServerClient } from "@/lib/supabaseServerClient";
import SendQueuedButton from "./SendQueuedButton.client";

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

  return (
    <div className="mx-auto max-w-2xl p-6 text-slate-100">
      <h1 className="mb-2 text-2xl font-semibold">Job Notifications</h1>
      <p className="mb-6 text-sm opacity-75">
        Send category-based email notifications for newly posted jobs.
      </p>

      <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm">Queued items (up to 50):</div>
        {error ? (
          <div className="text-red-400">{error.message}</div>
        ) : (
          <div className="mt-1 text-lg font-semibold">{queueLength}</div>
        )}
      </div>

      <SendQueuedButton initialQueueLength={queueLength} />
    </div>
  );
}
