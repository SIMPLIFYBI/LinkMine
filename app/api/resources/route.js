export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import {
  buildResourceRoutePayload,
  cleanNullableText,
  cleanText,
  DEFAULT_RESOURCE_SELECT,
  parsePaginationParams,
  RESOURCE_CARD_SELECT,
  getApprovedConsultantOwnership,
  getResourceAuthContext,
  listSelectableConsultantsForUser,
  RESOURCE_STORAGE_BUCKET,
  resolveResourceConsultantIcons,
  isValidResourceFormat,
  isSafeHttpUrl,
  isValidResourceStatus,
  isValidResourceType,
  normaliseTagIds,
  sanitizeSlug,
} from "@/lib/resourceHubServer";
import { timedRoute } from "@/lib/apiTiming";

function asNullablePositiveInteger(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.trunc(parsed);
}

export async function GET(req) {
  return timedRoute("resources.list", async () => {
    const sb = await supabaseServerClient();
    const { user, userId, isAdmin } = await getResourceAuthContext(sb);
    const { canCreateResources } = user ? await getApprovedConsultantOwnership(sb, userId) : { canCreateResources: false };

    const url = new URL(req.url);
    const mineOnly = url.searchParams.get("mine") === "1";
    const resourceType = cleanText(url.searchParams.get("type"));
    const status = cleanText(url.searchParams.get("status"));
    const categoryId = cleanText(url.searchParams.get("categoryId"));
    const view = cleanText(url.searchParams.get("view"));
    const search = cleanText(url.searchParams.get("q"));
    const sortByParam = cleanText(url.searchParams.get("sortBy"));
    const sortDirParam = cleanText(url.searchParams.get("sortDir")).toLowerCase();
    const { page, limit, rangeStart, rangeEnd } = parsePaginationParams(url, {
      defaultLimit: mineOnly ? 60 : 80,
      maxLimit: 200,
    });

    const SORT_COLUMN_MAP = {
      created_at: "created_at",
      updated_at: "updated_at",
      title: "title",
      download_count: "download_count",
    };
    const sortBy = SORT_COLUMN_MAP[sortByParam] || "created_at";
    const sortAscending = sortDirParam === "asc";

    if (mineOnly && !user) {
      return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
    }

    const dataSb = sb;

    let query = dataSb
      .from("resources")
      .select(view === "card" ? RESOURCE_CARD_SELECT : DEFAULT_RESOURCE_SELECT)
      .order(sortBy, { ascending: sortAscending, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(rangeStart, rangeEnd);

    if (mineOnly) {
      query = query.eq("owner_user_id", userId);
      if (isValidResourceStatus(status)) query = query.eq("status", status);
    } else {
      query = query.eq("status", isAdmin && isValidResourceStatus(status) ? status : "approved");
    }

    if (isValidResourceType(resourceType)) query = query.eq("resource_type", resourceType);
    if (categoryId) query = query.eq("category_id", categoryId);
    if (search) {
      const escaped = search.replace(/[,]/g, " ");
      query = query.or(`title.ilike.%${escaped}%,summary.ilike.%${escaped}%,description.ilike.%${escaped}%`);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    const rows = data || [];
    const hasMore = rows.length > limit;
    const slicedRows = hasMore ? rows.slice(0, limit) : rows;
    const consultantIconByResourceId = await resolveResourceConsultantIcons(dataSb, slicedRows);
    const resourceIds = slicedRows.map((row) => row.id).filter(Boolean);
    const resourceImagesByResourceId = new Map();

    if (resourceIds.length) {
      try {
        const { data: resourceImageRows } = await dataSb
          .from("resource_images")
          .select("id, resource_id, bucket_name, object_path, original_filename, sort_order")
          .in("resource_id", resourceIds)
          .order("resource_id", { ascending: true })
          .order("sort_order", { ascending: true });

        if (Array.isArray(resourceImageRows) && resourceImageRows.length) {
          let signingSb = sb;
          try {
            signingSb = supabaseAdminClient();
          } catch {}

          const signedRows = await Promise.all(resourceImageRows.map(async (row) => {
            const { data: signedData, error: signedError } = await signingSb.storage
              .from(row.bucket_name || RESOURCE_STORAGE_BUCKET)
              .createSignedUrl(row.object_path, 60 * 60 * 24 * 7);

            if (signedError || !signedData?.signedUrl) return null;

            return {
              resourceId: row.resource_id,
              image: {
                id: row.id,
                url: signedData.signedUrl,
                alt: row.original_filename || "Resource preview image",
                sortOrder: row.sort_order,
              },
            };
          }));

          signedRows.filter(Boolean).forEach(({ resourceId, image }) => {
            const current = resourceImagesByResourceId.get(resourceId) || [];
            if (current.length < 3) {
              current.push(image);
              resourceImagesByResourceId.set(resourceId, current);
            }
          });
        }
      } catch {}
    }

    let homeBannerResourceId = null;
    try {
      const { data: placementRow } = await dataSb
        .from("resource_homepage_placements")
        .select("hero_resource_id")
        .eq("placement_key", "vault_home")
        .maybeSingle();
      homeBannerResourceId = placementRow?.hero_resource_id || null;
    } catch {}

    return NextResponse.json({
      ok: true,
      canCreateResources,
      createResourceRequirementMessage: canCreateResources
        ? ""
        : "You need an approved consultant or creator profile before you can publish marketplace resources.",
      homeBannerResourceId,
      resources: slicedRows.map((row) => ({
        ...buildResourceRoutePayload({
          ...row,
          consultant_icon_url: consultantIconByResourceId.get(row.id) || null,
        }, row.resource_tag_links || []),
        resourceImages: resourceImagesByResourceId.get(row.id) || [],
      })),
      paging: {
        page,
        limit,
        hasMore,
      },
    });
  });
}

export async function POST(req) {
  const sb = await supabaseServerClient();
  const { user, userId, isAdmin } = await getResourceAuthContext(sb);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const { canCreateResources } = await getApprovedConsultantOwnership(sb, userId);
  if (!canCreateResources) {
    return NextResponse.json(
      {
        ok: false,
        error: "You need an approved consultant or creator profile before you can publish marketplace resources.",
      },
      { status: 403 }
    );
  }

  const { resource = {} } = await req.json().catch(() => ({ resource: {} }));

  const title = cleanText(resource.title);
  const slug = sanitizeSlug(resource.slug || resource.title);
  const summary = cleanNullableText(resource.summary);
  const description = cleanNullableText(resource.description);
  const resourceType = cleanText(resource.resourceType) || "hosted";
  const resourceFormat = cleanText(resource.resourceFormat);
  const requestedStatus = cleanText(resource.status) || "draft";
  const categoryId = cleanNullableText(resource.categoryId);
  const sourceName = cleanNullableText(resource.sourceName);
  const sourceUrl = cleanNullableText(resource.sourceUrl);
  const licenseName = cleanNullableText(resource.licenseName);
  const licenseUrl = cleanNullableText(resource.licenseUrl);
  const estimatedSizeBytes = asNullablePositiveInteger(resource.estimatedSizeBytes);
  const consultantId = cleanNullableText(resource.consultantId);
  const claimContactEmail = cleanNullableText(resource.claimContactEmail)?.toLowerCase() || null;
  const tagIds = normaliseTagIds(resource.tagIds);

  if (!title) {
    return NextResponse.json({ ok: false, error: "Title is required." }, { status: 400 });
  }

  if (!slug) {
    return NextResponse.json({ ok: false, error: "Slug is required." }, { status: 400 });
  }

  if (!isValidResourceType(resourceType)) {
    return NextResponse.json({ ok: false, error: "Invalid resource type." }, { status: 400 });
  }

  if (!isValidResourceFormat(resourceFormat)) {
    return NextResponse.json({ ok: false, error: "Resource format is required." }, { status: 400 });
  }

  if (!["draft", "pending"].includes(requestedStatus)) {
    return NextResponse.json({ ok: false, error: "Status must be draft or pending." }, { status: 400 });
  }

  if (resourceType === "external" && !isSafeHttpUrl(sourceUrl)) {
    return NextResponse.json({ ok: false, error: "External resources require a valid source URL." }, { status: 400 });
  }

  if (licenseUrl && !isSafeHttpUrl(licenseUrl)) {
    return NextResponse.json({ ok: false, error: "License URL must be http or https." }, { status: 400 });
  }

  if (claimContactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(claimContactEmail)) {
    return NextResponse.json({ ok: false, error: "Claim contact email must be a valid email." }, { status: 400 });
  }

  let selectedConsultantId = null;
  if (consultantId) {
    const availableConsultants = await listSelectableConsultantsForUser(sb, userId);
    const allowedIds = new Set(availableConsultants.map((item) => item.id));
    if (!allowedIds.has(consultantId)) {
      return NextResponse.json({ ok: false, error: "Selected consultancy is not available on your account." }, { status: 400 });
    }
    selectedConsultantId = consultantId;
  }

  const payload = {
    owner_user_id: userId,
    consultant_id: selectedConsultantId,
    category_id: categoryId,
    title,
    slug,
    summary,
    description,
    resource_type: resourceType,
    resource_format: resourceFormat,
    status: requestedStatus,
    source_name: resourceType === "external" ? sourceName : null,
    source_url: resourceType === "external" ? sourceUrl : null,
    license_name: licenseName,
    license_url: licenseUrl,
    estimated_size_bytes: estimatedSizeBytes,
    price_cents: 0,
    currency_code: "AUD",
    claim_contact_email: isAdmin ? claimContactEmail : null,
    submitted_at: requestedStatus === "pending" ? new Date().toISOString() : null,
  };

  const { data: inserted, error: insertError } = await sb
    .from("resources")
    .insert(payload)
    .select(DEFAULT_RESOURCE_SELECT)
    .single();

  if (insertError) {
    return NextResponse.json({ ok: false, error: insertError.message }, { status: 400 });
  }

  if (tagIds.length) {
    const { error: tagError } = await sb
      .from("resource_tag_links")
      .insert(tagIds.map((tagId) => ({ resource_id: inserted.id, tag_id: tagId })));

    if (tagError) {
      return NextResponse.json({ ok: false, error: tagError.message }, { status: 400 });
    }
  }

  await sb.from("resource_entitlements").insert({
    user_id: userId,
    resource_id: inserted.id,
    grant_source: "owner",
    revoked_at: null,
  });

  const { data: hydrated, error: reloadError } = await sb
    .from("resources")
    .select(DEFAULT_RESOURCE_SELECT)
    .eq("id", inserted.id)
    .single();

  if (reloadError) {
    return NextResponse.json({ ok: false, error: reloadError.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    resource: buildResourceRoutePayload(hydrated, hydrated.resource_tag_links || []),
  });
}
