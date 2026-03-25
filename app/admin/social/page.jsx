import Link from "next/link";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { getSocialStudioData } from "@/lib/socialStudioData";
import AdminSocialStudio from "./AdminSocialStudio.client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Social Studio · YouMine",
  description: "Generate current social-ready post graphics from live YouMine data.",
};

export default async function AdminSocialPage() {
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
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin = Boolean(adminRow) || (email && adminEmails.includes(email));

  if (!isAdmin) {
    return <div className="p-6 text-red-300">You don’t have access to this page.</div>;
  }

  const studioData = await getSocialStudioData(sb);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 text-slate-100 sm:px-6">
      <div className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.14),transparent_28%),linear-gradient(145deg,rgba(15,23,42,0.96),rgba(8,15,30,0.95))] p-6 shadow-[0_30px_80px_-40px_rgba(8,145,178,0.7)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100">
              Admin social studio
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Build weekly posts from live YouMine data
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Each tab generates a current social-ready graphic using the latest upcoming calendar items,
              consultant directory data, jobs, and platform counts.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/consultants/review"
              className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/10"
            >
              Consultant review
            </Link>
            <Link
              href="/admin/notifications"
              className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/10"
            >
              Job notifications
            </Link>
          </div>
        </div>

        {studioData.warnings.length ? (
          <div className="mt-6 rounded-2xl border border-amber-300/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Some data sources were unavailable. The studio loaded with fallbacks where possible.
          </div>
        ) : null}

        <div className="mt-8">
          <AdminSocialStudio data={studioData} />
        </div>
      </div>
    </main>
  );
}