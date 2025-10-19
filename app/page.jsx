"use client";
import React from "react";
import Link from "next/link";

const heroImage = "/Pictures/pexels-urtimud-89-76108288-14263363.jpg";

export default function HomePage() {
  const showPreview = true;

  const sampleListings = [
    { id: 1, name: "Acme Drilling", services: "Drilling • Sampling", location: "Kalgoorlie, WA" },
    { id: 2, name: "GeoConsult", services: "Geotech • Logging", location: "Perth, WA" },
    { id: 3, name: "CoreWorks", services: "Core Processing • Analysis", location: "Adelaide, SA" },
  ];

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-10">
      {/* Hero */}
      <section className="relative left-1/2 right-1/2 w-screen -ml-[50vw] -mr-[50vw] overflow-hidden min-h-[340px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-6 bg-slate-900/30 px-8 py-16 text-center sm:px-16">
          <h1 className="max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl">
            Stop searching, start mining: match with the right expert today.
          </h1>
          <p className="max-w-2xl text-lg text-slate-200 sm:text-xl">
            {/* existing subheading text if any */}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/signup" className="inline-flex">
              <button
                className="rounded-2xl px-4 py-2 bg-slate-700 text-white hover:bg-slate-600 transition"
              >
                Get started — it's free
              </button>
            </Link>
            <Link href="/consultants" className="inline-flex">
              <button
                className="rounded-2xl border border-white/25 bg-white/10 px-4 py-2 text-slate-50 shadow-lg shadow-sky-500/10 ring-1 ring-white/10 backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-md transition hover:bg-white/15 hover:border-white/40 hover:shadow-sky-500/20 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
              >
                Explore consultants
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Split section: stack on mobile, 2 cols on md+ */}
      <section className="mx-auto max-w-screen-md px-4 py-6 md:py-8">
        <div className="grid gap-7 items-center md:grid-cols-2">
          <div>
            <h2 className="text-2xl md:text-[32px] font-semibold mb-2">
              Connect mining clients with trusted contractors & consultants
            </h2>
            <p className="text-slate-300 mb-4">
              MineLink is a directory & portfolio platform for the mining industry — discover contractors, review portfolios, and for consultants, showcase work and see profile metrics.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/signup" className="inline-flex">
                <button
                  className="rounded-2xl border border-white/30 bg-gradient-to-r from-sky-500/25 via-cyan-500/20 to-blue-600/25 px-4 py-2 text-slate-50 shadow-lg shadow-sky-500/20 ring-1 ring-white/10 backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-md transition hover:from-sky-500/35 hover:via-cyan-500/30 hover:to-blue-600/35 hover:border-white/50 hover:shadow-sky-500/30 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                >
                  Get started — it's free
                </button>
              </Link>
              <Link href="/consultants" className="inline-flex">
                <button
                  className="rounded-2xl border border-white/25 bg-white/10 px-4 py-2 text-slate-50 shadow-lg shadow-sky-500/10 ring-1 ring-white/10 backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-md transition hover:bg-white/15 hover:border-white/40 hover:shadow-sky-500/20 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                >
                  Explore consultants
                </button>
              </Link>
            </div>

            <ul className="mt-4 list-disc pl-5 text-slate-400 space-y-1">
              <li>Business tiles for clients to showcase services</li>
              <li>Consultant profiles with portfolio galleries</li>
              <li>View metrics like profile views and favorites</li>
            </ul>
          </div>

          <aside className="rounded-xl border border-white/10 bg-white/[0.03] p-4 ring-1 ring-white/5">
            <h3 className="text-base font-semibold m-0">Quick tour</h3>
            <p className="mt-1 text-slate-300">Sample contractor gallery</p>
            <div className="grid gap-2">
              {sampleListings.map((l) => (
                <div key={l.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <strong className="text-slate-100">{l.name}</strong>
                  <div className="text-slate-300 text-sm">{l.services}</div>
                  <div className="text-slate-400 text-xs">{l.location}</div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section> {/* end split section */}

      {showPreview && (
        <section className="mx-auto max-w-screen-md px-4 pb-8">
          <h3 className="text-lg font-semibold mb-3">Why MineLink?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <Feature title="Verified Listings" desc="Profiles linked to authenticated users and organizations." />
            <Feature title="Portfolios" desc="Showcase past projects with images and links." />
            <Feature title="Metrics" desc="Basic analytics for consultant profile views." />
            <Feature title="Favorites" desc="Save contractors and listings for later." />
          </div>
        </section>
      )}

      {/* For clients */}
      <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <header className="mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-300">For clients</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">How YouMine works</h2>
          <p className="mt-1 text-sm text-slate-300">
            Post your job, compare specialists, and hire with confidence.
          </p>
        </header>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <li className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 ring-1 ring-white/5 transition hover:border-sky-300/40 hover:bg-white/[0.05]">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-100">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-sky-200">1</span>
              Step 1
            </div>
            <h3 className="text-base font-semibold text-white">Post your job</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Describe your project, location, timeline, and budget to attract the right consultants.
            </p>
          </li>

          <li className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 ring-1 ring-white/5 transition hover:border-sky-300/40 hover:bg-white/[0.05]">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-100">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-sky-200">2</span>
              Step 2
            </div>
            <h3 className="text-base font-semibold text-white">Review matches</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Compare profiles, experience, and proposals. Shortlist favourites and start a conversation.
            </p>
          </li>

          <li className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 ring-1 ring-white/5 transition hover:border-sky-300/40 hover:bg-white/[0.05]">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-100">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-sky-200">3</span>
              Step 3
            </div>
            <h3 className="text-base font-semibold text-white">Hire and deliver</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Select the best fit and kick off quickly. Stay in touch and keep momentum through delivery.
            </p>
          </li>
        </ol>
      </section>

      {/* For consultants (keep directly below) */}
      <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <header className="mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-300">For consultants</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">How YouMine works for Consultants</h2>
          <p className="mt-1 text-sm text-slate-300">Customize your profile, connect with clients, and get hired.</p>
        </header>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <li className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 ring-1 ring-white/5 transition hover:border-sky-300/40 hover:bg-white/[0.05]">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-100">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-sky-200">1</span>
              Step 1
            </div>
            <h3 className="text-base font-semibold text-white">Customize your profile</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Highlight your services, experience, locations, and a compelling bio. Keep it fresh to rank well in searches.
            </p>
          </li>
          <li className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 ring-1 ring-white/5 transition hover:border-sky-300/40 hover:bg-white/[0.05]">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-100">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-sky-200">2</span>
              Step 2
            </div>
            <h3 className="text-base font-semibold text-white">Find and contact clients</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Browse posted jobs that match your skills and reach out directly with tailored proposals.
            </p>
          </li>
          <li className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 ring-1 ring-white/5 transition hover:border-sky-300/40 hover:bg-white/[0.05]">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-100">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-sky-200">3</span>
              Step 3
            </div>
            <h3 className="text-base font-semibold text-white">Get discovered and hired</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Clients can contact you directly from the directory. Reply fast to turn enquiries into engagements.
            </p>
          </li>
        </ol> {/* fixed: was </ol */}
      </section>

      {/* Footer (full-width strip) */}
      <footer className="relative left-1/2 right-1/2 w-screen -ml-[50vw] -mr-[50vw] border-t border-white/10 bg-gradient-to-r from-slate-900/70 to-slate-900/50 backdrop-blur-md supports-[backdrop-filter]:backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="inline-flex items-center gap-2">
                <span className="h-8 w-8 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 ring-1 ring-white/20" />
                <span className="text-xl font-semibold tracking-tight">MineLink</span>
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Connect mining clients with trusted consultants and contractors.
              </p>
            </div>

            <nav>
              <h4 className="text-sm font-semibold text-slate-100">Explore</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li><Link href="/consultants" className="hover:text-sky-300">Consultants</Link></li>
                <li><Link href="/jobs" className="hover:text-sky-300">Jobs</Link></li>
                <li><Link href="/signup" className="hover:text-sky-300">Create account</Link></li>
              </ul>
            </nav>

            <nav>
              <h4 className="text-sm font-semibold text-slate-100">Company</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li><Link href="/about" className="hover:text-sky-300">About</Link></li>
                <li><a href="mailto:hello@minelink.app" className="hover:text-sky-300">Contact</a></li>
                <li><Link href="/pricing" className="hover:text-sky-300">Pricing</Link></li>
              </ul>
            </nav>

            <nav>
              <h4 className="text-sm font-semibold text-slate-100">Legal</h4>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li><Link href="/terms" className="hover:text-sky-300">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-sky-300">Privacy</Link></li>
              </ul>

              <div className="mt-4 flex items-center gap-3 text-slate-300">
                <a
                  href="https://www.linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10 hover:bg-white/20"
                  aria-label="LinkedIn"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M6.94 7.5A1.94 1.94 0 1 1 5 5.56 1.94 1.94 0 0 1 6.94 7.5ZM5.5 9h2.9v9.5H5.5zM13 9a3.92 3.92 0 0 0-3.5 1.94V9H6.6v9.5h2.9v-5c0-1.33.77-2.2 2-2.2s1.9.87 1.9 2.2v5h2.9v-5.6C16.3 10.67 14.97 9 13 9z" />
                  </svg>
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10 hover:bg-white/20"
                  aria-label="X"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M18.9 3H16.3l-4 5-4-5H5.7l5.2 6.5L5 21h2.6l4.5-5.9 4.5 5.9h2.6L13.1 9.5 18.9 3z" />
                  </svg>
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10 hover:bg-white/20"
                  aria-label="GitHub"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 .5a11.5 11.5 0 0 0-3.64 22.43c.58.1.79-.25.79-.56 0-.27-.01-1.16-.02-2.11-3.2.69-3.87-1.37-3.87-1.37-.53-1.35-1.3-1.7-1.3-1.7-1.07-.74.08-.73.08-.73 1.18.08 1.8 1.22 1.8 1.22 1.05 1.8 2.76 1.28 3.43.98.11-.77.41-1.28.75-1.57-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.28 1.2-3.08-.12-.29-.52-1.48.11-3.08 0 0 .98-.31 3.2 1.18.93-.26 1.93-.39 2.93-.39 1 0 2 .13 2.93.39 2.22-1.5 3.2-1.18 3.2-1.18.63 1.6.23 2.8.11 3.08.75.8 1.2 1.82 1.2 3.08 0 4.43-2.7 5.4-5.26 5.68.42.37.8 1.1.8 2.22 0 1.6-.02 2.88-.02 3.27 0 .31.21.66.8.55A11.5 11.5 0 0 0 12 .5z" />
                  </svg>
                </a>
              </div>
            </nav>
          </div>

          <div className="mt-8 border-t border-white/10 pt-4 text-xs text-slate-400 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} MineLink. All rights reserved.</span>
            <span className="text-slate-500">Built for the mining industry.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Feature({ title, desc }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 ring-1 ring-white/5">
      <div className="text-sm font-semibold text-slate-100">{title}</div>
      <div className="mt-1 text-sm text-slate-300">{desc}</div>
    </div>
  );
}
