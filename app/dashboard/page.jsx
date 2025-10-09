import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const sb = await supabaseServerClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-[calc(100vh-56px)] bg-slate-950 px-6 py-12">
        <div className="mx-auto flex max-w-5xl items-center justify-center">
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-8 text-slate-100 shadow-[0_40px_80px_rgba(8,12,24,0.55)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/25 via-indigo-500/20 to-transparent opacity-90" />
            <div className="pointer-events-none absolute inset-0 bg-white/10 mix-blend-overlay" />
            <div className="relative space-y-5 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-sky-200/80">
                MineLink dashboard
              </p>
              <h1 className="text-3xl font-semibold text-white">
                Sign in to view your personalised dashboard
              </h1>
              <p className="text-sm text-slate-200/80">
                Access saved jobs, manage consultant profiles, and keep tabs on
                your MineLink activity.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/login?redirect=%2Fdashboard"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-sky-400 hover:to-sky-600"
                >
                  Log in
                </Link>
                <Link
                  href="/signup?redirect=%2Fdashboard"
                  className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Create an account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-white">Your dashboard</h1>
      <p className="mt-2 text-sm text-slate-300">
        We’ll personalise this space soon.
      </p>
    </main>
  );
}