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
      contact_email,
      metadata,
      claimed_by,
      linkedin_url,
      facebook_url,
      twitter_url,
      instagram_url,
      place_id,
      status,
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
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-amber-100">
          <p className="text-sm font-semibold">Your profile has been submitted and is awaiting approval.</p>
          <p className="mt-1 text-xs text-amber-200/80">
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