import Link from "next/link";
import { cookies } from "next/headers";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import AddConsultantButton from "@/app/components/consultants/AddConsultantButton";
import ConsultantFavouriteButton from "@/app/components/ConsultantFavouriteButton";
import ServiceFilter from "./ServiceFilter.client.jsx";

export const runtime = "nodejs";
export const revalidate = 180; // 3 minutes

const PAGE_SIZE = 15;
const CARD_SELECT = "id, slug, display_name, headline, location, visibility, status";

// New: fetch by service slug (exact service)
async function getConsultantsByServiceSlug(sb, serviceSlug, page) {
  const offset = (page - 1) * PAGE_SIZE;

  if (!serviceSlug) {
    const { data, count } = await sb
      .from("consultants")
      .select(CARD_SELECT, { count: "exact" })
      .eq("visibility", "public")
      .eq("status", "approved")
      .order("display_name", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    return { consultants: data || [], activeService: null, total: count || 0 };
  }

  const { data: service } = await sb
    .from("services")
    .select("id, name, slug")
    .eq("slug", serviceSlug)
    .maybeSingle();

  if (!service) {
    return { consultants: [], activeService: null, total: 0 };
  }

  // Join consultant_services and pull consultants linked to this service
  const { data: linkRows = [] } = await sb
    .from("consultant_services")
    .select(
      "consultant:consultant_id (id, slug, display_name, headline, location, visibility, status)"
    )
    .eq("service_id", service.id)
    .eq("consultant.visibility", "public", { foreignTable: "consultant" })
    .eq("consultant.status", "approved", { foreignTable: "consultant" });

  // De-duplicate consultants
  const unique = new Map();
  for (const row of linkRows) {
    const c = row.consultant;
    if (c && !unique.has(c.id)) unique.set(c.id, c);
  }
  const all = Array.from(unique.values());
  const total = all.length;

  // Paginate in memory
  const consultants = all
    .sort((a, b) => a.display_name.localeCompare(b.display_name))
    .slice(offset, offset + PAGE_SIZE);

  return { consultants, activeService: service, total };
}

// Existing: fetch by service category slug
async function getConsultantsByCategorySlug(sb, categorySlug, page) {
  const offset = (page - 1) * PAGE_SIZE;

  if (!categorySlug) {
    const { data, count } = await sb
      .from("consultants")
      .select(CARD_SELECT, { count: "exact" })
      .eq("visibility", "public")
      .eq("status", "approved")
      .order("display_name", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    return { consultants: data || [], activeCategory: null, total: count || 0 };
  }

  const { data: category } = await sb
    .from("service_categories")
    .select("id, name, slug")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (!category) {
    return { consultants: [], activeCategory: null, total: 0 };
  }

  // Join consultant_services -> services (filter on services.category_id)
  const { data: linkRows = [] } = await sb
    .from("consultant_services")
    .select(
      "consultant:consultant_id (id, slug, display_name, headline, location, visibility, status), service:service_id (category_id)"
    )
    .eq("service.category_id", category.id, { foreignTable: "service" })
    .eq("consultant.visibility", "public", { foreignTable: "consultant" })
    .eq("consultant.status", "approved", { foreignTable: "consultant" });

  // De-duplicate consultants (a consultant may have multiple services in the same category)
  const unique = new Map();
  for (const row of linkRows) {
    const c = row.consultant;
    if (c && !unique.has(c.id)) unique.set(c.id, c);
  }
  const all = Array.from(unique.values());
  const total = all.length;

  // Paginate in memory
  const consultants = all
    .sort((a, b) => a.display_name.localeCompare(b.display_name))
    .slice(offset, offset + PAGE_SIZE);

  return { consultants, activeCategory: category, total };
}

export default async function ConsultantsPage({ searchParams }) {
  const sp = await searchParams;
  const serviceSlug = sp?.service || "";     // NEW: exact service filter
  const categorySlug = sp?.category || "";   // existing category filter
  const requestedPage = Number.parseInt(sp?.page ?? "1", 10);
  const page = Number.isNaN(requestedPage) ? 1 : Math.max(1, requestedPage);

  const sb = await supabaseServerClient();

  // Prefer service filter if present; else category; else all
  const dataResult = serviceSlug
    ? await getConsultantsByServiceSlug(sb, serviceSlug, page)
    : await getConsultantsByCategorySlug(sb, categorySlug, page);

  const consultants = dataResult.consultants;
  const activeCategory = dataResult.activeCategory || null;
  const activeService = dataResult.activeService || null;
  const total = dataResult.total || 0;

  const { data: allCategories = [] } = await sb
    .from("service_categories")
    .select("id, name, slug")
    .order("position", { ascending: true })
    .order("name", { ascending: true });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  // Preserve selection in pagination links
  const buildPageHref = (targetPage) => {
    const params = new URLSearchParams();
    if (serviceSlug) params.set("service", serviceSlug);
    else if (categorySlug) params.set("category", categorySlug);
    if (targetPage > 1) params.set("page", String(targetPage));
    const q = params.toString();
    return `/consultants${q ? `?${q}` : ""}`;
  };

  // Favourites (auth optional)
  const jar = await cookies();
  const hasSbAuth = jar.getAll().some((c) => c.name.includes("auth-token"));
  let favouriteIds = new Set();
  if (hasSbAuth) {
    const { data: auth } = await sb.auth.getUser();
    const userId = auth?.user?.id || null;
    if (userId) {
      const { data: favRows } = await sb
        .from("consultant_favourites")
        .select("consultant_id")
        .eq("user_id", userId);
      favouriteIds = new Set(favRows?.map((r) => r.consultant_id) ?? []);
    }
  }

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
              prefetch={false}
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
              <div className="absolute right-4 top-4">
                <ConsultantFavouriteButton
                  consultantId={c.id}
                  initialFavourite={favouriteIds.has(c.id)}
                />
              </div>
              <h3 className="text-lg font-semibold text-white">{c.display_name}</h3>
              {c.headline ? <p className="mt-1 text-sm text-slate-300">{c.headline}</p> : null}
              {c.location ? <div className="mt-1 text-xs text-slate-400">{c.location}</div> : null}
              <div className="mt-3">
                <Link
                  href={`/consultants/${c.id}`}
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
          href={buildPageHref(Math.max(1, safePage - 1))}
          className="rounded-md border border-white/10 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10"
          prefetch={false}
        >
          Prev
        </Link>
        <span className="text-xs text-slate-400">Page {safePage} of {totalPages}</span>
        <Link
          href={buildPageHref(Math.min(totalPages, safePage + 1))}
          className="rounded-md border border-white/10 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10"
          prefetch={false}
        >
          Next
        </Link>
      </div>

      {/* Spacer to ensure no overlap on very small viewports */}
      <div className="h-8 sm:h-0" aria-hidden="true" />
    </main>
  );
}