export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import EditConsultantForm from "./EditConsultantForm";

export default async function ConsultantEditPage({ params }) {
  const sb = await supabaseServerClient();

  const [{ data: auth }, { data: consultant, error }] = await Promise.all([
    sb.auth.getUser(),
    sb
      .from("consultants")
      .select(
        `
        id,
        display_name,
        headline,
        bio,
        company,
        location,
        contact_email,
        metadata,
        claimed_by
      `
      )
      .eq("id", params.id)
      .maybeSingle(),
  ]);

  if (error || !consultant) {
    redirect("/consultants");
  }

  const userId = auth?.user?.id || null;

  // Must be logged in
  if (!userId) {
    redirect(`/login?redirect=/consultants/${params.id}/edit`);
  }

  // Simple ownership check: only the user who claimed the profile can edit
  if (consultant.claimed_by !== userId) {
    redirect(`/consultants/${params.id}`);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <header className="mb-6 space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Consultant profile
        </p>
        <h1 className="text-2xl font-semibold text-slate-50">
          Edit {consultant.display_name}
        </h1>
        <p className="text-sm text-slate-400">
          Update what clients see on your public page.
        </p>
      </header>

      <EditConsultantForm consultant={consultant} />
    </main>
  );
}