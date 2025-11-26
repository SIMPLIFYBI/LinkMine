export const runtime = "nodejs";
export const revalidate = 180; // 3 minutes

import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { fetchPlaceDetails } from "@/lib/googlePlaces";
import ConsultantClaimButton from "@/app/components/ConsultantClaimButton";
import ConsultantSocialLinks from "@/app/components/ConsultantSocialLinks";
import TrackView from "./TrackView.client.jsx";
import ContactConsultantButton from "./ContactConsultantButton.client.jsx";
import ConsultantTabs from "./ConsultantTabs";
import PermissionsGate from "./PermissionsGate.client.jsx";

// Small formatting helpers for public display
function formatAbn(abn) {
  const d = String(abn || "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
}
function formatAcn(acn) {
  const d = String(acn || "").replace(/\D/g, "").slice(0, 9);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

async function getConsultant(id) {
  const sb = await supabaseServerClient();

  const { data } = await sb
    .from("consultants")
    // Added view_count to select; removed COUNT logic
    .select("*, view_count, linkedin_url, facebook_url, twitter_url, instagram_url")
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

  const { count: viewsCount = 0 } = await sb
    .from("consultant_page_views")
    .select("id", { head: true, count: "exact" })
    .eq("consultant_id", id);

  return {
    consultant: data,
    services: (svc || []).map((r) => r.service).filter(Boolean),
    ports: ports || [],
    viewsCount: viewsCount || 0,
  };
}

export default async function ConsultantPage(props) {
  const { id: consultantId } = await props.params;
  const data = await getConsultant(consultantId);
  if (!data) return notFound();

  const { consultant, services, ports, viewsCount } = data;

  const place = consultant.place_id
    ? await fetchPlaceDetails(consultant.place_id)
    : null;

  const rating = place?.rating ?? null;
  const reviewCount = place?.user_ratings_total ?? null;
  const topReviews = Array.isArray(place?.reviews)
    ? place.reviews.slice(0, 3)
    : [];

  return (
    <main className="relative mx-auto w-full max-w-4xl px-6 py-10 space-y-6">
      <TrackView consultantId={consultantId} source="consultant_profile" />

      <div className="flex items-start justify-between">
        <Link href="/consultants" className="text-sky-300 hover:underline">
          ← Back
        </Link>
        <PermissionsGate
          consultantId={consultantId}
          displayName={consultant.display_name}
          initialViewsCount={Number(viewsCount ?? 0)}
        />
      </div>

      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {consultant?.metadata?.logo?.url ? (
            <img
              src={consultant.metadata.logo.url}
              alt={`${consultant.display_name} logo`}
              width={112}
              height={112}
              decoding="async"
              loading="eager"
              className="h-28 w-28 shrink-0 rounded-lg bg-white/5 object-contain"
            />
          ) : null}
          <div>
            <h1 className="text-3xl font-semibold text-slate-50">{consultant.display_name}</h1>
            {consultant.abn_verified ? (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-100">
                  ✓ ABN verified
                </span>
              </div>
            ) : null}
            {consultant.headline ? (
              <p className="mt-1 text-sm text-slate-300">{consultant.headline}</p>
            ) : null}
            <ConsultantSocialLinks
              links={{
                linkedin_url: consultant.linkedin_url,
                facebook_url: consultant.facebook_url,
                twitter_url: consultant.twitter_url,
                instagram_url: consultant.instagram_url,
              }}
              className="mt-3"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ContactConsultantButton
            consultantId={consultantId}
            consultantName={consultant.display_name}
          />
        </div>
      </header>

      <ConsultantTabs consultantId={consultant.id} active="profile" />

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
          {/* NEW: Public business registration box (positive-only) */}
          {consultant.abn_verified ? (
            <article className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-6 text-sm text-emerald-100 shadow-sm ring-1 ring-emerald-400/20">
              <h2 className="text-lg font-semibold text-white">Business registration</h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-emerald-400/50 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold">
                  ✓ ABN verified
                </span>
                <span className="text-emerald-200/90">
                  {consultant.abn_entity_name ? <strong>{consultant.abn_entity_name}</strong> : null}
                  {consultant.abn_entity_type ? <> • {consultant.abn_entity_type}</> : null}
                  {consultant.abn ? <> • ABN {formatAbn(consultant.abn)}</> : null}
                  {consultant.acn ? <> • ACN {formatAcn(consultant.acn)}</> : null}
                  {consultant.abn_gst_registered_from ? (
                    <> • GST from {new Date(consultant.abn_gst_registered_from).toLocaleDateString()}</>
                  ) : null}
                </span>
              </div>
              {consultant.abn ? (
                <div className="mt-2 text-xs text-emerald-200/80">
                  Data sourced from ABN Lookup.{" "}
                  <a
                    href={`https://abr.business.gov.au/ABN/View?abn=${String(consultant.abn).replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                  >
                    View on ABN Lookup
                  </a>
                </div>
              ) : null}
            </article>
          ) : null}

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

          {/* ...existing Google location card... */}
        </aside>
      </div>

      <div className="mt-10">
        <ConsultantClaimButton
          consultantId={consultantId}
          isClaimed={Boolean(consultant.claimed_by)}
          contactEmail={consultant.contact_email}
        />
      </div>
    </main>
  );
}