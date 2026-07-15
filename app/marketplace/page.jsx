import { Suspense } from "react";
import MarketplacePageClient from "./MarketplacePage.client.jsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Marketplace",
  description: "Browse hosted files, external industry resources, requests, orders, and payouts in the YouMine marketplace.",
};

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-sm text-slate-300 ring-1 ring-white/10">
            Loading marketplace...
          </div>
        </main>
      }
    >
      <MarketplacePageClient />
    </Suspense>
  );
}
