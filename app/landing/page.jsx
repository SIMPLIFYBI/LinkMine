import Link from "next/link";
import { getResolvedSiteMarket } from "@/lib/siteMarketServer";
import { siteMarketToUrlValue } from "@/lib/siteMarket";

// Import landing content entries
import environmentalServicesMiningAustralia from "./content/environmental-services-mining-australia";
import geotechnicalConsultantsWA from "./content/geotechnical-consultants-wa";
import mineEngineeringPlanningAustralia from "./content/mine-engineering-planning-consultants-australia";
import miningConsultantsBrisbaneQueensland from "./content/mining-consultants-brisbane-queensland";
import miningConsultantsPerthWA from "./content/mining-consultants-perth-western-australia";
import openPitEngineeringAustralia from "./content/open-pit-engineering-consultants-australia";
import miningSafetyAustralia from "./content/mining-safety-consultants-australia";

const MINING_LANDING_PAGES = [
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

const OIL_GAS_LANDING_PAGES = [
  {
    slug: "subsurface-reservoir",
    title: "Subsurface and reservoir specialists",
    badge: "Oil & Gas hub",
    summary: "Browse consultants for reservoir studies, petrophysics, production forecasting, reserves work, and integration support.",
  },
  {
    slug: "field-development-planning",
    title: "Field development planning support",
    badge: "Planning",
    summary: "Explore specialists for concept select, FDP support, surface-subsurface integration, and development screening.",
  },
  {
    slug: "drilling-wells-field-execution",
    title: "Wells and field execution experts",
    badge: "Execution",
    summary: "Find consultants for well planning, campaign support, completions, workovers, intervention, and site supervision.",
  },
  {
    slug: "production-facilities",
    title: "Production and facilities specialists",
    badge: "Operations",
    summary: "Connect with experts in production operations, facility optimisation, commissioning, flow assurance, and debottlenecking.",
  },
  {
    slug: "asset-integrity-maintenance-reliability",
    title: "Integrity and reliability support",
    badge: "Integrity",
    summary: "Shortlist consultants for asset integrity, corrosion, NDT, reliability programs, shutdowns, and equipment performance.",
  },
  {
    slug: "environment-safety-regulatory",
    title: "Environment, safety, and regulatory advisory",
    badge: "Risk + compliance",
    summary: "Browse specialists in approvals, process safety, HSE systems, compliance reporting, and decommissioning support.",
  },
];

function buildLandingConsultantsHref(market, categorySlug) {
  const params = new URLSearchParams();
  const marketValue = siteMarketToUrlValue(market);
  if (marketValue !== "mining") params.set("market", marketValue);
  params.set("category", categorySlug);
  return `/consultants?${params.toString()}`;
}

function getLandingContent(market) {
  if (market === "oil_gas") {
    return {
      title: "Discover oil and gas consultants by specialty",
      description: "Browse focused entry points for oil and gas consultants across subsurface, wells, facilities, integrity, and project delivery.",
      eyebrow: "Oil & Gas hubs",
      heading: "Discover consultants by specialty and delivery phase",
      intro: "Jump into focused entry points for core Oil & Gas disciplines. Each hub sends you straight into the filtered consultants directory.",
      pages: OIL_GAS_LANDING_PAGES,
    };
  }

  return {
    title: "Discover mining consultants by region",
    description: "Browse curated landing pages for mining consultants across Australia by region and speciality.",
    eyebrow: "Landing pages",
    heading: "Discover consultants by region & specialty",
    intro: "Jump into focused pages for key mining regions and services. Each page highlights relevant consultants and search entry points.",
    pages: MINING_LANDING_PAGES,
  };
}

export async function generateMetadata() {
  const { market } = await getResolvedSiteMarket();
  const content = getLandingContent(market);

  return {
    title: content.title,
    description: content.description,
    alternates: { canonical: "/landing" },
  };
}

export default async function LandingIndexPage() {
  const { market } = await getResolvedSiteMarket();
  const content = getLandingContent(market);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="site-market-shell space-y-8" data-market={market}>
        <header className="site-market-hero rounded-3xl border p-8 ring-1 ring-white/10">
          <p className="site-market-kicker text-xs">{content.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {content.heading}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-200">
            {content.intro}
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {content.pages.map((page) => (
            <Link
              key={page.slug}
              href={market === "oil_gas" ? buildLandingConsultantsHref(market, page.slug) : `/landing/${page.slug}`}
              className="site-market-card group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 shadow-sm ring-1 ring-white/5 transition hover:-translate-y-[2px] hover:bg-white/[0.06]"
            >
              <div>
                <span className="site-market-pill inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
                  {page.badge}
                </span>
                <h2 className="mt-3 text-sm font-semibold text-white">
                  {page.title}
                </h2>
                <p className="mt-2 text-xs text-slate-300 line-clamp-3">
                  {page.summary}
                </p>
              </div>
              <div className="site-market-kicker mt-4 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1">
                  {market === "oil_gas" ? "Open directory" : "View page"}
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
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}