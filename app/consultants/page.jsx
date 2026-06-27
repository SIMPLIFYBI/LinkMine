import Link from "next/link";
import { unstable_cache } from "next/cache";
import { supabasePublicServer } from "@/lib/supabasePublicServer";
import { siteUrl } from "@/lib/siteUrl";
import {
  normaliseSiteMarket as normaliseMarketParam,
  siteMarketLabel as marketLabel,
  siteMarketToUrlValue as marketParamToUrlValue,
} from "@/lib/siteMarket";
import { getResolvedSiteMarket } from "@/lib/siteMarketServer";
import AddConsultantButton from "@/app/components/consultants/AddConsultantButton";
import ServiceFilter from "./ServiceFilter.client.jsx";
import NameSearch from "./NameSearch.client.jsx";
import ServiceSlugFilter from "./ServiceSlugFilter.client.jsx";
import MobileHeroAndFilters from "./MobileHeroAndFilters.client.jsx"; // NEW
import ProviderKindFilter from "./ProviderKindFilter.client.jsx"; // NEW

export const runtime = "nodejs";
export const revalidate = 300;
export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;
const SEED_BUCKET_MS = 5 * 60 * 1000;

function formatSlugLabel(value) {
  return String(value || "")
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function buildConsultantsListingHref({ market, serviceSlug, categorySlug, q, kindParam, page }) {
  const params = new URLSearchParams();
  const marketValue = marketParamToUrlValue(normaliseMarketParam(market));
  if (marketValue !== "mining") params.set("market", marketValue);
  if (serviceSlug) params.set("service", serviceSlug);
  else if (categorySlug) params.set("category", categorySlug);
  if (q) params.set("q", q);
  if (kindParam) params.set("kind", kindParam);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return `/consultants${query ? `?${query}` : ""}`;
}

function getSeed() {
  return Math.floor(Date.now() / SEED_BUCKET_MS);
}

const getConsultantsDirectoryReferenceData = unstable_cache(
  async (market) => {
    const sb = supabasePublicServer();
    const marketDb = normaliseMarketParam(market);

    const marketFilter = marketDb === "both"
      ? ["mining", "oil_gas"]
      : marketDb;

    const [{ data: categories = [] }, { data: services = [] }] = await Promise.all([
      typeof marketFilter === "string"
        ? sb
            .from("service_categories")
            .select("id, name, slug, market")
            .eq("market", marketFilter)
            .order("position", { ascending: true })
            .order("name", { ascending: true })
        : sb
            .from("service_categories")
            .select("id, name, slug, market")
            .in("market", marketFilter)
            .order("position", { ascending: true })
            .order("name", { ascending: true }),
      typeof marketFilter === "string"
        ? sb
            .from("services")
            .select("id, name, slug, category_id, market")
            .eq("market", marketFilter)
            .order("name", { ascending: true })
        : sb
            .from("services")
            .select("id, name, slug, category_id, market")
            .in("market", marketFilter)
            .order("name", { ascending: true }),
    ]);

    return { categories, services };
  },
  ["consultants-directory-reference-data"],
  { revalidate: 3600 }
);

async function getConsultantsDirectoryPageViaRpc(
  sb,
  { market, serviceSlug, categorySlug, q, providerKind, page, seed }
) {
  if (normaliseMarketParam(market) === "both") {
    const combinedPageSize = (page * PAGE_SIZE) + PAGE_SIZE;
    const params = {
      p_service_slug: serviceSlug || null,
      p_category_slug: categorySlug || null,
      p_q: q || null,
      p_provider_kind: providerKind || null,
      p_page: 1,
      p_page_size: combinedPageSize,
      p_seed_bucket: String(seed),
    };

    const [miningResult, oilGasResult] = await Promise.all([
      sb.rpc("get_consultants_directory_page", {
        ...params,
        p_market: "mining",
      }),
      sb.rpc("get_consultants_directory_page", {
        ...params,
        p_market: "oil_gas",
      }),
    ]);

    if (miningResult.error || oilGasResult.error) {
      const error = miningResult.error || oilGasResult.error;
      console.error("consultants directory rpc error:", error);
      throw new Error(error.message || "Could not load consultants directory.");
    }

    const rowsByMarket = [miningResult.data, oilGasResult.data].map((resultRows) =>
      asArray(resultRows).map(({ has_next, ...consultant }) => consultant)
    );

    const merged = [];
    const seen = new Set();
    let index = 0;

    while (true) {
      let foundRow = false;
      for (const rows of rowsByMarket) {
        const consultant = rows[index];
        if (!consultant) continue;
        foundRow = true;
        if (seen.has(consultant.id)) continue;
        seen.add(consultant.id);
        merged.push(consultant);
      }
      if (!foundRow) break;
      index += 1;
    }

    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return {
      consultants: merged.slice(startIndex, endIndex),
      hasNext: merged.length > endIndex || rowsByMarket.some((rows) => rows.length >= combinedPageSize),
    };
  }

  const { data, error } = await sb.rpc("get_consultants_directory_page", {
    p_service_slug: serviceSlug || null,
    p_category_slug: categorySlug || null,
    p_q: q || null,
    p_provider_kind: providerKind || null,
    p_page: page,
    p_page_size: PAGE_SIZE,
    p_seed_bucket: String(seed),
    p_market: normaliseMarketParam(market),
  });

  if (error) {
    console.error("consultants directory rpc error:", error);
    throw new Error(error.message || "Could not load consultants directory.");
  }

  const rows = asArray(data);
  const hasNextFromRpc = rows[0]?.has_next;
  return {
    consultants: rows
      .map(({ has_next, ...consultant }) => consultant)
      .slice(0, PAGE_SIZE),
    hasNext:
      typeof hasNextFromRpc === "boolean"
        ? hasNextFromRpc
        : rows.length > PAGE_SIZE,
  };
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
function buildJsonLd(consultants, market) {
  const marketName = marketLabel(market);
  const canonical = buildConsultantsListingHref({ market, page: 1 });
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${marketName} Consultants & Contractors Directory`,
    "url": siteUrl(canonical),
    "numberOfItems": consultants.length,
    "itemListElement": consultants.map((c, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "url": siteUrl(`/consultants/${c.id}`),
      "item": {
        "@type": "Organization",
        "name": c.display_name,
        ...(c.headline ? { "description": c.headline } : {}),
        ...(c.location
          ? { "address": { "@type": "PostalAddress", "addressLocality": c.location } }
          : {}),
        ...(c?.metadata?.logo?.url ? { "image": c.metadata.logo.url } : {}),
      },
    })),
  };
}

export async function generateMetadata({ searchParams }) {
  const sp = (await searchParams) || {};
  const { market } = await getResolvedSiteMarket(typeof sp.market === "string" ? sp.market : null);
  const serviceSlug = typeof sp.service === "string" ? sp.service : "";
  const categorySlug = typeof sp.category === "string" ? sp.category : "";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const kindParam = typeof sp.kind === "string" ? sp.kind : "";
  const requestedPage = Number.parseInt(sp.page ?? "1", 10);
  const page = Number.isNaN(requestedPage) ? 1 : Math.max(1, requestedPage);

  const focusLabel = serviceSlug
    ? formatSlugLabel(serviceSlug)
    : categorySlug
    ? formatSlugLabel(categorySlug)
    : `${marketLabel(market)} Consultants & Contractors Directory`;
  const titlePrefix = q
    ? `Search results for \"${q}\"`
    : focusLabel === `${marketLabel(market)} Consultants & Contractors Directory`
    ? focusLabel
    : `${focusLabel} consultants`;
  const title = page > 1 ? `${titlePrefix} · Page ${page}` : titlePrefix;
  const description = q
    ? `Browse consultant search results for ${q} on YouMine${page > 1 ? `, page ${page}` : ""}.`
    : `Discover verified ${marketLabel(market).toLowerCase()} consultants and contractors${
        focusLabel === `${marketLabel(market)} Consultants & Contractors Directory` ? "" : ` for ${focusLabel}`
      } on YouMine${page > 1 ? `, page ${page}` : ""}.`;
  const canonical = buildConsultantsListingHref({ market, serviceSlug, categorySlug, q, kindParam, page });

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: q
      ? {
          index: false,
          follow: true,
        }
      : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
  };
}

// Utils
const uniq = (arr) => Array.from(new Set(arr));
const asArray = (v) => (Array.isArray(v) ? v : []);

export default async function ConsultantsPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const { market } = await getResolvedSiteMarket(typeof sp.market === "string" ? sp.market : null);
  const serviceSlug = typeof sp.service === "string" ? sp.service : "";
  const categorySlug = typeof sp.category === "string" ? sp.category : "";
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const kindParam = typeof sp.kind === "string" ? sp.kind : ""; // "", "operational", "professional", "both"
  const requestedPage = Number.parseInt(sp.page ?? "1", 10);
  const page = Number.isNaN(requestedPage) ? 1 : Math.max(1, requestedPage);

  const sb = supabasePublicServer();
  const seed = getSeed();

  const kindDb =
    kindParam === "operational" ? "Operational Services" :
    kindParam === "professional" ? "Professional Services" :
    kindParam === "both" ? "both" : null;

  const [directoryPage, referenceData] = await Promise.all([
    getConsultantsDirectoryPageViaRpc(sb, {
      market,
      serviceSlug,
      categorySlug,
      page,
      seed,
      q,
      providerKind: kindDb,
    }),
    getConsultantsDirectoryReferenceData(market),
  ]);

  const allCategories = referenceData.categories || [];
  const allServices = referenceData.services || [];

  const consultants = directoryPage.consultants;
  const activeService = allServices.find((service) => service.slug === serviceSlug) || null;
  const activeCategory = allCategories.find((category) => category.slug === categorySlug) || null;
  const hasNext = Boolean(directoryPage.hasNext);
  const hasPrev = page > 1;

  const effectiveCategoryId = activeCategory?.id || activeService?.category_id || null;
  const effectiveCategory = effectiveCategoryId
    ? allCategories.find((category) => category.id === effectiveCategoryId) || null
    : null;
  const visibleServices = effectiveCategoryId
    ? allServices.filter((service) => service.category_id === effectiveCategoryId)
    : allServices;

  const buildPageHref = (targetPage) =>
    buildConsultantsListingHref({
      serviceSlug,
      categorySlug,
      market,
      q,
      kindParam,
      page: targetPage,
    });

  const locationPhrase = deriveLocationPhrase(serviceSlug, categorySlug);
  const jsonLd = buildJsonLd(consultants, market);
  const marketName = marketLabel(market);

  return (
    <main
      data-market={market}
      className="mx-auto w-full max-w-6xl px-6 pt-0 md:pt-10 space-y-0 md:space-y-10 pb-24 sm:pb-12"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4.5rem)" }}
    >
      <div className="consultants-market-shell contents" data-market={market}>
      {/* Desktop dual hero only */}
      <section className="hidden md:grid gap-6 lg:grid-cols-2">
        <div className="
          consultants-market-hero group relative overflow-hidden rounded-3xl
          p-6 backdrop-blur-xl ring-1 ring-white/10
        ">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -left-28 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
          </div>
          <div className="consultants-market-kicker relative text-[11px] font-semibold uppercase tracking-[0.24em]">
            {marketName} Directory
          </div>
          <h1 className="relative mt-3 text-2xl md:text-3xl font-bold tracking-tight text-white">
            Discover {marketName} Professionals
          </h1>
          <p className="relative mt-3 text-sm leading-relaxed text-slate-200">
            Discover vetted {marketName.toLowerCase()} consultants and contractors across {locationPhrase}. Compare expertise,
            disciplines, locations, and capabilities to deliver studies, projects, design, operations, and optimization.
          </p>
          <div className="relative mt-6 text-xs text-slate-400">
            Listing order rotates periodically to surface a broader range of consultants.
          </div>
        </div>

        <div className="
          consultants-market-secondary relative rounded-3xl
          p-5 backdrop-blur-xl shadow-lg ring-1 ring-white/10
        ">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-16 -left-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
          </div>
          <h2 className="relative text-2xl md:text-3xl font-bold tracking-tight text-white">
            Join YouMine
          </h2>
          <p className="relative mt-3 text-sm leading-relaxed text-slate-200">
            List your company or contractor profile, showcase capabilities, and connect with clients seeking specialist {marketName.toLowerCase()} expertise.
          </p>
          <div className="relative mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-100/90 backdrop-blur-sm">Free to list</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-100/90 backdrop-blur-sm">Fast setup</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-100/90 backdrop-blur-sm">Own your profile</span>
          </div>
          <div className="relative mt-3 inline-flex">
            <AddConsultantButton className="consultants-market-cta rounded-full px-5 py-2 text-sm font-semibold shadow transition hover:brightness-110" />
          </div>
        </div>
      </section>

      {/* Mobile hero + floating filter sheet trigger */}
      <MobileHeroAndFilters
        market={market}
        categories={allCategories}
        services={visibleServices}
        q={q}
        activeService={activeService}
        activeCategory={effectiveCategory}
        hasActive={Boolean(activeService || activeCategory || q)}
        consultantsCount={consultants.length}
      />

      {/* Filters (desktop only) */}
      <section className="hidden py-3 md:block md:py-4 space-y-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <ServiceFilter categories={allCategories} activeSlug={effectiveCategory?.slug || ""} />
            <ServiceSlugFilter services={visibleServices} activeSlug={activeService?.slug || ""} />
            <ProviderKindFilter />
            <NameSearch initialValue={q} />
          </div>
          {(activeService || activeCategory || q) && (
            <Link
              href={buildConsultantsListingHref({ market, page: 1 })}
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
            {kindParam && (
              <span className="rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 font-medium text-fuchsia-200">
                Type: {kindDb || "Both"}
              </span>
            )}
            <span className="consultants-market-chip rounded-full px-3 py-1 font-medium">
              Market: {marketName}
            </span>
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
            <Link
              key={c.id}
              href={`/consultants/${c.id}`}
              prefetch
              className="consultants-market-card relative block rounded-xl p-5 ring-1 ring-white/5 transition focus:outline-none focus:ring-2 focus:ring-sky-500/40"
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
              <div className="consultants-market-kicker mt-3 text-xs font-medium">
                View profile
              </div>
            </Link>
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
      </div>

      <div className="h-8 sm:h-0" aria-hidden="true" />

      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            ...jsonLd,
            name: `${marketName} Consultants & Contractors Directory`,
          }),
        }}
      />
    </main>
  );
}