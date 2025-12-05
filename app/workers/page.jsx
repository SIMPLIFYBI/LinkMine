export const runtime = "nodejs";

import Link from "next/link";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import WorkersFiltersDesktop from "./WorkersFiltersDesktop.client";
import WorkersFiltersMobile from "./WorkersFiltersMobile.client";

// small helper
const uniq = (arr) => Array.from(new Set(arr));

export default async function WorkersPage({ searchParams }) {
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
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
  const roles = (worker.roles || []).slice(0, 2);
  const extra = Math.max(0, (worker.roles || []).length - roles.length);
  const av = worker.availability;
  const availNow = !!av?.available_now;
  const availFrom = av?.available_from ? new Date(av.available_from) : null;

  return (
    <Link
      href={`/workers/${worker.id}`}
      className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.02] p-4 shadow-sm ring-1 ring-white/10 transition hover:border-sky-400/30 hover:ring-sky-400/20"
    >
      <div className="absolute -inset-px -z-10 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="h-full w-full bg-[radial-gradient(80%_60%_at_20%_-10%,rgba(56,189,248,0.18),transparent_60%)]" />
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white font-semibold">
          {initials(worker.display_name)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-white">{worker.display_name}</h3>
            {availNow ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Available now
              </span>
            ) : availFrom ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-100">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                From {availFrom.toLocaleDateString()}
              </span>
            ) : null}
          </div>
          {worker.headline ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-300">{worker.headline}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {roles.map((r) => (
              <span
                key={r.slug}
                className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-200"
              >
                {r.name}
              </span>
            ))}
            {extra > 0 && (
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">
                +{extra} more
              </span>
            )}
          </div>
          {worker.location ? (
            <div className="mt-2 text-[11px] text-slate-400">{worker.location}</div>
          ) : null}
        </div>
      </div>

      <div className="pointer-events-none absolute right-3 top-3 opacity-60 transition group-hover:opacity-100">
        <ArrowNarrowRight />
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

function ArrowNarrowRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" className="text-slate-300">
      <path fill="currentColor" d="M11 5l4 5-4 5v-3H5v-4h6V5z" />
    </svg>
  );
}