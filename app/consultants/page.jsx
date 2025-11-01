import Link from "next/link";
import { supabasePublicServer } from "@/lib/supabasePublicServer";
import AddConsultantButton from "@/app/components/consultants/AddConsultantButton";
import ServiceFilter from "./ServiceFilter.client.jsx";

export const runtime = "nodejs";
export const revalidate = 180; // 3 minutes

const PAGE_SIZE = 15;
const CARD_SELECT = "id, slug, display_name, headline, location, visibility, status, metadata";

// Paginate base list without exact count
async function getAllConsultantsPage(sb, page) {
  const offset = (page - 1) * PAGE_SIZE;
  // Fetch one extra row as a sentinel to detect a next page
  const { data = [] } = await sb
    .from("consultants")
    .select(CARD_SELECT)
    .eq("visibility", "public")
    .eq("status", "approved")
    .order("display_name", { ascending: true })
    .range(offset, offset + PAGE_SIZE); // inclusive, returns up to PAGE_SIZE+1

  const hasNext = data.length > PAGE_SIZE;
  const consultants = hasNext ? data.slice(0, PAGE_SIZE) : data;
  return { consultants, hasNext };
}

// Fetch by exact service slug with DB-level pagination on consultant_services
async function getConsultantsByServiceSlug(sb, serviceSlug, page) {
  const offset = (page - 1) * PAGE_SIZE;

  if (!serviceSlug) {
    const { consultants, hasNext } = await getAllConsultantsPage(sb, page);
    return { consultants, activeService: null, hasNext };
  }

  const { data: service } = await sb
    .from("services")
    .select("id, name, slug")
    .eq("slug", serviceSlug)
    .maybeSingle();

  if (!service) return { consultants: [], activeService: null, hasNext: false };

  // Pull one page of consultant ids ordered by consultant.display_name
  const { data: linkRows = [] } = await sb
    .from("consultant_services")
    .select("consultant_id, consultant:consultant_id(display_name)")
    .eq("service_id", service.id)
    .eq("consultant.visibility", "public", { foreignTable: "consultant" })
    .eq("consultant.status", "approved", { foreignTable: "consultant" })
    .order("consultant.display_name", { ascending: true, foreignTable: "consultant" })
    .range(offset, offset + PAGE_SIZE); // inclusive; sentinel

  // De-dup + compute paging
  const idsOrdered = [];
  const seen = new Set();
  for (const r of linkRows) {
    if (!seen.has(r.consultant_id)) {
      seen.add(r.consultant_id);
      idsOrdered.push(r.consultant_id);
    }
  }
  const hasNext = idsOrdered.length > PAGE_SIZE;
  const pageIds = hasNext ? idsOrdered.slice(0, PAGE_SIZE) : idsOrdered;

  if (pageIds.length === 0) return { consultants: [], activeService: service, hasNext: false };

  const { data: consultants = [] } = await sb
    .from("consultants")
    .select(CARD_SELECT)
    .in("id", pageIds);

  // Preserve order
  const orderMap = new Map(pageIds.map((id, i) => [id, i]));
  consultants.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

  return { consultants, activeService: service, hasNext };
}

// Fetch by category slug with DB-level pagination on consultant_services→services
async function getConsultantsByCategorySlug(sb, categorySlug, page) {
  const offset = (page - 1) * PAGE_SIZE;

  if (!categorySlug) {
    const { consultants, hasNext } = await getAllConsultantsPage(sb, page);
    return { consultants, activeCategory: null, hasNext };
  }

  const { data: category } = await sb
    .from("service_categories")
    .select("id, name, slug")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (!category) return { consultants: [], activeCategory: null, hasNext: false };

  const { data: linkRows = [] } = await sb
    .from("consultant_services")
    .select("consultant_id, consultant:consultant_id(display_name), service:service_id(category_id)")
    .eq("service.category_id", category.id, { foreignTable: "service" })
    .eq("consultant.visibility", "public", { foreignTable: "consultant" })
    .eq("consultant.status", "approved", { foreignTable: "consultant" })
    .order("consultant.display_name", { ascending: true, foreignTable: "consultant" })
    .range(offset, offset + PAGE_SIZE); // inclusive; sentinel

  const idsOrdered = [];
  const seen = new Set();
  for (const r of linkRows) {
    if (!seen.has(r.consultant_id)) {
      seen.add(r.consultant_id);
      idsOrdered.push(r.consultant_id);
    }
  }
  const hasNext = idsOrdered.length > PAGE_SIZE;
  const pageIds = hasNext ? idsOrdered.slice(0, PAGE_SIZE) : idsOrdered;

  if (pageIds.length === 0) return { consultants: [], activeCategory: category, hasNext: false };

  const { data: consultants = [] } = await sb
    .from("consultants")
    .select(CARD_SELECT)
    .in("id", pageIds);

  const orderMap = new Map(pageIds.map((id, i) => [id, i]));
  consultants.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

  return { consultants, activeCategory: category, hasNext };
}

