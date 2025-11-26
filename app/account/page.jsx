"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AccountPageClient from "./AccountPage.client.jsx";
import WelcomeEmailPing from "./WelcomeEmailPing.client";

export const dynamic = "force-dynamic"; // Avoid static optimization & searchParams warnings

const ALLOWED_TABS = new Set(["account", "notifications", "consultants"]);

function AccountPageWrapper() {
  const sp = useSearchParams();
  const rawTab = sp?.get("tab");
  const initialTab =
    rawTab && ALLOWED_TABS.has(rawTab.toLowerCase())
      ? rawTab.toLowerCase()
      : "account";
  return <AccountPageClient initialTab={initialTab} />;
}

export default function Page() {
  return (
    <>
      <WelcomeEmailPing />
      <Suspense
        fallback={
          <main className="p-10">
            <div className="animate-pulse rounded-xl border border-white/10 bg-white/5 p-6 text-sm">
              Loading…
            </div>
          </main>
        }
      >
        <AccountPageWrapper />
      </Suspense>
    </>
  );
}