import MarketplaceShellPage from "../MarketplaceShellPage.jsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vault Account",
  description: "Manage your vault library and created resources.",
};

export default function MarketplaceAccountPage() {
  return <MarketplaceShellPage initialTab="account" fallbackLabel="Loading account workspace..." />;
}
