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

  // Confirm ownership
  const { data: consultant } = await sb
    .from("consultants")
    .select("id, display_name, claimed_by, status")
    .eq("id", id)
    .maybeSingle();

  if (!consultant) return notFound();
  if (!userId || consultant.claimed_by !== userId) {
    redirect(`/consultants/${id}/portfolio`);
  }

  // Load current portfolio (if any)
  const { data: portfolio } = await sb
    .from("consultant_portfolio")
    .select("overall_intro, images, attachment")
    .eq("consultant_id", id)
    .maybeSingle();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="mb-2 text-2xl font-semibold text-white">
        Edit portfolio · {consultant.display_name}
      </h1>

      <EditTabs consultantId={consultant.id} active="portfolio" />

      {consultant.status === "pending" && (
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-amber-100">
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

      <div className="mt-4" />

      <PortfolioEditor consultantId={id} initialData={portfolio} />

      <p className="mt-4 text-xs text-slate-400">
        Limits: up to 3 photos, one PDF, and short paragraphs for each item. Keep images under ~1–2 MB; PDF under ~5 MB.
      </p>
    </main>
  );
}