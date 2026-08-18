import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Apps24Regular,
  BranchFork24Regular,
  Code24Regular,
  Document24Regular,
  DocumentPdf24Regular,
  DocumentText24Regular,
  Globe24Regular,
  SlideText24Regular,
  TableSimple24Regular,
} from "@fluentui/react-icons";
import { formatResourceBytes } from "@/lib/resourceHub";
import {
  buildResourceRoutePayload,
  DEFAULT_RESOURCE_SELECT,
  getResourceAuthContext,
  resolveConsultantIconUrl,
} from "@/lib/resourceHubServer";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import MarketplaceRouteShell from "@/app/marketplace/MarketplaceRouteShell.client.jsx";
import ResourceDetailActions from "./ResourceDetailActions.client.jsx";
import ResourceImageCarousel from "./ResourceImageCarousel.client.jsx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

const RESOURCE_FORMAT_LABELS = {
  website: "Website",
  repository: "Repository",
  excel: "Excel",
  word: "Word",
  powerpoint: "PowerPoint",
  script: "Script",
  app: "App",
  pdf: "PDF",
  generic: "Resource",
};

const RESOURCE_FORMAT_ICONS = {
  website: Globe24Regular,
  repository: BranchFork24Regular,
  excel: TableSimple24Regular,
  word: DocumentText24Regular,
  powerpoint: SlideText24Regular,
  script: Code24Regular,
  app: Apps24Regular,
  pdf: DocumentPdf24Regular,
  generic: Document24Regular,
};

function ResourceFormatGlyph({ format, className = "h-3.5 w-3.5" }) {
  const Icon = RESOURCE_FORMAT_ICONS[format] || RESOURCE_FORMAT_ICONS.generic;
  return <Icon aria-hidden="true" className={className} />;
}

function ResourceFormatChip({ format }) {
  const safeFormat = format || "generic";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-slate-950/30 px-2.5 py-1 text-[11px] font-semibold text-slate-100">
      <ResourceFormatGlyph format={safeFormat} />
      <span>{RESOURCE_FORMAT_LABELS[safeFormat] || RESOURCE_FORMAT_LABELS.generic}</span>
    </span>
  );
}

