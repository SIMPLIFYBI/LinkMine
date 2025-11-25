import Link from "next/link";

// Import landing content entries
import environmentalServicesMiningAustralia from "./content/environmental-services-mining-australia";
import geotechnicalConsultantsWA from "./content/geotechnical-consultants-wa";
import mineEngineeringPlanningAustralia from "./content/mine-engineering-planning-consultants-australia";
import miningConsultantsBrisbaneQueensland from "./content/mining-consultants-brisbane-queensland";
import miningConsultantsPerthWA from "./content/mining-consultants-perth-western-australia";
import openPitEngineeringAustralia from "./content/open-pit-engineering-consultants-australia";
import miningSafetyAustralia from "./content/mining-safety-consultants-australia"; // NEW

export const metadata = {
  title: "Discover mining consultants by region · YouMine",
  description:
    "Browse curated landing pages for mining consultants across Australia by region and speciality.",
  alternates: { canonical: "/landing" },
};

// Map content entries to cards for the index
const LANDING_PAGES = [
  {
    slug: openPitEngineeringAustralia.slug,
    title: openPitEngineeringAustralia.title,
    badge: "Australia-wide",
    summary:
      "Independent open pit engineering consultants for pit and dump design, haulage, drill & blast, scheduling and execution support.",
  },
  {
    slug: mineEngineeringPlanningAustralia.slug,
    title: mineEngineeringPlanningAustralia.title,
    badge: "Australia-wide",
    summary:
      "Mine engineering and planning consultants for studies, scheduling, fleet optimisation, cost control and execution readiness.",
  },
  {
    slug: miningConsultantsPerthWA.slug,
    title: miningConsultantsPerthWA.title,
    badge: "Western Australia",
    summary:
      "Perth and WA-based mining consultants for studies, planning, geotechnical, drill & blast, productivity and closure.",
  },
  {
    slug: miningConsultantsBrisbaneQueensland.slug,
    title: miningConsultantsBrisbaneQueensland.title,
    badge: "Queensland",
    summary:
      "Brisbane and Queensland mining consultants covering studies, planning, geotechnical, drill & blast and productivity uplift.",
  },
  {
    slug: geotechnicalConsultantsWA.slug,
    title: geotechnicalConsultantsWA.title,
    badge: "Western Australia",
    summary:
      "Geotechnical consultants for WA pits and underground mines, including slope design, monitoring and ground control.",
  },
  {
    slug: environmentalServicesMiningAustralia.slug,
    title: environmentalServicesMiningAustralia.title,
    badge: "Environmental · Australia",
    summary:
      "Environmental services for mining approvals, closure, rehabilitation, water, ESG reporting and community engagement across Australia.",
  },
  {
    slug: miningSafetyAustralia.slug,
    title: miningSafetyAustralia.title,
    badge: "Safety · Australia",
    summary:
      "Mining safety consultants across Australia for risk assessments, critical controls, incident investigations and field leadership.",
  },
];

export default function LandingIndexPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-300">
          Landing pages
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Discover consultants by region & specialty
        </h1>
        <p className="max-w-2xl text-sm text-slate-300">
          Jump into focused pages for key mining regions and services. Each page
          highlights relevant consultants and search entry points.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LANDING_PAGES.map((page) => (
          <Link
            key={page.slug}
            href={`/landing/${page.slug}`}
            className="
              group relative flex flex-col justify-between overflow-hidden
              rounded-2xl border border-white/10 bg-white/[0.03] p-4
              shadow-sm ring-1 ring-white/5 transition
              hover:-translate-y-[2px] hover:border-sky-300/60 hover:bg-white/[0.06]
              hover:shadow-[0_0_0_1px_rgba(56,189,248,0.35)]
            "
          >
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-2.5 py-1 text-[11px] font-medium text-sky-100">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
                {page.badge}
              </span>
              <h2 className="mt-3 text-sm font-semibold text-white group-hover:text-sky-100">
                {page.title}
              </h2>
              <p className="mt-2 text-xs text-slate-300 line-clamp-3">
                {page.summary}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-sky-300">
              <span className="inline-flex items-center gap-1">
                View page
                <svg
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
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

            {/* Soft glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-20 -z-10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20"
              style={{
                background:
                  "radial-gradient(500px circle at 0% 0%, rgba(56,189,248,0.35), transparent 40%)",
              }}
            />
          </Link>
        ))}
      </section>
    </main>
  );
}