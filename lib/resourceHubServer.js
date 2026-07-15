import {
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
  return {
    id: resourceRow.id,
    ownerUserId: resourceRow.owner_user_id,
    categoryId: resourceRow.category_id,
    title: resourceRow.title,
    slug: resourceRow.slug,
    summary: resourceRow.summary,
    description: resourceRow.description,
    resourceType: resourceRow.resource_type,
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
    tags: tagLinks
      .map((item) => item?.resource_tags)
      .filter(Boolean)
      .map((tag) => ({ id: tag.id, name: tag.name, slug: tag.slug })),
  };
}

export const DEFAULT_RESOURCE_SELECT = `
  id,
  owner_user_id,
  category_id,
  title,
  slug,
  summary,
  description,
  resource_type,
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

export const RESOURCE_LIMITS = RESOURCE_LAUNCH_LIMITS;
