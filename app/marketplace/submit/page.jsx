import MarketplaceShellPage from "../MarketplaceShellPage.jsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vault Submit",
  description: "Create and manage vault resource submissions.",
};

export default function MarketplaceSubmitPage() {
  return <MarketplaceShellPage initialTab="submit" fallbackLabel="Loading submit workspace..." />;
}
