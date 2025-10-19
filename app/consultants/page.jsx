export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { cookies } from "next/headers";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import AddConsultantButton from "@/app/components/consultants/AddConsultantButton";
import ConsultantFavouriteButton from "@/app/components/ConsultantFavouriteButton";
import ServiceFilter from "./ServiceFilter.client.jsx";

const PAGE_SIZE = 15;
const CARD_SELECT = "id, slug, display_name, headline, location, visibility, status";

// Replace multi-select helper with single-select
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

  const { data: svc } = await sb
    .from("services")
    .select("id, name, slug")
    .eq("slug", serviceSlug)
    .maybeSingle();

  if (!svc) return { consultants: [], activeService: null, total: 0 };

  const { data: linkRows, count } = await sb
    .from("consultant_services")
    .select(
      "consultant:consultant_id (id, slug, display_name, headline, location, visibility, status)",
      { count: "exact" }
    )
    .eq("service_id", svc.id)
    .eq("consultant.visibility", "public", { foreignTable: "consultant" })
    .eq("consultant.status", "approved", { foreignTable: "consultant" })
    .order("display_name", { ascending: true, foreignTable: "consultant" })
    .range(offset, offset + PAGE_SIZE - 1);

  const consultants = (linkRows || []).map((r) => r.consultant).filter(Boolean);
  return { consultants, activeService: svc, total: count || 0 };
}

export default async function ConsultantsPage({ searchParams }) {
  const sp = await searchParams;
  const serviceSlug = sp?.service || "";
  const requestedPage = Number.parseInt(sp?.page ?? "1", 10);
  const page = Number.isNaN(requestedPage) ? 1 : Math.max(1, requestedPage);

  const sb = await supabaseServerClient();

  const [
    { consultants, activeService, total },
    { data: allServices = [] },
  ] = await Promise.all([
    getConsultantsByServiceSlug(sb, serviceSlug, page),
    sb.from("services").select("id, name, slug").order("name", { ascending: true }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const sbAuthCookies = await cookies();
  const hasSbAuth = sbAuthCookies.getAll().some((c) => c.name.includes("auth-token"));
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

  // Build pagination href preserving current service filter
  const buildPageHref = (targetPage) => {
    const params = new URLSearchParams();
    if (serviceSlug) params.set("service", serviceSlug);
    if (targetPage > 1) params.set("page", String(targetPage));
    const q = params.toString();
    return `/consultants${q ? `?${q}` : ""}`;
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 space-y-8">
      <section className="rounded-3xl border border-sky-400/30 bg-sky-500/10 p-6 text-slate-100 shadow-lg ring-1 ring-sky-400/20">
        <h1 className="text-2xl font-semibold text-white">
          Want to join MineHub and add your consultancy?
        </h1>
        <p className="mt-2 text-sm text-slate-200">
          Showcase your services to potential clients and manage your profile directly on MineLink.
        </p>
        <div className="mt-4 inline-flex items-center">
          <AddConsultantButton className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-slate-100" />
        </div>
      </section>

      {/* Services filter (single select) */}
      <section className="mt-2 space-y-2">
        <ServiceFilter services={allServices} activeSlug={activeService?.slug || ""} />
        {activeService ? (
          <div className="text-sm text-slate-300">
            Filtering by: <span className="font-medium text-white">{activeService.name}</span>
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
      <div className="mt-4 flex items-center justify-center gap-2">
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
    </main>
  );
}