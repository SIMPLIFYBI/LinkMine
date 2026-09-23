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

  if (!userId) {
    redirect(`/login?redirect=${encodeURIComponent(`/consultants/${id}/edit`)}`);
  }

  if (consultant.claimed_by !== userId && !isAdmin) {
    redirect(`/consultants/${id}`);
  }

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
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Edit profile</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200">Keep your public presence current so the right people can find and contact you.</p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-slate-100">
              <span className={`h-2 w-2 rounded-full ${consultant.status === "approved" ? "bg-emerald-300" : "bg-amber-300"}`} />
              {consultant.status === "approved" ? "Profile live" : "In review"}
            </div>
          </div>
        </div>
      </section>

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
        <section className="mt-10 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_22px_54px_-42px_rgba(0,0,0,0.9)] ring-1 ring-white/10 sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-200">Capability</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Services offered</h2>
          <p className="mt-2 text-sm text-slate-400">
            Add or remove services offered by this consultancy.
          </p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/20 p-4">
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