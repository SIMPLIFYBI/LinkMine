import { notFound, redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import PortfolioEditor from "./PortfolioEditor.client";

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
    .select("id, display_name, claimed_by")
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
      <h1 className="mb-4 text-2xl font-semibold text-white">
        Edit portfolio · {consultant.display_name}
      </h1>
      <PortfolioEditor consultantId={id} initialData={portfolio} />
      <p className="mt-4 text-xs text-slate-400">
        Limits: up to 3 photos, one PDF, and short paragraphs for each item. Keep images under ~1–2 MB; PDF under ~5 MB.
      </p>
    </main>
  );
}