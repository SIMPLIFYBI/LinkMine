import { Suspense } from "react";
import ResourcesTablePageClient from "./ResourcesTablePage.client.jsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "All Vault Resources",
  description: "View vault resources in a sortable, filterable table with fast pagination.",
};

export default function MarketplaceResourcesPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="animate-pulse rounded-[28px] border border-white/10 bg-white/[0.04] p-8 text-sm text-slate-300 ring-1 ring-white/10">
            Loading resource index...
          </div>
        </main>
      }
    >
      <ResourcesTablePageClient />
    </Suspense>
  );
}
