export const runtime = "nodejs";

import WorkersFiltersDesktop from "../WorkersFiltersDesktop.client";
import WorkersFiltersMobile from "../WorkersFiltersMobile.client";
import DeckView from "./DeckView.client";

export default async function TalentHubDeckPage({ searchParams }) {
  // Pass current URL filters to the client deck (these can be extended)
  const initial = {
    q: searchParams?.q || "",
  };

  return (
    <main className="min-h-screen">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-screen-xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1.5 text-[11px] font-medium text-sky-200">
                Talent Hub · Deck (beta)
              </div>
              <h1 className="mt-2 text-xl font-semibold text-white">Discover talent</h1>
            </div>
          </div>
          <div className="mt-4 hidden md:block">
            <WorkersFiltersDesktop />
          </div>
          <div className="mt-4 md:hidden">
            <WorkersFiltersMobile />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8">
        <DeckView initialFilters={initial} />
      </section>
    </main>
  );
}