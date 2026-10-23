export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { supabasePublicServer } from "@/lib/supabasePublicServer";

export default async function CreatorsPage() {
  const sb = supabasePublicServer();

  const { data: publicProfiles = [], error: profileError } = await sb
    .from("consultants")
    .select("id, display_name, headline, location, metadata, claimed_by")
    .eq("visibility", "public")
    .eq("status", "approved")
    .order("display_name", { ascending: true })
    .limit(200);

  const { data: publishedResources = [], error: resourceError } = await sb
    .from("resources")
    .select("consultant_id, owner_user_id")
    .eq("status", "approved")
    .limit(1000);

  const creatorIds = new Set();
  for (const profile of publicProfiles) {
    if (publishedResources.some((resource) => resource.consultant_id === profile.id || (profile.claimed_by && resource.owner_user_id === profile.claimed_by))) {
      creatorIds.add(profile.id);
    }
  }
  const creators = publicProfiles.filter((profile) => creatorIds.has(profile.id));
  const error = profileError || resourceError;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 space-y-6">
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
            <li key={creator.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 hover:border-sky-400/40">
              <Link href={`/creators/${creator.id}`} className="block">
                <div className="text-lg font-semibold text-white">{creator.display_name}</div>
                {creator.headline ? <p className="mt-1 text-sm text-slate-300 line-clamp-2">{creator.headline}</p> : null}
                {creator.location ? <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-400">{creator.location}</p> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
