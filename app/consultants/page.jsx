export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabaseAnonServer } from "@/lib/supabaseAnonServer";
import AddConsultantButton from "@/app/components/consultants/AddConsultantButton";

async function getConsultantsByServiceSlug(serviceSlug) {
  const sb = supabaseAnonServer();

  if (!serviceSlug) {
    const { data } = await sb
      .from("consultants")
      .select("id, display_name, headline, location, visibility")
      .eq("visibility", "public")
      .order("display_name", { ascending: true });
    return { consultants: data || [], activeService: null };
  }

  // Resolve service id + name by slug
  const { data: svc } = await sb
    .from("services")
    .select("id, name, slug")
    .eq("slug", serviceSlug)
    .limit(1)
    .maybeSingle();

  if (!svc) return { consultants: [], activeService: null };

  // Find consultant ids offering this service
  const { data: links } = await sb
    .from("consultant_services")
    .select("consultant_id")
    .eq("service_id", svc.id);

  const ids = (links || []).map((x) => x.consultant_id);
  if (ids.length === 0) return { consultants: [], activeService: svc };

  const { data: consultants } = await sb
    .from("consultants")
    .select("id, display_name, headline, location, visibility")
    .in("id", ids)
    .eq("visibility", "public")
    .order("display_name", { ascending: true });

  return { consultants: consultants || [], activeService: svc };
}

export default async function ConsultantsPage({ searchParams }) {
  const serviceSlug = searchParams?.service || "";
  const { consultants, activeService } = await getConsultantsByServiceSlug(serviceSlug);

  return (
    <main className="mx-auto max-w-screen-xl px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Consultants</h1>
        <AddConsultantButton />
      </div>

      {activeService ? (
        <div className="mt-2 text-sm text-slate-300">
          Filtering by service: <span className="font-medium text-white">{activeService.name}</span>
        </div>
      ) : (
        <div className="mt-2 text-sm text-slate-400">Browse all consultants.</div>
      )}

      <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {consultants.length === 0 ? (
          <div className="text-slate-400 text-sm">No consultants found for this service.</div>
        ) : (
          consultants.map((c) => (
            <article key={c.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 ring-1 ring-white/5">
              <h3 className="text-base font-semibold text-white">{c.display_name}</h3>
              {c.headline ? <p className="mt-1 text-sm text-slate-300">{c.headline}</p> : null}
              {c.location ? <div className="mt-1 text-xs text-slate-400">{c.location}</div> : null}
              <div className="mt-3">
                <Link
                  href={`/consultants/${c.id}`}
                  className="inline-flex items-center rounded-md bg-gradient-to-r from-sky-600 to-indigo-600 px-3 py-1.5 text-xs font-medium"
                >
                  View Profile
                </Link>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}