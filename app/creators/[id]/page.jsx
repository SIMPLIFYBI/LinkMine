export const runtime = "nodejs";
export const revalidate = 180;

import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import ConsultantClaimButton from "@/app/components/ConsultantClaimButton";

async function getCreator(id) {
  const sb = await supabaseServerClient();

  const { data: creator } = await sb
    .from("consultants")
    .select("id, display_name, headline, bio, location, contact_email, claimed_by, profile_type, visibility, status")
    .eq("id", id)
    .maybeSingle();

  if (!creator) return null;
  if (creator.visibility !== "public" || creator.status !== "approved") return null;
  if (!["creator", "both"].includes(String(creator.profile_type || "consultant"))) return null;

  let resourcesQuery = sb
    .from("resources")
    .select("id, title, summary, resource_type, resource_format, status")
    .eq("status", "approved")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (creator.claimed_by) {
    resourcesQuery = resourcesQuery.or(`consultant_id.eq.${id},owner_user_id.eq.${creator.claimed_by}`);
  } else {
    resourcesQuery = resourcesQuery.eq("consultant_id", id);
  }

  const { data: resources = [] } = await resourcesQuery;

  const { data: auth } = await sb.auth.getUser();
  const user = auth?.user || null;

  let isAdmin = false;
  if (user?.id) {
    const { data: adminRow } = await sb
      .from("app_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    isAdmin = Boolean(adminRow?.user_id);
  }

  const canEdit = Boolean(user?.id && (creator.claimed_by === user.id || isAdmin));

  return { creator, resources, canEdit };
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const data = await getCreator(id);
  if (!data) {
    return {
      title: "Creator not found",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${data.creator.display_name} · Creator`,
    description: data.creator.headline || data.creator.bio || "Digital creator on YouMine.",
    alternates: { canonical: `/creators/${data.creator.id}` },
  };
}

export default async function CreatorPage({ params }) {
  const { id } = await params;
  const data = await getCreator(id);
  if (!data) return notFound();

  const { creator, resources, canEdit } = data;

  return (
    <main className="relative mx-auto w-full max-w-4xl px-6 py-10 space-y-6">
      <div className="flex items-start justify-between">
        <Link href="/creators" className="text-sky-300 hover:underline">← Back</Link>
      </div>

      <header className="rounded-3xl border border-white/10 bg-white/[0.05] p-6">
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Digital Creator</div>
        <h1 className="mt-2 text-3xl font-semibold text-white">{creator.display_name}</h1>
        {creator.headline ? <p className="mt-2 text-sm text-slate-200">{creator.headline}</p> : null}
        {creator.location ? <p className="mt-3 text-xs uppercase tracking-[0.14em] text-slate-400">{creator.location}</p> : null}
      </header>

      <ConsultantClaimButton
        consultantId={creator.id}
        isClaimed={Boolean(creator.claimed_by)}
        canEdit={canEdit}
        contactEmail={creator.contact_email}
      />

      <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-xl font-semibold text-white">Published resources</h2>
        {resources.length === 0 ? (
          <p className="mt-3 text-sm text-slate-300">No approved resources are linked yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {resources.map((resource) => (
              <li key={resource.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <Link href={`/vault/${resource.id}`} className="text-white font-semibold hover:text-sky-200">
                  {resource.title}
                </Link>
                {resource.summary ? <p className="mt-1 text-sm text-slate-300 line-clamp-2">{resource.summary}</p> : null}
                <div className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-400">
                  {resource.resource_type} • {resource.resource_format}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
