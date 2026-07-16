import Link from "next/link";
import { notFound } from "next/navigation";
import { formatResourceBytes } from "@/lib/resourceHub";
import { buildResourceRoutePayload, DEFAULT_RESOURCE_SELECT, getResourceAuthContext } from "@/lib/resourceHubServer";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import ResourceDetailActions from "./ResourceDetailActions.client.jsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatMoney(cents, currencyCode = "AUD") {
  const amount = Number(cents || 0) / 100;
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currencyCode || "AUD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusTone(status) {
  if (["approved", "paid", "active", "available"].includes(status)) {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  }
  if (["pending", "draft"].includes(status)) {
    return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  }
  if (["rejected", "failed", "cancelled", "disabled"].includes(status)) {
    return "border-red-400/30 bg-red-500/10 text-red-100";
  }
  return "border-cyan-400/30 bg-cyan-500/10 text-cyan-100";
}

function Badge({ children, tone }) {
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${tone}`}>{children}</span>;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Resource ${id}`,
  };
}

export default async function MarketplaceResourcePage({ params }) {
  const { id } = await params;
  const sb = await supabaseServerClient();
  const { user } = await getResourceAuthContext(sb);

  const { data, error } = await sb
    .from("resources")
    .select(DEFAULT_RESOURCE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const resource = buildResourceRoutePayload(data, data.resource_tag_links || []);

  const { data: relatedRows } = await sb
    .from("resources")
    .select("id, title, summary")
    .eq("status", "approved")
    .neq("id", id)
    .eq("category_id", resource.categoryId || "00000000-0000-0000-0000-000000000000")
    .limit(3);

  const related = relatedRows || [];

  return (
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link href="/marketplace" className="inline-flex items-center text-sm text-slate-400 transition hover:text-white">
          Back to marketplace
        </Link>

        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[0_35px_120px_-60px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
          <div className="grid gap-8 px-6 py-7 sm:px-8 lg:grid-cols-[1.2fr,0.8fr] lg:px-10 lg:py-10">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={statusTone(resource.status)}>{resource.status}</Badge>
                <Badge tone="border-white/10 bg-white/[0.08] text-slate-100">{resource.resourceType}</Badge>
                {resource.category?.name ? <Badge tone="border-white/10 bg-white/[0.04] text-slate-300">{resource.category.name}</Badge> : null}
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{resource.title}</h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                {resource.description || resource.summary || "No description has been added for this resource yet."}
              </p>

              {resource.tags?.length ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {resource.tags.map((tag) => (
                    <span key={tag.id} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
                      {tag.name}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-5 ring-1 ring-white/10">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Price</div>
                <div className="mt-3 text-3xl font-semibold text-white">{resource.priceCents > 0 ? formatMoney(resource.priceCents, resource.currencyCode) : "Free"}</div>
                <div className="mt-2 text-sm text-slate-400">{resource.downloadCount || 0} downloads</div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-5 ring-1 ring-white/10">
                <ResourceDetailActions resource={resource} requiresAuth={!user} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5 ring-1 ring-white/10">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Access</div>
            <div className="mt-3 text-sm text-slate-200">{resource.resourceType === "external" ? (resource.sourceName || "External source") : "Hosted pack"}</div>
            {resource.sourceUrl ? <div className="mt-2 break-all text-xs text-slate-400">{resource.sourceUrl}</div> : null}
          </div>
          <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5 ring-1 ring-white/10">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Size</div>
            <div className="mt-3 text-sm text-slate-200">{formatResourceBytes(resource.estimatedSizeBytes) || "Not set"}</div>
          </div>
          <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5 ring-1 ring-white/10">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Updated</div>
            <div className="mt-3 text-sm text-slate-200">{formatDate(resource.updatedAt) || "Recently"}</div>
          </div>
        </section>

        {(resource.licenseName || resource.licenseUrl || related.length) ? (
          <section className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 ring-1 ring-white/10">
              <div className="text-lg font-semibold text-white">Resource details</div>
              <dl className="mt-4 space-y-4 text-sm text-slate-300">
                <div>
                  <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">Created</dt>
                  <dd className="mt-1">{formatDate(resource.createdAt) || "Recently"}</dd>
                </div>
                {resource.sourceName ? (
                  <div>
                    <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">Source name</dt>
                    <dd className="mt-1">{resource.sourceName}</dd>
                  </div>
                ) : null}
                {resource.licenseName ? (
                  <div>
                    <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">License</dt>
                    <dd className="mt-1">{resource.licenseName}</dd>
                  </div>
                ) : null}
                {resource.licenseUrl ? (
                  <div>
                    <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">License URL</dt>
                    <dd className="mt-1 break-all text-sky-300">{resource.licenseUrl}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 ring-1 ring-white/10">
              <div className="text-lg font-semibold text-white">Related resources</div>
              <div className="mt-4 space-y-3">
                {related.length ? related.map((item) => (
                  <Link key={item.id} href={`/marketplace/${item.id}`} className="block rounded-[22px] border border-white/10 bg-slate-950/35 px-4 py-4 transition hover:border-white/20 hover:bg-white/[0.08]">
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                    <div className="mt-1 text-sm text-slate-400">{item.summary || "View full details for this resource."}</div>
                  </Link>
                )) : <div className="text-sm text-slate-400">No related resources available yet.</div>}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}