import ConsultantTabs from "../ConsultantTabs";
import { supabasePublicServer } from "@/lib/supabasePublicServer";
import OwnerEditButton from "./OwnerEditButton.client"; // ADD

export const revalidate = 300;

export default async function ConsultantPortfolioPage({ params }) {
  const { id } = await params;
  const sb = supabasePublicServer();

  const { data: consultant } = await sb
    .from("consultants")
    .select("id, display_name")
    .eq("id", id)
    .maybeSingle();

  const { data: portfolio } = await sb
    .from("consultant_portfolio")
    .select("overall_intro, images, attachment, updated_at")
    .eq("consultant_id", id)
    .maybeSingle();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8">
      <ConsultantTabs consultantId={id} active="portfolio" />

      {/* Header with owner-only edit button on the right */}
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">
            {consultant?.display_name || "Consultant"} · Portfolio
          </h1>
          {portfolio?.updated_at ? (
            <p className="mt-1 text-xs text-slate-400">
              Updated {new Date(portfolio.updated_at).toLocaleDateString()}
            </p>
          ) : null}
        </div>
        <OwnerEditButton consultantId={id} />
      </header>

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

          {/* Images grid */}
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
                    {/* Using native img to avoid external domain config for now */}
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

          {/* Attachment */}
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

          {/* Owner edit hint (we’ll render the real edit UI on /portfolio/edit) */}
          <div className="pt-2 text-xs text-slate-400">
            Owners can edit their portfolio from the “Edit portfolio” page.
          </div>
        </div>
      )}
    </main>
  );
}