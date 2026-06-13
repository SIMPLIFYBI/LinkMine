import ConsultantReviewClient from "./ConsultantReviewClient";
import StatsCards from "./StatsCards";
import Tabs from "./Tabs";
import InProgressClient from "./InProgressClient";
import LandingPagesList from "./LandingPagesList";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ConsultantReviewPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const tab = (sp?.tab || "dashboard").toLowerCase();
  const active = ["dashboard", "review", "jobs", "in-progress", "landing-pages"].includes(tab)
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
    </div>
  );
}