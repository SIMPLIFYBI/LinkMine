import JobsPageTabs from "@/app/jobs/tabs";
// CHANGED: use the public, cacheable client
import { supabasePublicServer } from "@/lib/supabasePublicServer";

export const runtime = "nodejs";
// CHANGED: enable ISR (remove force-dynamic)
export const revalidate = 180; // 3 minutes

const PAGE_SIZE = 16;

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
    <JobsPageTabs
      initialTab={initialTab}
      boardJobs={jobs}
      boardPage={page}
      boardHasPrev={hasPrev}
      boardHasNext={hasNext}
    />
  );
}