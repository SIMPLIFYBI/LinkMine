import { redirect, notFound } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import EditConsultantForm from "./EditConsultantForm";
import ConsultantServicesManager from "@/app/components/ConsultantServicesManager";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditConsultantPage({ params }) {
  // FIX: await params before using its properties
  const { id } = await params;
  if (!id) return notFound();

  const sb = await supabaseServerClient();

  const { data: auth } = await sb.auth.getUser();
  const userId = auth?.user?.id || null;

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
      instagram_url,
      place_id
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !consultant) return notFound();

  if (!userId || consultant.claimed_by !== userId) {
    redirect(`/consultants/${id}`);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="mb-4 text-2xl font-semibold text-white">Edit profile</h1>
      <EditConsultantForm consultant={consultant} />
      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-slate-100">Services</h2>
        <p className="text-sm text-slate-400">
          Add or remove services offered by this consultancy.
        </p>
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <ConsultantServicesManager consultantId={consultant.id} canEdit={true} />
        </div>
      </section>
    </main>
  );
}