import MarketplaceShellPage from "./MarketplaceShellPage.jsx";
import { siteUrl } from "@/lib/siteUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vault",
  description: "Explore software, templates and practical resources for mining and oil & gas in the YouMine Vault.",
  alternates: { canonical: siteUrl("/vault") },
};

export default function MarketplacePage() {
  return <MarketplaceShellPage initialTab="discover" fallbackLabel="Loading vault..." />;
}
