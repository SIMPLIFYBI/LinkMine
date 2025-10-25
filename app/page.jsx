"use client";
import React from "react";
import Link from "next/link";
import ServiceFinder from "@/app/components/ServiceFinder";

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
              <button className="rounded-md px-4 py-2 bg-slate-700 text-white hover:bg-slate-600 transition">
                Get started — it's free
              </button>
            </Link>
            <Link href="/consultants" className="inline-flex">
              <button
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-slate-100 shadow-lg backdrop-blur-md ring-1 ring-white/10 hover:bg-white/15 hover:border-white/30 hover:ring-white/20 transition"
              >
                Explore Consultants
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Service finder */}
      <section className="mx-auto w-full max-w-screen-md px-4">
        <ServiceFinder className="mt-4" />
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
                <button className="rounded-md px-4 py-2 bg-slate-700 text-white hover:bg-slate-600 transition">
                  Get started — it's free
                </button>
              </Link>
              <Link href="/explore" className="inline-flex">
                <button className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-slate-100 hover:border-white/20 hover:bg-white/10 transition">
                  Explore listings
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
      </section>

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