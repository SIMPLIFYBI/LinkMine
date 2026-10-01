import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Apps24Regular,
  BranchFork24Regular,
  Code24Regular,
  Document24Regular,
  DocumentPdf24Regular,
  DocumentText24Regular,
  Globe24Regular,
  SlideText24Regular,
  TableSimple24Regular,
} from "@fluentui/react-icons";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import EditTabs from "../../edit/EditTabs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const RESOURCE_FORMAT_LABELS = {
  website: "Website",
  repository: "Repository",
  excel: "Excel",
  word: "Word",
  powerpoint: "PowerPoint",
  script: "Script",
  app: "App",
  pdf: "PDF",
  generic: "Resource",
};

const RESOURCE_FORMAT_ICONS = {
  website: Globe24Regular,
  repository: BranchFork24Regular,
  excel: TableSimple24Regular,
  word: DocumentText24Regular,
  powerpoint: SlideText24Regular,
  script: Code24Regular,
  app: Apps24Regular,
  pdf: DocumentPdf24Regular,
  generic: Document24Regular,
};

const RESOURCE_FORMAT_STYLES = {
  website: "border-cyan-300/30 bg-cyan-500/15 text-cyan-100",
  repository: "border-emerald-300/30 bg-emerald-500/15 text-emerald-100",
  excel: "border-lime-300/30 bg-lime-500/15 text-lime-100",
  word: "border-blue-300/30 bg-blue-500/15 text-blue-100",
  powerpoint: "border-orange-300/30 bg-orange-500/15 text-orange-100",
  script: "border-violet-300/30 bg-violet-500/15 text-violet-100",
  app: "border-pink-300/30 bg-pink-500/15 text-pink-100",
  pdf: "border-red-300/30 bg-red-500/15 text-red-100",
  generic: "border-slate-300/30 bg-slate-500/15 text-slate-100",
};

function ResourceFormatChip({ format }) {
  const safeFormat = format || "generic";
  const Icon = RESOURCE_FORMAT_ICONS[safeFormat] || RESOURCE_FORMAT_ICONS.generic;
  const style = RESOURCE_FORMAT_STYLES[safeFormat] || RESOURCE_FORMAT_STYLES.generic;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${style}`}>
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {RESOURCE_FORMAT_LABELS[safeFormat] || RESOURCE_FORMAT_LABELS.generic}
    </span>
  );
}

function statusStyle(status) {
  if (status === "approved") return "border-emerald-300/30 bg-emerald-500/15 text-emerald-100";
  if (["pending", "draft"].includes(status)) return "border-amber-300/30 bg-amber-500/15 text-amber-100";
  if (["rejected", "archived"].includes(status)) return "border-red-300/30 bg-red-500/15 text-red-100";
  return "border-sky-300/30 bg-sky-500/15 text-sky-100";
}

function formatUpdatedAt(value) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export default async function EditConsultantResourcesPage({ params }) {
  const { id } = await params;
  const sb = await supabaseServerClient();

  const { data: auth } = await sb.auth.getUser();
  const userId = auth?.user?.id || null;

  const { data: consultant } = await sb
    .from("consultants")
    .select("id, display_name, claimed_by, profile_type, status")
    .eq("id", id)
    .maybeSingle();

  if (!consultant) return notFound();

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

  let resourcesQuery = sb
    .from("resources")
    .select("id, title, summary, status, resource_type, resource_format, updated_at")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (consultant.claimed_by) {
    resourcesQuery = resourcesQuery.or(
      `consultant_id.eq.${consultant.id},owner_user_id.eq.${consultant.claimed_by}`
    );
  } else {
    resourcesQuery = resourcesQuery.eq("consultant_id", consultant.id);
  }

  const { data: resources = [] } = await resourcesQuery;

  const isCreatorCapable = ["creator", "both"].includes(
    String(consultant.profile_type || "consultant")
  );

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
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">My resources</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200">
                Manage the digital resources connected to your public profile.
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-slate-100">
              <span className={`h-2 w-2 rounded-full ${consultant.status === "approved" ? "bg-emerald-300" : "bg-amber-300"}`} />
              {consultant.status === "approved" ? "Profile live" : "In review"}
            </div>
          </div>
        </div>
      </section>

      <EditTabs consultantId={consultant.id} active="resources" />

      {consultant.status === "pending" && (
        <div className="mb-6 mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 text-yellow-200">
          <p className="text-sm font-semibold">Your profile has been submitted and is awaiting approval.</p>
          <p className="mt-1 text-xs text-yellow-200/80">
            You can keep managing resources while we review your public profile.
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

      <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Manage your vault resources</h2>
            <p className="mt-1 text-sm text-slate-300">
              View existing resources, edit any item, or create a new one.
            </p>
          </div>
          <Link
            href="/vault/submit"
            className="rounded-full border border-sky-300/40 bg-sky-500/15 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-500/25"
          >
            Create new resource
          </Link>
        </div>

        {!isCreatorCapable ? (
          <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            This profile is set to consultant mode. You can still manage resources below, or switch the profile type to creator/both to highlight resources publicly.
          </p>
        ) : null}

        {resources.length === 0 ? (
          <p className="mt-5 text-sm text-slate-300">No resources found for this profile yet.</p>
        ) : (
          <ul className="mt-5 space-y-4">
            {resources.map((resource) => (
              <li
                key={resource.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(110deg,rgba(255,255,255,0.08),rgba(255,255,255,0.025))] p-5 shadow-[0_18px_42px_-34px_rgba(0,0,0,0.9)] transition hover:border-sky-300/35 hover:bg-white/[0.06]"
              >
                <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-sky-300/70" aria-hidden="true" />
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <ResourceFormatChip format={resource.resource_format} />
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${statusStyle(resource.status)}`}>
                        {resource.status || "draft"}
                      </span>
                    </div>
                    <Link href={`/vault/${resource.id}`} className="mt-4 block text-xl font-semibold tracking-tight text-white transition group-hover:text-sky-100">
                      {resource.title || "Untitled resource"}
                    </Link>
                    {resource.summary ? (
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 line-clamp-2">{resource.summary}</p>
                    ) : null}
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="rounded-full border border-white/10 bg-slate-950/25 px-3 py-1.5 capitalize">{resource.resource_type || "resource"}</span>
                      <span>Updated {formatUpdatedAt(resource.updated_at)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
                    <Link
                      href={`/vault/${resource.id}/edit`}
                      className="inline-flex justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                    >
                      Edit resource
                    </Link>
                    <Link
                      href={`/vault/${resource.id}`}
                      className="inline-flex justify-center rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/[0.1]"
                    >
                      View in Vault
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
