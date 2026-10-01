import { notFound, redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import PortfolioEditor from "./PortfolioEditor.client";
import EditTabs from "../../edit/EditTabs";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditPortfolioPage({ params }) {
  const { id } = await params;
  const sb = await supabaseServerClient();

  const { data: auth } = await sb.auth.getUser();
  const userId = auth?.user?.id || null;

  const { data: consultant } = await sb
    .from("consultants")
    .select("id, display_name, claimed_by, status")
    .eq("id", id)
    .maybeSingle();

  if (!consultant) return notFound();

  // NEW: allow admins
  let isAdmin = false;
  if (userId) {
    const { data: adminRow } = await sb
      .from("app_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    isAdmin = Boolean(adminRow);
  }

  if (!userId || (consultant.claimed_by !== userId && !isAdmin)) {
    redirect(`/consultants/${id}/portfolio`);
  }

  // Load current portfolio (if any)
  const { data: portfolio } = await sb
    .from("consultant_portfolio")
    .select("overall_intro, images, attachment, links")
    .eq("consultant_id", id)
    .maybeSingle();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
      <section className="relative overflow-hidden rounded-[28px] border border-sky-200/20 bg-[radial-gradient(circle_at_88%_12%,rgba(34,211,238,0.2),transparent_28%),radial-gradient(circle_at_12%_100%,rgba(59,130,246,0.16),transparent_34%),linear-gradient(145deg,rgba(8,24,43,0.96),rgba(10,32,54,0.9))] p-5 shadow-[0_28px_70px_-46px_rgba(0,0,0,0.95)] ring-1 ring-white/10 sm:p-7">
        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full border border-cyan-200/20 bg-cyan-300/10" aria-hidden="true" />
        <div className="relative">
          <div className="mb-4">
            <Link
              href={`/consultants/${consultant.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-100 transition hover:text-white"
            >
              <span aria-hidden className="text-lg leading-none">←</span>
              <span>Back to profile</span>
            </Link>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-100/80">Profile workspace</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Edit portfolio</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200">
                Share your strongest projects, supporting documents, and relevant links.
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-slate-100">
              <span className={`h-2 w-2 rounded-full ${consultant.status === "approved" ? "bg-emerald-300" : "bg-amber-300"}`} />
              {consultant.status === "approved" ? "Profile live" : "In review"}
            </div>
          </div>
        </div>
      </section>

      <EditTabs consultantId={consultant.id} active="portfolio" />

      {consultant.status === "pending" && (
        <div className="mb-6 mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 text-yellow-200">
          <p className="text-sm font-semibold">Your profile has been submitted and is awaiting approval.</p>
          <p className="mt-1 text-xs text-amber-200/80">
            You can keep adding portfolio items and updating details—changes will be included when approved.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/consultants/${consultant.id}/edit`}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-amber-50 hover:bg-white/15"
            >
              Back to profile editor
            </Link>
            <Link
              href="/consultants"
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-amber-50 hover:bg-white/15"
            >
              Finish later
            </Link>
          </div>
        </div>
      )}

      <PortfolioEditor consultantId={id} initialData={portfolio} />

      <p className="mt-4 text-xs text-slate-400">
        Limits: up to 3 photos, one PDF, and short paragraphs for each item. Keep images under ~1–2 MB; PDF under ~5 MB.
      </p>
    </main>
  );
}