export default async function ConsultantsPage({ searchParams }) {
  const sp = await searchParams;
  const serviceSlug = sp?.service || "";
  const categorySlug = sp?.category || "";
  const requestedPage = Number.parseInt(sp?.page ?? "1", 10);
  const page = Number.isNaN(requestedPage) ? 1 : Math.max(1, requestedPage);

  const sb = supabasePublicServer();

  const dataResult = serviceSlug
    ? await getConsultantsByServiceSlug(sb, serviceSlug, page)
    : await getConsultantsByCategorySlug(sb, categorySlug, page);

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

  const buildPageHref = (targetPage) => {
    const params = new URLSearchParams();
    if (serviceSlug) params.set("service", serviceSlug);
    else if (categorySlug) params.set("category", categorySlug);
    if (targetPage > 1) params.set("page", String(targetPage));
    const q = params.toString();
    return `/consultants${q ? `?${q}` : ""}`;
  };

  return (
    <main
      className="mx-auto w-full max-w-6xl px-6 py-10 space-y-8 pb-24 sm:pb-12"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 4.5rem)" }}
    >
      <section className="rounded-3xl border border-sky-400/30 bg-sky-500/10 p-6 text-slate-100 shadow-lg ring-1 ring-sky-400/20">
        <h1 className="text-2xl font-semibold text-white">
          Want to join MineHub?
        </h1>
        <p className="mt-2 text-sm text-slate-200">
          Add your consultancy to showcase your services to potential clients and manage your profile directly on MineLink.
        </p>
        <div className="mt-4 inline-flex items-center">
          <AddConsultantButton className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-slate-100" />
        </div>
      </section>

      {/* Category filter (single select) */}
      <section className="mt-2 space-y-2">
        <ServiceFilter categories={allCategories} activeSlug={activeCategory?.slug || ""} />
        {(activeService || activeCategory) ? (
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-slate-300">
              {activeService ? (
                <>
                  Filtering by service: <span className="font-medium text-white">{activeService.name}</span>
                </>
              ) : (
                <>
                  Filtering by category: <span className="font-medium text-white">{activeCategory?.name}</span>
                </>
              )}
            </div>
            <Link
              href="/consultants"
              prefetch
              className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-100 shadow backdrop-blur-md ring-1 ring-white/10 hover:bg-white/15"
            >
              Show all consultants
            </Link>
          </div>
        ) : (
          <div className="text-sm text-slate-400">Browse all consultants.</div>
        )}
      </section>

      {/* Grid of consultant cards */}
      <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {consultants.length === 0 ? (
          <div className="text-slate-400 text-sm sm:col-span-2 lg:col-span-3">
            No consultants found for this selection.
          </div>
        ) : (
          consultants.map((c) => (
            <article
              key={c.id}
              className="relative rounded-xl border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/5 transition hover:border-white/20"
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
                  {c.headline ? <p className="mt-1 text-sm text-slate-300">{c.headline}</p> : null}
                  {c.location ? <div className="mt-1 text-xs text-slate-400">{c.location}</div> : null}
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

      {/* Pagination (no exact total; sentinel-based) */}
      <div className="mt-4 mb-20 flex items-center justify-center gap-2">
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

      {/* Spacer to ensure no overlap on very small viewports */}
      <div className="h-8 sm:h-0" aria-hidden="true" />
    </main>
  );
}