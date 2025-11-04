import JobsPageTabs from "@/app/jobs/tabs";
// CHANGED: add UI imports
import Link from "next/link";
import Image from "next/image";
// CHANGED: use the public, cacheable client
import { supabasePublicServer } from "@/lib/supabasePublicServer";

export const runtime = "nodejs";
// CHANGED: enable ISR (already set)
export const revalidate = 180; // 3 minutes

const PAGE_SIZE = 16;

// NEW: hero image (place your photo here)
const HERO_IMG = "/HaulRoad.png";

export default async function JobsRootPage({ searchParams }) {
  const initialTab = searchParams?.tab === "my-jobs" ? "my-jobs" : "board";

  const page = Math.max(1, Number.parseInt(searchParams?.page ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  // sentinel row (+1) to determine hasNext without exact count
  const to = from + PAGE_SIZE; // inclusive

  // CHANGED: public client is sync and does not read cookies
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
    .order("created_at", { ascending: false })
    .range(from, to);

  const hasNext = raw.length > PAGE_SIZE;
  const jobs = hasNext ? raw.slice(0, PAGE_SIZE) : raw;
  const hasPrev = page > 1;

  return (
    <main className="pb-8">
      {/* Full-bleed hero with gradient overlay */}
      <section className="relative left-1/2 right-1/2 w-screen -ml-[50vw] -mr-[50vw] min-h-[260px] overflow-hidden border-b border-white/10">
        <Image
          src={HERO_IMG}
          alt="Open pit mine haul road with a dump truck"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/40 to-slate-950/80" />
        <div className="relative z-10 mx-auto flex max-w-6xl items-end justify-between px-4 py-8 sm:px-6 md:py-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Mining jobs board</h1>
            <p className="mt-1 max-w-[60ch] text-slate-200">
              Find and post roles across geology, drilling, operations, and more.
            </p>
          </div>
          <Link href="/jobs/new" className="hidden sm:inline-flex">
            <button className="rounded-md bg-sky-600 px-4 py-2 text-white shadow-sm transition hover:bg-sky-500">
              Post a job
            </button>
          </Link>
        </div>

        {/* Soft header accent */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-sky-500/40 via-cyan-400/30 to-sky-500/40" />
      </section>

      {/* Tabs section, slightly overlapped for a polished stack */}
      <div className="mx-auto -mt-6 max-w-6xl px-4">
        <JobsPageTabs
          initialTab={initialTab}
          boardJobs={jobs}
          boardPage={page}
          boardHasPrev={hasPrev}
          boardHasNext={hasNext}
        />
      </div>
    </main>
  );
}