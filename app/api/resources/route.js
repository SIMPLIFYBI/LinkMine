export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import {
  buildResourceRoutePayload,
  cleanNullableText,
  cleanText,
  DEFAULT_RESOURCE_SELECT,
  getApprovedConsultantOwnership,
  getResourceAuthContext,
  isSafeHttpUrl,
  isValidResourceStatus,
  isValidResourceType,
  normaliseTagIds,
  sanitizeSlug,
} from "@/lib/resourceHubServer";

function asNullablePositiveInteger(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.trunc(parsed);
}

export async function GET(req) {
  const sb = await supabaseServerClient();
  const { user, userId } = await getResourceAuthContext(sb);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const { canCreateResources } = await getApprovedConsultantOwnership(sb, userId);

  const url = new URL(req.url);
  const mineOnly = url.searchParams.get("mine") === "1";
  const resourceType = cleanText(url.searchParams.get("type"));
  const status = cleanText(url.searchParams.get("status"));
  const categoryId = cleanText(url.searchParams.get("categoryId"));

  let query = sb
    .from("resources")
    .select(DEFAULT_RESOURCE_SELECT)
    .order("created_at", { ascending: false });

  if (mineOnly) query = query.eq("owner_user_id", userId);
  if (isValidResourceType(resourceType)) query = query.eq("resource_type", resourceType);
  if (isValidResourceStatus(status)) query = query.eq("status", status);
  if (categoryId) query = query.eq("category_id", categoryId);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    canCreateResources,
    createResourceRequirementMessage: canCreateResources
      ? ""
      : "You need an approved consultant or service provider profile before you can publish marketplace resources.",
    resources: (data || []).map((row) => buildResourceRoutePayload(row, row.resource_tag_links || [])),
  });
}

export async function POST(req) {
  const sb = await supabaseServerClient();
  const { user, userId } = await getResourceAuthContext(sb);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const { canCreateResources } = await getApprovedConsultantOwnership(sb, userId);
  if (!canCreateResources) {
    return NextResponse.json(
      {
        ok: false,
        error: "You need an approved consultant or service provider profile before you can publish marketplace resources.",
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
  const requestedStatus = cleanText(resource.status) || "draft";
  const categoryId = cleanNullableText(resource.categoryId);
  const sourceName = cleanNullableText(resource.sourceName);
  const sourceUrl = cleanNullableText(resource.sourceUrl);
  const licenseName = cleanNullableText(resource.licenseName);
  const licenseUrl = cleanNullableText(resource.licenseUrl);
  const estimatedSizeBytes = asNullablePositiveInteger(resource.estimatedSizeBytes);
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

  if (!["draft", "pending"].includes(requestedStatus)) {
    return NextResponse.json({ ok: false, error: "Status must be draft or pending." }, { status: 400 });
  }

  if (resourceType === "external" && !isSafeHttpUrl(sourceUrl)) {
    return NextResponse.json({ ok: false, error: "External resources require a valid source URL." }, { status: 400 });
  }

  if (licenseUrl && !isSafeHttpUrl(licenseUrl)) {
    return NextResponse.json({ ok: false, error: "License URL must be http or https." }, { status: 400 });
  }

  const payload = {
    owner_user_id: userId,
    category_id: categoryId,
    title,
    slug,
    summary,
    description,
    resource_type: resourceType,
    status: requestedStatus,
    source_name: resourceType === "external" ? sourceName : null,
    source_url: resourceType === "external" ? sourceUrl : null,
    license_name: licenseName,
    license_url: licenseUrl,
    estimated_size_bytes: estimatedSizeBytes,
    price_cents: 0,
    currency_code: "AUD",
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
