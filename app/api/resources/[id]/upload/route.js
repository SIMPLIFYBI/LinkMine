export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { supabaseAdminClient } from "@/lib/supabaseAdminClient";
import { supabaseServerClient } from "@/lib/supabaseServerClient";
import {
  cleanText,
  getFileExtension,
  getResourceAuthContext,
  isAllowedResourceUpload,
  RESOURCE_LIMITS,
  RESOURCE_STORAGE_BUCKET,
  sanitizeFileName,
} from "@/lib/resourceHubServer";

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
    .select("id, owner_user_id, resource_type, status")
    .eq("id", id)
    .maybeSingle();

  if (resourceError) {
    return NextResponse.json({ ok: false, error: resourceError.message }, { status: 400 });
  }

  if (!resource) {
    return NextResponse.json({ ok: false, error: "Resource not found." }, { status: 404 });
  }

  if (resource.owner_user_id !== userId && !isAdmin) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  if (resource.resource_type !== "hosted") {
    return NextResponse.json({ ok: false, error: "Only hosted resources accept uploaded packs." }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file !== "object" || typeof file.name !== "string") {
    return NextResponse.json({ ok: false, error: "No file provided." }, { status: 400 });
  }

  if (file.size > RESOURCE_LIMITS.maxPackBytes) {
    return NextResponse.json({
      ok: false,
      error: `File too large. Max ${Math.round(RESOURCE_LIMITS.maxPackBytes / (1024 * 1024))} MB.`,
    }, { status: 400 });
  }

  if (!isAllowedResourceUpload(file)) {
    return NextResponse.json({ ok: false, error: "Unsupported file type." }, { status: 400 });
  }

  const safeName = sanitizeFileName(file.name || "resource-pack");
  const extension = getFileExtension(safeName);
  const contentType = cleanText(file.type) || "application/octet-stream";
  const ts = Date.now();
  const objectPath = `users/${resource.owner_user_id}/resources/${id}/${ts}-${safeName}`;

  const { data: currentAsset } = await sb
    .from("resource_assets")
    .select("id, version_no")
    .eq("resource_id", id)
    .eq("is_current", true)
    .maybeSingle();

  const nextVersion = (currentAsset?.version_no || 0) + 1;

  const { error: uploadError } = await adminSb.storage
    .from(RESOURCE_STORAGE_BUCKET)
    .upload(objectPath, file, { contentType, upsert: false });

  if (uploadError) {
    return NextResponse.json({ ok: false, error: uploadError.message || "Upload failed." }, { status: 400 });
  }

  if (currentAsset?.id) {
    const { error: clearCurrentError } = await sb
      .from("resource_assets")
      .update({ is_current: false })
      .eq("resource_id", id)
      .eq("is_current", true);

    if (clearCurrentError) {
      return NextResponse.json({ ok: false, error: clearCurrentError.message }, { status: 400 });
    }
  }

  const { data: asset, error: assetError } = await sb
    .from("resource_assets")
    .insert({
      resource_id: id,
      storage_provider: "supabase",
      bucket_name: RESOURCE_STORAGE_BUCKET,
      object_path: objectPath,
      original_filename: safeName,
      file_ext: extension || null,
      mime_type: contentType,
      size_bytes: file.size,
      version_no: nextVersion,
      is_current: true,
      uploaded_by: userId,
    })
    .select("id, bucket_name, object_path, original_filename, file_ext, mime_type, size_bytes, version_no, is_current, created_at")
    .single();

  if (assetError) {
    return NextResponse.json({ ok: false, error: assetError.message }, { status: 400 });
  }

  await sb.from("resources").update({ estimated_size_bytes: file.size }).eq("id", id);

  return NextResponse.json({ ok: true, asset });
}
