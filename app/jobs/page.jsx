import JobsPageTabs from "@/app/jobs/tabs";
import Image from "next/image";
import { supabasePublicServer } from "@/lib/supabasePublicServer";
import LearnAboutPostingModal from "./LearnAboutPostingModal.client"; // NEW

export const runtime = "nodejs";
export const revalidate = 180;

const PAGE_SIZE = 16;
const HERO_IMG = "/HaulRoad.png";

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
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/40 to-slate-950/80" />
        <div className="relative z-10 mx-auto flex max-w-6xl items-end justify-between px-4 py-8 sm:px-6 md:py-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Mining jobs board</h1>
            <p className="mt-1 max-w-[60ch] text-slate-200">
              Find and post roles across geology, drilling, operations, and more.
            </p>
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