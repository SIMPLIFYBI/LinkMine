import JobsPageTabs from "@/app/jobs/tabs";
import Image from "next/image";
import { supabasePublicServer } from "@/lib/supabasePublicServer";
import LearnAboutPostingModal from "./LearnAboutPostingModal.client"; // NEW
import Link from "next/link"; // NEW

export const runtime = "nodejs";
export const revalidate = 180;

export const metadata = {
  title: "Mining Jobs Board · YouMine",
  description: "Browse open mining jobs and connect directly with consultants and contractors.",
  alternates: {
    canonical: "/jobs",
  },
  openGraph: {
    title: "Mining Jobs Board · YouMine",
    description: "Browse open mining jobs and connect directly with consultants and contractors.",
    url: "/jobs",
  },
};

const PAGE_SIZE = 16;
const HERO_IMG = "/OpenPit2.png"; // was "/Pictures/youmine_hero.webp"

export default async function JobsRootPage({ searchParams }) {
  const sp = await searchParams;

  const page = Math.max(1, Number.parseInt(sp?.page ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE;

  const sb = supabasePublicServer();

  const { data: raw = [] } = await sb
    .from("jobs")
    .select(
      `
        id,
        title,
        description,
        location,
        preferred_payment_type,
        urgency,
        listing_type,
        company,
        created_at,
        service:services(id, name)
      `
    )
    .or("listing_type.eq.Public,listing_type.eq.Both")
    .eq("status", "open")            // Only show open jobs on the public board
    .order("created_at", { ascending: false })
    .range(from, to);

  const hasNext = raw.length > PAGE_SIZE;
  const jobs = hasNext ? raw.slice(0, PAGE_SIZE) : raw;
  const hasPrev = page > 1;

  return (
    <main className="pb-8">
      {/* Mobile-only hero (lightened overlay) */}
      <section className="relative md:hidden left-1/2 right-1/2 w-screen -ml-[50vw] -mr-[50vw] overflow-hidden border-b border-white/10">
        <Image
          src={HERO_IMG}
          alt="Open pit mine haul road with a dump truck"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />

        {/* Lightened scrim layers */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Softer vertical gradient (was 55/45/55) */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-black/40" />
          {/* Softer radial focus (was 0.55) */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_30%,rgba(0,0,0,0.32),transparent_65%)]" />
          {/* Removed multiply tint layer */}
        </div>

        <div className="relative z-10 px-6 py-6">
          {/* Glass panel for text (light tint); remove if not needed */}
          <div className="inline-block rounded-xl bg-black/25 backdrop-blur-[3px] px-4 py-4 border border-white/10 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.4)]">
            <h1
              className="text-xl font-bold tracking-tight text-white"
              style={{
                textShadow: "0 1px 2px rgba(0,0,0,0.45), 0 0 3px rgba(0,0,0,0.28)"
              }}
            >
              Mining jobs board
            </h1>
            <p
              className="mt-2 text-[13px] leading-relaxed text-slate-100"
              style={{
                textShadow: "0 1px 2px rgba(0,0,0,0.4)"
              }}
            >
              Find and post roles across geology, drilling, operations, and more.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/account?tab=notifications"
                prefetch
                className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[12px] font-semibold text-white backdrop-blur-sm hover:bg-white/15 transition focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.45)" }}
              >
                Subscribe to job postings
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="ml-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </Link>
              <LearnAboutPostingModal />
            </div>
          </div>
        </div>
      </section>

      {/* Existing desktop/tablet hero (hidden on mobile) */}
      <section className="relative hidden md:block left-1/2 right-1/2 w-screen -ml-[50vw] -mr-[50vw] min-h-[260px] overflow-hidden border-b border-white/10">
        <Image
          src={HERO_IMG}
          alt="Open pit mine haul road with a dump truck"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="relative z-10 mx-auto flex max-w-6xl items-end justify-between px-4 py-8 sm:px-6 md:py-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Mining jobs board</h1>
            <p className="mt-1 max-w-[60ch] text-slate-200">
              Find and post roles across geology, drilling, operations, and more.
            </p>

            {/* CTA row */}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/account?tab=notifications"
                prefetch
                className="inline-flex items-center rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:from-sky-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              >
                Subscribe to job postings
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="ml-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Replaces the broken "Post a Job" link with the explainer modal */}
          <LearnAboutPostingModal />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-sky-500/40 via-cyan-400/30 to-sky-500/40" />
      </section>

      <div className="mx-auto -mt-6 max-w-6xl px-4">
        <JobsPageTabs
          boardJobs={jobs}
          boardPage={page}
          boardHasPrev={hasPrev}
          boardHasNext={hasNext}
        />
      </div>
    </main>
  );
}