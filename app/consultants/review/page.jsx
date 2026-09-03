import ConsultantReviewClient from "./ConsultantReviewClient";
import StatsCards from "./StatsCards";
import Tabs from "./Tabs";
import InProgressClient from "./InProgressClient";
import LandingPagesList from "./LandingPagesList";
import DeveloperToolsClient from "./DeveloperToolsClient";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ConsultantReviewPage({ searchParams }) {
  const sb = await supabaseServerClient();
  const { data: auth } = await sb.auth.getUser();
  const user = auth?.user || null;

  if (!user) {
    return <div className="p-6 text-slate-100">Please sign in.</div>;
  }

  const [{ data: adminRow }, email] = await Promise.all([
    sb.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    Promise.resolve(user.email?.toLowerCase() || ""),
  ]);

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const isAdmin = Boolean(adminRow) || (email && adminEmails.includes(email));

  if (!isAdmin) {
    return <div className="p-6 text-red-300">You do not have access to this page.</div>;
  }

  const sp = (await searchParams) || {};
  const tab = (sp?.tab || "dashboard").toLowerCase();
  const active = ["dashboard", "review", "jobs", "in-progress", "landing-pages", "dev-tools"].includes(tab)
    ? tab
    : "dashboard";

  return (
    <div className="space-y-6">
      <Tabs />
      {active === "dashboard" && (
        <div className="space-y-6">
          <StatsCards />
        </div>
      )}
      {active === "review" && (
        <div className="space-y-6">
          <ConsultantReviewClient />
        </div>
      )}
      {active === "jobs" && (
        <div className="space-y-6">
          <ConsultantReviewClient
            initialTab="jobs"
            availableTabs={["jobs"]}
            heading="Jobs review"
            description="Approve, suspend, reopen, or delete job listings."
          />
        </div>
      )}
      {active === "in-progress" && (
        <div className="space-y-6">
          <InProgressClient />
        </div>
      )}
      {active === "landing-pages" && (
        <div className="space-y-6">
          <LandingPagesList />
        </div>
      )}
      {active === "dev-tools" && (
        <div className="space-y-6">
          <DeveloperToolsClient />
        </div>
      )}
    </div>
  );
}