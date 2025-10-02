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
        </div>
      </section>

      {/* Primary cards - single column on mobile */}
      <section className="mx-auto max-w-screen-md px-4 py-4 md:py-6 space-y-4">
        <article className="rounded-xl border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/5">
          <h2 className="text-lg font-semibold">Browse Consultants</h2>
          <p className="mt-1 text-sm text-slate-300">
            Discover experts across geotech, planning, environmental and more.
          </p>
        </article>

        <article className="rounded-xl border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/5">
          <h2 className="text-lg font-semibold">View Listings</h2>
          <p className="mt-1 text-sm text-slate-300">
            Explore active opportunities. Posters stay anonymous.
          </p>
        </article>

        <article className="rounded-xl border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/5">
          <h2 className="text-lg font-semibold">Favorites</h2>
          <p className="mt-1 text-sm text-slate-300">
            Save consultants and listings to review later.
          </p>
        </article>
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

      <section className="mx-auto max-w-screen-md px-4 pb-6">
        <h3 className="text-lg font-semibold mb-2">For Clients</h3>
        <p className="text-slate-300">
          Find contractors by service, browse portfolios, and contact providers directly. Save favourites and track projects.
        </p>
      </section>

      <section className="mx-auto max-w-screen-md px-4 pb-6">
        <h3 className="text-lg font-semibold mb-2">For Consultants</h3>
        <p className="text-slate-300">
          Create a profile, upload portfolio items, list services, and monitor profile views and enquiries.
        </p>
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

      {/* Make the three boxes clickable */}
      <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Link
          href="/consultants"
          className="group block rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
        >
          <div className="text-base font-semibold">Browse Consultants</div>
          <div className="text-sm text-slate-400">
            Discover experts across geotech, planning, environmental and more.
          </div>
        </Link>

        <Link
          href="/listings"
          className="group block rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
        >
          <div className="text-base font-semibold">View Listings</div>
          <div className="text-sm text-slate-400">Explore open listings and opportunities.</div>
        </Link>

        <Link
          href="/favourites"
          className="group block rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
        >
          <div className="text-base font-semibold">Favourites</div>
          <div className="text-sm text-slate-400">Quick access to saved consultants.</div>
        </Link>
      </div>

      <section className="space-y-10">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 min-h-[260px]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImage})` }}
          >
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          </div>
          <div className="relative z-10 px-6 py-12 sm:px-10 sm:py-16">
            {/* existing headline/CTA content stays here */}
          </div>
        </div>

        {/* rest of the homepage content */}
      </section>
    </main>
  );
}

function Feature({ title, desc }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 ring-1 ring-white/5">
      <strong className="text-slate-100">{title}</strong>
      <div className="mt-1 text-slate-300 text-sm">{desc}</div>
    </div>
  );
}