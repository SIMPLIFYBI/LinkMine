import MarketplaceShellPage from "./MarketplaceShellPage.jsx";
import { siteUrl } from "@/lib/siteUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vault",
  description: "Browse hosted files, external industry resources, and requests in the YouMine vault.",
  alternates: { canonical: siteUrl("/vault") },
};

export default function MarketplacePage() {
  return <MarketplaceShellPage initialTab="discover" fallbackLabel="Loading vault..." />;
}
