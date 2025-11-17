import Link from "next/link";
import { supabasePublicServer } from "@/lib/supabasePublicServer";
import AddConsultantButton from "@/app/components/consultants/AddConsultantButton";
import ServiceFilter from "./ServiceFilter.client.jsx";
import NameSearch from "./NameSearch.client.jsx";
import ServiceSlugFilter from "./ServiceSlugFilter.client.jsx";
import MobileHeroAndFilters from "./MobileHeroAndFilters.client.jsx"; // NEW

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAGE_SIZE = 15;
const CARD_SELECT = "id, slug, display_name, headline, location, visibility, status, metadata";

// ---- Shuffle helpers ----
const SEED_BUCKET_MS = 5 * 60 * 1000;
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
function seededShuffle(arr, seed) {
  const a = arr.slice();
  const rand = mulberry32(seed);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j] ] = [a[j], a[i]];
  }
  return a;
}
function getSeed() {
  return Math.floor(Date.now() / SEED_BUCKET_MS);
}

// ---- Data lookups (with optional name search) ----
async function getAllConsultantsPage(sb, page, seed, q) {
  const offset = (page - 1) * PAGE_SIZE;

  // Build the base id set (optionally filtered by name)
  let idRows = [];
  if (q) {
    const { data = [] } = await sb
      .from("consultants")
      .select("id")
      .eq("visibility", "public")
      .eq("status", "approved")
      .ilike("display_name", `%${q}%`);
    idRows = data;
  } else {
    const { data = [] } = await sb
      .from("consultants")
      .select("id")
      .eq("visibility", "public")
      .eq("status", "approved");
    idRows = data;
  }

  const idsAll = idRows.map((r) => r.id).filter(Boolean);
  if (idsAll.length === 0) return { consultants: [], hasNext: false };

  const shuffled = seededShuffle(idsAll, seed);
  const hasNext = shuffled.length > page * PAGE_SIZE;
  const pageIds = shuffled.slice(offset, offset + PAGE_SIZE);

  // Add the same public/approved constraints here for consistency
  const { data: rows = [] } = await sb
    .from("consultants")
    .select(CARD_SELECT)
    .in("id", pageIds)
    .eq("visibility", "public")
    .eq("status", "approved");

  const byId = new Map(rows.map((r) => [r.id, r]));
  const consultants = pageIds.map((id) => byId.get(id)).filter(Boolean);

  return { consultants, hasNext };
}

const toArray = (d) => (Array.isArray(d) ? d : []);
const uniq = (arr) => Array.from(new Set(arr));

async function getConsultantsByServiceSlug(sb, serviceSlug, page, seed, q) {
  const offset = (page - 1) * PAGE_SIZE;

  if (!serviceSlug) {
    return getAllConsultantsPage(sb, page, seed, q);
  }

  const { data: service } = await sb
    .from("services")
    .select("id, name, slug")
    .eq("slug", serviceSlug)
    .maybeSingle();

  if (!service) return { consultants: [], activeService: null, hasNext: false };

  const { data: linkRowsData } = await sb
    .from("consultant_services")
    .select("consultant_id")
    .eq("service_id", service.id);

  let idsAll = uniq(toArray(linkRowsData).map((r) => r.consultant_id).filter(Boolean));
  if (idsAll.length === 0) return { consultants: [], activeService: service, hasNext: false };

  // Optional name filter: intersect with ILIKE results
  if (q) {
    const { data: filtered = [] } = await sb
      .from("consultants")
      .select("id")
      .in("id", idsAll)
      .eq("visibility", "public")
      .eq("status", "approved")
      .ilike("display_name", `%${q}%`);
    idsAll = filtered.map((r) => r.id).filter(Boolean);
    if (idsAll.length === 0) return { consultants: [], activeService: service, hasNext: false };
  }

  idsAll = seededShuffle(idsAll, seed);
  const hasNext = idsAll.length > page * PAGE_SIZE;
  const pageIds = idsAll.slice(offset, offset + PAGE_SIZE);
  if (pageIds.length === 0) return { consultants: [], activeService: service, hasNext };

  const { data: rows = [] } = await sb
    .from("consultants")
    .select(CARD_SELECT)
    .in("id", pageIds)
    .eq("visibility", "public")
    .eq("status", "approved");

  const byId = new Map(rows.map((r) => [r.id, r]));
  const consultants = pageIds.map((id) => byId.get(id)).filter(Boolean);

  return { consultants, activeService: service, hasNext };
}

