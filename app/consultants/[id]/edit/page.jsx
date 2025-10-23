import { redirect, notFound } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import EditConsultantForm from "./EditConsultantForm";
import ConsultantServicesManager from "@/app/components/ConsultantServicesManager"; // ADDED
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditConsultantPage({ params }) {
  const id = params.id;
  const sb = await supabaseServerClient();

  // Who is logged in?
  const { data: auth } = await sb.auth.getUser();
  const userId = auth?.user?.id || null;

  // Load consultant with claimed_by + new social columns
  const { data: consultant, error } = await sb
    .from("consultants")
    .select(`
      id,
      display_name,
      headline,
      bio,
      company,
      location,
      contact_email,
      metadata,
      claimed_by,
      linkedin_url,
      facebook_url,
      twitter_url,
      instagram_url
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !consultant) return notFound();

  // Guard: must be owner
  if (!userId || consultant.claimed_by !== userId) {
    redirect(`/consultants/${id}`); // go back to the profile, not the listing
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="mb-4 text-2xl font-semibold text-white">Edit profile</h1>
      <EditConsultantForm consultant={consultant} />

      {/* Services manager */}
      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-slate-100">Services</h2>
        <p className="text-sm text-slate-400">
          Add or remove services offered by this consultancy.
        </p>
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <ConsultantServicesManager
            consultantId={consultant.id}
            canEdit={true}
          />
        </div>
      </section>
    </main>
  );
}