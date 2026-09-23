import { getResolvedSiteMarket } from "@/lib/siteMarketServer";

function getAboutContent(_market) {
  return {
    description: "Learn what YouMine is and how our core pillars help mining teams and specialists work smarter.",
    badge: "Unified About and How-To",
    heroTitle: "What Is YouMine?",
    heroBody:
      "YouMine is a central hub for the mining industry: connect consultants with clients, run training and events with booking, share digital products in Vault, and post freelance or contract work opportunities.",
    pillars: [
      {
        title: "Consultants and Clients",
        text: "Discover specialist capability, shortlist quickly, and connect directly without platform lock-in.",
        href: "/consultants",
        cta: "Browse consultants",
      },
      {
        title: "Training and Events",
        text: "Host and promote training sessions or events with a built-in booking flow for attendees.",
        href: "/training/schedule",
        cta: "Open training and events",
      },
      {
        title: "Vault Digital Products",
        text: "Creators can publish products, users can link to or download resources, and teams can request new tools publicly.",
        href: "/vault",
        cta: "Open Vault",
      },
      {
        title: "Freelance and Contract Jobs",
        text: "Post and discover contract or freelance opportunities, separate from payg-style job workflows.",
        href: "/jobs",
        cta: "View jobs",
      },
    ],
    consultantsIntro:
      "YouMine is your lightweight storefront: be discoverable for what you do best and make it effortless for the right clients to get in touch.",
    clientsIntro:
      "Find the sharpest expertise without the noise. Compare like-for-like specialists and start a conversation in minutes.",
    consultantVisualTitle: "A profile that works for you",
    consultantVisualBody:
      "Show capabilities, specialties, and location coverage. Link Google reviews and social proof. Clients can contact you directly, and you reply from your inbox.",
    clientVisualTitle: "Filters that actually help",
    clientVisualBody:
      "Sort by services, commodities, and geography to shortlist specialists who fit your brief. Contact them directly with no middleman.",
    ctaBody:
      "Whether you are a consultant looking to be discovered or a client with a specific brief, YouMine helps you move faster.",
    stepsConsultants: [
      { title: "Create your profile", text: "Add your company details, services, locations, and social proof. Bring your brand to life with imagery and a clear headline." },
      { title: "Get discovered", text: "Show up in searches by specialty, commodity, and location. Our filters surface the right expertise to the right client." },
      { title: "Receive enquiries", text: "Clients contact you directly via a simple form. You reply from your inbox with no walled garden or message lock-in." },
    ],
    stepsClients: [
      { title: "Search the directory", text: "Start with a goal such as feasibility, mine planning, geology, environmental, HSE, or operations support. Browse real experts." },
      { title: "Filter by what matters", text: "Narrow by services, commodities, location, availability, and more to find a sharp fit instead of a generic vendor." },
      { title: "Contact and engage", text: "Send a concise brief from the profile page. The consultant replies directly so you can engage and move fast." },
    ],
  };
}

export async function generateMetadata() {
  const { market } = await getResolvedSiteMarket();
  const content = getAboutContent(market);

  return {
    title: "About YouMine",
    description: content.description,
    alternates: { canonical: "/about" },
    openGraph: {
      title: "About YouMine",
      description: content.description,
      url: "/about",
    },
  };
}

