import ConsultantReviewClient from "./ConsultantReviewClient";
import StatsCards from "./StatsCards";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ConsultantReviewPage() {
  return (
    <div>
      <StatsCards />
      <ConsultantReviewClient />
    </div>
  );
}