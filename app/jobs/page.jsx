import JobsPageTabs from "@/app/jobs/tabs";
import Image from "next/image";
import { supabasePublicServer } from "@/lib/supabasePublicServer";
import LearnAboutPostingModal from "./LearnAboutPostingModal.client"; // NEW
import Link from "next/link"; // NEW

export const runtime = "nodejs";
export const revalidate = 180;

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
      <section className="relative left-1/2 right-1/2 w-screen -ml-[50vw] -mr-[50vw] min-h-[260px] overflow-hidden border-b border-white/10">
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

            {/* NEW: CTA row */}
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