export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import { getResourceAuthContext, RESOURCE_STORAGE_BUCKET } from "@/lib/resourceHubServer";

function bytesUsedToday(events = []) {
  return events.reduce((sum, event) => sum + Number(event?.bytes_served || 0), 0);
}

export async function POST(req, { params }) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing resource id." }, { status: 400 });
  }

  const sb = await supabaseServerClient();
  const adminSb = supabaseAdminClient();
  const { userId, isAdmin } = await getResourceAuthContext(sb);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });
  }

  const { data: resource, error: resourceError } = await sb
    .from("resources")
    .select("id, owner_user_id, resource_type, status, source_url, estimated_size_bytes, download_count")
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
    const { error: logError } = await sb.from("resource_download_events").insert({
      user_id: userId,
      resource_id: id,
      asset_id: null,
      access_kind: "external",
      bytes_served: 0,
    });

    if (logError) {
      return NextResponse.json({ ok: false, error: logError.message }, { status: 400 });
    }

    await adminSb
      .from("resources")
      .update({ download_count: Number(resource.download_count || 0) + 1 })
      .eq("id", id);

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

  const { data: asset, error: assetError } = await adminSb
    .from("resource_assets")
    .select("id, bucket_name, object_path, size_bytes")
    .eq("resource_id", id)
    .eq("is_current", true)
    .maybeSingle();

  if (assetError) {
    return NextResponse.json({ ok: false, error: assetError.message }, { status: 400 });
  }

  if (!asset) {
    return NextResponse.json({ ok: false, error: "No current asset available for this resource." }, { status: 404 });
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

  const { data: signed, error: signedError } = await adminSb.storage
    .from(asset.bucket_name || RESOURCE_STORAGE_BUCKET)
    .createSignedUrl(asset.object_path, 60);

  if (signedError || !signed?.signedUrl) {
    return NextResponse.json({ ok: false, error: signedError?.message || "Could not create access URL." }, { status: 400 });
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

  await adminSb
    .from("resources")
    .update({ download_count: Number(resource.download_count || 0) + 1 })
    .eq("id", id);

  return NextResponse.json({
    ok: true,
    accessKind: "hosted",
    assetId: asset.id,
    signedUrl: signed.signedUrl,
    expiresInSeconds: 60,
  });
}
