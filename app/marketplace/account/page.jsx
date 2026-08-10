import MarketplaceShellPage from "../MarketplaceShellPage.jsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Marketplace Account",
  description: "Manage your marketplace library and created resources.",
};

export default function MarketplaceAccountPage() {
  return <MarketplaceShellPage initialTab="account" fallbackLabel="Loading account workspace..." />;
}
