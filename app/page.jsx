export const revalidate = 300; // 5 minutes

import React from "react";
import Link from "next/link";
import Image from "next/image";
import ServiceFinder from "@/app/components/ServiceFinder";
import { supabasePublicServer } from "@/lib/supabasePublicServer";

const heroImage = "/Pictures/pexels-urtimud-89-76108288-14263363.jpg";

export const metadata = {
  title: "YouMine — Find mining consultants and contractors fast",
  description:
    "YouMine connects mining clients with trusted consultants and contractors. Browse services, view portfolios, and contact experts directly.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "YouMine — Find mining consultants and contractors fast",
    description:
      "Discover trusted mining consultants and contractors by service. View portfolios and contact experts directly.",
    url: "/",
    siteName: "YouMine",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "YouMine" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "YouMine — Find mining consultants and contractors fast",
    description:
      "Discover trusted mining consultants and contractors by service. View portfolios and contact experts directly.",
    images: ["/og-image.png"],
  },
};

async function getStatsAndFeatured() {
  try {
    const sb = supabasePublicServer();

    const { data: featured = [] } = await sb
      .from("consultants")
      .select("id, display_name, headline, location, metadata")
      .eq("visibility", "public")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(24);

    // LIMIT TO 9 categories for 3x3 layout
    const { data: categories = [] } = await sb
      .from("service_categories")
      .select("id, name, slug")
      .order("position", { ascending: true })
      .order("name", { ascending: true })
      .limit(9);

    return { featured, categories };
  } catch {
    return { featured: [], categories: [] };
  }
}

