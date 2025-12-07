export const runtime = "nodejs";

import Link from "next/link";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import WorkersFiltersDesktop from "./WorkersFiltersDesktop.client";
import WorkersFiltersMobile from "./WorkersFiltersMobile.client";
import BackButton from "./BackButton.client";

// small helper
const uniq = (arr) => Array.from(new Set(arr));

export default async function TalentHubPage({ searchParams }) {
  const sb = await supabaseServerClient();

  // Parse filters from URL
  const sp = searchParams || {};
  const rolesParam = typeof sp.roles === "string" ? sp.roles : ""; // comma-separated slugs
  const roleSlugs = rolesParam
    ? rolesParam.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const availParam = typeof sp.avail === "string" ? sp.avail : ""; // "now" | ""
  const fromParam = typeof sp.from === "string" ? sp.from : "";     // "YYYY-MM-DD"
  const fromDate = /^\d{4}-\d{2}-\d{2}$/.test(fromParam) ? fromParam : null;

  // Fetch role options for filters
  const { data: allRoles = [] } = await sb
    .from("role_categories")
    .select("name, slug, position")
    .order("position", { ascending: true });

  // Build candidate id sets for each filter
  let idsRole = null;
  if (roleSlugs.length > 0) {
    // map slugs → role ids
    const { data: roles = [] } = await sb
      .from("role_categories")
      .select("id, slug")
      .in("slug", roleSlugs);

    const roleIds = roles.map((r) => r.id).filter(Boolean);
    if (roleIds.length > 0) {
      const { data: wr = [] } = await sb
        .from("worker_roles")
        .select("worker_id, role_category_id")
        .in("role_category_id", roleIds);

      idsRole = uniq((wr || []).map((r) => r.worker_id).filter(Boolean));
    } else {
      idsRole = []; // slugs didn’t match anything
    }
  }

  let idsAvail = null;
  if (availParam === "now") {
    const { data: avNow = [] } = await sb
      .from("worker_availability")
      .select("worker_id")
      .eq("available_now", true);
    idsAvail = uniq(avNow.map((r) => r.worker_id).filter(Boolean));
  } else if (fromDate) {
    const [nowRes, fromRes] = await Promise.all([
      sb.from("worker_availability").select("worker_id").eq("available_now", true),
      sb.from("worker_availability").select("worker_id").lte("available_from", fromDate),
    ]);
    const nowIds = (nowRes.data || []).map((r) => r.worker_id).filter(Boolean);
    const fromIds = (fromRes.data || []).map((r) => r.worker_id).filter(Boolean);
    idsAvail = uniq(nowIds.concat(fromIds));
  }

  // Intersect candidate sets (if both present)
  let candidateIds = null;
  if (idsRole !== null && idsAvail !== null) {
    const set = new Set(idsRole);
    candidateIds = idsAvail.filter((id) => set.has(id));
  } else if (idsRole !== null) {
    candidateIds = idsRole;
  } else if (idsAvail !== null) {
    candidateIds = idsAvail;
  }

  // Base workers query
  let workersQuery = sb
    .from("workers")
    .select("id, display_name, headline, location, created_at")
    .eq("visibility", "public")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (candidateIds !== null) {
    if (candidateIds.length === 0) {
      // No matches, short-circuit
      return (
        <main className="min-h-screen">
          <Hero rolesParam={rolesParam} availParam={availParam} fromDate={fromDate} count={0} />
          <section className="mx-auto max-w-screen-xl px-4 py-6 md:py-8">
            <EmptyState />
          </section>
        </main>
      );
    }
    workersQuery = workersQuery.in("id", candidateIds);
  } else {
    workersQuery = workersQuery.limit(12);
  }

  const { data: workersRaw = [] } = await workersQuery;

  const workerIds = workersRaw.map((w) => w.id);

  // Enrich with roles
  let rolesByWorker = new Map();
  if (workerIds.length) {
    const { data: wr = [] } = await sb
      .from("worker_roles")
      .select("worker_id, role_categories(name, slug)")
      .in("worker_id", workerIds);

    for (const row of wr || []) {
      const list = rolesByWorker.get(row.worker_id) ?? [];
      if (row.role_categories) list.push(row.role_categories);
      rolesByWorker.set(row.worker_id, list);
    }
  }

  // Enrich with availability
  let availByWorker = new Map();
  if (workerIds.length) {
    const { data: av = [] } = await sb
      .from("worker_availability")
      .select("worker_id, available_now, available_from")
      .in("worker_id", workerIds);
    for (const row of av || []) availByWorker.set(row.worker_id, row);
  }

  const workers = workersRaw.map((w) => ({
    ...w,
    roles: rolesByWorker.get(w.id) ?? [],
    availability: availByWorker.get(w.id) ?? null,
  }));

  return (
    <main className="min-h-screen">
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-screen-xl px-4 py-6 md:py-8">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1.5 text-[11px] font-medium text-sky-200">
              Talent Hub
            </div>
            <Link
              href="/talenthub/deck"
              className="inline-flex items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-sm font-medium text-sky-100 hover:bg-sky-500/15 hover:border-sky-400/40 transition"
            >
              View Deck
            </Link>
          </div>

          {/* Filters */}
          <div className="mt-4 hidden md:block">
            {/* ...existing code... */}
          </div>
          <div className="mt-4 md:hidden">
            {/* ...existing code... */}
          </div>
        </div>
      </section>

      <Hero
        rolesParam={rolesParam}
        availParam={availParam}
        fromDate={fromDate}
        count={workers.length}
        roles={allRoles}
        selectedRoleSlugs={roleSlugs}
      />

      {/* Mobile filters trigger + sheet */}
      <WorkersFiltersMobile
        roles={allRoles}
        selectedRoleSlugs={roleSlugs}
        availNow={availParam === "now"}
        fromDate={fromDate || ""}
        resultCount={workers.length}
      />

      {/* Grid */}
      <section className="mx-auto max-w-screen-xl px-4 py-6 md:py-8">
        {workers.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {workers.map((w) => (
              <li key={w.id}>
                <WorkerCard worker={w} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Hero({ rolesParam, availParam, fromDate, count, roles, selectedRoleSlugs }) {
  // Active filters summary (desktop bar placeholder; UI controls in next step)
  const hasAny =
    (rolesParam && rolesParam.length > 0) ||
    availParam === "now" ||
    !!fromDate;

  return (
    <>
      <section className="relative border-b border-white/10">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(59,130,246,0.18),transparent_60%)]" />
        <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="mx-auto max-w-screen-xl px-4 py-10 md:py-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1.5 text-[11px] font-medium text-sky-200 shadow-sm ring-1 ring-sky-400/15">
            <Sparkles className="text-sky-300/90" />
            Talent Hub
          </div>
          <h1 className="mt-4 text-2xl md:text-3xl font-semibold text-white">
            Find skilled workers fast
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Browse verified workers by role and availability. Tap a profile to view details and get in touch.
          </p>
        </div>
      </section>

      {/* Desktop filters bar */}
      <section className="sticky top-[56px] z-30 hidden md:block border-b border-white/10 bg-slate-900/70 backdrop-blur">
        <div className="flex items-center">
          <WorkersFiltersDesktop
            roles={roles}
            selectedRoleSlugs={selectedRoleSlugs}
            availNow={availParam === "now"}
            fromDate={fromDate || ""}
          />
          <div className="ml-auto mr-[calc((100vw-1280px)/2+16px)] text-xs text-slate-400 hidden xl:block">
            {count} result{count === 1 ? "" : "s"}
          </div>
        </div>
      </section>
    </>
  );
}

function WorkerCard({ worker }) {
  const roles = (worker.roles || []).slice(0, 3);
  const extra = Math.max(0, (worker.roles || []).length - roles.length);
  const av = worker.availability;
  const availNow = !!av?.available_now;
  const availFrom = av?.available_from ? new Date(av.available_from) : null;

  return (
    <Link
      href={`/talenthub/${worker.id}`}
      className="group relative block overflow-hidden rounded-3xl p-[1px] bg-gradient-to-br from-sky-300/40 via-slate-200/40 to-transparent transition hover:from-sky-400/60 hover:via-white/60 hover:to-sky-200/20"
    >
      <div className="relative rounded-3xl bg-white/70 backdrop-blur-md border border-white/40 p-6 shadow-sm transition group-hover:shadow-md">
        {/* Content row with full-height image column */}
        <div className="flex items-stretch gap-4">
          {/* Full-height image container */}
          <div className="shrink-0 w-[96px] flex">
            <div className="flex-1 rounded-2xl border border-slate-200 bg-white/70 p-3 backdrop-blur-sm flex items-center justify-center">
              <div className="h-14 w-14 rounded-xl border border-sky-200 bg-sky-100 text-sky-700 text-xl font-bold flex items-center justify-center">
                {initials(worker.display_name)}
              </div>
            </div>
          </div>

          {/* Right content */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base md:text-lg font-semibold text-slate-900">
                {worker.display_name}
              </h3>
              {availNow ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/60 bg-emerald-100/70 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Available now
                </span>
              ) : availFrom ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-100/70 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                  From {availFrom.toLocaleDateString()}
                </span>
              ) : null}
            </div>

            {worker.headline ? (
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{worker.headline}</p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {roles.map((r) => (
                <span
                  key={r.slug}
                  className="inline-flex items-center rounded-full border border-white/60 bg-white/70 px-2.5 py-1 text-xs text-slate-800"
                >
                  {r.name}
                </span>
              ))}
              {extra > 0 && (
                <span className="inline-flex items-center rounded-full border border-white/60 bg-white/70 px-2.5 py-1 text-xs text-slate-700">
                  +{extra} more
                </span>
              )}
            </div>

            <div className="mt-5 border-t border-white/60 pt-3 flex items-center justify-between">
              {worker.location ? (
                <div className="inline-flex items-center gap-2 text-xs text-slate-600">
                  <LocationDot />
                  <span className="truncate">{worker.location}</span>
                </div>
              ) : (
                <span />
              )}
              <div className="inline-flex items-center gap-2 text-xs text-sky-700 opacity-80 group-hover:opacity-100">
                View profile
                <ArrowNarrowRight className="text-sky-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Subtle bottom shine */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-70 group-hover:opacity-90" />
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center ring-1 ring-white/10">
      <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1.5 text-[11px] font-medium text-sky-200">
        <Sparkles className="text-sky-300/90" />
        Talent Hub
      </div>
      <h2 className="text-white font-semibold">No workers match your filters</h2>
      <p className="mt-1 text-sm text-slate-400">Try removing filters or check back soon.</p>
    </div>
  );
}

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("");
}

function Sparkles({ className = "" }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" className={className}>
      <path
        fill="currentColor"
        d="M12 2l1.2 3.6L17 7l-3.8 1.4L12 12l-1.2-3.6L7 7l3.8-1.4L12 2zm6 8l.8 2.4L21 13l-2.2.6L18 16l-.8-2.4L15 13l2.2-.6L18 10zM6 14l.8 2.4L9 17l-2.2.6L6 20l-.8-2.4L3 17l2.2-.6L6 14z"
      />
    </svg>
  );
}

function ArrowNarrowRight({ className = "text-slate-300" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" className={className}>
      <path fill="currentColor" d="M11 5l4 5-4 5v-3H5v-4h6V5z" />
    </svg>
  );
}

function LocationDot() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" className="text-slate-500">
      <path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
    </svg>
  );
}