export default async function AboutPage() {
  const { market } = await getResolvedSiteMarket();
  const content = getAboutContent(market);

  return (
    <main className="relative mx-auto w-full max-w-6xl px-4 py-10">
      <div className="site-market-shell space-y-14" data-market={market}>
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[rgba(var(--consultants-accent-rgb),0.18)] blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[rgba(var(--consultants-accent-soft-rgb),0.18)] blur-3xl" />
        </div>

        <section className="site-market-hero rounded-3xl border p-8 text-center ring-1 ring-white/10 sm:p-10">
          <span className="site-market-pill inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
            {content.badge}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {content.heroTitle}
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-base text-slate-200">
            {content.heroBody}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#pillars"
              className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
            >
              Platform Pillars
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white transition -rotate-90 group-hover:translate-y-0.5">
                <path d="M12 20 4 8h16Z" />
              </svg>
            </a>
            <a
              href="#consultants"
              className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
            >
              For Consultants
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white transition -rotate-90 group-hover:translate-y-0.5">
                <path d="M12 20 4 8h16Z" />
              </svg>
            </a>
            <a
              href="#clients"
              className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
            >
              For Clients
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white transition -rotate-90 group-hover:translate-y-0.5">
                <path d="M12 20 4 8h16Z" />
              </svg>
            </a>
          </div>
        </section>

        <section id="pillars" className="scroll-mt-20">
          <header className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 ring-1 ring-white/20">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
                <path d="M4 5h16v2H4Zm0 6h16v2H4Zm0 6h16v2H4Z" />
              </svg>
            </span>
            <h2 className="text-xl font-bold text-white">YouMine Platform Pillars</h2>
          </header>
          <p className="mt-2 max-w-3xl text-slate-300">
            One platform, four connected outcomes for mining teams, consultants, and creators.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {content.pillars.map((pillar) => (
              <article
                key={pillar.title}
                className="site-market-card rounded-2xl border p-5 ring-1 ring-white/10 transition hover:bg-white/[0.06]"
              >
                <h3 className="text-base font-semibold text-white">{pillar.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{pillar.text}</p>
                <a
                  href={pillar.href}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20"
                >
                  {pillar.cta}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section id="consultants" className="scroll-mt-20">
          <header className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 ring-1 ring-white/20">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
                <path d="M3 3h18v2H3Zm0 6h18v2H3Zm0 6h12v2H3Z" />
              </svg>
            </span>
            <h2 className="text-xl font-bold text-white">For Consultants</h2>
          </header>
          <p className="mt-2 max-w-3xl text-slate-300">{content.consultantsIntro}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.stepsConsultants.map((step, index) => (
              <article
                key={step.title}
                className="site-market-card rounded-2xl border p-4 ring-1 ring-white/10 transition hover:bg-white/[0.06]"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/10 ring-1 ring-sky-300/30">
                    {index === 0 ? (
                      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-sky-300/90">
                        <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm-9 9a9 9 0 1 1 18 0Z" />
                      </svg>
                    ) : index === 1 ? (
                      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-sky-300/90">
                        <path d="M10 18a8 8 0 1 1 5.29-14l4.71 4.71-1.41 1.41L13.88 5.41A6 6 0 1 0 16 10h2a8 8 0 0 1-8 8Z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-sky-300/90">
                        <path d="M22 6v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6l10 6Z" />
                        <path d="M20 6H4l8 6Z" />
                      </svg>
                    )}
                  </span>
                  <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                </div>
                <p className="mt-2 text-sm text-slate-300">{step.text}</p>
              </article>
            ))}
          </div>

          <div className="site-market-panel mt-8 rounded-3xl border p-5 ring-1 ring-white/10">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="flex flex-col justify-center">
                <h3 className="text-base font-semibold text-white">{content.consultantVisualTitle}</h3>
                <p className="mt-2 text-sm text-slate-300">{content.consultantVisualBody}</p>
              </div>
              <div className="relative">
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="h-3 w-24 rounded bg-sky-400/30" />
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="h-24 rounded-lg bg-white/5" />
                    <div className="h-24 rounded-lg bg-white/5" />
                    <div className="h-24 rounded-lg bg-white/5" />
                  </div>
                  <div className="mt-3 h-20 rounded-lg bg-white/5" />
                  <div className="mt-3 h-8 w-40 rounded-full bg-sky-400/30" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="clients" className="scroll-mt-20">
          <header className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 ring-1 ring-white/20">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5ZM2 21a10 10 0 0 1 20 0Z" />
              </svg>
            </span>
            <h2 className="text-xl font-bold text-white">For Clients</h2>
          </header>
          <p className="mt-2 max-w-3xl text-slate-300">{content.clientsIntro}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.stepsClients.map((step, index) => (
              <article
                key={step.title}
                className="site-market-card rounded-2xl border p-4 ring-1 ring-white/10 transition hover:bg-white/[0.06]"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-400/10 ring-1 ring-indigo-300/30">
                    {index === 0 ? (
                      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-indigo-300/90">
                        <path d="m21 21-4.35-4.35A8 8 0 1 0 16.65 17L21 21ZM10 16a6 6 0 1 1 6-6 6 6 0 0 1-6 6Z" />
                      </svg>
                    ) : index === 1 ? (
                      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-indigo-300/90">
                        <path d="M3 5h18v2l-7 7v5l-4-2v-3L3 7Z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-indigo-300/90">
                        <path d="M2 21V3l20 9-20 9Zm3-4.62L15.64 12 5 7.62v3.78l6 0-6 0v5.98Z" />
                      </svg>
                    )}
                  </span>
                  <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                </div>
                <p className="mt-2 text-sm text-slate-300">{step.text}</p>
              </article>
            ))}
          </div>

          <div className="site-market-panel mt-8 rounded-3xl border p-5 ring-1 ring-white/10">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="relative order-last lg:order-first">
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex gap-2">
                    <div className="h-8 w-24 rounded-full bg-indigo-400/30" />
                    <div className="h-8 w-24 rounded-full bg-indigo-400/20" />
                  </div>
                  <div className="mt-3 h-8 rounded-lg bg-white/5" />
                  <div className="mt-2 h-40 rounded-lg bg-white/5" />
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="h-20 rounded-lg bg-white/5" />
                    <div className="h-20 rounded-lg bg-white/5" />
                    <div className="h-20 rounded-lg bg-white/5" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="text-base font-semibold text-white">{content.clientVisualTitle}</h3>
                <p className="mt-2 text-sm text-slate-300">{content.clientVisualBody}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="site-market-panel rounded-3xl border p-6 ring-1 ring-white/10">
          <div className="grid items-center gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-xl font-bold text-white">Ready to get started?</h2>
              <p className="mt-1 text-slate-300">{content.ctaBody}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/consultants"
                className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 hover:border-sky-300 hover:bg-sky-500/20"
              >
                Browse consultants
              </a>
              <a
                href="/training/schedule"
                className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:border-cyan-300 hover:bg-cyan-500/20"
              >
                Training and events
              </a>
              <a
                href="/vault"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 hover:border-emerald-300 hover:bg-emerald-500/20"
              >
                Open Vault
              </a>
              <a
                href="/jobs"
                className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-100 hover:border-indigo-300 hover:bg-indigo-500/20"
              >
                View freelance and contract jobs
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
