import {
  RESOURCE_FORMATS,
  RESOURCE_LAUNCH_LIMITS,
  RESOURCE_REQUEST_STATUSES,
  RESOURCE_STATUSES,
  RESOURCE_TYPES,
} from "@/lib/resourceHub";

export const RESOURCE_STORAGE_BUCKET = process.env.SUPABASE_RESOURCE_BUCKET || "resources";

export const RESOURCE_ALLOWED_UPLOAD_EXTENSIONS = new Set([
  "zip",
  "pdf",
  "xlsx",
  "xls",
  "csv",
  "docx",
  "doc",
  "txt",
  "json",
]);

export const RESOURCE_ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "application/zip",
  "application/x-zip-compressed",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "application/json",
  "application/octet-stream",
]);

export function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function cleanNullableText(value) {
  const cleaned = cleanText(value);
  return cleaned || null;
}

export function sanitizeSlug(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function sanitizeFileName(value = "") {
  return String(value).replace(/[^\w.\-]+/g, "_").slice(0, 120);
}

export function getFileExtension(value = "") {
  const safe = String(value).trim();
  const dotIndex = safe.lastIndexOf(".");
  if (dotIndex <= -1 || dotIndex === safe.length - 1) return "";
  return safe.slice(dotIndex + 1).toLowerCase();
}

export function isSafeHttpUrl(value) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function normaliseTagIds(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((item) => typeof item === "string" && item.trim())));
}

export function isValidResourceType(value) {
  return RESOURCE_TYPES.includes(value);
}

export function isValidResourceFormat(value) {
  return RESOURCE_FORMATS.includes(value);
}

export function isValidResourceStatus(value) {
  return RESOURCE_STATUSES.includes(value);
}

export function isValidResourceRequestStatus(value) {
  return RESOURCE_REQUEST_STATUSES.includes(value);
}

export function isAllowedResourceUpload(file) {
  const extension = getFileExtension(file?.name || "");
  const mimeType = String(file?.type || "").toLowerCase();
  if (!RESOURCE_ALLOWED_UPLOAD_EXTENSIONS.has(extension)) return false;
  if (!mimeType) return true;
  return RESOURCE_ALLOWED_UPLOAD_MIME_TYPES.has(mimeType);
}

export function parsePaginationParams(url, { defaultLimit = 50, maxLimit = 200 } = {}) {
  const rawPage = Number(url.searchParams.get("page") || 1);
  const rawLimit = Number(url.searchParams.get("limit") || defaultLimit);

  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.trunc(rawPage) : 1;
  const safeLimit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.trunc(rawLimit) : defaultLimit;
  const limit = Math.min(maxLimit, safeLimit);
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
    rangeStart: offset,
    rangeEnd: offset + limit,
  };
}

export async function getResourceAuthContext(sb) {
  const { data: auth } = await sb.auth.getUser();
  const user = auth?.user || null;
  if (!user) {
    return { user: null, userId: null, isAdmin: false };
  }

  const { data: adminRow } = await sb
    .from("app_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    user,
    userId: user.id,
    isAdmin: Boolean(adminRow),
  };
}

export async function getApprovedConsultantOwnership(sb, userId) {
  if (!userId) {
    return { consultantId: null, canCreateResources: false };
  }

  const { data, error } = await sb
    .from("consultants")
    .select("id")
    .eq("status", "approved")
    .or(`user_id.eq.${userId},claimed_by.eq.${userId}`)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to validate consultant ownership.");
  }

  return {
    consultantId: data?.id || null,
    canCreateResources: Boolean(data?.id),
  };
}

