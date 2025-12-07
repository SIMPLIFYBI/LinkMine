export const runtime = "nodejs";

import WorkersFiltersDesktop from "../WorkersFiltersDesktop.client";
import WorkersFiltersMobile from "../WorkersFiltersMobile.client";
import DeckView from "./DeckView.client";
import Link from "next/link";

export default async function TalentHubDeckPage({ searchParams }) {
  const initial = { q: searchParams?.q || "" };

  return (
    <main className="min-h-screen">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-screen-xl px-4 py-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1.5 text-[11px] font-medium text-sky-200">
            Talent Hub · Deck (beta)
          </div>
          <div className="mt-4 hidden md:block"><WorkersFiltersDesktop /></div>
          <div className="mt-4 md:hidden"><WorkersFiltersMobile /></div>
          <div className="mt-2 text-xs text-slate-400">
            Tip: Click a card to open the profile. Try <Link href="/talenthub">grid view</Link>.
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <DeckView initialFilters={initial} />
      </section>
    </main>
  );
}