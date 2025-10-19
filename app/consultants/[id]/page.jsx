export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { fetchPlaceDetails } from "@/lib/googlePlaces";
import ConsultantClaimButton from "@/app/components/ConsultantClaimButton";
import ConsultantFavouriteButton from "@/app/components/ConsultantFavouriteButton";
import TrackView from "./TrackView.client.jsx";

async function getConsultant(id) {
  const sb = await supabaseServerClient();

  // Resolve current user (for favourite + permissions)
  const { data: auth } = await sb.auth.getUser();
  const userId = auth?.user?.id || null;

  const { data, error } = await sb
    .from("consultants")
    .select("*")
    .eq("id", id)
    .maybeSingle();

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

  // Fetch total page views for this consultant
  const { count: viewsCount = 0 } = await sb
    .from("consultant_page_views")
    .select("id", { count: "exact", head: true })
    .eq("consultant_id", id);

  // User-specific: initial favourite + edit permission
  let initialFavourite = false;
  if (userId) {
    const { data: fav } = await sb
      .from("consultant_favourites")
      .select("id")
      .eq("user_id", userId)
      .eq("consultant_id", id)
      .maybeSingle();
    initialFavourite = Boolean(fav);
  }

  const canEdit = Boolean(userId && data.claimed_by === userId);

  return {
    consultant: data,
    services: (svc || []).map((r) => r.service).filter(Boolean),
    ports: ports || [],
    viewsCount,
    userId,
    initialFavourite,
    canEdit,
  };
}

