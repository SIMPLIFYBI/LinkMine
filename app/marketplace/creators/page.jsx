import Link from "next/link";
import MarketplaceRouteShell from "@/app/marketplace/MarketplaceRouteShell.client.jsx";
import { supabasePublicServer } from "@/lib/supabasePublicServer";
import { getResourceAuthContext } from "@/lib/resourceHubServer";
import { supabaseServerClient } from "@/lib/supabaseServerClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vault Creators",
  description: "Browse approved creators publishing digital resources in Vault.",
};

export default async function MarketplaceCreatorsPage() {
  const sb = supabasePublicServer();
  const authedSb = await supabaseServerClient();
  const { user, isAdmin } = await getResourceAuthContext(authedSb);

  const { data: creators = [], error } = await sb
    .from("consultants")
    .select("id, display_name, headline, location")
    .eq("visibility", "public")
    .eq("status", "approved")
    .in("profile_type", ["creator", "both"])
    .order("display_name", { ascending: true })
    .limit(200);

  return (
    <MarketplaceRouteShell signedIn={Boolean(user)} isAdmin={isAdmin} activeKey="creators">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h1 className="text-3xl font-semibold text-white">Digital Creators</h1>
          <p className="mt-2 text-sm text-slate-300">
            Browse approved creators publishing digital resources in Vault.
          </p>
        </header>

        {error ? (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error.message}
          </div>
        ) : creators.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
            No creators are public yet.
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {creators.map((creator) => (
              <li key={creator.id}>
                <Link
                  href={`/consultants/${creator.id}`}
                  className="group block h-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-sky-400/40 hover:bg-white/[0.06]"
                  aria-label={`Open digital creator profile for ${creator.display_name || "creator"}`}
                >
                  <div className="text-lg font-semibold text-white group-hover:text-sky-100">{creator.display_name}</div>
                  {creator.headline ? <p className="mt-1 line-clamp-2 text-sm text-slate-300">{creator.headline}</p> : null}
                  {creator.location ? <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-400">{creator.location}</p> : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MarketplaceRouteShell>
  );
}