export function buildResourceRoutePayload(resourceRow, tagLinks = []) {
  const consultantIconUrl = cleanNullableText(resourceRow.consultant_icon_url);

  return {
    id: resourceRow.id,
    ownerUserId: resourceRow.owner_user_id,
    consultantId: resourceRow.consultant_id || null,
    categoryId: resourceRow.category_id,
    title: resourceRow.title,
    slug: resourceRow.slug,
    summary: resourceRow.summary,
    description: resourceRow.description,
    resourceType: resourceRow.resource_type,
    resourceFormat: resourceRow.resource_format,
    status: resourceRow.status,
    sourceName: resourceRow.source_name,
    sourceUrl: resourceRow.source_url,
    licenseName: resourceRow.license_name,
    licenseUrl: resourceRow.license_url,
    estimatedSizeBytes: resourceRow.estimated_size_bytes,
    priceCents: resourceRow.price_cents,
    currencyCode: resourceRow.currency_code,
    downloadCount: resourceRow.download_count,
    isFeatured: Boolean(resourceRow.is_featured),
    submittedAt: resourceRow.submitted_at,
    approvedAt: resourceRow.approved_at,
    approvedBy: resourceRow.approved_by,
    rejectedAt: resourceRow.rejected_at,
    rejectionNotes: resourceRow.rejection_notes,
    createdAt: resourceRow.created_at,
    updatedAt: resourceRow.updated_at,
    category: resourceRow.resource_categories || null,
    consultantIconUrl,
    tags: tagLinks
      .map((item) => item?.resource_tags)
      .filter(Boolean)
      .map((tag) => ({ id: tag.id, name: tag.name, slug: tag.slug })),
  };
}