async function getConsultantsByCategorySlug(sb, categorySlug, page, seed, q) {
  const offset = (page - 1) * PAGE_SIZE;

  if (!categorySlug) {
    return getAllConsultantsPage(sb, page, seed, q);
  }

  const { data: category } = await sb
    .from("service_categories")
    .select("id, name, slug")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (!category) return { consultants: [], activeCategory: null, hasNext: false };

  const { data: servicesData } = await sb.from("services").select("id").eq("category_id", category.id);
  const serviceIds = toArray(servicesData).map((s) => s.id).filter(Boolean);
  if (serviceIds.length === 0) return { consultants: [], activeCategory: category, hasNext: false };

  const { data: linkRowsData } = await sb
    .from("consultant_services")
    .select("consultant_id")
    .in("service_id", serviceIds);

  let idsAll = uniq(toArray(linkRowsData).map((r) => r.consultant_id).filter(Boolean));
  if (idsAll.length === 0) return { consultants: [], activeCategory: category, hasNext: false };

  // Optional name filter: intersect with ILIKE results
  if (q) {
    const { data: filtered = [] } = await sb
      .from("consultants")
      .select("id")
      .in("id", idsAll)
      .eq("visibility", "public")
      .eq("status", "approved")
      .ilike("display_name", `%${q}%`);
    idsAll = filtered.map((r) => r.id).filter(Boolean);
    if (idsAll.length === 0) return { consultants: [], activeCategory: category, hasNext: false };
  }

  idsAll = seededShuffle(idsAll, seed);
  const hasNext = idsAll.length > page * PAGE_SIZE;
  const pageIds = idsAll.slice(offset, offset + PAGE_SIZE);
  if (pageIds.length === 0) return { consultants: [], activeCategory: category, hasNext };

  const { data: rows = [] } = await sb
    .from("consultants")
    .select(CARD_SELECT)
    .in("id", pageIds)
    .eq("visibility", "public")
    .eq("status", "approved");

  const byId = new Map(rows.map((r) => [r.id, r]));
  const consultants = pageIds.map((id) => byId.get(id)).filter(Boolean);

  return { consultants, activeCategory: category, hasNext };
}

// --- Utility: derive a location phrase from query slugs for SEO flavor ---
function deriveLocationPhrase(serviceSlug, categorySlug) {
  const slug = (serviceSlug || categorySlug || "").toLowerCase();
  if (slug.includes("perth") || slug.includes("wa") || slug.includes("western")) return "Perth & Western Australia";
  if (slug.includes("brisbane") || slug.includes("queensland") || slug.includes("qld")) return "Brisbane & Queensland";
  if (slug.includes("open-pit")) return "Open Pit Operations";
  if (slug.includes("planning")) return "Mine Planning";
  return "Australia";
}

// --- JSON-LD builder (optional SEO enrichment) ---
function buildJsonLd(consultants) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Mining Engineering Consultants Directory",
    "itemListElement": consultants.map((c, i) => ({
      "@type": "Organization",
      "position": i + 1,
      "name": c.display_name,
      "url": `https://youmine.example/consultants/${c.id}`,
      ...(c.location ? { "address": { "@type": "PostalAddress", "addressLocality": c.location } } : {})
    }))
  };
}

