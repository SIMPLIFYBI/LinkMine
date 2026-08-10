import MarketplaceShellPage from "../MarketplaceShellPage.jsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Marketplace Requests",
  description: "Track and create marketplace resource requests.",
};

export default function MarketplaceRequestsPage() {
  return <MarketplaceShellPage initialTab="requests" fallbackLabel="Loading requests workspace..." />;
}
