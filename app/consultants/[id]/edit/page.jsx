import { redirect, notFound } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import EditConsultantForm from "./EditConsultantForm";
import ConsultantServicesManager from "@/app/components/ConsultantServicesManager";
import Link from "next/link";
import EditTabs from "./EditTabs";
import AbnSection from "./AbnSection.client.jsx"; // NEW

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

      <h1 className="mb-4 text-2xl font-semibold text-white">Edit profile</h1>

      <EditTabs consultantId={consultant.id} active="profile" />

      {consultant.status === "pending" && (
        <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 text-yellow-200 mb-6">
          <p className="text-sm font-semibold">Your profile has been submitted and is awaiting approval.</p>
          <p className="mt-1 text-xs text-yellow-200/80">
            While you wait, you can keep improving your profile or add a portfolio.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/consultants/${consultant.id}/portfolio/edit`}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-amber-50 hover:bg-white/15"
            >
              Add portfolio
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

      <section className="relative mt-6 overflow-hidden rounded-2xl border border-cyan-200/20 bg-[linear-gradient(135deg,rgba(14,165,233,0.14),rgba(15,23,42,0.74)_54%,rgba(16,185,129,0.1))] p-5 shadow-[0_22px_50px_-38px_rgba(34,211,238,0.72)] ring-1 ring-white/5">
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-12 h-32 w-32 rounded-full border border-cyan-100/20 bg-cyan-300/10" />
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-100">Grow your profile</p>
          <h2 className="mt-2 text-xl font-semibold text-white">One profile. Add the work you offer.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Your profile appears in Consultant discovery when you add services, and in Vault Creators when you publish an approved resource. Training and events are also connected here.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="#services" className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-200/35 hover:bg-white/10">Add services</Link>
            <Link href={`/consultants/${consultant.id}/resources/edit`} className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-200/35 hover:bg-white/10">Publish resources</Link>
            <Link href={`/consultants/${consultant.id}?training=manage`} className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-200/35 hover:bg-white/10">Manage training</Link>
            <Link href="/whats-on" className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-200/35 hover:bg-white/10">Submit an event</Link>
          </div>
          {consultant.status !== "approved" ? <p className="mt-3 text-xs text-amber-100">Resource publishing and event submission unlock after your profile is approved.</p> : null}
        </div>
      </section>

      <EditConsultantForm consultant={consultant} />

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

      {["consultant", "both"].includes(String(consultant.profile_type || "consultant")) ? (
        <section id="services" className="mt-10 space-y-3">
          <h2 className="text-lg font-semibold text-slate-100">Services</h2>
          <p className="text-sm text-slate-400">
            Add or remove services offered by this consultancy.
          </p>
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <ConsultantServicesManager consultantId={consultant.id} canEdit={true} />
          </div>
        </section>
      ) : (
        <section className="mt-10 rounded-2xl border border-sky-300/20 bg-sky-500/10 p-4 text-sm text-sky-100">
          This profile is currently in creator mode, so services are hidden.
        </section>
      )}
    </main>
  );
}