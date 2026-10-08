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
  const panelClassName = "mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[20px] border border-sky-200/15 bg-[linear-gradient(135deg,rgba(56,189,248,0.14),rgba(15,23,42,0.36))] p-4 ring-1 ring-white/5";
  const panelContents = (
    <>
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[17px] border border-sky-100/25 bg-slate-900/45 text-lg font-bold text-white shadow-[0_14px_30px_-18px_rgba(56,189,248,0.8)]">
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
      {profileHref ? <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-sky-200/35 bg-sky-400/15 px-3.5 py-2 text-xs font-semibold text-sky-50 transition group-hover:-translate-y-0.5 group-hover:border-sky-100/60 group-hover:bg-sky-400/25">
        View creator
        <span aria-hidden="true" className="text-base leading-none transition-transform group-hover:translate-x-0.5">↗</span>
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
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{resource.title}</h1>

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