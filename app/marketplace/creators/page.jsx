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
      <div className="mx-auto w-full max-w-6xl space-y-6" data-market="mining">
        <header className="relative overflow-hidden rounded-[28px] border border-sky-300/20 bg-[radial-gradient(circle_at_88%_12%,rgba(56,189,248,0.28),transparent_28%),linear-gradient(135deg,rgba(8,47,73,0.9),rgba(15,23,42,0.96)_54%,rgba(2,6,23,0.98))] px-5 py-6 shadow-[0_26px_62px_-38px_rgba(14,165,233,0.64)] sm:px-6 sm:py-7">
          <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full border border-sky-100/15 bg-sky-300/10" />
          <div className="pointer-events-none absolute bottom-[-4rem] right-[16%] h-28 w-28 rotate-12 rounded-[24px] border border-white/10 bg-white/[0.04]" />
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/20 bg-sky-300/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100">
              Vault creators
            </div>
            <h1 className="mt-3 text-2xl font-semibold leading-tight text-white sm:text-3xl">Meet the people building practical tools.</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200 sm:text-base">
              Explore approved creators publishing resources for the mining community, from field-ready templates to specialist platforms.
            </p>
            <div className="mt-5 inline-flex rounded-full border border-white/12 bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-slate-100">
              {creators.length} {creators.length === 1 ? "public creator" : "public creators"}
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-[22px] border border-rose-400/30 bg-rose-500/10 p-5 text-sm text-rose-200 ring-1 ring-rose-300/10">
            {error.message}
          </div>
        ) : creators.length === 0 ? (
          <section className="rounded-[26px] border border-dashed border-white/15 bg-white/[0.035] px-5 py-10 text-center shadow-[0_24px_56px_-42px_rgba(0,0,0,0.82)]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[16px] border border-sky-300/20 bg-sky-500/10 text-lg font-semibold text-sky-100">+</div>
            <h2 className="mt-4 text-lg font-semibold text-white">No public creators yet.</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-300">Creator profiles will appear here once they are approved and ready to share their Vault resources.</p>
          </section>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {creators.map((creator) => (
              <li key={creator.id} className="h-full">
                <Link
                  href={`/consultants/${creator.id}?backTo=${encodeURIComponent("/vault/creators")}`}
                  className="group relative flex h-full min-h-[208px] flex-col justify-between overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.09),rgba(255,255,255,0.025))] p-5 shadow-[0_24px_58px_-40px_rgba(0,0,0,0.86)] ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:border-sky-200/30 hover:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-sky-300/50"
                  aria-label={`Open digital creator profile for ${creator.display_name || "creator"}`}
                >
                  <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full border border-white/10 bg-sky-300/[0.06] transition duration-300 group-hover:scale-110 group-hover:bg-sky-300/[0.1]" />
                  <div className="flex items-start gap-3">
                    {creator?.metadata?.logo?.url ? (
                      <img
                        src={creator.metadata.logo.url}
                        alt={`${creator.display_name} logo`}
                        width={48}
                        height={48}
                        loading="lazy"
                        decoding="async"
                        className="h-12 w-12 shrink-0 rounded-[15px] border border-white/12 bg-white/[0.08] object-contain shadow-[0_12px_26px_-18px_rgba(255,255,255,0.58)]"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] border border-sky-200/15 bg-sky-500/10 text-sm font-semibold text-sky-100" aria-hidden="true">
                        {(creator.display_name || "C").slice(0, 1).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-white">{creator.display_name}</h3>
                      {creator.headline ? <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-slate-300">{creator.headline}</p> : <p className="mt-1.5 text-sm text-slate-400">Vault creator</p>}
                      {creator.location ? <div className="mt-2 text-xs font-medium text-slate-400">{creator.location}</div> : null}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-200">Creator profile</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-slate-100 transition group-hover:border-sky-200/30 group-hover:bg-sky-400 group-hover:text-slate-950">
                      View profile
                      <span aria-hidden="true">&rarr;</span>
                    </span>
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
