import Link from "next/link";

export const metadata = {
  title: "Training Hub — YouMine",
  description: "Centralise mining training across providers, schedules, and teams.",
};

export default function TrainingHomePage() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-12">
      {/* Hero */}
      <section className="relative left-1/2 right-1/2 w-screen -ml-[50vw] -mr-[50vw] overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-tr from-slate-950/88 via-slate-900/82 to-slate-950/88"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-radial-fade opacity-60" />
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-5 px-6 py-14 text-center sm:px-12 md:py-16">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-300">YouMine</p>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Training Hub for the mining industry
          </h1>
          <p className="max-w-2xl text-base text-slate-200 sm:text-lg">
            Centralise courses, providers, and schedules. Plan training, enrol teams, and keep compliance on track.
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <Link href="/training/schedule" prefetch className="inline-flex">
              <button
                className="inline-flex items-center rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:from-sky-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                aria-label="Open training schedule"
              >
                Open Schedule
                <svg aria-hidden="true" viewBox="0 0 24 24" className="ml-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14" />
                  <path d="M13 5l7 7-7 7" />
                </svg>
              </button>
            </Link>
            <Link href="/consultants?tag=training" prefetch className="inline-flex">
              <button
                className="inline-flex items-center rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/30"
                aria-label="Browse training providers"
              >
                Browse Providers
              </button>
            </Link>
          </div>

          <div aria-hidden="true" className="mt-6 h-px w-full max-w-4xl bg-gradient-to-r from-transparent via-sky-400/60 to-transparent" />
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto w-full max-w-6xl fade-in-up">
        <p className="section-label mb-2">Why Training Hub?</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { t: "Unified schedule", d: "See all sessions from multiple providers on one timeline." },
            { t: "Simple enrolments", d: "Add people to sessions and track attendance." },
            { t: "Provider directory", d: "Find verified trainers across regions and specialties." },
            { t: "Compliance ready", d: "Record completions and keep evidence in one place." },
            { t: "Smart notifications", d: "Reminders for learners and organisers to reduce no‑shows." },
            { t: "Insights", d: "Understand demand, utilisation, and gaps over time." },
          ].map((f, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 ring-1 ring-white/10 transition hover:-translate-y-[2px] hover:border-sky-300/40 hover:bg-white/[0.1] focus-within:outline-none"
            >
              <div className="mb-1 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15 text-sky-200 ring-1 ring-inset ring-sky-400/30">
                <span className="text-xs">◆</span>
              </div>
              <h3 className="text-sm font-semibold text-white">{f.t}</h3>
              <p className="mt-1 text-sm text-slate-300">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl fade-in-up">
        <p className="section-label mb-2">How it works</p>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { n: 1, t: "Add providers", d: "Connect with training providers or add your internal courses." },
            { n: 2, t: "Plan schedule", d: "Set dates or pull in sessions and visualise the timeline." },
            { n: 3, t: "Enroll & track", d: "Invite your team, track completion, and export evidence." },
          ].map((s) => (
            <li key={s.n} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 ring-1 ring-white/10">
              <div className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/20 text-xs font-semibold text-sky-100 ring-1 ring-inset ring-sky-400/30">
                {s.n}
              </div>
              <div className="text-sm font-semibold text-white">{s.t}</div>
              <div className="text-sm text-slate-300">{s.d}</div>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA bar */}
      <section className="mx-auto w-full max-w-6xl rounded-2xl border border-white/10 bg-white/[0.06] p-5 ring-1 ring-white/10">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Ready to plan training?</h3>
            <p className="text-sm text-slate-300">Open the unified schedule and start mapping dates across providers.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/training/schedule" prefetch>
              <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40">
                Open Schedule
              </button>
            </Link>
            <Link href="/consultants?tag=training" prefetch>
              <button className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/30">
                Find Providers
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}