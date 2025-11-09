// Server component wrapper – receives searchParams automatically.
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import ClaimPageClient from "./ClaimPageClient.jsx";

export default function ClaimPage({ searchParams }) {
  const consultantId = searchParams?.consultant || "";
  return (
    <Suspense
      fallback={
        <main className="mx-auto mt-20 max-w-md px-6 text-center text-slate-300">
          <div className="animate-pulse rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <p className="text-sm">Loading claim interface…</p>
          </div>
        </main>
      }
    >
      <ClaimPageClient consultantIdInitial={consultantId} />
    </Suspense>
  );
}