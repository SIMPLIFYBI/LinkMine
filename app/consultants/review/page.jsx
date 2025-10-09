import { supabaseServerClient } from "@/lib/supabaseServerClient";
import ReviewList from "./ReviewList";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ConsultantReviewPage() {
  const sb = await supabaseServerClient();

  const { data: pending = [] } = await sb
    .from("consultants")
    .select("id, display_name, company, headline, location, contact_email, created_at, status")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-white">Consultant approvals</h1>
        <p className="text-sm text-slate-300">
          Review and approve pending consultancy profiles before they appear in the directory.
        </p>
      </header>

      <ReviewList initialConsultants={pending} />
    </main>
  );
}