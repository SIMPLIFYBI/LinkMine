import { redirect, notFound } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import EditConsultantForm from "./EditConsultantForm";
import ConsultantServicesManager from "@/app/components/ConsultantServicesManager";
import Link from "next/link";
import AbnSection from "./AbnSection.client.jsx"; // NEW
import { BookOpen, BriefcaseBusiness, CalendarDays, FileText } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditConsultantPage({ params }) {
  const { id } = await params;

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
      country_code,
      global_region,
      contact_email,
      website_url,
      metadata,
      claimed_by,
      linkedin_url,
      facebook_url,
      twitter_url,
      instagram_url,
      place_id,
      status,
      provider_kind,
      profile_type,
      abn,
      acn,
      abn_verified,
      abn_status,
      abn_entity_name,
      abn_entity_type,
      abn_gst_registered_from,
      abn_last_checked
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !consultant) return notFound();

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
    redirect(`/consultants/${id}`);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      {/* New back button */}
      <div className="mb-4">
        <Link
          href={`/consultants/${consultant.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-300 hover:text-sky-200 hover:underline"
        >
          <span aria-hidden className="text-lg leading-none">←</span>
          <span>Back to profile</span>
        </Link>
      </div>

      <h1 className="mb-1 text-2xl font-semibold text-white">Set up your provider profile</h1>
      <p className="text-sm text-slate-400">Choose what you offer, then refine the details people see publicly.</p>

      {consultant.status === "pending" && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-100">
          <span className="h-2 w-2 rounded-full bg-amber-300" aria-hidden="true" />
          Profile awaiting approval
        </div>
      )}

      <section className="relative mt-6 overflow-hidden rounded-2xl border border-cyan-200/20 bg-[linear-gradient(135deg,rgba(14,165,233,0.14),rgba(15,23,42,0.74)_54%,rgba(16,185,129,0.1))] p-5 shadow-[0_22px_50px_-38px_rgba(34,211,238,0.72)] ring-1 ring-white/5">
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-12 h-32 w-32 rounded-full border border-cyan-100/20 bg-cyan-300/10" />
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-100">Step 2: Choose what you offer</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Build your provider profile around your work.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Choose one or more paths now, or return later. Your public profile is the same either way.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Link href={`/consultants/${consultant.id}/edit?add=services`} scroll={false} className="group rounded-xl border border-white/10 bg-white/[0.05] p-3 transition hover:border-cyan-200/35 hover:bg-white/10">
              <BriefcaseBusiness className="h-5 w-5 text-cyan-200" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-slate-100">Offer services</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Appear in Consultant discovery after approval.</p>
            </Link>
            <Link href={`/consultants/${consultant.id}/resources/edit`} className="group rounded-xl border border-white/10 bg-white/[0.05] p-3 transition hover:border-cyan-200/35 hover:bg-white/10">
              <FileText className="h-5 w-5 text-cyan-200" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-slate-100">Create resources</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Publish to the Vault after approval.</p>
            </Link>
            <Link href={`/consultants/${consultant.id}?training=manage`} className="group rounded-xl border border-white/10 bg-white/[0.05] p-3 transition hover:border-cyan-200/35 hover:bg-white/10">
              <BookOpen className="h-5 w-5 text-cyan-200" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-slate-100">Offer training</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Create courses, sessions, and bookings.</p>
            </Link>
            <Link href="/whats-on" className="group rounded-xl border border-white/10 bg-white/[0.05] p-3 transition hover:border-cyan-200/35 hover:bg-white/10">
              <CalendarDays className="h-5 w-5 text-cyan-200" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-slate-100">Add an event</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Submit an event for What&apos;s On.</p>
            </Link>
          </div>
          {consultant.status !== "approved" ? <p className="mt-3 text-xs text-amber-100">You can set up services and training now. Resource publishing and event submission unlock after approval.</p> : null}
        </div>
      </section>

      <EditConsultantForm consultant={consultant} />

      <section className="mt-8 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Show your work</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">Add projects, supporting documents, and relevant links to strengthen your public profile.</p>
        </div>
        <Link
          href={`/consultants/${consultant.id}/portfolio/edit`}
          className="shrink-0 rounded-lg border border-sky-300/35 bg-sky-500/10 px-4 py-2.5 text-center text-sm font-semibold text-sky-100 transition hover:border-sky-200/60 hover:bg-sky-500/20"
        >
          Manage portfolio
        </Link>
      </section>

      {/* NEW: ABN/ACN verify section (positive-only badge) */}
      <AbnSection
        consultantId={consultant.id}
        initial={{
          abn: consultant.abn || "",
          acn: consultant.acn || "",
          abn_verified: consultant.abn_verified || false,
          abn_entity_name: consultant.abn_entity_name || "",
          abn_entity_type: consultant.abn_entity_type || "",
          abn_status: consultant.abn_status || "",
          abn_gst_registered_from: consultant.abn_gst_registered_from || null,
          abn_last_checked: consultant.abn_last_checked || null,
        }}
      />

      <section id="services" className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-slate-100">Services</h2>
        <p className="text-sm text-slate-400">
          Add the services you offer. They determine where your approved profile appears in Consultant discovery.
        </p>
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <ConsultantServicesManager consultantId={consultant.id} canEdit={true} />
        </div>
      </section>
    </main>
  );
}