export default async function ConsultantPage({ params }) {
  const consultantId = params.id; // fixed: no await
  const data = await getConsultant(consultantId);
  if (!data) return notFound();

  const { consultant, services, ports, viewsCount, userId, initialFavourite, canEdit } = data;

  const place = consultant.place_id
    ? await fetchPlaceDetails(consultant.place_id)
    : null;

  const rating = place?.rating ?? null;
  const reviewCount = place?.user_ratings_total ?? null;
  const topReviews = Array.isArray(place?.reviews)
    ? place.reviews.slice(0, 3)
    : [];

  const isOwner = Boolean(userId && consultant.claimed_by === userId);

  return (
    <main className="relative mx-auto w-full max-w-4xl px-6 py-10 space-y-6">
      {/* Track page view */}
      <TrackView consultantId={consultantId} source="consultant_profile" />

      {/* Views badge (top-right) */}
      <div className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 ring-1 ring-white/10">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-300" fill="currentColor" aria-hidden="true">
          <path d="M12 5c4.5 0 8.3 2.9 10 7-1.7 4.1-5.5 7-10 7S3.7 16.1 2 12c1.7-4.1 5.5-7 10-7zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
        </svg>
        <span>{viewsCount.toLocaleString()} views</span>
      </div>

      <div className="flex items-center justify-between">
        <Link href="/consultants" className="text-sky-300 hover:underline">
          ← Back
        </Link>

        {isOwner && (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/70 bg-emerald-500/15 px-4 py-1.5 text-sm md:text-base font-semibold text-emerald-100 shadow-sm ring-1 ring-emerald-300/30">
              You are the owner of this page
            </span>
            <Link
              href={`/consultants/${consultantId}/edit`}
              className="inline-flex items-center gap-2 rounded-full border border-sky-400/60 bg-sky-500/15 px-4 py-1.5 text-sm font-semibold text-sky-100 hover:border-sky-300 hover:bg-sky-500/25"
            >
              Edit profile
            </Link>
          </div>
        )}
      </div>

      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-50">
            {consultant.display_name}
          </h1>
          {consultant.headline ? (
            <p className="mt-1 text-sm text-slate-300">
              {consultant.headline}
            </p>
          ) : null}
        </div>
        <ConsultantFavouriteButton
          consultantId={consultantId}
          initialFavourite={initialFavourite}
        />
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr,1fr]">
        <section className="space-y-6">
          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-slate-100 shadow-sm ring-1 ring-white/5">
            <h2 className="text-lg font-semibold text-white">About</h2>
            {consultant.bio ? (
              <p className="mt-3 whitespace-pre-line text-sm text-slate-200">
                {consultant.bio}
              </p>
            ) : (
              <p className="mt-3 text-sm text-slate-400">
                This consultant hasn’t added a bio yet.
              </p>
            )}
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-slate-100 shadow-sm ring-1 ring-white/5">
            <h2 className="text-lg font-semibold text-white">
              Services offered
            </h2>
            {services.length ? (
              <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                {services.map((svc) => (
                  <li
                    key={svc.slug ?? svc.name}
                    className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-slate-200"
                  >
                    {svc.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-400">
                No services listed yet.
              </p>
            )}
          </article>

          {ports.length ? (
            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-slate-100 shadow-sm ring-1 ring-white/5">
              <h2 className="text-lg font-semibold text-white">
                Portfolio highlights
              </h2>
              <div className="mt-4 space-y-5">
                {ports.map((port) => (
                  <div
                    key={port.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"
                  >
                    <div className="text-sm font-semibold text-white">
                      {port.title}
                    </div>
                    {port.description ? (
                      <p className="mt-2 text-sm text-slate-300">
                        {port.description}
                      </p>
                    ) : null}
                    {Array.isArray(port.links) && port.links.length ? (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {port.links.map((link) => (
                          <Link
                            key={link}
                            href={link}
                            target="_blank"
                            className="rounded-full border border-sky-400/50 bg-sky-500/10 px-3 py-1 text-sky-100 hover:border-sky-300 hover:bg-sky-500/20"
                          >
                            View link
                          </Link>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </article>
          ) : null}

          {rating ? (
            <article className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-6 text-slate-100 shadow-sm">
              <h2 className="text-lg font-semibold text-white">
                Google rating
              </h2>
              <div className="mt-4 flex items-center gap-3 text-xl font-semibold text-amber-200">
                <span>{rating.toFixed(1)}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <span key={idx}>★</span>
                  ))}
                </div>
              </div>
              {typeof reviewCount === "number" ? (
                <p className="mt-2 text-sm text-amber-100/80">
                  Based on {reviewCount} Google review
                  {reviewCount === 1 ? "" : "s"}.
                </p>
              ) : null}
              {topReviews.length ? (
                <ul className="mt-4 space-y-4">
                  {topReviews.map((rev, idx) => {
                    const reviewText =
                      typeof rev?.text === "string"
                        ? rev.text
                        : rev?.text?.text ?? "";

                    if (!reviewText) return null;

                    return (
                      <li
                        key={rev?.time || rev?.author_url || idx}
                        className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">
                            {rev?.author_name ?? "Anonymous reviewer"}
                          </span>
                          {rev?.rating ? (
                            <span className="text-amber-200">
                              {rev.rating} ★
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-slate-200">{reviewText}</p>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </article>
          ) : null}
        </section>

        <aside className="space-y-6">
          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-slate-200 shadow-sm ring-1 ring-white/5">
            <h2 className="text-lg font-semibold text-white">Contact</h2>
            <dl className="mt-3 space-y-3">
              {consultant.contact_email ? (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">
                    Email
                  </dt>
                  <dd>
                    <a
                      href={`mailto:${consultant.contact_email}`}
                      className="text-sky-300 hover:underline"
                    >
                      {consultant.contact_email}
                    </a>
                  </dd>
                </div>
              ) : null}

              {consultant.phone ? (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">
                    Phone
                  </dt>
                  <dd>{consultant.phone}</dd>
                </div>
              ) : null}

              {consultant.website_url ? (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">
                    Website
                  </dt>
                  <dd>
                    <Link
                      href={consultant.website_url}
                      target="_blank"
                      className="text-sky-300 hover:underline"
                    >
                      {consultant.website_url.replace(/^https?:\/\//, "")}
                    </Link>
                  </dd>
                </div>
              ) : null}

              {consultant.location ? (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">
                    Location
                  </dt>
                  <dd>{consultant.location}</dd>
                </div>
              ) : null}
            </dl>
          </article>

          {place?.formatted_address ? (
            <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-slate-200 shadow-sm ring-1 ring-white/5">
              <h2 className="text-lg font-semibold text-white">
                Google location
              </h2>
              <p className="mt-2">{place.formatted_address}</p>
              {place?.url ? (
                <Link
                  href={place.url}
                  target="_blank"
                  className="mt-3 inline-flex items-center rounded-full border border-sky-400/60 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-100 hover:border-sky-300 hover:bg-sky-500/20"
                >
                  View on Google Maps
                </Link>
              ) : null}
            </article>
          ) : null}
        </aside>
      </div>

      <div className="mt-10">
        <ConsultantClaimButton
          consultantId={consultantId}
          isClaimed={Boolean(consultant.claimed_by)}
          canEdit={canEdit}
          contactEmail={consultant.contact_email}
        />
      </div>

      {process.env.NODE_ENV !== "production" && (
        <details className="mt-4 rounded-xl border border-sky-400/30 bg-sky-500/10 p-4 text-xs text-sky-100">
          <summary className="cursor-pointer font-semibold">Claim debug</summary>
          <pre className="mt-2 whitespace-pre-wrap break-words">
            {JSON.stringify(
              {
                userId,
                claimedBy: consultant.claimed_by || null,
                isClaimed: Boolean(consultant.claimed_by),
                canEdit,
              },
              null,
              2
            )}
          </pre>
        </details>
      )}
    </main>
  );
}