function ConsultantBadge({ consultant }) {
  if (!consultant?.id) return null;

  const initials = String(consultant.displayName || "Consultant")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "C";

  return (
    <Link
      href={`/consultants/${consultant.id}`}
      className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-white/25 hover:bg-white/[0.08]"
      aria-label={`View consultant profile for ${consultant.displayName}`}
    >
      <span className="inline-flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-slate-900/45 text-[10px] font-bold text-white">
        {consultant.iconUrl ? (
          <img src={consultant.iconUrl} alt={consultant.displayName} className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </span>
      <span className="whitespace-nowrap">Added by {consultant.displayName}</span>
    </Link>
  );
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
  const { user, userId, isAdmin } = await getResourceAuthContext(sb);

  const { data, error } = await sb
    .from("resources")
    .select(DEFAULT_RESOURCE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const resource = buildResourceRoutePayload(data, data.resource_tag_links || []);
  const canEditResource = Boolean(userId && (resource.ownerUserId === userId || isAdmin));

  let consultantProfile = null;
  const selectedConsultantId = resource.consultantId || null;

  if (selectedConsultantId) {
    const { data: consultantRow } = await sb
      .from("consultants")
      .select("id, display_name, name, logo_url, thumbnail_url, avatar_url, photo_url, image_url, metadata")
      .eq("id", selectedConsultantId)
      .maybeSingle();

    if (consultantRow?.id) {
      consultantProfile = {
        id: consultantRow.id,
        displayName: consultantRow.display_name || consultantRow.name || "Consultant",
        iconUrl: resource.consultantIconUrl || resolveConsultantIconUrl(consultantRow),
      };
    }
  }

  if (!consultantProfile && resource.ownerUserId) {
    const { data: ownerConsultantRow } = await sb
      .from("consultants")
      .select("id, display_name, name, logo_url, thumbnail_url, avatar_url, photo_url, image_url, metadata")
      .eq("user_id", resource.ownerUserId)
      .eq("visibility", "public")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (ownerConsultantRow?.id) {
      consultantProfile = {
        id: ownerConsultantRow.id,
        displayName: ownerConsultantRow.display_name || ownerConsultantRow.name || "Consultant",
        iconUrl: resource.consultantIconUrl || resolveConsultantIconUrl(ownerConsultantRow),
      };
    }
  }

  const { data: resourceImageRows } = await sb
    .from("resource_images")
    .select("id, bucket_name, object_path, original_filename, sort_order")
    .eq("resource_id", id)
    .order("sort_order", { ascending: true })
    .limit(3);

  let resourceImages = [];
  if (resourceImageRows?.length) {
    try {
      let signingSb = null;
      try {
        signingSb = supabaseAdminClient();
      } catch {
        signingSb = sb;
      }
      const signedRows = await Promise.all(resourceImageRows.map(async (row) => {
        const { data: signedData, error: signedError } = await signingSb.storage
          .from(row.bucket_name)
          .createSignedUrl(row.object_path, 60 * 60 * 24 * 7);

        if (signedError || !signedData?.signedUrl) return null;

        return {
          id: row.id,
          url: signedData.signedUrl,
          alt: row.original_filename || "Resource preview image",
          sortOrder: row.sort_order,
        };
      }));

      resourceImages = signedRows.filter(Boolean);
    } catch {
      resourceImages = [];
    }
  }

  let uniqueOpeners30d = null;
  try {
    const { data: uniqueOpeners } = await sb.rpc("resource_unique_openers_30d", {
      p_resource_id: id,
    });
    uniqueOpeners30d = Number(uniqueOpeners ?? 0);
  } catch {
    uniqueOpeners30d = null;
  }

  const totalOpenCount = Number(resource.openCount ?? resource.downloadCount ?? 0);

  return (
    <MarketplaceRouteShell signedIn={Boolean(user)} isAdmin={isAdmin} activeKey="account">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/vault" className="inline-flex items-center text-sm text-slate-400 transition hover:text-white">
            Back to vault
          </Link>
          {canEditResource ? (
            <Link href={`/vault/${resource.id}/edit`} className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.1]">
              Edit resource
            </Link>
          ) : null}
        </div>

        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[0_35px_120px_-60px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
          <div className="grid gap-8 px-6 py-7 sm:px-8 lg:grid-cols-[1.2fr,0.8fr] lg:px-10 lg:py-10">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={statusTone(resource.status)}>{resource.status}</Badge>
                <ResourceFormatChip format={resource.resourceFormat} />
                {resource.category?.name ? <Badge tone="border-white/10 bg-white/[0.04] text-slate-300">{resource.category.name}</Badge> : null}
                <ConsultantBadge consultant={consultantProfile} />
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{resource.title}</h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                {resource.description || resource.summary || "No description has been added for this resource yet."}
              </p>

              {resourceImages.length ? (
                <div className="mt-5 space-y-2">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Preview images</div>
                  <ResourceImageCarousel images={resourceImages} />
                </div>
              ) : null}

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
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Click-through</div>
                <div className="mt-3 text-3xl font-semibold text-white">{totalOpenCount}</div>
                <div className="mt-2 text-sm text-slate-400">Total open clicks</div>
                <div className="mt-2 text-xs text-slate-500">
                  {uniqueOpeners30d == null ? "Unique users (30d): unavailable" : `Unique users (30d): ${uniqueOpeners30d}`}
                </div>
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
            <div className="mt-3 text-sm text-slate-200">{resource.resourceType === "external" ? (resource.sourceName || "External source") : "Resource file"}</div>
            <div className="mt-3"><ResourceFormatChip format={resource.resourceFormat} /></div>
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

        {(resource.licenseName || resource.licenseUrl) ? (
          <section className="grid gap-6 lg:grid-cols-1">
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
          </section>
        ) : null}
      </div>
    </MarketplaceRouteShell>
  );
}