export default async function ConsultantsPage({ searchParams }) {
  const sp = searchParams || {};
  const serviceSlug = typeof sp.service === "string" ? sp.service : "";
  const categorySlug = typeof sp.category === "string" ? sp.category : "";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const requestedPage = Number.parseInt(sp.page ?? "1", 10);
  const page = Number.isNaN(requestedPage) ? 1 : Math.max(1, requestedPage);

  const sb = supabasePublicServer();
  const seed = getSeed();

  const dataResult = serviceSlug
    ? await getConsultantsByServiceSlug(sb, serviceSlug, page, seed, q)
    : await getConsultantsByCategorySlug(sb, categorySlug, page, seed, q);

  const consultants = dataResult.consultants;
  const activeCategory = dataResult.activeCategory || null;
  const activeService = dataResult.activeService || null;
  const hasNext = Boolean(dataResult.hasNext);
  const hasPrev = page > 1;

  const { data: allCategories = [] } = await sb
    .from("service_categories")
    .select("id, name, slug")
    .order("position", { ascending: true })
    .order("name", { ascending: true });

  const { data: allServices = [] } = await sb
    .from("services")
    .select("id, name, slug")
    .order("name", { ascending: true });

  const buildPageHref = (targetPage) => {
    const params = new URLSearchParams();
    if (serviceSlug) params.set("service", serviceSlug);
    else if (categorySlug) params.set("category", categorySlug);
    if (q) params.set("q", q);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qstr = params.toString();
    return `/consultants${qstr ? `?${qstr}` : ""}`;
  };

  const locationPhrase = deriveLocationPhrase(serviceSlug, categorySlug);
  const jsonLd = buildJsonLd(consultants);

  return (
    <main
      className="mx-auto w-full max-w-6xl px-6 pt-0 md:pt-10 space-y-0 md:space-y-10 pb-24 sm:pb-12"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4.5rem)" }}
    >
      {/* Desktop dual hero only */}
      <section className="hidden md:grid gap-6 lg:grid-cols-2">
        <div className="
          group relative overflow-hidden rounded-3xl
          border border-sky-400/30 bg-gradient-to-br from-slate-900/70 via-sky-900/30 to-indigo-900/40
          p-6 backdrop-blur-xl shadow-lg ring-1 ring-sky-300/20
        ">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -left-28 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
          </div>
          <h1 className="relative text-2xl md:text-3xl font-bold tracking-tight text-white">
            Discover Mining Professionals
          </h1>
          <p className="relative mt-3 text-sm leading-relaxed text-slate-200">
            Discover vetted mine consultants and contractors across {locationPhrase}. Compare expertise,
            disciplines, locations, and capabilities to deliver studies, projects, design, operations, and optimization.
          </p>
          <div className="relative mt-6 text-xs text-slate-400">
            Listing order rotates periodically to surface a broader range of consultants.
          </div>
        </div>

        <div className="
          relative rounded-3xl border border-emerald-400/30
          bg-gradient-to-br from-slate-900/70 via-emerald-900/30 to-cyan-900/40
          p-5 backdrop-blur-xl shadow-lg ring-1 ring-emerald-300/20
        ">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-16 -left-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          </div>
          <h2 className="relative text-xl md:text-2xl font-semibold text-white">
            Consultant or contractor? Join YouMine.
          </h2>
          <p className="relative mt-3 text-sm leading-relaxed text-slate-200">
            List your company or contractor profile, showcase capabilities, and connect with clients seeking specialist mining expertise.
          </p>
          <div className="relative mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-100/90 backdrop-blur-sm">Free to list</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-100/90 backdrop-blur-sm">Fast setup</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-100/90 backdrop-blur-sm">Own your profile</span>
          </div>
          <div className="relative mt-3 inline-flex">
            <AddConsultantButton className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-slate-100 transition" />
          </div>
        </div>
      </section>

      {/* Mobile hero + floating filter sheet trigger */}
      <MobileHeroAndFilters
        categories={allCategories}
        services={allServices}
        q={q}
        activeService={activeService}
        activeCategory={activeCategory}
        hasActive={Boolean(activeService || activeCategory || q)}
        consultantsCount={consultants.length}
      />

      {/* Filters (desktop only) */}
      <section className="hidden md:block rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm p-4 shadow-sm ring-1 ring-white/5 space-y-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <ServiceFilter categories={allCategories} activeSlug={activeCategory?.slug || ""} />
            <ServiceSlugFilter services={allServices} activeSlug={activeService?.slug || ""} />
            <NameSearch initialValue={q} />
          </div>
          {(activeService || activeCategory || q) && (
            <Link
              href="/consultants"
              prefetch
              className="h-9 inline-flex items-center rounded-xl border border-white/10 bg-white/10 px-4 text-xs font-semibold text-slate-100 backdrop-blur-md hover:bg-white/15 transition focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            >
              Reset
            </Link>
          )}
        </div>

        {(activeService || activeCategory || q) ? (
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
            {q && (
              <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 font-medium text-sky-200">
                Name: “{q}”
              </span>
            )}
            {activeService && (
              <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 font-medium text-indigo-200">
                Service: {activeService.name}
              </span>
            )}
            {!activeService && activeCategory && (
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 font-medium text-emerald-200">
                Category: {activeCategory.name}
              </span>
            )}
            <span className="text-slate-500">
              {consultants.length} result{consultants.length === 1 ? "" : "s"}
            </span>
          </div>
        ) : (
          <div className="text-xs text-slate-400">
            Browse all consultants. Use filters or search to refine.
          </div>
        )}
      </section>

      {/* Grid */}
      <section className="mt-6 md:mt-0 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {consultants.length === 0 ? (
          <div className="text-slate-400 text-sm sm:col-span-2 lg:col-span-3">
            No consultants found for this selection.
          </div>
        ) : (
          consultants.map((c) => (
            <article
              key={c.id}
              className="relative rounded-xl border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/5 transition hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="flex items-start gap-3">
                {c?.metadata?.logo?.url ? (
                  <img
                    src={c.metadata.logo.url}
                    alt={`${c.display_name} logo`}
                    width={48}
                    height={48}
                    loading="lazy"
                    decoding="async"
                    className="h-12 w-12 shrink-0 rounded-md bg-white/5 object-contain"
                  />
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded-md bg-white/5" aria-hidden="true" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white">{c.display_name}</h3>
                  {c.headline && <p className="mt-1 text-sm text-slate-300">{c.headline}</p>}
                  {c.location && <div className="mt-1 text-xs text-slate-400">{c.location}</div>}
                </div>
              </div>
              <div className="mt-3">
                <Link
                  href={`/consultants/${c.id}`}
                  prefetch
                  className="inline-flex items-center rounded-md bg-gradient-to-r from-sky-600 to-indigo-600 px-3 py-1.5 text-xs font-medium"
                >
                  View Profile
                </Link>
              </div>
            </article>
          ))
        )}
      </section>

      {/* Pagination */}
      <div className="mt-6 mb-20 flex items-center justify-center gap-2">
        <Link
          href={hasPrev ? buildPageHref(page - 1) : "#"}
          className={`rounded-md border border-white/10 px-3 py-1.5 text-sm ${
            hasPrev ? "text-slate-200 hover:bg-white/10" : "text-slate-500 cursor-not-allowed"
          }`}
          prefetch
          aria-disabled={!hasPrev}
        >
          Prev
        </Link>
        <span className="text-xs text-slate-400">Page {page}</span>
        <Link
          href={hasNext ? buildPageHref(page + 1) : "#"}
          className={`rounded-md border border-white/10 px-3 py-1.5 text-sm ${
            hasNext ? "text-slate-200 hover:bg-white/10" : "text-slate-500 cursor-not-allowed"
          }`}
          prefetch
          aria-disabled={!hasNext}
        >
          Next
        </Link>
      </div>

      <div className="h-8 sm:h-0" aria-hidden="true" />

      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            ...jsonLd,
            name: "Mine Consultants & Contractors Directory",
          }),
        }}
      />
    </main>
  );
}