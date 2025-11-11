import Link from "next/link";
import { supabasePublicServer } from "@/lib/supabasePublicServer";
import AddConsultantButton from "@/app/components/consultants/AddConsultantButton";
import ServiceFilter from "./ServiceFilter.client.jsx";

export const runtime = "nodejs";
// Ensure filters (query params) always re-evaluate on navigation
export const dynamic = "force-dynamic";
export const revalidate = 0;

const PAGE_SIZE = 15;
const CARD_SELECT = "id, slug, display_name, headline, location, visibility, status, metadata";

// Base list with sentinel pagination
async function getAllConsultantsPage(sb, page) {
  const offset = (page - 1) * PAGE_SIZE;
  const { data = [] } = await sb
    .from("consultants")
    .select(CARD_SELECT)
    .eq("visibility", "public")
    .eq("status", "approved")
    .order("display_name", { ascending: true })
  // Fetch PAGE_SIZE + 1 for sentinel
    .range(offset, offset + PAGE_SIZE);

  const hasNext = data.length > PAGE_SIZE;
  const consultants = hasNext ? data.slice(0, PAGE_SIZE) : data;
  return { consultants, hasNext };
}

// Helpers
const toArray = (d) => (Array.isArray(d) ? d : []);
const uniq = (arr) => Array.from(new Set(arr));

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

  // Get consultant IDs for this service (simple path, no nested filters)
  const { data: linkRowsData } = await sb
    .from("consultant_services")
    .select("consultant_id")
    .eq("service_id", service.id);

  const idsAll = uniq(toArray(linkRowsData).map((r) => r.consultant_id).filter(Boolean));
  if (idsAll.length === 0) return { consultants: [], activeService: service, hasNext: false };

  // Page the ids
  const hasNext = idsAll.length > page * PAGE_SIZE;
  const pageIds = idsAll.slice(offset, offset + PAGE_SIZE);

  if (pageIds.length === 0) return { consultants: [], activeService: service, hasNext };

  // Fetch consultants for ids, enforce visibility/status and sort by name
  const { data: consultants = [] } = await sb
    .from("consultants")
    .select(CARD_SELECT)
    .in("id", pageIds)
    .eq("visibility", "public")
    .eq("status", "approved");

  consultants.sort((a, b) => String(a.display_name).localeCompare(String(b.display_name)));

  return { consultants, activeService: service, hasNext };
}

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

  // Get all services under this category
  const { data: servicesData } = await sb
    .from("services")
    .select("id")
    .eq("category_id", category.id);

  const serviceIds = toArray(servicesData).map((s) => s.id).filter(Boolean);
  if (serviceIds.length === 0) return { consultants: [], activeCategory: category, hasNext: false };

  // Get consultant IDs across those services
  const { data: linkRowsData } = await sb
    .from("consultant_services")
    .select("consultant_id")
    .in("service_id", serviceIds);

  const idsAll = uniq(toArray(linkRowsData).map((r) => r.consultant_id).filter(Boolean));
  if (idsAll.length === 0) return { consultants: [], activeCategory: category, hasNext: false };

  const hasNext = idsAll.length > page * PAGE_SIZE;
  const pageIds = idsAll.slice(offset, offset + PAGE_SIZE);

  if (pageIds.length === 0) return { consultants: [], activeCategory: category, hasNext };

  const { data: consultants = [] } = await sb
    .from("consultants")
    .select(CARD_SELECT)
    .in("id", pageIds)
    .eq("visibility", "public")
    .eq("status", "approved");

  consultants.sort((a, b) => String(a.display_name).localeCompare(String(b.display_name)));

  return { consultants, activeCategory: category, hasNext };
}

export default async function ConsultantsPage({ searchParams }) {
  // searchParams is a plain object; don’t await
  const sp = searchParams || {};
  const serviceSlug = typeof sp.service === "string" ? sp.service : "";
  const categorySlug = typeof sp.category === "string" ? sp.category : "";
  const requestedPage = Number.parseInt((sp.page ?? "1"), 10);
  const page = Number.isNaN(requestedPage) ? 1 : Math.max(1, requestedPage);

  const sb = supabasePublicServer();

  // Prefer service when both exist
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
        <h1 className="text-2xl font-semibold text-white">Want to join YouMine?</h1>
        <p className="mt-2 text-sm text-slate-200">
          Add your consultancy to showcase your services to potential clients and manage your profile directly on YouMine.
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
                <>Filtering by service: <span className="font-medium text-white">{activeService.name}</span></>
              ) : (
                <>Filtering by category: <span className="font-medium text-white">{activeCategory?.name}</span></>
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

      {/* Grid */}
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

      {/* Pagination */}
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

      <div className="h-8 sm:h-0" aria-hidden="true" />
    </main>
  );
}