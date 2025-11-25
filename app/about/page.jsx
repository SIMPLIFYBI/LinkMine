export const metadata = {
  title: "About YouMine",
  description: "Learn how YouMine connects mining clients with trusted consultants and contractors.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About YouMine",
    description: "Learn how YouMine connects mining clients with trusted consultants and contractors.",
    url: "/about",
  },
};

const stepsConsultants = [
  {
    title: "Create your profile",
    text:
      "Add your company details, services, locations, and social proof. Bring your brand to life with imagery and a clear headline.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-sky-300/90">
        <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm-9 9a9 9 0 1 1 18 0Z" />
      </svg>
    ),
  },
  {
    title: "Get discovered",
    text:
      "Show up in searches by specialty, commodity, and location. Our filters surface the right expertise to the right client.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-sky-300/90">
        <path d="M10 18a8 8 0 1 1 5.29-14l4.71 4.71-1.41 1.41L13.88 5.41A6 6 0 1 0 16 10h2a8 8 0 0 1-8 8Z" />
      </svg>
    ),
  },
  {
    title: "Receive enquiries",
    text:
      "Clients contact you directly via a simple form. You reply from your inbox—no walled garden or message lock-in.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-sky-300/90">
        <path d="M22 6v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6l10 6Z" />
        <path d="M20 6H4l8 6Z" />
      </svg>
    ),
  },
];

const stepsClients = [
  {
    title: "Search the directory",
    text:
      "Start with a goal—feasibility, mine planning, geology, environmental, HSE, or operations support. Browse real experts.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-indigo-300/90">
        <path d="m21 21-4.35-4.35A8 8 0 1 0 16.65 17L21 21ZM10 16a6 6 0 1 1 6-6 6 6 0 0 1-6 6Z" />
      </svg>
    ),
  },
  {
    title: "Filter by what matters",
    text:
      "Narrow by services, commodities, location, availability, and more to find a sharp fit—not a generic vendor.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-indigo-300/90">
        <path d="M3 5h18v2l-7 7v5l-4-2v-3L3 7Z" />
      </svg>
    ),
  },
  {
    title: "Contact and engage",
    text:
      "Send a concise brief from the profile page. The consultant replies directly, so you can engage and move fast.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-indigo-300/90">
        <path d="M2 21V3l20 9-20 9Zm3-4.62L15.64 12 5 7.62v3.78l6 0-6 0v5.98Z" />
      </svg>
    ),
  },
];

export default function AboutPage() {
  return (
    <main className="relative mx-auto w-full max-w-6xl px-4 py-10">
      {/* Background accents */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      {/* Hero */}
      <section className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          Built for the mining industry
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          How YouMine helps Consultants and Clients work smarter
        </h1>
        <p className="mx-auto mt-3 max-w-3xl text-base text-slate-300">
          A focused marketplace where specialists showcase their capabilities and clients find the
          exact expertise they need—fast, transparent, and direct.
        </p>

        {/* Jump buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#consultants"
            className="group inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 hover:border-sky-300 hover:bg-sky-500/20"
          >
            For Consultants
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-sky-200 transition -rotate-90 group-hover:translate-y-0.5">
              <path d="M12 20 4 8h16Z" />
            </svg>
          </a>
          <a
            href="#clients"
            className="group inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-100 hover:border-indigo-300 hover:bg-indigo-500/20"
          >
            For Clients
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-indigo-200 transition -rotate-90 group-hover:translate-y-0.5">
              <path d="M12 20 4 8h16Z" />
            </svg>
          </a>
        </div>
      </section>

      {/* Consultants section */}
      <section id="consultants" className="mt-14 scroll-mt-20">
        <header className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 ring-1 ring-white/20">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
              <path d="M3 3h18v2H3Zm0 6h18v2H3Zm0 6h12v2H3Z" />
            </svg>
          </span>
          <h2 className="text-xl font-bold text-white">For Consultants</h2>
        </header>
        <p className="mt-2 max-w-3xl text-slate-300">
          YouMine is your lightweight storefront: be discoverable for what you do best and make it
          effortless for the right clients to get in touch.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stepsConsultants.map((s) => (
            <article
              key={s.title}
              className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 ring-1 ring-white/10 transition hover:border-sky-300/40 hover:bg-white/[0.06]"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-400/10 ring-1 ring-sky-300/30">
                  {s.icon}
                </span>
                <h3 className="text-sm font-semibold text-white">{s.title}</h3>
              </div>
              <p className="mt-2 text-sm text-slate-300">{s.text}</p>
            </article>
          ))}
        </div>

        {/* Visual explainer */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/10 to-indigo-500/10 p-5 ring-1 ring-white/10">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="flex flex-col justify-center">
              <h3 className="text-base font-semibold text-white">A profile that works for you</h3>
              <p className="mt-2 text-sm text-slate-300">
                Show capabilities, specialties, and location coverage. Link Google reviews and social proof.
                Clients can contact you directly, and you reply from your inbox.
              </p>
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

      {/* Clients section */}
      <section id="clients" className="mt-16 scroll-mt-20">
        <header className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 ring-1 ring-white/20">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
              <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5ZM2 21a10 10 0 0 1 20 0Z" />
            </svg>
          </span>
          <h2 className="text-xl font-bold text-white">For Clients</h2>
        </header>
        <p className="mt-2 max-w-3xl text-slate-300">
          Find the sharpest expertise without the noise. Compare like-for-like specialists and start a
          conversation in minutes.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stepsClients.map((s) => (
            <article
              key={s.title}
              className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 ring-1 ring-white/10 transition hover:border-indigo-300/40 hover:bg-white/[0.06]"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-400/10 ring-1 ring-indigo-300/30">
                  {s.icon}
                </span>
                <h3 className="text-sm font-semibold text-white">{s.title}</h3>
              </div>
              <p className="mt-2 text-sm text-slate-300">{s.text}</p>
            </article>
          ))}
        </div>

        {/* Visual explainer */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-sky-500/10 p-5 ring-1 ring-white/10">
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
              <h3 className="text-base font-semibold text-white">Filters that actually help</h3>
              <p className="mt-2 text-sm text-slate-300">
                Sort by services, commodities, and geography to shortlist specialists who fit your brief.
                Contact them directly—no middleman.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-16 rounded-3xl border border-white/10 bg-white/[0.04] p-6 ring-1 ring-white/10">
        <div className="grid items-center gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold text-white">Ready to get started?</h2>
            <p className="mt-1 text-slate-300">
              Whether you’re a consultant looking to be discovered or a client with a specific brief,
              YouMine helps you move faster.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/consultants"
              className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 hover:border-sky-300 hover:bg-sky-500/20"
            >
              Browse consultants
            </a>
            <a
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-100 hover:border-indigo-300 hover:bg-indigo-500/20"
            >
              View jobs
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}