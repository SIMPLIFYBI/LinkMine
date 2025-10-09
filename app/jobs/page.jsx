import JobsPageTabs from "@/app/jobs/tabs";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function JobsRootPage({ searchParams }) {
  const initialTab = searchParams?.tab === "my-jobs" ? "my-jobs" : "board";

  const sb = await supabaseServerClient();

  const { data: jobs = [] } = await sb
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
    .order("created_at", { ascending: false });

  return <JobsPageTabs initialTab={initialTab} boardJobs={jobs} />;
}