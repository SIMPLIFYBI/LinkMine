export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { getResourceAuthContext, RESOURCE_STORAGE_BUCKET } from "@/lib/resourceHubServer";

function bytesUsedToday(events = []) {
  return events.reduce((sum, event) => sum + Number(event?.bytes_served || 0), 0);
}

function normalizeSourceSurface(value) {
  const source = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!source) return "unknown";
  return source.slice(0, 60);
}

async function logOpenEvent(sb, { userId, resourceId, accessKind, sourceSurface }) {
  const { error } = await sb.from("resource_open_events").insert({
    user_id: userId,
    resource_id: resourceId,
    access_kind: accessKind,
    source_surface: sourceSurface,
  });

  if (error) {
    console.error("[resources.access] Failed to log open event", {
      resourceId,
      userId,
      accessKind,
      sourceSurface,
      error: error.message,
    });
  }
}

async function incrementOpenCount(sb, resourceId, currentOpenCount, currentDownloadCount) {
  const nextOpenCount = Number(currentOpenCount || 0) + 1;
  const nextDownloadCount = Number(currentDownloadCount || 0) + 1;
  const { error } = await sb
    .from("resources")
    .update({
      open_count: nextOpenCount,
      download_count: nextDownloadCount,
    })
    .eq("id", resourceId);

  if (error) {
    console.error("[resources.access] Failed to update open counters", {
      resourceId,
      error: error.message,
    });
  }
}

export async function POST(req, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing resource id." }, { status: 400 });
  }

  const sb = await supabaseServerClient();
  const { userId, isAdmin } = await getResourceAuthContext(sb);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const payload = await req.json().catch(() => ({}));
  const sourceSurface = normalizeSourceSurface(payload?.sourceSurface);

  const { data: resource, error: resourceError } = await sb
    .from("resources")
    .select("id, owner_user_id, resource_type, status, source_url, estimated_size_bytes, open_count, download_count")
    .eq("id", id)
    .maybeSingle();

  if (resourceError) {
    return NextResponse.json({ ok: false, error: resourceError.message }, { status: 400 });
  }

  if (!resource) {
    return NextResponse.json({ ok: false, error: "Resource not found." }, { status: 404 });
  }

  const canAccess = resource.status === "approved" || resource.owner_user_id === userId || isAdmin;
  if (!canAccess) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  if (resource.resource_type === "external") {
    if (!resource.source_url) {
      return NextResponse.json({ ok: false, error: "External resource is missing a source URL." }, { status: 400 });
    }

    void logOpenEvent(sb, {
      userId,
      resourceId: id,
      accessKind: "external",
      sourceSurface,
    });

    void incrementOpenCount(sb, id, resource.open_count, resource.download_count);

    return NextResponse.json({
      ok: true,
      accessKind: "external",
      sourceUrl: resource.source_url,
    });
  }

  await sb.rpc("ensure_resource_user_quota_row", { p_user_id: userId });

  const { data: quota, error: quotaError } = await sb
    .from("resource_user_quotas")
    .select("max_downloads_per_day, max_download_bytes_per_day")
    .eq("user_id", userId)
    .maybeSingle();

  if (quotaError) {
    return NextResponse.json({ ok: false, error: quotaError.message }, { status: 400 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentEvents, error: recentError } = await sb
    .from("resource_download_events")
    .select("bytes_served")
    .eq("user_id", userId)
    .eq("access_kind", "hosted")
    .gte("created_at", since);

  if (recentError) {
    return NextResponse.json({ ok: false, error: recentError.message }, { status: 400 });
  }

  const { data: currentAsset, error: assetError } = await sb
    .from("resource_assets")
    .select("id, bucket_name, object_path, original_filename, size_bytes")
    .eq("resource_id", id)
    .eq("is_current", true)
    .maybeSingle();

  if (assetError) {
    console.error("[resources.access] Hosted asset lookup failed", {
      resourceId: id,
      userId,
      error: assetError.message,
    });
    return NextResponse.json({ ok: false, error: assetError.message }, { status: 400 });
  }

  let asset = currentAsset;
  if (!asset) {
    const { data: latestAsset, error: latestAssetError } = await sb
      .from("resource_assets")
      .select("id, bucket_name, object_path, original_filename, size_bytes")
      .eq("resource_id", id)
      .order("version_no", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestAssetError) {
      console.error("[resources.access] Hosted fallback asset lookup failed", {
        resourceId: id,
        userId,
        error: latestAssetError.message,
      });
      return NextResponse.json({ ok: false, error: latestAssetError.message }, { status: 400 });
    }

    asset = latestAsset;
  }

  if (!asset) {
    return NextResponse.json({ ok: false, error: "No hosted asset is available for this resource." }, { status: 404 });
  }

  const recentCount = Array.isArray(recentEvents) ? recentEvents.length : 0;
  const recentBytes = bytesUsedToday(recentEvents || []);
  const nextBytes = recentBytes + Number(asset.size_bytes || 0);

  if (quota && recentCount >= quota.max_downloads_per_day) {
    return NextResponse.json({ ok: false, error: "Daily hosted download count limit reached." }, { status: 429 });
  }

  if (quota && nextBytes > quota.max_download_bytes_per_day) {
    return NextResponse.json({ ok: false, error: "Daily hosted download bandwidth limit reached." }, { status: 429 });
  }

  const { data: signed, error: signedError } = await sb.storage
    .from(asset.bucket_name || RESOURCE_STORAGE_BUCKET)
    .createSignedUrl(asset.object_path, 60, {
      download: asset.original_filename || `resource-${id}`,
    });

  if (signedError || !signed?.signedUrl) {
    console.error("[resources.access] Hosted URL signing failed", {
      resourceId: id,
      userId,
      error: signedError?.message || "No signed URL returned",
    });
    return NextResponse.json({
      ok: false,
      error: "Hosted resource access is blocked for this account. Storage permissions need to allow signed-in users to read hosted files.",
    }, { status: 403 });
  }

  const { error: logError } = await sb.from("resource_download_events").insert({
    user_id: userId,
    resource_id: id,
    asset_id: asset.id,
    access_kind: "hosted",
    bytes_served: asset.size_bytes,
  });

  if (logError) {
    return NextResponse.json({ ok: false, error: logError.message }, { status: 400 });
  }

  await logOpenEvent(sb, {
    userId,
    resourceId: id,
    accessKind: "hosted",
    sourceSurface,
  });

  await incrementOpenCount(sb, id, resource.open_count, resource.download_count);

  return NextResponse.json({
    ok: true,
    accessKind: "hosted",
    assetId: asset.id,
    signedUrl: signed.signedUrl,
    expiresInSeconds: 60,
  });
}
