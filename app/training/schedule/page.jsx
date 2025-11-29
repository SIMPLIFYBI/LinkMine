import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import ProviderCard from "./ProviderCard.client.jsx";
import TimelineView from "./TimelineView.client.jsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSearchParam(url, key, fallback) {
  try {
    const u = new URL(url);
    return u.searchParams.get(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export default async function TrainingSchedulePage({ searchParams }) {
  const enabled = String(process.env.TRAINING_SCHEDULE_ENABLED || "").toLowerCase() === "true";
  if (!enabled) return notFound();

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = `${proto}://${host}`;

  const view = (await searchParams?.view) || "cards"; // "cards" or "timeline"

  // Fetch sessions JSON for cards view
  const res = await fetch(`${base}/api/training/sessions`, { cache: "no-store" });
  const data = res.ok ? await res.json() : { sessions: [] };

  // Group: providers -> courses for cards
  const byProvider = new Map();
  for (const s of data.sessions || []) {
    const pid = s.provider_id || s.provider_slug || s.provider;
    if (!byProvider.has(pid)) {
      byProvider.set(pid, { id: s.provider_id, name: s.provider, slug: s.provider_slug, courses: new Map() });
    }
    const p = byProvider.get(pid);
    const ck = s.course_id || `${s.provider}_${s.course}`;
    if (!p.courses.has(ck)) {
      p.courses.set(ck, { id: s.course_id, title: s.course, slug: s.course_slug, summary: s.course_summary, sessions: [] });
    }
    p.courses.get(ck).sessions.push(s);
  }

  // Ownership (to show +Add course button)
  const sb = await supabaseServerClient();
  const { data: auth } = await sb.auth.getUser();
  const userId = auth?.user?.id || null;

  let ownedIds = new Set();
  let isAdmin = false;

  if (userId) {
    const { data: owned } = await sb
      .from("consultants")
      .select("id")
      .or(`user_id.eq.${userId},claimed_by.eq.${userId}`);
    ownedIds = new Set((owned || []).map((r) => r.id));

    const { data: adminRow } = await sb
      .from("app_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    isAdmin = Boolean(adminRow);
  }

  // Merge in owned providers’ courses (even without sessions) for cards tab
  if (userId && (ownedIds.size > 0 || isAdmin)) {
    const providerIds = Array.from(ownedIds);
    if (providerIds.length > 0) {
      const { data: courses } = await sb
        .from("training_courses")
        .select(`
          id, title, slug, summary, status, consultant_id,
          consultant:consultants!inner ( id, display_name, slug )
        `)
        .in("consultant_id", providerIds);

      for (const c of courses || []) {
        const pid = c.consultant?.id || c.consultant_id;
        if (!pid) continue;
        if (!byProvider.has(pid)) {
          byProvider.set(pid, {
            id: pid,
            name: c.consultant?.display_name || "Provider",
            slug: c.consultant?.slug || null,
            courses: new Map(),
          });
        }
        const p = byProvider.get(pid);
        const ck = c.id;
        if (!p.courses.has(ck)) {
          p.courses.set(ck, {
            id: c.id,
            title: c.title,
            slug: c.slug,
            summary: c.summary,
            sessions: [],
          });
        }
      }
    }
  }

  const providers = Array.from(byProvider.values()).map((p) => ({
    ...p,
    courses: Array.from(p.courses.values()).map((c) => ({
      ...c,
      sessions: c.sessions.sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
    })),
  }));

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 py-8 px-4 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Training</h1>
          <p className="mt-1 text-sm text-slate-400">Browse providers and view the schedule timeline.</p>
        </div>
        <nav className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1">
          <Link
            href={`/training/schedule?view=cards`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              view === "cards" ? "bg-white/90 text-slate-900" : "text-slate-200 hover:bg-white/10"
            }`}
          >
            Providers & Courses
          </Link>
          <Link
            href={`/training/schedule?view=timeline`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              view === "timeline" ? "bg-white/90 text-slate-900" : "text-slate-200 hover:bg-white/10"
            }`}
          >
            Timeline
          </Link>
        </nav>
      </header>

      {view === "timeline" ? (
        <TimelineView />
      ) : (
        <>
          {providers.length === 0 && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-slate-400">No upcoming sessions yet.</div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {providers.map((p) => (
              <ProviderCard
                key={p.id || p.slug || p.name}
                provider={p}
                canManage={Boolean(userId && (isAdmin || (p.id && ownedIds.has(p.id))))}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}