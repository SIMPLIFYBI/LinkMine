import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Compass, GraduationCap, Layers3, UsersRound, Wrench } from "lucide-react";
import YouMineExplainer from "@/app/components/YouMineExplainer.client";
import { getResolvedSiteMarket } from "@/lib/siteMarketServer";

function getAboutContent(market) {
  if (market === "oil_gas") {
    return {
      industry: "oil & gas",
      description: "Find the people, opportunities, learning, and digital tools that help oil and gas work move forward.",
    };
  }
  if (market === "both") {
    return {
      industry: "mining and oil & gas",
      description: "One place to find expertise, opportunity, industry learning, and practical tools across mining and oil & gas.",
    };
  }
  return {
    industry: "mining",
    description: "Find the people, opportunities, learning, and digital tools that help mining work move forward.",
  };
}

const pathways = [
  {
    number: "01",
    title: "Find expertise",
    description: "Explore specialist consultants and providers by capability, services, and location. Start a direct conversation when you find the right fit.",
    href: "/consultants",
    action: "Explore consultants",
    Icon: Compass,
    accent: "border-sky-300/25 bg-sky-400/10 text-sky-200",
  },
  {
    number: "02",
    title: "Find work and people",
    description: "Discover contract and freelance opportunities, or share a role with a focused resources-industry audience.",
    href: "/jobs",
    action: "Explore opportunities",
    Icon: BriefcaseBusiness,
    accent: "border-amber-300/25 bg-amber-400/10 text-amber-200",
  },
  {
    number: "03",
    title: "Learn and connect",
    description: "See upcoming industry events and training, then follow the details through to the people hosting them.",
    href: "/whats-on",
    action: "See what's on",
    Icon: GraduationCap,
    accent: "border-emerald-300/25 bg-emerald-400/10 text-emerald-200",
  },
  {
    number: "04",
    title: "Discover useful tools",
    description: "Browse digital products and practical resources made for industry work, or share a useful tool of your own.",
    href: "/vault",
    action: "Explore the Vault",
    Icon: Layers3,
    accent: "border-cyan-300/25 bg-cyan-400/10 text-cyan-200",
  },
];

const journeys = [
  {
    audience: "Companies and project teams",
    title: "Move from a need to the right next step.",
    description: "Search for specialist capability, review opportunities and events, and explore tools that can help your team deliver.",
    href: "/consultants",
    action: "Start with expertise",
    Icon: Compass,
  },
  {
    audience: "Consultants and providers",
    title: "Make your work easier to find.",
    description: "Build a profile around your services and experience, share resources, and promote training or events connected to your expertise.",
    href: "/consultants/new",
    action: "Create a provider profile",
    Icon: UsersRound,
  },
  {
    audience: "Workers and candidates",
    title: "Stay close to relevant opportunities.",
    description: "Explore contract and freelance roles. YouMine also includes Talent Hub for worker profiles and professional connections.",
    href: "/jobs",
    action: "Browse opportunities",
    Icon: BriefcaseBusiness,
  },
  {
    audience: "Creators and tool builders",
    title: "Put practical digital products in front of industry.",
    description: "Share useful apps, downloads, guides, and other digital resources through the Vault.",
    href: "/vault",
    action: "Visit the Vault",
    Icon: Wrench,
  },
];

export async function generateMetadata() {
  const { market } = await getResolvedSiteMarket();
  const content = getAboutContent(market);
  const description = `Learn how YouMine connects ${content.industry} expertise, opportunities, events, and practical digital resources.`;
  return {
    title: "About YouMine",
    description,
    alternates: { canonical: "/about" },
    openGraph: { title: "About YouMine", description, url: "/about" },
  };
}

export default async function AboutPage() {
  const { market } = await getResolvedSiteMarket();
  const content = getAboutContent(market);

  return (
    <main className="relative overflow-hidden">
      <section className="relative border-b border-white/10 bg-[linear-gradient(115deg,rgba(8,47,73,0.72),rgba(8,20,34,0.94)_48%,rgba(12,48,42,0.72))]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="relative mx-auto grid max-w-7xl items-end gap-8 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_auto] lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">A connected platform for {content.industry}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">The resources industry, connected.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">{content.description} YouMine brings the industry's people and practical tools into one useful place.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#watch-youmine" className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200">
                See how it works <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="#platform" className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Explore the platform
              </Link>
            </div>
          </div>
          <div className="hidden min-w-48 border-l border-cyan-100/25 pl-6 lg:block">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">One place for</div>
            <div className="mt-3 space-y-2 text-sm font-medium text-slate-100">
              <div>Expertise</div><div>Opportunity</div><div>Learning</div><div>Digital tools</div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-20 px-4 py-12 sm:px-6 sm:py-16 lg:space-y-24 lg:px-8">
        <YouMineExplainer />

        <section id="platform" className="scroll-mt-24">
          <div className="grid gap-5 border-b border-white/10 pb-6 sm:grid-cols-[1fr_0.7fr] sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">The platform</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Four ways to move work forward.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-300">Each part has a clear job. Use one on its own or move between them as your work takes shape.</p>
          </div>

          <div className="mt-2 grid gap-x-8 sm:grid-cols-2">
            {pathways.map(({ number, title, description, href, action, Icon, accent }) => (
              <article key={number} className="group grid grid-cols-[44px_1fr] gap-4 border-b border-white/10 py-6 sm:py-7">
                <span className={`flex h-10 w-10 items-center justify-center rounded-lg border ${accent}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-xs font-semibold tabular-nums text-slate-500">{number}</span>
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
                  <Link href={href} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition group-hover:text-white">
                    {action}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="people" className="scroll-mt-24">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-200">Made for the people doing the work</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Start with where you fit.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">Whether you are looking for capability, growing a business, finding your next role, or sharing a tool, there is a straightforward place to begin.</p>
          </div>

          <div className="mt-7 divide-y divide-white/10 border-y border-white/10">
            {journeys.map(({ audience, title, description, href, action, Icon }) => (
              <article key={audience} className="grid gap-4 py-6 sm:grid-cols-[180px_1fr_auto] sm:items-center sm:gap-6 sm:py-7">
                <div className="flex items-center gap-3 text-sm font-semibold text-slate-300">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-cyan-200"><Icon className="h-4 w-4" aria-hidden="true" /></span>
                  {audience}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
                </div>
                <Link href={href} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-white sm:justify-self-end">
                  {action}<ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden border-y border-cyan-200/20 bg-[linear-gradient(100deg,rgba(14,116,144,0.18),rgba(15,23,42,0.18)_55%,rgba(5,150,105,0.14))] px-5 py-9 sm:px-8 sm:py-11">
          <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Take the next step</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Put YouMine to work for you.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Explore the platform, or create a profile to make your expertise and work easier to discover.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/consultants" className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-200">Explore YouMine<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              <Link href="/signup" className="inline-flex items-center rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">Create an account</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
