export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { fetchPlaceDetails } from "@/lib/googlePlaces";
import ConsultantServicesManager from "@/app/components/ConsultantServicesManager";
import ConsultantClaimButton from "@/app/components/ConsultantClaimButton";
import ConsultantFavouriteButton from "@/app/components/ConsultantFavouriteButton";

async function getConsultant(id) {
  const sb = supabaseServerClient();

  // const { data, error } = await supabaseServer().from("consultants")...
  const { data, error } = await sb.from("consultants").select("*").eq("id", id).maybeSingle();

  if (!data || data.visibility !== "public") return null;

  const { data: svc } = await sb
    .from("consultant_services")
    .select("service:service_id (name, slug)")
    .eq("consultant_id", id);

  const { data: ports } = await sb
    .from("portfolios")
    .select("id, title, description, media_urls, links, created_at")
    .eq("consultant_id", id)
    .order("created_at", { ascending: false });

  return {
    c: data,
    services: (svc || []).map((r) => r.service).filter(Boolean),
    ports: ports || [],
  };
}

export default async function ConsultantProfilePage({ params }) {
  const sb = supabaseServerClient();
  const consultantId = params.id;

  // Load consultant and check ownership (adjust fields to your schema)
  const [{ data: consultantRow }, { data: authData }] = await Promise.all([
    sb
      .from("consultants")
      .select("id, display_name, owner, user_id, claimed_by")
      .eq("id", consultantId)
      .maybeSingle(),
    sb.auth.getUser(),
  ]);

  const userId = authData?.user?.id || null;
  const canEdit =
    !!userId &&
    (consultantRow?.owner === userId ||
      consultantRow?.user_id === userId ||
      consultantRow?.claimed_by === userId);

  let initialFavourite = false;
  if (userId) {
    const { data: favRow } = await sb
      .from("consultant_favourites")
      .select("consultant_id")
      .eq("consultant_id", consultantId)
      .eq("user_id", userId)
      .maybeSingle();

    initialFavourite = Boolean(favRow);
  }

  const data = await getConsultant(params.id);
  if (!data) return notFound();

  const { c: consultant, services, ports } = data;
  const place = consultant.place_id ? await fetchPlaceDetails(consultant.place_id) : null;

  const debugInfo =
    process.env.NODE_ENV === "development"
      ? {
          userId,
          consultantId,
          consultantOwner: consultantRow?.owner ?? null,
          consultantUserId: consultantRow?.user_id ?? null,
          consultantClaimedBy: consultantRow?.claimed_by ?? null,
          canEdit,
        }
      : null;

  return (
    <main className="mx-auto max-w-screen-xl px-4 py-6">
      {debugInfo ? (
        <pre className="mb-4 rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-slate-200/80">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      ) : null}
      <Link href="/consultants" className="text-sky-300 hover:underline">
        ← Back
      </Link>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-50">
            {consultant.display_name}
          </h1>
          <p className="mt-1 text-sm text-slate-300">{consultant.headline}</p>
        </div>
        <ConsultantFavouriteButton
          consultantId={consultantId}
          initialFavourite={initialFavourite}
        />
      </header>

      {consultant.place_id ? (
        <section className="mt-4">
          <h3 className="text-base font-semibold">Ratings</h3>

          {!place ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm ring-1 ring-white/5 text-slate-300">
              Loading Google rating…
            </div>
          ) : place.ok && place.rating ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm ring-1 ring-white/5">
              <span className="text-amber-400">★ {place.rating.toFixed(1)}</span>
              <span className="text-slate-300">({place.userRatingCount ?? 0})</span>
              <span className="text-slate-400">on Google</span>
            </div>
          ) : place.ok && !place.rating ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm ring-1 ring-white/5 text-slate-300">
              No Google rating available.
            </div>
          ) : (
            <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              Google Places error: {place?.error || "Unknown error"}
            </div>
          )}

          {place?.ok && place?.reviews?.length ? (
            <ul className="mt-3 space-y-2">
              {place.reviews.slice(0, 3).map((r, i) => (
                <li key={i} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm ring-1 ring-white/5">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-100">
                      {r.authorAttribution?.displayName || "Google user"}
                    </strong>
                    {typeof r.rating === "number" && (
                      <span className="text-amber-400 text-xs">★ {r.rating.toFixed(1)}</span>
                    )}
                  </div>
                  {r.text?.text ? <p className="mt-1 text-slate-300">{r.text.text}</p> : null}
                  {r.publishTime ? (
                    <div className="mt-1 text-xs text-slate-400">
                      {new Date(r.publishTime).toLocaleDateString()}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-2 text-[11px] text-slate-400">
            Powered by Google • <a className="text-sky-300 hover:underline" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consultant.display_name)}&query_place_id=${encodeURIComponent(consultant.place_id)}`} target="_blank" rel="noreferrer">View on Google Maps</a>
          </div>
        </section>
      ) : null}

      <section className="mt-6">
        <h3 className="text-base font-semibold">About</h3>
        <p className="mt-1 text-slate-300">{consultant.bio || "No description provided."}</p>

        {services?.length ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {services.map((s) => (
              <li key={s.slug}>
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white px-3 py-1 text-xs font-medium shadow-sm ring-1 ring-white/10 hover:from-sky-500 hover:to-indigo-500">
                  {s.name}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="mt-6">
        <h3 className="text-base font-semibold">Portfolio</h3>
        {ports.length === 0 ? (
          <div className="mt-2 text-slate-400">No portfolio items yet.</div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ports.map((p) => (
              <article key={p.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] ring-1 ring-white/5">
                <div className="h-40 bg-slate-800/40">
                  {Array.isArray(p.media_urls) && p.media_urls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.media_urls[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-slate-400 text-sm">No image</div>
                  )}
                </div>
                <div className="p-3">
                  <strong className="text-slate-100">{p.title}</strong>
                  {p.description ? <p className="mt-1 text-slate-300 text-sm">{p.description}</p> : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <ConsultantServicesManager consultantId={consultantId} canEdit={canEdit} />
      <ConsultantClaimButton
        consultantId={consultantId}
        isClaimed={Boolean(consultant.claimed_by)}
        canEdit={canEdit}
        contactEmail={consultant.contact_email}
      />
    </main>
  );
}