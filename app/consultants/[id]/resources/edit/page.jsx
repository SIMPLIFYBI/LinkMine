import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import EditTabs from "../../edit/EditTabs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditConsultantResourcesPage({ params }) {
  const { id } = await params;
  const sb = await supabaseServerClient();

  const { data: auth } = await sb.auth.getUser();
  const userId = auth?.user?.id || null;

  const { data: consultant } = await sb
    .from("consultants")
    .select("id, display_name, claimed_by, profile_type")
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
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <h1 className="mb-2 text-2xl font-semibold text-white">
        Digital resources · {consultant.display_name}
      </h1>

      <EditTabs consultantId={consultant.id} active="resources" />

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
          <ul className="mt-5 space-y-3">
            {resources.map((resource) => (
              <li
                key={resource.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/vault/${resource.id}`} className="text-sm font-semibold text-white hover:text-sky-200">
                      {resource.title}
                    </Link>
                    {resource.summary ? (
                      <p className="mt-1 text-sm text-slate-300 line-clamp-2">{resource.summary}</p>
                    ) : null}
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-400">
                      {resource.status} • {resource.resource_type} • {resource.resource_format}
                    </p>
                  </div>
                  <Link
                    href={`/vault/${resource.id}/edit`}
                    className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-white/[0.1]"
                  >
                    Edit resource
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
