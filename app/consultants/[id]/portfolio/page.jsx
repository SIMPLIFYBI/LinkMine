import { notFound } from "next/navigation";
import { supabasePublicServer } from "@/lib/supabasePublicServer";
import TopSection from "../TopSection";
import OwnerEditButton from "./OwnerEditButton.client";

export const revalidate = 300;

export default async function ConsultantPortfolioPage({ params }) {
  const { id } = await params;
  const sb = supabasePublicServer();

  // Fetch more fields so TopSection matches the Profile page
  const { data: consultant } = await sb
    .from("consultants")
    .select("id, display_name, metadata, view_count, headline, abn_verified, linkedin_url, facebook_url, twitter_url, instagram_url")
    .eq("id", id)
    .maybeSingle();

  if (!consultant || consultant.visibility === "private") return notFound();

  const { data: portfolio } = await sb
    .from("consultant_portfolio")
    .select("overall_intro, images, attachment, updated_at, links")
    .eq("consultant_id", id)
    .maybeSingle();

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10 space-y-6">
      {/* Shared top section identical to Profile page */}
      <TopSection
        consultantId={id}
        consultant={consultant}
        initialViewsCount={Number(consultant.view_count ?? 0)}
        active="portfolio"
        showTrack
      />

      {/* Small toolbar just under tabs to preserve existing portfolio affordances */}
      <div className="mb-2 flex items-start justify-between gap-3">
        {portfolio?.updated_at ? (
          <p className="text-xs text-slate-400">
            Updated {new Date(portfolio.updated_at).toLocaleDateString()}
          </p>
        ) : <span />}
        <OwnerEditButton consultantId={id} />
      </div>

      {/* Existing portfolio content remains unchanged, just shifted below the tabs */}
      {!portfolio ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-slate-300">
          This consultant hasn’t published a portfolio yet.
        </div>
      ) : (
        <div className="space-y-6">
          {portfolio.overall_intro ? (
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-slate-200">
              <p className="whitespace-pre-wrap">{portfolio.overall_intro}</p>
            </section>
          ) : null}

          {Array.isArray(portfolio.images) && portfolio.images.length > 0 ? (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-slate-100">Project photos</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {portfolio.images.slice(0, 3).map((img, idx) => (
                  <figure
                    key={idx}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 ring-1 ring-white/10"
                  >
                    {img?.title ? (
                      <h3 className="mb-2 text-sm font-semibold text-slate-100">
                        {img.title}
                      </h3>
                    ) : null}
                    {img?.url ? (
                      <img
                        src={img.url}
                        alt={img?.alt || "Portfolio image"}
                        className="h-48 w-full rounded-lg object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-48 w-full rounded-lg bg-white/5" />
                    )}
                    {img?.caption ? (
                      <figcaption className="mt-2 text-sm text-slate-300 whitespace-pre-wrap">
                        {img.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          {portfolio.attachment?.url ? (
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 ring-1 ring-white/10">
              <h2 className="text-sm font-semibold text-slate-100">Project document</h2>
              {portfolio.attachment.caption ? (
                <p className="mt-1 text-sm text-slate-300 whitespace-pre-wrap">
                  {portfolio.attachment.caption}
                </p>
              ) : null}
              <a
                href={portfolio.attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 hover:border-sky-300 hover:bg-sky-500/20"
              >
                {portfolio.attachment.name || "Download attachment (PDF)"}
              </a>
            </section>
          ) : null}

          {Array.isArray(portfolio?.links) && portfolio.links.length > 0 ? (
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <h2 className="mb-2 text-lg font-semibold text-white">Related links</h2>
              <ul className="space-y-1">
                {portfolio.links.map((l, i) => {
                  const url = String(l?.url || "").trim();
                  const label = String(l?.label || "").trim();
                  let text = label;
                  try {
                    if (!text) text = new URL(url).hostname.replace(/^www\./i, "");
                  } catch {}
                  return url ? (
                    <li key={i}>
                      <a
                        href={url}
                        target="_blank"
                        rel="nofollow ugc noopener"
                        className="text-sky-300 hover:underline break-words"
                      >
                        {text || url}
                      </a>
                    </li>
                  ) : null;
                })}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </main>
  );
}