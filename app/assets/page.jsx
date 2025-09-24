export const metadata = { title: "Assets · LinkMine" };

import AssetsClient from "./AssetsClient";

export default function AssetsPage() {
  return (
    <main className="mx-auto max-w-screen-xl px-4 py-6">
      <h1 className="text-2xl font-semibold">Assets</h1>
      {/* Move the previous client-only UI into AssetsClient */}
      <AssetsClient />
    </main>
  );
}