export const dynamic = "force-dynamic";
export const revalidate = 0;

import ClientFire from "./ClientFire";

import { supabaseServerClient } from "@/lib/supabaseServerClient";

async function fetchRecent(consultantId) {
  if (!consultantId) return [];
  try {
    const sb = await supabaseServerClient();
    const { data, error } = await sb
      .from("consultant_page_views")
      .select("id, consultant_id, viewer_id, anon_hash, viewed_at, user_agent")
      .eq("consultant_id", consultantId)
      .order("viewed_at", { ascending: false })
      .limit(25);
    if (error) return [{ error: error.message }];
    return data || [];
  } catch (e) {
    return [{ error: e.message || "Fetch error" }];
  }
}

export default async function DebugViewsPage({ searchParams }) {
  const consultantId =
    typeof searchParams.consultant_id === "string"
      ? searchParams.consultant_id.trim()
      : "";
  const force = searchParams.force === "1";
  const recent = await fetchRecent(consultantId);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <h1 className="text-2xl font-bold text-white">Consultant Views Debug</h1>
      <p className="text-sm text-slate-300">
        Use this page to test the tracking endpoint and inspect view rows.
      </p>

      <form
        action="/debug/consultant-views"
        method="get"
        className="flex flex-wrap gap-3 items-end"
      >
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-300 mb-1">
            Consultant UUID
          </label>
          <input
            name="consultant_id"
            defaultValue={consultantId}
            placeholder="uuid..."
            className="rounded-md bg-slate-900/60 border border-white/10 px-3 py-2 text-sm text-slate-100 w-72"
            required
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            name="force"
            value="1"
            defaultChecked={force}
            className="h-4 w-4 rounded border-white/20 bg-slate-800"
          />
          Force insert (ignore cooldown)
        </label>
        <button
          type="submit"
          className="rounded-md bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2 text-sm font-semibold"
        >
          Load / Refresh
        </button>
      </form>

      {consultantId ? (
        <ClientFire consultantId={consultantId} force={force} />
      ) : (
        <div className="text-sm text-slate-400">
          Enter a consultant UUID and submit.
        </div>
      )}

      {consultantId && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-2">Recent rows</h2>
          {recent.length === 0 ? (
            <div className="text-sm text-slate-400">No rows found.</div>
          ) : (
            <div className="space-y-2 text-xs">
              {recent.map((r) => (
                <pre
                  key={r.id || r.error || Math.random()}
                  className="rounded-md bg-black/40 border border-white/10 p-3 overflow-x-auto"
                >
                  {JSON.stringify(r, null, 2)}
                </pre>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}