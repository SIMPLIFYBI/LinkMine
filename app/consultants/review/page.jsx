import ConsultantReviewClient from "./ConsultantReviewClient";
import StatsCards from "./StatsCards";
import Tabs from "./Tabs";
import InProgressClient from "./InProgressClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ConsultantReviewPage({ searchParams }) {
  const tab = (searchParams?.tab || "dashboard").toLowerCase();
  const active = ["dashboard", "review", "in-progress"].includes(tab) ? tab : "dashboard";

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
      {active === "in-progress" && (
        <div className="space-y-6">
          <InProgressClient />
        </div>
      )}
    </div>
  );
}