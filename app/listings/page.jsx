import { supabaseServer } from "@/lib/supabaseServer";
import FilterBar from "./FilterBar";
import MyListingsClient from "./MyListingsClient";
import PostJobControls from "@/PostJobControls";

export const dynamic = "force-dynamic";

async function getPublicListings(searchParams) {
  const supabase = supabaseServer();
  let q = supabase
    .from("listings_public")
    .select("id,title,excerpt,location,status,created_at")
    .order("created_at", { ascending: false });

  const term = (searchParams?.q || "").trim();
  const loc = (searchParams?.loc || "").trim();

  if (term) q = q.or(`title.ilike.%${term}%,excerpt.ilike.%${term}%`);
  if (loc) q = q.ilike("location", `%${loc}%`);

  const { data, error } = await q;
  if (error) return [];
  return data ?? [];
}

export default async function ListingsPage({ searchParams }) {
  const items = await getPublicListings(searchParams);

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-100">
      <div className="bg-gradient-to-r from-sky-900/40 via-slate-900/40 to-indigo-900/40 border-b border-white/10">
        <div className="mx-auto max-w-screen-md px-4 py-6 md:py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Listings
            </h1>
            <PostJobControls />
          </div>
          <p className="text-slate-300 mt-1 md:mt-2">
            Browse active opportunities. Posters stay anonymous.
          </p>
          <div className="mt-4">
            <FilterBar />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-screen-md px-4 py-4 md:py-6 space-y-4 md:space-y-5">
        {/* Signed-in users see their own listings (full detail via RLS) */}
        <MyListingsClient />

        {items.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-slate-300">
            No active listings found.
          </div>
        ) : (
          <section className="space-y-4 md:space-y-5">
            {items.map((l) => (
              <article
                key={l.id}
                className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm shadow-lg shadow-black/20 ring-1 ring-white/5 overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold">
                      {l.title || "Untitled listing"}
                    </h3>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-slate-200">
                      {l.status || "active"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">
                    {l.excerpt || "Details to be provided."}
                  </p>
                  <div className="mt-3 text-xs text-slate-400">
                    {l.location || "Location N/A"} •{" "}
                    {new Date(l.created_at).toLocaleDateString()}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}