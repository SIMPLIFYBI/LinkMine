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
import { supabasePublicServer } from "@/lib/supabasePublicServer";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import MarketplaceRouteShell from "@/app/marketplace/MarketplaceRouteShell.client.jsx";
import ConsultantClaimButton from "@/app/components/ConsultantClaimButton";
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

function getCreatorInitials(name) {
  return String(name || "Creator")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "C";
}

function CreatorPanel({ consultant, fallbackName = "", fallbackIconUrl = "" }) {
  const displayName = consultant?.displayName || fallbackName;
  if (!displayName) return null;

  const initials = getCreatorInitials(displayName);
  const iconUrl = consultant?.iconUrl || fallbackIconUrl;
  const profileHref = consultant?.id ? `/consultants/${consultant.id}?backTo=${encodeURIComponent("/vault/creators")}` : "";
  const panelClassName = "mt-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.055] p-3.5 ring-1 ring-white/[0.04]";
  const panelContents = (
    <>
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-slate-900/60 text-base font-bold text-white shadow-[0_12px_24px_-18px_rgba(56,189,248,0.8)]">
          {iconUrl ? (
            <img src={iconUrl} alt={`${displayName} logo`} className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200/80">Published by</div>
          <div className="mt-1 truncate text-base font-semibold text-white">{displayName}</div>
          <div className="mt-1 text-xs text-slate-300">Creator of this Vault resource</div>
        </div>
      </div>
      {profileHref ? <span className="inline-flex shrink-0 items-center rounded-full border border-sky-200/25 bg-sky-400/10 px-3.5 py-2 text-xs font-semibold text-sky-50 transition group-hover:-translate-y-0.5 group-hover:border-sky-100/50 group-hover:bg-sky-400/20">
        View creator
      </span> : null}
    </>
  );

  if (!profileHref) return <section className={panelClassName}>{panelContents}</section>;

  return <Link href={profileHref} className={`${panelClassName} group transition hover:-translate-y-0.5 hover:border-sky-200/40 hover:bg-sky-400/[0.12]`} aria-label={`View creator profile for ${displayName}`}>{panelContents}</Link>;
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
  const publicSb = supabasePublicServer();
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
  let claimTarget = null;

  if (selectedConsultantId) {
    const { data: consultantRow } = await publicSb
      .from("consultants")
      .select("id, display_name, metadata, contact_email, claimed_by")
      .eq("id", selectedConsultantId)
      .maybeSingle();

    if (consultantRow?.id) {
      consultantProfile = {
        id: consultantRow.id,
        displayName: consultantRow.display_name || "Consultant",
        iconUrl: resource.consultantIconUrl || resolveConsultantIconUrl(consultantRow),
      };

      claimTarget = {
        consultantId: consultantRow.id,
        contactEmail: consultantRow.contact_email || null,
        claimedBy: consultantRow.claimed_by || null,
      };
    }
  }

  if (!claimTarget?.consultantId && resource.claimContactEmail) {
    const claimEmail = String(resource.claimContactEmail || "").trim().toLowerCase();
    if (claimEmail) {
      const { data: fallbackClaimRow } = await publicSb
        .from("consultants")
        .select("id, display_name, metadata, contact_email, claimed_by, claimed_at")
        .ilike("contact_email", claimEmail)
        .order("claimed_at", { ascending: true, nullsFirst: true })
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackClaimRow?.id) {
        claimTarget = {
          consultantId: fallbackClaimRow.id,
          contactEmail: fallbackClaimRow.contact_email || null,
          claimedBy: fallbackClaimRow.claimed_by || null,
        };

        consultantProfile = {
          id: fallbackClaimRow.id,
          displayName: fallbackClaimRow.display_name || "Creator",
          iconUrl: resource.consultantIconUrl || resolveConsultantIconUrl(fallbackClaimRow),
        };
      }
    }
  }

  const isClaimed = Boolean(claimTarget?.claimedBy);
  const canEditClaimProfile = Boolean(
    userId && claimTarget?.claimedBy && (claimTarget.claimedBy === userId || isAdmin)
  );

  if (!consultantProfile && resource.ownerUserId) {
    const { data: ownerConsultantRow } = await publicSb
      .from("consultants")
      .select("id, display_name, metadata")
      .eq("user_id", resource.ownerUserId)
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (ownerConsultantRow?.id) {
      consultantProfile = {
        id: ownerConsultantRow.id,
        displayName: ownerConsultantRow.display_name || "Consultant",
        iconUrl: resource.consultantIconUrl || resolveConsultantIconUrl(ownerConsultantRow),
      };
    }
  }

  if (!consultantProfile && resource.sourceName) {
    const { data: sourceConsultantRow } = await publicSb
      .from("consultants")
      .select("id, display_name, metadata")
      .ilike("display_name", resource.sourceName)
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sourceConsultantRow?.id) {
      consultantProfile = {
        id: sourceConsultantRow.id,
        displayName: sourceConsultantRow.display_name || resource.sourceName,
        iconUrl: resource.consultantIconUrl || resolveConsultantIconUrl(sourceConsultantRow),
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
    const { data: uniqueOpeners, error: uniqueOpenersError } = await sb.rpc("resource_unique_openers_30d", {
      p_resource_id: id,
    });
    if (!uniqueOpenersError) {
      uniqueOpeners30d = Number(uniqueOpeners ?? 0);
    }
  } catch {
    uniqueOpeners30d = null;
  }

  const totalOpenCount = Number(resource.openCount ?? resource.downloadCount ?? 0);

  return (
    <MarketplaceRouteShell signedIn={Boolean(user)} isAdmin={isAdmin} activeKey="account">
      <div className="mx-auto max-w-7xl space-y-5 pb-4 sm:space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/vault" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-sky-200/30 hover:bg-sky-400/10 hover:text-white">
            <span aria-hidden="true">&larr;</span>
            Back to Vault
          </Link>
          {canEditResource ? (
            <Link href={`/vault/${resource.id}/edit`} className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.1]">
              Edit resource
            </Link>
          ) : null}
        </div>

        <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(18,69,86,0.7),rgba(15,23,42,0.9)_48%,rgba(2,6,23,0.92))] shadow-[0_38px_110px_-58px_rgba(0,0,0,0.95)] ring-1 ring-white/[0.08]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-200/50 to-transparent" aria-hidden="true" />
          <div className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-cyan-300/[0.08] blur-3xl" aria-hidden="true" />
          <div className="relative grid xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="p-6 sm:p-8 xl:p-10">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={statusTone(resource.status)}>{resource.status}</Badge>
                <ResourceFormatChip format={resource.resourceFormat} />
                {resource.category?.name ? <Badge tone="border-white/10 bg-white/[0.04] text-slate-300">{resource.category.name}</Badge> : null}
              </div>

              <h1 className="mt-5 max-w-4xl bg-gradient-to-r from-white via-sky-50 to-sky-200/90 bg-clip-text text-3xl font-semibold leading-[1.08] tracking-tight text-transparent sm:text-4xl xl:text-[2.75rem]">{resource.title}</h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                {resource.description || resource.summary || "No description has been added for this resource yet."}
              </p>

              <CreatorPanel consultant={consultantProfile} fallbackName={resource.sourceName} />

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

            <aside className="border-t border-white/10 bg-slate-950/25 xl:border-l xl:border-t-0">
              <div className="p-5 sm:p-6 xl:p-7">
                <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-100/75">Resource access</div>
                <ResourceDetailActions resource={resource} requiresAuth={!user} />
              </div>
              <div className="grid grid-cols-2 divide-x divide-white/10 border-t border-white/10">
                <div className="p-5 xl:p-6">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Opens</div>
                  <div className="mt-2 text-3xl font-semibold tracking-tight text-white">{totalOpenCount}</div>
                  <div className="mt-1 text-xs text-slate-400">Total activity</div>
                </div>
                <div className="p-5 xl:p-6">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Visitors</div>
                  <div className="mt-2 text-3xl font-semibold tracking-tight text-white">{uniqueOpeners30d == null ? "-" : uniqueOpeners30d}</div>
                  <div className="mt-1 text-xs text-slate-400">Last 30 days</div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-sky-200/20 hover:bg-white/[0.055]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Access</div>
            <div className="mt-3 text-sm font-medium text-slate-100">{resource.resourceType === "external" ? (resource.sourceName || "External source") : "Resource file"}</div>
            <div className="mt-3"><ResourceFormatChip format={resource.resourceFormat} /></div>
            {resource.sourceUrl ? <div className="mt-3 line-clamp-1 break-all text-xs text-slate-500">{resource.sourceUrl}</div> : null}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-sky-200/20 hover:bg-white/[0.055]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Size</div>
            <div className="mt-3 text-sm font-medium text-slate-100">
              {resource.resourceType === "external" && !Number(resource.estimatedSizeBytes)
                ? "Hosted externally"
                : formatResourceBytes(resource.estimatedSizeBytes) || "Not set"}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:border-sky-200/20 hover:bg-white/[0.055]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Updated</div>
            <div className="mt-3 text-sm font-medium text-slate-100">{formatDate(resource.updatedAt) || "Recently"}</div>
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

        {claimTarget?.consultantId ? (
          <ConsultantClaimButton
            consultantId={claimTarget.consultantId}
            isClaimed={isClaimed}
            canEdit={canEditClaimProfile}
            contactEmail={claimTarget.contactEmail}
            title="Claim this resource profile"
            description="Secure ownership of this resource and unlock editing by sending a claim link to"
            buttonLabel="Start resource claim"
          />
        ) : null}
      </div>
    </MarketplaceRouteShell>
  );
}