import Link from "next/link";
import { notFound } from "next/navigation";
import { getLandingEntry, landingPages } from "../registry";
import { HeroSection } from "../components/HeroSection";
import { supabasePublicServer } from "@/lib/supabasePublicServer";

export const revalidate = 3600;

// Static params for prerender
export async function generateStaticParams() {
  return landingPages.map(p => ({ slug: p.slug }));
}

// Dynamic metadata
export async function generateMetadata({ params }) {
  const entry = getLandingEntry(params.slug);
  if (!entry) {
    return { title: "YouMine", description: "Consultants marketplace" };
  }
  return {
    title: entry.title,
    description: entry.description,
    alternates: { canonical: `/landing/${entry.slug}` },
    openGraph: {
      title: entry.title,
      description: entry.description,
      url: `/landing/${entry.slug}`,
      siteName: "YouMine",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "YouMine" }],
      type: "article"
    },
    twitter: {
      card: "summary_large_image",
      title: entry.title,
      description: entry.description,
      images: ["/og-image.png"]
    }
  };
}

// Deterministic daily shuffle
function seededShuffle(arr, seedStr) {
  if (!Array.isArray(arr) || arr.length < 2) return arr;
  const seedBase = Array.from(String(seedStr || "")).reduce(
    (h, c) => (h * 33 + c.charCodeAt(0)) >>> 0,
    0x9e3779b1
  );
  let state = seedBase;
  const rng = () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state ^ (state >>> 15);
    t = Math.imul(t, t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Fetch showcase consultants by category slug
async function fetchShowcase(entry) {
  if (!entry?.showcase || !entry.categorySlug) return [];
  const sb = supabasePublicServer();

  // Category
  const { data: category, error: catErr } = await sb
    .from("service_categories")
    .select("id, slug")
    .eq("slug", entry.categorySlug)
    .maybeSingle();
  if (catErr || !category) return [];

  // Services in category
  const { data: services, error: svcErr } = await sb
    .from("services")
    .select("id")
    .eq("category_id", category.id);
  if (svcErr || !services?.length) return [];

  const serviceIds = services.map(s => s.id);

  // Links consultant -> services
  const { data: links, error: linkErr } = await sb
    .from("consultant_services")
    .select("consultant_id, service_id")
    .in("service_id", serviceIds);
  if (linkErr || !links?.length) return [];

  const consultantIds = Array.from(new Set(links.map(l => l.consultant_id).filter(Boolean)));
  if (!consultantIds.length) return [];

  // Consultants
  const { data: consultants, error: consErr } = await sb
    .from("consultants")
    .select("id, display_name, headline, location, metadata, visibility, status")
    .in("id", consultantIds)
    .eq("visibility", "public")
    .eq("status", "approved");
  if (consErr || !consultants?.length) return [];

  const limit = entry.showcase.limit ?? 6;
  if (entry.showcase.dailyRotate) {
    const dayKey = new Date().toISOString().slice(0, 10);
    return seededShuffle(consultants, dayKey).slice(0, limit);
  }
  return consultants
    .slice()
    .sort((a, b) => String(a.display_name || "").localeCompare(String(b.display_name || "")))
    .slice(0, limit);
}

// Page component
export default async function LandingPage({ params }) {
  const entry = getLandingEntry(params.slug);
  if (!entry) return notFound();

  const browseHref = entry.categorySlug
    ? `/consultants?category=${encodeURIComponent(entry.categorySlug)}`
    : entry.serviceSlug
    ? `/consultants?service=${encodeURIComponent(entry.serviceSlug)}`
    : "/consultants";

  const showcaseConsultants = await fetchShowcase(entry);

  const faqLd = entry.faqs?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: entry.faqs.map(f => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a }
        }))
      }
    : null;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-16">
      <HeroSection hero={entry.hero} browseHref={browseHref} />

      {entry.showcase && (
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">{entry.showcase.heading}</h2>
            <Link
              href={browseHref}
              className="text-xs font-semibold text-sky-300 underline-offset-2 hover:underline"
            >
              See more
            </Link>
          </div>
          {showcaseConsultants.length === 0 ? (
            <p className="text-sm text-slate-400">
              Consultants offering any services in this category will appear here as they are approved.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {showcaseConsultants.map(c => {
                const logo = c?.metadata?.logo?.url || "";
                return (
                  <Link
                    key={c.id}
                    href={`/consultants/${c.id}`}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:border-sky-400/30 hover:bg-white/[0.06]"
                  >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500/70 via-indigo-400/70 to-sky-500/70" />
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
                        {logo ? (
                          <img
                            src={logo}
                            alt={`${c.display_name} logo`}
                            width={56}
                            height={56}
                            loading="lazy"
                            decoding="async"
                            className="h-14 w-14 object-contain"
                          />
                        ) : (
                          <div className="text-sm font-semibold text-slate-300">
                            {c.display_name?.slice(0, 1) || "•"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-lg font-semibold tracking-tight text-white">
                          {c.display_name}
                        </div>
                        {c.headline && (
                          <div className="mt-1 line-clamp-2 text-sm text-slate-300">{c.headline}</div>
                        )}
                        {c.location && (
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-400/70" />
                            <span className="truncate">{c.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-slate-400">Profile</span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-300">
                        View
                        <svg
                          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L13.586 11H4a1 1 0 110-2h9.586l-3.293-3.293a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    </div>
                    <div
                      className="pointer-events-none absolute -inset-20 -z-10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-10"
                      style={{
                        background: "radial-gradient(600px circle at 0% 0%, rgba(56,189,248,0.35), transparent 40%)"
                      }}
                    />
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {entry.problem?.length > 0 && (
        <section className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/10">
          <h2 className="text-xl font-semibold text-white">The problem</h2>
          <ul className="grid list-disc gap-2 pl-5 text-sm text-slate-200">
            {entry.problem.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </section>
      )}

      {entry.services?.length > 0 && (
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/10">
          <h2 className="text-xl font-semibold text-white">Services consultants offer</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {entry.services.map((s, i) => (
              <article
                key={i}
                className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 ring-1 ring-white/10"
              >
                <h3 className="text-sm font-semibold text-sky-100">{s.title}</h3>
                {s.bullets?.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-200">
                    {s.bullets.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
          <div className="mt-5">
            <Link href={browseHref} className="text-sky-300 underline-offset-2 hover:underline">
              Browse consultants offering these services →
            </Link>
          </div>
        </section>
      )}

      {entry.where && (
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/10">
          <h2 className="text-xl font-semibold text-white">Where consultants operate</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Regions", entry.where.regions],
              ["Commodities", entry.where.commodities],
              ["Methods", entry.where.methods],
              ["Delivery", entry.where.delivery],
              ["Lifecycle", entry.where.lifecycle]
            ].map(([label, list]) =>
              list?.length ? (
                <div key={label}>
                  <h3 className="text-sm font-semibold text-slate-100">{label}</h3>
                  <ul className="mt-1 text-sm text-slate-200">
                    {list.map(v => (
                      <li key={v}>{v}</li>
                    ))}
                  </ul>
                </div>
              ) : null
            )}
          </div>
        </section>
      )}

      {entry.proof?.length > 0 && (
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/10">
          <h2 className="text-xl font-semibold text-white">Representative outcomes</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {entry.proof.map((c, i) => (
              <article
                key={i}
                className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 ring-1 ring-white/10"
              >
                <h3 className="text-sm font-semibold text-sky-100">{c.heading}</h3>
                <p className="mt-2 text-sm text-slate-200">{c.body}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {entry.who?.length > 0 && (
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/10">
          <h2 className="text-xl font-semibold text-white">Who our consultants serve</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-200">
            {entry.who.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </section>
      )}

      {entry.engagement?.length > 0 && (
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/10">
          <h2 className="text-xl font-semibold text-white">How engagement typically works</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-200">
            {entry.engagement.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ol>
          <div className="mt-5">
            <Link href={browseHref} className="text-sky-300 underline-offset-2 hover:underline">
              Connect with consultants →
            </Link>
          </div>
        </section>
      )}

      <div className="sticky bottom-4 z-10 mx-auto w-full max-w-6xl px-2">
        <div className="rounded-2xl border border-sky-400/30 bg-sky-500/10 p-3 text-center shadow ring-1 ring-sky-400/20 backdrop-blur">
          <Link href={browseHref} className="inline-flex">
            <button className="rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white">
              Browse consultants now
            </button>
          </Link>
        </div>
      </div>

      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}
    </main>
  );
}