// Lightweight icon set mapped by slug keywords (fallback to generic)
function CategoryIcon({ slug }) {
  const s = (slug || "").toLowerCase();

  // Pick an icon by simple heuristics; fallback is a grid icon
  const path = (() => {
    if (/(drill|rig)/.test(s)) return "M3 12l18-6-6 18-3-7-7-3z"; // paper plane/drill-ish
    if (/(geo|survey|map)/.test(s)) return "M3 6l6-3 6 3 6-3v12l-6 3-6-3-6 3z"; // layered terrain
    if (/(plan|manage|project)/.test(s)) return "M4 6h16v4H4V6zm0 6h10v4H4v-4z"; // panels
    if (/(sample|lab|assay|core)/.test(s)) return "M7 4h10l-1 12a4 4 0 01-8 0L7 4z M9 4v12"; // flask-ish
    if (/(safety|hse)/.test(s)) return "M12 2l7 4v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-4z"; // shield
    if (/(mine|haul|truck)/.test(s)) return "M3 9h14l4 5v3h-3a3 3 0 11-6 0H9a3 3 0 11-6 0H3V9z"; // truck
    if (/(env|water|rehab)/.test(s)) return "M12 2c4 4 6 7 6 10a6 6 0 11-12 0c0-3 2-6 6-10z"; // leaf
    if (/(it|data|ai|software)/.test(s)) return "M4 6h16v8H4V6zm3 10h10v2H7v-2z"; // monitor
    return "M4 5h16v4H4V5zm0 6h10v4H4v-4zm12 0h4v4h-4v-4z"; // grid
  })();

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

export default async function HomePage() {
  const showPreview = true;
  const { featured, categories } = await getStatsAndFeatured();

  // Deterministic daily rotation (UTC) for featured
  const tzOffsetMinutes = 0;
  const now = new Date(Date.now() + tzOffsetMinutes * 60_000);
  const dayKey = now.toISOString().slice(0, 10);

  const seedFromString = (str) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
      h >>>= 0;
    }
    return h >>> 0;
  };
  const mulberry32 = (a) => () => {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const seededShuffle = (arr, seed) => {
    const rng = mulberry32(seed);
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const rotatedFeatured = seededShuffle(featured, seedFromString(dayKey)).slice(0, 3);

  const sampleListings = [
    { id: 1, name: "Acme Drilling", services: "Drilling • Sampling", location: "Kalgoorlie, WA" },
    { id: 2, name: "GeoConsult", services: "Geotech • Logging", location: "Perth, WA" },
    { id: 3, name: "CoreWorks", services: "Core Processing • Analysis", location: "Adelaide, SA" },
  ];

  const testimonials = [
    {
      name: "Sophie Carter",
      role: "Operations Manager, Pilbara Mines",
      quote:
        "We filled a specialist role in days, not weeks. The portfolio previews gave us confidence to move fast.",
    },
    {
      name: "Daniel Hayes",
      role: "Project Lead, CoreWorks",
      quote:
        "Clear profiles and direct contact made shortlisting effortless. We saved a heap of back-and-forth.",
    },
    {
      name: "Priya Nair",
      role: "Senior Geologist, TerraWest",
      quote:
        "Found exactly the expertise we needed on a tight timeline. Great experience end-to-end.",
    },
    {
      name: "Liam O’Reilly",
      role: "Site Supervisor, Red Hill",
      quote:
        "Strong selection of contractors and transparent profiles. We’ll be back for the next phase.",
    },
  ];

  // JSON-LD (Organization + FAQ)
  const faqItems = [
    {
      q: "How do I contact a consultant?",
      a: "Open the consultant’s profile and use the Contact button to send a message directly.",
    },
    {
      q: "How does YouMine verify profiles?",
      a: "Profiles are linked to authenticated users and reviewed before approval.",
    },
    {
      q: "Can I add a portfolio?",
      a: "Yes. Consultants can upload a logo, images, and a PDF to showcase projects.",
    },
  ];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "name": "YouMine",
        "url": "https://youmine.com.au",
        "logo": "https://youmine.com.au/og-image.png",
        "contactPoint": [{ "@type": "ContactPoint", "email": "info@youmine.com.au", "contactType": "customer support" }],
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqItems.map((f) => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a },
        })),
      },
    ],
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-10">
      {/* Hero */}
      <section className="relative left-1/2 right-1/2 w-screen -ml-[50vw] -mr-[50vw] min-h-[240px] md:min-h-[300px] overflow-hidden">
        <Image
          src={heroImage}
          alt="YouMine — consultants and contractors in mining"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/25 via-slate-900/45 to-slate-950/85" />
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-5 px-6 py-10 text-center sm:px-12 md:py-14">
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl leading-tight">
            Stop searching, start mining: match with the right expert today.
          </h1>
          <p className="max-w-2xl text-base text-slate-200 sm:text-lg">
            Discover trusted consultants and contractors, review portfolios, and contact directly.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="inline-flex">
              <button className="rounded-md bg-slate-700 px-4 py-2 text-white transition hover:bg-slate-600">
                Get started — it's free
              </button>
            </Link>
            <Link href="/consultants" className="inline-flex">
              <button className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-slate-100 shadow-lg backdrop-blur-md ring-1 ring-white/10 transition hover:border-white/30 hover:bg-white/15 hover:ring-white/20">
                Explore consultants
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Value prop + 3x3 category grid side-by-side */}
      <section className="mx-auto w-full max-w-6xl px-2 md:px-4">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start">
          {/* Left: existing value prop */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold md:text-[32px]">
              Connect mining clients with trusted contractors & consultants
            </h2>
            <p className="text-slate-300">
              YouMine is a directory & portfolio platform for the mining industry — discover contractors,
              review portfolios, and for consultants, showcase work and see profile metrics.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup" className="inline-flex">
                <button className="rounded-md bg-slate-700 px-4 py-2 text-white transition hover:bg-slate-600">
                  Get started — it's free
                </button>
              </Link>
              <Link href="/explore" className="inline-flex">
                <button className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-slate-100 transition hover:border-white/20 hover:bg-white/10">
                  Explore listings
                </button>
              </Link>
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-400 text-sm">
              <li>Business tiles for clients to showcase services</li>
              <li>Consultant profiles with portfolio galleries</li>
              <li>View metrics like profile views and favourites</li>
            </ul>
          </div>

          {/* Right: 3x3 category grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white tracking-wide">Browse by category</h3>
              <Link
                href="/consultants"
                className="text-xs font-medium text-sky-300 hover:text-sky-200 hover:underline underline-offset-2"
              >
                View all
              </Link>
            </div>

            {categories.length === 0 ? (
              <p className="text-xs text-slate-400">Categories are coming soon.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/consultants?category=${encodeURIComponent(c.slug)}`}
                    prefetch
                    className="
                      group relative flex flex-col gap-2 rounded-xl
                      border border-white/10 bg-white/[0.06] p-3
                      text-left shadow-sm ring-1 ring-white/10 transition
                      hover:-translate-y-[2px] hover:border-sky-300/40 hover:bg-white/[0.1]
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50
                    "
                    aria-label={`Browse ${c.name}`}
                  >
                    {/* Accent bar */}
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-xl bg-gradient-to-r from-sky-500/60 via-cyan-300/60 to-sky-500/60 opacity-70 group-hover:opacity-90" />

                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg
                                 bg-sky-500/15 text-sky-200 ring-1 ring-inset ring-sky-400/30
                                 transition-colors group-hover:bg-sky-500/25"
                    >
                      <CategoryIcon slug={c.slug} />
                    </span>
                    <span className="line-clamp-2 text-[11px] font-medium leading-tight text-slate-100">
                      {c.name}
                    </span>

                    {/* Subtle glow */}
                    <div
                      className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-20"
                      style={{
                        background:
                          "radial-gradient(circle at 30% 25%, rgba(56,189,248,0.35), transparent 70%)",
                      }}
                    />
                  </Link>
                ))}
              </div>
            )}
            <p className="text-[10px] text-slate-500">
              Choose a category to filter consultants by their offered services.
            </p>
          </div>
        </div>
      </section>

      {/* Service finder — glassmorphic combobox */}
      <section className="mx-auto w-full max-w-screen-md px-4">
        <ServiceFinder className="mt-4" />
      </section>

      {/* Featured consultants — 3 cards, rotates daily */}
      <section className="mx-auto w-full max-w-screen-lg px-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Featured consultants</h3>
          <Link href="/consultants" className="text-xs text-sky-300 underline-offset-2 hover:underline">
            View all
          </Link>
        </div>

        {rotatedFeatured.length === 0 ? (
          <p className="text-sm text-slate-300">New profiles are being approved—check back soon.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rotatedFeatured.map((c) => {
              const logo = c?.metadata?.logo?.url || "";
              return (
                <Link
                  key={c.id}
                  href={`/consultants/${c.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 ring-1 ring-white/10 transition-all duration-200 hover:-translate-y-[2px] hover:border-sky-300/30 hover:bg-white/[0.06] hover:shadow-[0_0_0_1px_rgba(125,211,252,0.25)]"
                >
                  {/* Gradient top bar accent */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-sky-500/70 via-cyan-400/70 to-sky-500/70" />

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
                      {c.headline ? (
                        <div className="mt-1 line-clamp-2 text-sm text-slate-300">
                          {c.headline}
                        </div>
                      ) : null}
                      {c.location ? (
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-400/70" />
                          <span className="truncate">{c.location}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Verified profile</span>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-sky-300">
                      View profile
                      <svg
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10.293 3.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L13.586 11H4a1 1 0 110-2h9.586l-3.293-3.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </div>

                  {/* Soft glow on hover */}
                  <div
                    className="pointer-events-none absolute -inset-20 -z-10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-10"
                    style={{ background: "radial-gradient(600px circle at 0% 0%, rgba(56,189,248,0.35), transparent 40%)" }}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Testimonials — horizontal snap strip */}
      <section className="mx-auto w-full max-w-screen-lg px-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">What clients say</h3>
          <span className="text-xs text-slate-400">Real feedback from teams using YouMine</span>
        </div>

        <div className="-mx-4 overflow-hidden px-4">
          <div
            className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Testimonials"
          >
            {testimonials.map((t, i) => (
              <figure
                key={i}
                className="min-w-[280px] max-w-[360px] snap-start rounded-2xl border border-white/10 bg-white/[0.04] p-4 ring-1 ring-white/10"
              >
                <blockquote className="text-sm leading-6 text-slate-200">
                  <span aria-hidden="true" className="mr-1 text-slate-400">“</span>
                  {t.quote}
                  <span aria-hidden="true" className="ml-1 text-slate-400">”</span>
                </blockquote>
                <figcaption className="mt-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/15 text-xs font-semibold text-sky-100 ring-1 ring-inset ring-sky-400/30">
                    {t.name.split(" ").slice(0, 2).map(s => s[0]).join("").toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{t.name}</div>
                    <div className="truncate text-xs text-slate-400">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {showPreview && (
        <section className="mx-auto max-w-screen-md px-4 pb-8">
          <h3 className="mb-3 text-lg font-semibold">Why YouMine?</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <Feature title="Verified Listings" desc="Profiles linked to authenticated users and organizations." />
            <Feature title="Portfolios" desc="Showcase past projects with images and links." />
            <Feature title="Metrics" desc="Basic analytics for consultant profile views." />
            <Feature title="Favourites" desc="Save contractors and listings for later." />
          </div>
        </section>
      )}

      {/* For clients */}
      <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <header className="mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-300">For clients</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">How YouMine works for Clients</h2>
          <p className="mt-1 text-sm text-slate-300">Post your job, compare specialists, and hire with confidence.</p>
        </header>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Step n={1} title="Post your job" desc="Describe your project, location, timeline, and budget to attract the right consultants." />
          <Step n={2} title="Review matches" desc="Compare profiles, experience, and proposals. Shortlist favourites and start a conversation." />
          <Step n={3} title="Hire and deliver" desc="Select the best fit and kick off quickly. Stay in touch and keep momentum through delivery." />
        </ol>
      </section>

      {/* For consultants */}
      <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <header className="mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-300">For consultants</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">How YouMine works for Consultants</h2>
          <p className="mt-1 text-sm text-slate-300">Customize your profile, connect with clients, and get hired.</p>
        </header>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Step n={1} title="Customize your profile" desc="Highlight services, experience, locations, and a compelling bio. Keep it fresh to rank well." />
          <Step n={2} title="Find and contact clients" desc="Browse posted jobs that match your skills and reach out directly with tailored proposals." />
          <Step n={3} title="Get discovered and hired" desc="Clients can contact you directly. Reply fast to turn enquiries into engagements." />
        </ol>
      </section>

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
}

function Feature({ title, desc }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
      <h4 className="text-lg font-semibold text-white">{title}</h4>
      <p className="mt-2 text-sm text-slate-300">{desc}</p>
    </div>
  );
}

function Step({ n, title, desc }) {
  return (
    <li className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 ring-1 ring-white/5 transition hover:border-sky-300/40 hover:bg-white/[0.05]">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-100">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-sky-200">{n}</span>
        Step {n}
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{desc}</p>
    </li>
  );
}