function parseJsonObject(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isHttpUrl(value) {
  if (!value || typeof value !== "string") return false;
  return /^https?:\/\//i.test(value);
}

function buildStoragePublicUrl(supabaseUrl, bucket, path) {
  if (!supabaseUrl || !bucket || !path) return null;
  const base = String(supabaseUrl).replace(/\/$/, "");
  const cleanPath = String(path).replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/${bucket}/${cleanPath}`;
}

export function resolveConsultantIconUrl(consultantRow, supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL) {
  if (!consultantRow) return null;

  const directUrl = [
    consultantRow.logo_url,
    consultantRow.thumbnail_url,
    consultantRow.avatar_url,
    consultantRow.photo_url,
    consultantRow.image_url,
  ].find((value) => isHttpUrl(value));
  if (directUrl) return directUrl;

  const metadata = parseJsonObject(consultantRow.metadata);
  if (!metadata) return null;

  const metadataUrl = [
    metadata.logo_url,
    metadata.logoUrl,
    metadata.thumbnail_url,
    metadata.thumbnailUrl,
    metadata.avatar_url,
    metadata.avatarUrl,
    metadata.photo_url,
    metadata.photoUrl,
    metadata.image_url,
    metadata.imageUrl,
  ].find((value) => isHttpUrl(value));
  if (metadataUrl) return metadataUrl;

  const rawMetadataPath = [
    metadata?.logo?.url,
    metadata?.logo?.publicUrl,
    metadata?.branding?.logo?.url,
    metadata?.branding?.logo?.publicUrl,
    metadata?.profile?.logo?.url,
    metadata?.profile?.logo?.publicUrl,
  ].find((value) => typeof value === "string" && value.trim());

  if (typeof rawMetadataPath === "string") {
    const trimmed = rawMetadataPath.trim();
    if (isHttpUrl(trimmed)) {
      return trimmed;
    }
    if (trimmed.startsWith("/storage/v1/object/public/")) {
      return `${String(supabaseUrl || "").replace(/\/$/, "")}${trimmed}`;
    }
    if (trimmed.startsWith("storage/v1/object/public/")) {
      return `${String(supabaseUrl || "").replace(/\/$/, "")}/${trimmed}`;
    }
  }

  const logoValue = parseJsonObject(metadata.logo);
  const path = cleanText(logoValue?.path || logoValue?.key || metadata.logo_path || metadata.path);
  if (!path || !supabaseUrl) return null;

  const bucket = cleanText(logoValue?.bucket || metadata.logo_bucket || metadata.bucket) || "portfolio";
  return buildStoragePublicUrl(supabaseUrl, bucket, path);
}

export async function fetchConsultantIconsByOwnerUserId(sb, ownerUserIds = []) {
  const uniqueOwnerIds = Array.from(new Set((ownerUserIds || []).filter(Boolean)));
  if (!uniqueOwnerIds.length) return new Map();

  const { data, error } = await sb
    .from("consultants")
    .select("*")
    .or(`user_id.in.(${uniqueOwnerIds.join(",")}),claimed_by.in.(${uniqueOwnerIds.join(",")})`);

  if (error || !Array.isArray(data)) {
    return new Map();
  }

  const map = new Map();
  const rankByOwner = new Map();
  for (const row of data) {
    const iconUrl = resolveConsultantIconUrl(row);
    if (!iconUrl) continue;

    const candidateOwnerIds = [row?.user_id, row?.claimed_by]
      .filter((value) => typeof value === "string" && value)
      .filter((value, index, array) => array.indexOf(value) === index)
      .filter((value) => uniqueOwnerIds.includes(value));

    if (!candidateOwnerIds.length) continue;

    const score = row?.status === "approved" ? 2 : 1;
    const updatedAtScore = Date.parse(row?.updated_at || "") || 0;
    const nextRank = score * 1_000_000_000_000 + updatedAtScore;

    for (const ownerUserId of candidateOwnerIds) {
      const currentRank = rankByOwner.get(ownerUserId) || 0;
      if (nextRank >= currentRank) {
        rankByOwner.set(ownerUserId, nextRank);
        map.set(ownerUserId, iconUrl);
      }
    }
  }

  return map;
}

export async function listSelectableConsultantsForUser(sb, userId, { approvedOnly = false } = {}) {
  if (!userId) return [];

  let query = sb
    .from("consultants")
    .select("*")
    .or(`user_id.eq.${userId},claimed_by.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(100);

  if (approvedOnly) {
    query = query.eq("status", "approved");
  }

  const { data, error } = await query;
  if (error || !Array.isArray(data)) return [];

  return data.map((row) => ({
    id: row.id,
    name: cleanText(row.display_name || row.name || row.company || row.metadata?.company || "Consultancy") || "Consultancy",
    status: row.status || "unknown",
    iconUrl: resolveConsultantIconUrl(row),
  }));
}

export async function resolveResourceConsultantIcons(sb, resourceRows = []) {
  const rows = Array.isArray(resourceRows) ? resourceRows : [];
  if (!rows.length) return new Map();

  const consultantIds = Array.from(new Set(rows.map((row) => row?.consultant_id).filter(Boolean)));
  const ownerUserIds = Array.from(new Set(rows.map((row) => row?.owner_user_id).filter(Boolean)));

  const consultantIconById = new Map();
  if (consultantIds.length) {
    const { data } = await sb
      .from("consultants")
      .select("*")
      .in("id", consultantIds);

    for (const row of data || []) {
      const iconUrl = resolveConsultantIconUrl(row);
      if (iconUrl) consultantIconById.set(row.id, iconUrl);
    }
  }

  const ownerIconByOwnerId = await fetchConsultantIconsByOwnerUserId(sb, ownerUserIds);

  const iconByResourceId = new Map();
  for (const row of rows) {
    const iconUrl = (row?.consultant_id && consultantIconById.get(row.consultant_id))
      || ownerIconByOwnerId.get(row.owner_user_id)
      || null;
    iconByResourceId.set(row.id, iconUrl);
  }

  return iconByResourceId;
}

export const DEFAULT_RESOURCE_SELECT = `
  id,
  owner_user_id,
  consultant_id,
  category_id,
  title,
  slug,
  summary,
  description,
  resource_type,
  resource_format,
  status,
  source_name,
  source_url,
  license_name,
  license_url,
  estimated_size_bytes,
  price_cents,
  currency_code,
  download_count,
  is_featured,
  submitted_at,
  approved_at,
  approved_by,
  rejected_at,
  rejection_notes,
  created_at,
  updated_at,
  resource_categories ( id, name, slug ),
  resource_tag_links ( resource_tags ( id, name, slug ) )
`;

export const RESOURCE_CARD_SELECT = `
  id,
  owner_user_id,
  consultant_id,
  category_id,
  title,
  slug,
  summary,
  description,
  resource_type,
  resource_format,
  status,
  source_name,
  source_url,
  estimated_size_bytes,
  price_cents,
  currency_code,
  download_count,
  is_featured,
  created_at,
  updated_at,
  resource_categories ( id, name, slug ),
  resource_tag_links ( resource_tags ( id, name, slug ) )
`;

export const RESOURCE_LIMITS = RESOURCE_LAUNCH_LIMITS;
