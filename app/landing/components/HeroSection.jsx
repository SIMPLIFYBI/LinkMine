export function HeroSection({ hero, browseHref }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-8 ring-1 ring-white/10">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-500" />
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{hero.heading}</h1>
      <p className="mt-3 max-w-3xl text-slate-200">{hero.subheading}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <a href={browseHref}>
          <button className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:opacity-95">
            Browse consultants
          </button>
        </a>
        <a href="/consultants">
          <button className="rounded-xl border border-white/15 bg-white/10 px-5 py-2 text-sm font-semibold text-slate-100 hover:bg-white/15">
            View all consultants
          </button>
        </a>
      </div>
    </section>
  );
}