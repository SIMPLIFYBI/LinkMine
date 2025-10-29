import JobsPageTabs from "@/app/jobs/tabs";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 16;

export default async function JobsRootPage({ searchParams }) {
  const initialTab = searchParams?.tab === "my-jobs" ? "my-jobs" : "board";

  const page = Math.max(1, Number.parseInt(searchParams?.page ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  // Request one extra row (sentinel) to know if there's a next page
  const to = from + PAGE_SIZE; // inclusive; returns at most PAGE_SIZE + 1 rows

  const sb = await supabaseServerClient();

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