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
    .select("id, display_name, headline, location, metadata")
    .eq("visibility", "public")
    .eq("status", "approved")
    .in("profile_type", ["creator", "both"])
    .order("display_name", { ascending: true })
    .limit(200);

  return (
    <MarketplaceRouteShell signedIn={Boolean(user)} isAdmin={isAdmin} activeKey="creators">
      <div className="consultants-market-shell mx-auto w-full max-w-6xl space-y-6" data-market="mining">
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
              <li key={creator.id} className="h-full">
                <Link
                  href={`/consultants/${creator.id}?backTo=${encodeURIComponent("/vault/creators")}`}
                  className="consultants-market-card group relative flex h-full min-h-[176px] flex-col justify-between rounded-xl p-5 ring-1 ring-white/5 transition focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  aria-label={`Open digital creator profile for ${creator.display_name || "creator"}`}
                >
                  <div className="flex items-start gap-3">
                    {creator?.metadata?.logo?.url ? (
                      <img
                        src={creator.metadata.logo.url}
                        alt={`${creator.display_name} logo`}
                        width={48}
                        height={48}
                        loading="lazy"
                        decoding="async"
                        className="h-12 w-12 shrink-0 rounded-md bg-white/5 object-contain"
                      />
                    ) : (
                      <div className="h-12 w-12 shrink-0 rounded-md bg-white/5" aria-hidden="true" />
                    )}

                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-white">{creator.display_name}</h3>
                      {creator.headline ? <p className="mt-1 line-clamp-2 text-sm text-slate-300">{creator.headline}</p> : null}
                      {creator.location ? <div className="mt-1 text-xs text-slate-400">{creator.location}</div> : null}
                    </div>
                  </div>

                  <div className="consultants-market-kicker mt-3 text-xs font-medium">
                    View profile
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MarketplaceRouteShell>
  );
}
