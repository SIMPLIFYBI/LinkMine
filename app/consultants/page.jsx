export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabaseAnonServer } from "@/lib/supabaseAnonServer";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import AddConsultantButton from "@/app/components/consultants/AddConsultantButton";
import ConsultantFavouriteButton from "@/app/components/ConsultantFavouriteButton";

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

  const sb = await supabaseServerClient();

  const {
    data: { user },
  } = await sb.auth.getUser();

  const userId = user?.id ?? null;
  let favouriteIds = new Set();
  if (userId) {
    const { data: favRows } = await sb
      .from("consultant_favourites")
      .select("consultant_id")
      .eq("user_id", userId);

    favouriteIds = new Set(favRows?.map((row) => row.consultant_id) ?? []);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 space-y-8">
      <section className="rounded-3xl border border-sky-400/30 bg-sky-500/10 p-6 text-slate-100 shadow-lg ring-1 ring-sky-400/20">
        <h1 className="text-2xl font-semibold text-white">
          Want to join MineHub and add your consultancy?
        </h1>
        <p className="mt-2 text-sm text-slate-200">
          Showcase your services to potential clients and manage your profile directly on MineLink.
        </p>
        <div className="mt-4 inline-flex items-center">
          <AddConsultantButton className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-slate-100" />
        </div>
      </section>

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
            <article
              key={c.id}
              className="relative rounded-xl border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/5 transition hover:border-white/20"
            >
              <div className="absolute right-4 top-4">
                <ConsultantFavouriteButton
                  consultantId={c.id}
                  initialFavourite={favouriteIds.has(c.id)}
                />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {c.display_name}
              </h3>
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

      <div className="mt-4 inline-flex items-center">
        <AddConsultantButton className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-slate-100" />
      </div>
    </main>
  );
}